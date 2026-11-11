# Phase B — test and verification protocol

Use Windows PowerShell from `C:\Jonathan\Capstone\Kavyo_Backend\kavyo-backend`.

## 0. Source alignment and safety
- Save local uncommitted changes before switching branches; A.1–A.3 may exist **only locally**.
- This preparation branch is based on the remote `feature/flipp-ingestion-upgrade`, so the local tested A.1–A.3 files must be retained/merged.
- Check that DATABASE_URL targets **development**, never production. Never publish `.env`.
- Do not run migrations, deletion, or live flyer ingestion as part of the preparation review.

## 1. Static and unit checks
```powershell
git status --short
npm test -- src/ingestion/living-catalog/living-catalog-policy.spec.ts
npm test -- src/ingestion/product/
npm run build
git diff --check
```
Expected: all applicable tests pass; NestJS build clean. Warning about Vite tsconfig paths is not an error.

## 2. Read-only catalog audit
```powershell
npx tsx scripts/audit-living-catalog.ts
Get-Content data/research/living-db/catalog-audit.json
```
Expected: counts and all FK constraints displayed; no database writes; `sourceSystems` and related counts are **not** proof of Product provenance.
Compare counts with previous baseline, accounting for new ingestion.

## 3. Offer policy acceptance cases
- Generic produce without brand/size: keep advertised offer, no fake canonical SKU.
- Grouped `Rice 500–700g`, `Pizza Pops or Strudels`: preserve the offer; do not force one Product.
- Missing regular price: JSON null and UI `Price unavailable`, never copy promotion price.
- Promotion not yet effective: `UPCOMING`; expires only when timestamp exceeds supplied end instant.
- Expired promo: product remains and offer becomes historical.
- Out-of-scope car seats: no catalog product creation.
- Pharmacy and pet supplies: remain in scope if correctly classified.
- `REVIEW_SCOPE` offers stay available for audit; no forced promotion.

## 4. Before *any* schema migration
```powershell
npx prisma validate
npx prisma migrate status
```
Review migration SQL using an isolated dev DB; take pg_dump and test a restore. Do not run reset.

## 5. Future integration acceptance (not implemented by this prep)
- Same capture twice: no additional canonical Products or durable offers.
- Same item across retailers: one canonical Product only if identity sufficiently corroborated, two retailer offers.
- Reordered or changed flyer promo: version or update correctly without losing raw evidence.
- Contradictory GTIN/package: flag conflict; no silent merge.
- Price is missing: no invented price; maintain source metadata.
- Store unknown: no PriceObservation requiring storeId.
- Future `validFrom` should not display price as active.
- User baskets and product references survive archival/cleanup.
- Failed transaction rolls back product+offer linking atomically.
- Audit history identifies source of every enrichment change.

## 6. Approval gate
Review generated audit report and migration diff before enabling writes.
**Do not run destructive operations until FK-safe cleanup manifests are reviewed.**
