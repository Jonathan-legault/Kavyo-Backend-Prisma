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
- promotion type, quantity, total price, and per-item multibuy price
- member/loyalty program name, member price, and non-member price
- advertised price range minimum and maximum
- human-readable conditions and machine-readable promotion conditions
- unit price and unit-price basis
- review status, reasons, decision, notes, reviewer, and review timestamp
- image/source URLs
- normalized and raw JSON payloads

`StagedOffer` is intentionally independent of `Product`:

- Safeway and Calgary Co-op flyer items generally do not carry a usable UPC/GTIN.
- Flipp item detail `sku` values are only treated as GTIN candidates when they contain 8–14 digits.
- Many flyer items are multi-variant, size ranges, member-only prices, or multi-buys.
- Automatically merging those rows into a canonical product would fabricate precision that the source does not provide.

`Product`, `AdvertisedOffer`, and `PriceObservation` form the reviewed data layer. The admin review workflow promotes a `StagedOffer` by matching an existing product, creating a canonical product with a stable `catalogKey`, and upserting a retailer-level `AdvertisedOffer`. It can optionally publish a stricter store-level `PriceObservation`. Barcodes are optional and are never invented.

A `catalogKey` is a stable, unique product identifier derived from the normalized match key (or a retailer/source-record fallback). Weekly reviews reuse the same product row instead of creating duplicate products. A reviewed offer may be approved without publishing a store price; its `AdvertisedOffer` remains available to the catalogue and basket as an estimate when its conditions are representable.

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
- Price ranges are read from Flipp `current_price_range` or text such as `$4.99-$6.99` or `$4.99 to $6.99`.
- Prices are stored in CAD.

### Promotion Conditions

Promotion parsing records the original condition text and structured flags on `StagedOffer`:

| Condition | Stored fields |
| --- | --- |
| Multibuy (`3 for $7`, `2/$5`, `$5 for 2`) | `promotionType=MULTIBUY`, `promotionQuantity`, `promotionTotalPrice`, `promotionUnitPrice` |
| Per-item quantity threshold (`$5.99 ea when you buy 2 or more`) | `promotionType=MULTIBUY`, `promotionQuantity`, `promotionUnitPrice`, `promotionConditions.quantityRequirement` |
| Quantity requirement without a multibuy price (`when you buy 2`) | `promotionQuantity`, review flag `QUANTITY_REQUIREMENT` |
| Member/loyalty price | `promotionType=MEMBER_PRICE`, `memberProgram`, `memberPriceAmount`, `nonMemberPriceAmount` |
| Price range | `promotionType=PRICE_RANGE`, `priceMinAmount`, `priceMaxAmount` |
| BOGO | `promotionType=BOGO` |
| Minimum spend | `promotionType=SPEND_THRESHOLD`, `promotionConditions.minSpend` |
| Purchase limit | `promotionType=PURCHASE_LIMIT`, `promotionConditions.purchaseLimit` |
| Coupon | `promotionConditions.requiresCoupon`, review flag `COUPON_REQUIRED` |
| Points | `promotionType=POINTS_OFFER` or a higher-priority condition type, plus review flag `POINTS_OFFER` |
| In-store only | `promotionType=IN_STORE_ONLY` or `promotionConditions.inStoreOnly` |
| Unresolved offer language | `promotionType=OTHER`, review flag `PROMOTION_AMBIGUOUS` |

Multibuy unit prices are used for unit-price comparison, but they are not published as single-unit shelf prices without an explicit administrator decision. Member prices are preserved but are not treated as general sale prices. This avoids recommending a price that requires a membership, a coupon, a minimum spend, or a quantity the shopper may not purchase.

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

It is only generated when the offer is not a multi-variant, size-range, or price-range offer. Exact comparison groups by this key.

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
| `PRICE_RANGE` | Advertised price is a range; a single price must be resolved |
| `BOGO` | Buy-one-get-one offer |
| `SPEND_THRESHOLD` | Offer depends on a minimum spend |
| `PURCHASE_LIMIT` | Offer has a per-customer purchase limit |
| `QUANTITY_REQUIREMENT` | Offer requires a quantity but the price effect is not a simple multibuy |
| `COUPON_REQUIRED` | Offer requires a coupon or promo code |
| `FREE_ITEM` | Offer includes a free item |
| `PROMOTION_AMBIGUOUS` | Promotion language is not fully resolved |

`NO_GTIN` and `POINTS_OFFER` are informational: they do not block normalization by themselves. `NO_GTIN` means the offer has no usable 8–14 digit GTIN candidate; `POINTS_OFFER` means the offer mentions points but the points value is not part of the price calculation.

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
- `promotionType`: `NONE`, `MULTIBUY`, `MEMBER_PRICE`, `PRICE_RANGE`, `BOGO`, `SPEND_THRESHOLD`, `PURCHASE_LIMIT`, `IN_STORE_ONLY`, `POINTS_OFFER`, `OTHER`, or `ANY` for any non-`NONE` promotion
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

## Admin Review Workflow

Admin routes require a JWT whose roles include `ADMIN` or `SUPER_ADMIN`.

### Queue

```http
GET /admin/flyer-offers?status=PENDING_REVIEW&q=butter&limit=50
```

The queue defaults to the latest completed Flipp batch. Query parameters:

- `status`: `PENDING_REVIEW`, `NORMALIZED`, `REJECTED`, or `ALL`
- `q`: search product name, brand, family, or package size
- `retailer`: retailer name substring
- `batchId`: review a specific batch
- `limit`: 1–200, default 50
- `offset`: zero-based offset

The response includes the batch ID, filtered count, status counts for the batch, and serialized offers with promotion conditions, review reasons, flyer metadata, retailer, matched product, and reviewer.

### Summary

```http
GET /admin/flyer-offers/summary
```

Returns total, pending, normalized, and rejected counts, plus breakdowns by status, promotion type, and review decision. Pass `?batchId=<uuid>` to inspect an earlier batch.

### Get one offer

```http
GET /admin/flyer-offers/{offerId}
```

### Review an offer

```http
PATCH /admin/flyer-offers/{offerId}/review
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "decision": "APPROVE",
  "createProduct": true,
  "catalogKey": "FLIPP|quality-street|tin|650g",
  "storeId": "2d08df42-04ee-4c82-bcaa-9818dfea239f",
  "publishPrice": true,
  "unitPrice": 12.99,
  "notes": "Resolved price range from shelf check"
}
```

Decisions:

- `APPROVE`: resolve the canonical product, upsert an advertised offer, optionally publish a store price observation, then mark the offer `NORMALIZED`.
- `REJECT`: mark the offer `REJECTED` and withdraw any advertised offer or price observation previously published from it.
- `NEEDS_INFO`: keep the offer `PENDING_REVIEW`, record the reviewer note, and withdraw any previously published records.

Approval behavior:

- If `productId` is supplied, that product is used.
- Otherwise, an existing `matchedProductId`, barcode, or `catalogKey` match is reused.
- If no product exists, `createProduct: true` is required. The product receives the supplied `catalogKey`, or a key generated from a stable match key. Offers without a stable match key require an explicit `catalogKey`; `barcode` remains optional.
- Multi-variant offers must supply an explicit `productId`; they cannot be auto-created from ambiguous flyer text.
- Every approval upserts a retailer-level `AdvertisedOffer` with a stable SHA-256 key. This is idempotent across re-reviews and weekly runs.
- Store price publication is opt-in with `publishPrice: true` and requires `storeId` belonging to the offer retailer.
- `unitPrice` overrides the parsed advertised or multibuy per-item price for both published records.
- Price ranges, multi-variant offers, and ambiguous `OTHER` offers require an explicit `unitPrice` before a store price can be published.
- Member-only, multibuy, BOGO, free-item, coupon, and minimum-spend offers cannot become single-unit sale or basket prices yet. They can still be approved as catalogue products with their conditions retained for review.
- Re-reviewing the same offer updates the existing source-linked advertised offer and price observation instead of creating duplicates.
- Rejecting or returning a previously approved offer to `NEEDS_INFO` withdraws both published records.

---

## Example

The latest run on 2026-11-10 produced:

- Safeway flyer `8212267`: 272 priced items, 82 normalized
- Walmart flyer `8215609`: 441 priced items, 143 normalized
- Calgary Co-op flyer `8211213`: 103 priced items, 15 normalized
- Total: 816 staged offers, 240 normalized, 576 pending review
- Promotion breakdown: 686 `NONE`, 80 `POINTS_OFFER`, 25 `OTHER`, 10 `SPEND_THRESHOLD`, 8 `MEMBER_PRICE`, 6 `MULTIBUY`, 1 `PURCHASE_LIMIT`

The first successful run on 2026-10-30 produced 745 staged offers: 214 normalized and 531 pending review.

These counts are a snapshot, not a guarantee; flyers change weekly.

---

## Limitations

- **No universal product identity.** Safeway and Calgary Co-op flyer data usually lacks UPCs. Exact matching is limited to normalized name + brand + size.
- **Flyer prices are not shelf prices.** They may be doorcrashers, member prices, multi-buys, or limited to specific stores. The ingest stores the flyer validity window but does not guarantee store-level availability.
- **Package sizes are extracted from text.** Descriptions are inconsistent; ranges and multi-variant offers remain approximate and are flagged.
- **Per-weight produce cannot be priced as a fixed basket item.** It is stored with a per-100 g unit price and marked for review.
- **Family comparison is broad.** `produce|100g` can contain unrelated produce items. It is not an exact-match substitute.
- **Promotion-aware basket pricing is partial.** Current, condition-safe advertised offers can enter basket totals as retailer-level estimates. Member-only, multibuy, BOGO, coupon, minimum-spend, price-range, and multi-variant prices are preserved and reviewed but are not used as single-unit sale prices.
- **Review is manual.** The admin queue can approve, reject, or request more information, but product identity and ambiguous promotion resolution still require a human decision.
- **Source terms.** Production use of Flipp's JSON endpoints requires a terms-of-use review.

---

## Frontend Integration

The Kavyo frontend exposes the flyer surface at `/flyers`. The page:

- loads the latest batch summary and the lowest unit-price normalized offers
- shows a **Promotion watch** strip built from `status=ALL&promotionType=MULTIBUY|MEMBER_PRICE|PRICE_RANGE|ANY`, with a worked `2 for $5.00 → $2.50 each` example
- searches `/flyers/offers` as the user types a submitted query
- shows `/flyers/compare?mode=EXACT` separately as **exact product matches**
- shows `/flyers/compare?mode=FAMILY` as **similar products**, with the API's comparison note
- exposes a **Verified prices** / **Include review items** switch and labels `PENDING_REVIEW` offers
- renders promotion quantity, total price, per-item price, member/non-member price, price range, and conditions on offer and comparison cards
- keeps `q`, `retailer`, and `status` in the URL so a search can be shared or revisited

Example: `/flyers?q=cheese&status=ALL&retailer=Safeway`.

The flyer page remains a separate discovery/comparison surface. The basket product picker loads the public `/products` catalogue, and reviewed, current offers appear as flyer estimates. Store-verified observations take priority. The frontend still needs an admin review console and fuller promotion-aware basket behavior.

Remaining integration work:

1. Build the admin review console on top of `/admin/flyer-offers`.
2. Add member-aware and multibuy-aware basket pricing before using those offers as general prices.
3. Keep unresolved member, multibuy, range, and variant offers visibly labelled.
4. Improve automatic product matching so the staged backlog can be linked with less manual effort.
