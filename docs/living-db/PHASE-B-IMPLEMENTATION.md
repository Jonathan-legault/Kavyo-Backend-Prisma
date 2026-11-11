# Kavyo Phase B — Living database

**Status:** preparation branch only; no active product promotion, no migrations applied.

## Goal
Move from a community-sourced seed catalog to a provenance-aware retailer-driven catalog that grows with new offers.
Flipp flyer data is credible *advertising evidence*, not guaranteed ground truth for GTIN, package size, shelf price, or store inventory.

## Data contracts
- `Product`: canonical real-world product identity; persist across promotions. Barcode optional, never invented.
- `AdvertisedOffer` (proposed): exact retailer flyer claim. May link to zero or one Product; grouped variant ads remain unlinked until resolved.
- `StagedOffer`: immutable-enough ingestion evidence and review entry. Current batch-scoped table stays.
- `PriceObservation`: store-specific product price evidence, only when actual store is known.
- `ProductEvidence` (proposed): provenance records for creation, updates and conflicts.

## Non-destructive work included in this prep branch
- `scripts/audit-living-catalog.ts`: read-only FK and source summary; saves JSON locally.
- `src/ingestion/living-catalog/living-catalog-policy.ts`: pure acceptance/display/temporal functions.
- `src/ingestion/living-catalog/living-catalog-policy.spec.ts`: policy tests.
- Written migration, removal and verification procedures.

## Implementation order after audit
1. Confirm source provenance and dependencies of legacy Product rows; do not delete unidentified records.
2. Create & review optional-barcode migration plus evidence/advertised-offer models.
3. Integrate explicit `StagedOffer -> AdvertisedOffer` idempotent upserts; preserve raw evidence and promo terms.
4. Link adverts to canonical Product only for independently supported identity; retain unmatched/variant advert rows.
5. Implement product creation and confidence-gated enrichment in a transaction (no fuzzy name merges).
6. Add catalog history and a retailer-specific expiry/visibility query; unknown regular price remains null.
7. Validate rollback, duplicate reruns, and multi-retailer cross-identities on a restored database.
8. After approval, archive/remove verified legacy imports with explicit mapped dependencies.

## Phase gates
**B.1:** audit and proposed migration; **B.2:** schema and durable offer ingestion; **B.3:** controlled product promotion and evidence-first enrichment; **B.4:** legacy catalog retirement.
No phase automatically enables the next one.

## Known data-quality issues from A.3
2,273 staged offers; 1,946 strict `REVIEW`, 282 create-candidate rows / 203 groups, 42 out-of-scope, 3 matches.
These are strict canonical-product decisions, **not** a statement that all reviewed advertisements are unusable.
Examples: Blueberries require scope classifier fixes; multi-variant Oîkos remains a useful advert but not one canonical SKU.
