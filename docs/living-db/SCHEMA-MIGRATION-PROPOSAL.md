# Phase B schema proposal — NOT applied

## Current constraints verified in Prisma schema
- `Product.barcode` is required and unique; optional UPC/SKU was requested.
- `Product` has no direct data-source/provenance field.
- `PriceObservation.storeId` is required; a retailer flyer does not always name an individual store.
- `StagedOffer` contains promotion details and original payload, but is batch-scoped.
- `BasketItem.productId`, `PriceObservation.productId` are protected by FK restrictions; staged matches set null on deletion.

## Migration design
1. Verified DB backup **and restore test** before SQL.
2. Disable Open Food Facts importer and any scheduled reimports.
3. Change `Product.barcode` to `String? @unique @db.VarChar(64)` in a reviewed Prisma migration. PostgreSQL permits multiple nulls in a normal unique index.
4. Add a **product evidence/provenance** relation (productId, sourceSystemId, sourceRecordId, observedAt, raw evidence, confidence). Do not infer provenance of historical products.
5. Add durable **AdvertisedOffer**, separate from `StagedOffer` and `PriceObservation`, with stable source identity, retailer, optional store/product links, sale/regular price (both nullable), condition text/JSON, raw payload, observedAt, validFrom/Until, and lastSeenAt.
6. Preserve one advert for grouped variants until individual SKU identities can be verified. Never create one arbitrary canonical product to hold multiple options.
7. Keep advertised source timestamps and offsets. For a date-only endpoint, document local-zone end-of-day conversion and UTC storage; never parse ambiguous `12/11/2026` by guesswork.
8. Use `npx prisma migrate dev --create-only --name living_catalog` on an isolated development copy to inspect generated SQL before applying migrations.
9. Add indexes/uniqueness keys for repeated flyer captures. Reingestion must be idempotent. Do not overwrite verified product attributes with lower-confidence flyer text.

## Not authorized in this preparation
- No `TRUNCATE`, `DELETE FROM products`, `prisma migrate reset`, bulk promotion, or FK cascade.
- No live endpoint or ingestion module modified.
- No assumption that all 62,575 products have Open Food Facts provenance.
- No price observation creation without a matching store.
