# Task 5 and Task 6 Status

Prepared for the Sherry scope/priority check.

Branch: `feature/flyer-ingestion`

Last verified: 2026-11-11

---

## Verification Snapshot

| Check | Result |
| --- | --- |
| Unit tests | 68 passing |
| End-to-end tests | 41 passing |
| Build | Passing |
| Lint | Clean |
| Prisma migrations | 10 applied |
| Current local stores | 3 |
| Latest flyer batch | 816 staged offers |

Latest flyer batch on 2026-11-10:

- 816 priced offers
- 240 `NORMALIZED`
- 576 `PENDING_REVIEW`
- 0 rejected by ingestion

Promotion breakdown in that batch:

- 686 `NONE`
- 80 `POINTS_OFFER`
- 25 `OTHER`
- 10 `SPEND_THRESHOLD`
- 8 `MEMBER_PRICE`
- 6 `MULTIBUY`
- 1 `PURCHASE_LIMIT`

Review-flag counts include `MULTI_VARIANT` (424), `NO_GTIN` (579), `PACKAGE_SIZE_RANGE` (139), `QUANTITY_REQUIREMENT` (49), and `PRICE_BY_WEIGHT` (51). These are conditions for review, not necessarily ingestion failures.

---

## Task 5 — Promotional Ingestion and Pricing

### What is implemented

- Structured promotion parsing on `StagedOffer`:
  - multibuy forms such as `3 for $7`, `2/$5`, `$5 for 2`
  - per-item quantity thresholds such as `$5.99 ea when you buy 2 or more`
  - member/loyalty pricing and program names such as Scene+
  - price ranges from flyer text and Flipp `current_price_range`
  - BOGO and free-item conditions
  - purchase limits
  - minimum-spend thresholds
  - quantity requirements that are not simple multibuys
  - coupon, points, and in-store-only conditions
- Promotion and condition fields:
  - `promotionType`
  - `promotionQuantity`
  - `promotionTotalPrice`
  - `promotionUnitPrice`
  - `memberProgram`
  - `memberPriceAmount`
  - `nonMemberPriceAmount`
  - `priceMinAmount`
  - `priceMaxAmount`
  - `conditionsText`
  - `promotionConditions` (JSON)
- Public flyer API exposes the new promotion fields.
- Public flyer API supports `promotionType` filtering, including `ANY` for non-`NONE` promotions.
- The flyer frontend now:
  - loads a **Promotion watch** strip with multibuy, member-price, price-range, and other promotional rows
  - shows a worked `2 for $5.00 → $2.50 each` example
  - renders promotion quantity, total price, per-item price, member/non-member price, price range, and conditions
  - keeps review-item badges visible instead of presenting pending promotions as verified prices
- Admin review workflow:
  - `GET /admin/flyer-offers`
  - `GET /admin/flyer-offers/summary`
  - `GET /admin/flyer-offers/:id`
  - `PATCH /admin/flyer-offers/:id/review`
- Admin roles are required (`ADMIN` or `SUPER_ADMIN`).
- Approval can:
  - match an existing product
  - create a canonical product with a stable `catalogKey`
  - publish a validated `PriceObservation` for a selected store
- `Product.barcode` is optional; barcodes are never invented.
- `Product.catalogKey` is unique, so weekly approvals reuse products rather than duplicating them.
- Member-only, multibuy, BOGO, free-item, coupon, and spend-threshold prices are preserved but are not published as general sale prices until the basket engine can represent the conditions.
- Price publication is opt-in (`publishPrice: true`) and requires a matching store.
- Price-range, multi-variant, and ambiguous offers require an explicit resolved `unitPrice`.
- Multi-variant offers require an explicit `productId`.
- Review decisions and audit metadata are stored: decision, notes, reviewer, timestamp.
- Rejecting or returning an approved offer to `NEEDS_INFO` withdraws its published price observation.
- Tests cover promotion parsing, normalizer integration, admin approval, admin rejection, price withdrawal, product reuse, and price publication.

### What remains for Task 5

1. **Member-aware basket pricing.** The canonical `PriceObservation` has no member-price flag or member program. Member offers are stored and reviewable, but they are intentionally not published as general prices.
2. **Multibuy-aware basket pricing.** The comparison engine assumes one unit at the observation price. A 3-for-$7 or “$5.99 ea when you buy 2+” condition cannot yet be applied to basket quantities.
3. **Promotion-aware basket and checkout behavior.** Flyer promotion conditions are now visible in the frontend, but the basket engine still assumes one unit at the observation price.
4. **Admin review console.** Backend endpoints exist; the UI is not built.
5. **Product/price APIs for reviewed offers.** The review endpoint is currently the promotion path into the canonical layer.
6. **Parser coverage for retailer-specific formats.** Current parsing is conservative and flags unresolved language for review.
7. **Source/terms review for production use of Flipp data.**
8. **Automated product matching.** Product matching is still a human decision.

### Decisions needed from Sherry

- Are member pricing and multibuy pricing required in the basket comparison for this milestone, or is staged review sufficient for now?
- Should reviewed offers publish prices by default, or should every price publication require an explicit admin action? The current implementation requires an explicit `publishPrice: true`.
- Which promotion types are highest priority for basket support (multibuy first, member pricing first, or both)?
- Is a minimal admin review UI part of this team's scope, or is the backend API sufficient for now?

---

## Task 6 — Comparison, Travel, and Store Mapping

### What is implemented

- Basket comparison for a single store:
  - latest validated `PriceObservation` per product and store
  - active sale price when inside the validity window
  - fallback to regular price when a sale is expired or not yet active
  - missing-product detection
  - stale-price warnings
- Travel-cost estimation:
  - Calgary FSA centroid lookup
  - Haversine distance
  - road-distance factor
  - round-trip option
  - cost per kilometre
- Recommendation actions:
  - `GO_TO_STORE`
  - `STAY`
  - `SWITCH`
  - `NO_COMPLETE_STORE`
- Comparison includes `cheapestCompleteStore`, `closestPartialStore`, warnings, and a recommendation message.
- Comparison consumes only canonical `Product`/`PriceObservation` data.
- Reviewed flyer offers can now become canonical price observations through the admin workflow.
- Store mapping is retailer/store-driven; the comparison engine reads active `Store` rows with latitude/longitude.

### Store dataset status

- A team member has prepared a verified 95-location Calgary retail dataset with latitude and longitude.
- That dataset is **not in this local database yet**; the current database contains 3 stores.
- The portable fixture intentionally keeps 3 stores so tests are reproducible.
- Do not duplicate or overwrite the team member's dataset. The next step is to receive the file/script or wait for their install-time auto-population.

### What remains for Task 6

1. **Load and validate the 95-store dataset.** Need the file/script/format from the team member, then confirm retailer names, postal codes, coordinates, and active/inactive status.
2. **Multi-store/split-basket comparison.** Current comparison chooses one complete store. It does not split a basket across stores or combine multiple stops.
3. **Multi-stop optimization.** No route ordering, travel-time model, or combined travel-cost calculation across stops.
4. **Travel modes.** Current travel cost is driving-distance-based; transit, walking, and cycling are not implemented.
5. **Store-level flyer availability.** A retailer flyer does not guarantee that every store carries every item or price.
6. **Promotion-aware comparison.** Member and multibuy prices cannot yet flow into basket totals.
7. **Store coverage checks.** Need to confirm which retailers/FSA areas the 95 stores cover and whether every store has usable coordinates.

### Decisions needed from Sherry

- What is the source of truth for the 95-store dataset: the team member's script, a committed seed file, or an install-time job?
- Should the 95-store dataset replace the 3-store fixture in development, or remain a separate optional dataset?
- Is split-basket comparison required for this milestone, or is single-store comparison plus travel cost sufficient?
- Should comparison include only stores with complete basket coverage, or also partial-store options?

---

## Suggested Next Steps

1. Review this status with Sherry and confirm Task 5/6 ownership and priorities.
2. Obtain the 95-store dataset or its import contract from the team member.
3. Implement member-aware and multibuy-aware basket pricing if Sherry confirms it is in scope.
4. Add a store import/validation path for the 95-store dataset without changing the comparison contract.
5. Define the split-basket recommendation model before implementation.

---

## Blockers

- Sherry's scope/priority confirmation is still outstanding.
- The 95-store dataset format/script is not available in this repository.
- Member-aware and multibuy-aware pricing need a product decision before canonical price publication is expanded.
