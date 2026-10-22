# Kavyo ingestion foundation

This is a source-neutral prototype. It does not implement production flyer scraping, live uploads, OCR, Prisma persistence, or API routes.

## Goal

Collect offers from permitted flyer APIs, documents or images, normalize them, match known products and stores, review ambiguous offers, then persist verified observations with provenance.

## Pipeline

Acquire -> extract -> normalize -> validate -> product/store matching -> review if needed -> persist -> audit ingest batch.

## Current files

- `src/ingestion/contracts/normalized-offer.ts`: candidate-offer contract (not a trusted price record).
- `src/ingestion/adapters/sample-json.adapter.ts`: adapter for Kavyo's own demonstration JSON format; not a third-party API integration.
- `src/ingestion/adapters/sample-json.adapter.spec.ts`: initial unit tests.
- `test/fixtures/sample-calgary-flyer.json`: **synthetic** test data; all store names and prices are illustrative.

## Decisions before database writes

1. Verify a legitimate flyer source, Calgary postal-code coverage, permitted use, costs and returned fields.
2. Design staging/review for flyer items without UPCs. The current Product model requires a unique barcode.
3. Distinguish lookup postal code from flyer coverage and verified store location.
4. Define deduplication, promotion conditions and data freshness rules.
5. Coordinate schema migrations with the team.

Do not insert synthetic fixture records into the real product catalogue. No changes are made to the existing Prisma schema, NestJS routes, authentication, or basket/comparison engine.
