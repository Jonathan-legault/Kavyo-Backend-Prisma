# Flyer Price Ingestion

Kavyo ingests weekly grocery flyer prices from Flipp's public flyer JSON, normalizes them, and stages them for review before they can become canonical product prices.

This document covers the source, the staging model, normalization rules, commands, API endpoints, and known limitations.

---

## Source

| Retailer | Flipp merchant ID | Flyer used in the first run |
| --- | ---: | --- |
| Safeway | `2126` | `8205958` |
| Walmart | `234` | `8203652` |
| Calgary Co-op | `2051` | `8195613` |

The ingester uses the JSON endpoints behind Flipp's retailer flyer widget:

- `GET https://backflipp.wishabi.com/flipp/flyers`
- `GET https://backflipp.wishabi.com/flipp/flyers/{flyerId}`
- `GET https://backflipp.wishabi.com/flipp/items/{itemId}`

The API is called with `locale=en-ca` and the configured postal code. The first run uses `T3M 1T4` (Calgary).

The client sends an identifying `User-Agent`, rate-limits item-detail requests, and retries only transient failures (`429`, `5xx`, timeouts). It does not attempt to bypass access controls.

**Terms of use:** Flipp and the retailers own the flyer data. These endpoints are used by public flyer widgets, but production use still requires confirming that Flipp and each retailer permit this use. Do not treat a successful request as permission to redistribute the data.

---

## Data Model

The ingestion layer deliberately does **not** write directly to `Product` or `PriceObservation`.

### `Flyer`

One row per retailer flyer run:

- external Flipp flyer ID
- source system and retailer
- merchant ID, postal code, locale
- validity window
- source and thumbnail URLs
- fetch time
- small JSON summary payload

### `StagedOffer`

One row per priced flyer item in an ingestion batch:

- source record ID and flyer
- retailer and ingest batch
- product name, brand, description
- parsed package size, quantity value, quantity unit
- family and match keys
- advertised price, regular price, pricing basis
- member/multibuy/multi-variant/range flags
- unit price and unit-price basis
- review status and reasons
- image/source URLs
- normalized and raw JSON payloads

`StagedOffer` is intentionally independent of `Product`:

- Safeway and Calgary Co-op flyer items generally do not carry a usable UPC/GTIN.
- Flipp item detail `sku` values are only treated as GTIN candidates when they contain 8–14 digits.
- Many flyer items are multi-variant, size ranges, member-only prices, or multi-buys.
- Automatically merging those rows into a canonical product would fabricate precision that the source does not provide.

`Product` and `PriceObservation` remain the canonical layer for reviewed, matched data. A later review workflow can promote a `StagedOffer` by setting `matchedProductId` or by creating a real product record with verified identifiers. Barcodes are never invented.

---

## Ingestion Lifecycle

`npm run ingest:flyers` performs these steps:

1. Find or create the `FLIPP_FLYERS` source system.
2. Find or create the Safeway, Walmart, and Calgary Co-op retailer rows.
3. Fetch the active flyer list for the postal code.
4. Select one main active grocery flyer per retailer.
5. Fetch every priced item from each selected flyer.
6. Fetch item details for package size, price text, disclaimers, sale story, and SKU.
7. Normalize every priced item into a staged offer.
8. Upsert the `Flyer` rows.
9. Create a new `IngestBatch` and insert staged offers in chunks.
10. Mark the batch `COMPLETED` with read/inserted/rejected counts, or `FAILED` with the error.

The latest completed batch is the default read source for the API. Earlier batches remain in the database for audit and comparison.

Selecting one main flyer:

- flyer must be active at the ingestion time
- flyer must include a grocery-related category
- `relationship` must not be explicitly `false`
- when several flyers qualify, the largest flyer by area is selected

This avoids choosing a small seasonal or promotional flyer when the main weekly grocery flyer is available.

---

## Normalization Rules

### Price

- The advertised price comes from the flyer item's `price`.
- `regularPriceAmount` is parsed from disclaimer text such as `$6.99 without Scene+ Card` or `Regular price $6.99`.
- Prices are stored in CAD.

### Package Size

The item-detail `description` is the primary size source; the product name is a fallback.

Supported forms include:

- `454 g`, `1.5 kg`, `2 L`, `597 mL`
- `4 lb`, `16 oz` (converted to grams)
- `12 x 355 mL` (total volume)
- `400-450 g`, `750g-1kg` (midpoint, marked approximate)
- `5 pk`, `8-pack` (count)
- `Each` (one item)
- `Pack` / `Bag` (one package when no size is available)

### Unit Price

Unit prices are normalized to:

- **per 100 g** for weight
- **per 100 mL** for volume
- **per each** for counts or packages

Per-pound and per-kilogram prices are converted to a per-100 g basis. The original pricing basis is retained in `pricingBasis`.

### Families

A family is a conservative grocery category such as `butter`, `milk`, `eggs`, `cheese`, `coffee`, `soft_drinks`, `chicken`, `seafood`, `pasta`, `produce`, or `household`.

Families are used only for **similar-product** discovery. They are not a claim that two items are the same product.

### Match Key

`matchKey` is built from:

- normalized brand
- normalized product name
- parsed quantity and unit

It is only generated when the offer is not a multi-variant or size-range offer. Exact comparison groups by this key.

### Review Flags

Offers are marked `PENDING_REVIEW` when any blocking condition applies:

| Flag | Meaning |
| --- | --- |
| `PRICE_MISSING` | Price could not be parsed |
| `PACKAGE_SIZE_MISSING` | No usable package size or each/package quantity |
| `PACKAGE_SIZE_RANGE` | Size range; quantity is an approximate midpoint |
| `MULTI_VARIANT` | Offer includes variants such as “A or B” or “selected varieties” |
| `MULTIBUY` | Price depends on buying multiple units |
| `PRICE_BY_WEIGHT` | Price is per lb/kg or sold by 100 g |
| `MEMBER_PRICE` | Price requires a membership/loyalty card |

`NO_GTIN` is informational: the offer has no usable 8–14 digit GTIN candidate. It does not block normalization by itself.

Only `NORMALIZED` offers are used by default. Use `status=ALL` to inspect or compare pending offers, and keep the review flags visible in the UI.

---

## Commands

Set `DATABASE_URL` in `.env`, then run:

```bash
npm run ingest:flyers -- --postal-code T3M1T4
```

Options:

```bash
npm run ingest:flyers -- --postal-code "T3M 1T4" --concurrency 4
npm run ingest:flyers -- --flyer-ids 8205958,8203652,8195613
npm run ingest:flyers -- --help
```

- `--postal-code`: flyer retrieval postal code; default `T3M 1T4`
- `--locale`: Flipp locale; default `en-ca`
- `--concurrency`: concurrent item-detail requests, 1–12; default `4`
- `--flyer-ids`: optional comma-separated Flipp flyer IDs for a targeted run

A normal three-flyer run is roughly 745 priced items and about 35 seconds with the default concurrency.

---

## API

All flyer endpoints are public and read from the latest completed `FLIPP_FLYERS` batch by default.

### Summary

```http
GET /flyers/summary
```

Returns:

- latest batch metadata
- total offer count
- per-retailer totals, normalized counts, and pending-review counts
- flyer metadata, validity windows, source links, and offer counts for the batch

### List offers

```http
GET /flyers/offers?q=butter&retailer=Safeway&status=NORMALIZED&sort=unitPrice&limit=50
```

Query parameters:

- `q`: search product name, brand, family, or package size
- `retailer`: retailer name (case-insensitive substring)
- `family`: exact family key
- `status`: `NORMALIZED` (default), `PENDING_REVIEW`, or `ALL`
- `sort`: `unitPrice`, `price`, or `name`
- `batchId`: optional UUID for a specific batch
- `limit`: 1–200, default 100
- `offset`: zero-based offset

The response contains normalized numeric prices and prices per 100 g / 100 mL / each.

### Get one offer

```http
GET /flyers/offers/{offerId}
```

Returns one staged offer or `404`.

### Compare offers

Exact product/size comparison:

```http
GET /flyers/compare?q=Quality%20Street&mode=EXACT
```

Similar-product/unit-price comparison:

```http
GET /flyers/compare?q=butter&mode=FAMILY&status=ALL
```

Parameters:

- `q`: required search text, 2–120 characters
- `mode`: `EXACT` or `FAMILY` (default `FAMILY`)
- `status`: `NORMALIZED` (default), `PENDING_REVIEW`, or `ALL`
- `retailer`: optional retailer filter
- `batchId`: optional batch UUID
- `limit`: 1–300, default 300

The response includes `comparisonType`:

- `EXACT_PRODUCT`: same normalized product name and package size
- `SIMILAR_PRODUCT`: grouped by family and unit-price basis; not guaranteed identical

Each group includes the cheapest offer per retailer, retailer count, `hasComparison`, minimum/maximum unit price, and spread. The `comparisonNote` explains the mode.

**Recommendation:** use `mode=EXACT` when presenting a direct product substitution. Use `mode=FAMILY` only as a discovery aid, with a visible “similar products, compare unit price” label. Do not hide pending-review flags when `status=ALL` is used.

---

## Example

The first successful run on 2026-10-30 produced:

- Safeway flyer `8205958`: 288 priced items, 103 normalized
- Walmart flyer `8203652`: 352 priced items, 86 normalized
- Calgary Co-op flyer `8195613`: 105 priced items, 25 normalized
- Total: 745 staged offers, 214 normalized, 531 pending review
- One exact cross-retailer match in the normalized set: `Quality Street Tin 650g`

These counts are a snapshot, not a guarantee; flyers change weekly.

---

## Limitations

- **No universal product identity.** Safeway and Calgary Co-op flyer data usually lacks UPCs. Exact matching is limited to normalized name + brand + size.
- **Flyer prices are not shelf prices.** They may be doorcrashers, member prices, multi-buys, or limited to specific stores. The ingest stores the flyer validity window but does not guarantee store-level availability.
- **Package sizes are extracted from text.** Descriptions are inconsistent; ranges and multi-variant offers remain approximate and are flagged.
- **Per-weight produce cannot be priced as a fixed basket item.** It is stored with a per-100 g unit price and marked for review.
- **Family comparison is broad.** `produce|100g` can contain unrelated produce items. It is not an exact-match substitute.
- **No automatic promotion to products.** A human or a future admin workflow must review ambiguous offers before they become canonical `Product`/`PriceObservation` records.
- **Source terms.** Production use of Flipp's JSON endpoints requires a terms-of-use review.

---

## Frontend Integration

The Kavyo frontend exposes the flyer surface at `/flyers`. The page:

- loads the latest batch summary and the lowest unit-price normalized offers
- searches `/flyers/offers` as the user types a submitted query
- shows `/flyers/compare?mode=EXACT` separately as **exact product matches**
- shows `/flyers/compare?mode=FAMILY` as **similar products**, with the API's comparison note
- exposes a **Verified prices** / **Include review items** switch and labels `PENDING_REVIEW` offers
- keeps `q`, `retailer`, and `status` in the URL so a search can be shared or revisited

Example: `/flyers?q=cheese&status=ALL&retailer=Safeway`.

The flyer page is still a separate discovery/comparison surface. The basket comparison uses the five verified backend fixture products until reviewed flyer offers are promoted into `Product`/`PriceObservation` records or the basket flow explicitly supports staged offers.

Remaining integration work:

1. Add an admin/review path for promoting reviewed, unambiguous offers.
2. Let the basket builder add a staged flyer offer without pretending it is a canonical product.
3. Keep unresolved member, multibuy, range, and variant offers visibly labelled.
