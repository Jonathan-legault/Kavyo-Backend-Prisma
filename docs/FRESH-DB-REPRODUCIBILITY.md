# Fresh-database reproducibility baseline (before promotion enrichment)

Status: **NOT YET EXECUTED**. This runbook is a test protocol; creating the branch and this document does not prove a fresh installation works.

## Frozen inputs and ownership

- Baseline code: commit `130f453` (`feature/ingestion-clean-verified`). The enrichment branch begins from this exact commit.
- Input: saved Flipp capture `2026-11-19T19-16-16-948Z` (6,156 unique flyer-item pairs). This capture is **not committed**: `data/research/flipp/` is ignored.
- Treat the raw capture as immutable. Check or transfer its original manifest and SHA-256 source checksums; do not replace it with a new live download.
- Do not modify normalization, promotion, or matching logic until a fresh-db baseline has completed.
- Existing counts 47 flyers / 14,699 staged / 13,507 advertised / 558 products / 558 product evidence / 1,133 linked advertisements describe a previously populated development DB. **These are not fresh-database assertions.**

## Test database isolation

The existing ingestion stage guards allow **only localhost/127.0.0.1** and database names `kavyo_install_test`, `kavyo_phase_b_test`, or `kavyo_dev`. Never point ingestion at another name or remote host.

The existing `seed-calgary-stores.ts --apply` **only permits** `localhost:5432/kavyo_dev`; it cannot be used to seed the isolated test DBs without a separately reviewed change. Do not bypass its guard. `prisma/seed.ts` seeds application bootstrap data; it is not a substitute for the full Calgary store reference import.

The current runner requires `--write --backup-confirmed` for any writes, including a new test DB. First verify the intended database is new/empty, preserve the existing DB backups, and explicitly acknowledge the safety flag only on the isolated database. No destructive reset of `kavyo_dev`.

## Local operator procedure (PowerShell)

1. Fetch and check out `feature/ingestion-promotion-enrichment`. Confirm `git rev-parse HEAD` is the baseline commit before any future enrichment commits; the fresh baseline must use exactly `130f453`.
2. Run `npm ci`, `npx prisma validate`, `npm test`, `npx tsc --noEmit --project tsconfig.json`, `npm run build`.
3. Ensure the original capture directory is available at `data/research/flipp/2026-11-19T19-16-16-948Z`. Never commit or redistribute it without confirming source rights.
4. As a PostgreSQL administrator, create an **empty** local database named `kavyo_install_test`; never drop/recreate an existing database without explicit verification. Set local `DATABASE_URL` to that DB (no credentials in terminal logs or reports). Verify the active database with `SELECT current_database();`.
5. Apply committed migrations using `npx prisma migrate deploy`; report and stop if it fails. Run `npx prisma db seed` only after verifying the project's configured seed command works. Capture migration and seed status.
6. Record a before-state with row counts from `flyers`, `staged_offers`, `advertised_offers`, `products`, `product_evidence`, `price_observations`, and `stores`.
7. Dry-run: `npm run ingest:flipp -- --capture "data/research/flipp/2026-11-19T19-16-16-948Z"`. Review source count and conflicts; verify counts unchanged.
8. After verifying the target DB is `kavyo_install_test` and that a suitable recovery point exists, write: `npm run ingest:flipp -- --capture "data/research/flipp/2026-11-19T19-16-16-948Z" --write --backup-confirmed`.
9. Record all after-state counts, stage report JSON, hold reasons, and stable-key counts. Repeat the same write command and verify no new identities or unapproved record modifications.
10. Repeat from a new **independently initialized** local `kavyo_phase_b_test` database with the same migrations, seed policy, code commit, and capture. Compare both databases by source keys, product catalog keys, advertisement stable keys, business fields, hold reasons, and condition evidence; exclude DB-generated UUIDs, creation/update timestamps, and run IDs.

## Required acceptance evidence

- Code commit SHA; Node/npm/PostgreSQL/Prisma versions; migration list and status; input capture manifest/checksums.
- Both DBs: first-run and second-run reports, table counts, per-source identity and business-field digests, hold-reason distributions, and difference list.
- Explicit note of seed differences: missing store reference import may affect the DB state and any store-dependent features. **Do not declare complete coworker reproducibility until store seeding works against the isolated DBs via an approved path.**
- No failing migrations, duplicate identities, silent promotions to canonical product status, or differing business values.
- A separate after-enrichment test on two new databases, with expected differences limited to documented enrichment fields.

## Current blockers

1. Source-capture redistribution and independent availability are not solved by Git clone alone.
2. Store seeding is restricted to `kavyo_dev`; isolated DBs cannot receive the store reference data via the current seeder.
3. Database runtime and migrations have **not** been executed from this session. No fresh-install baseline or deterministic comparison is claimed.

After these are resolved and baseline evidence exists, implement Sherry's promotion parser as **metadata enrichment only**, retaining the current conservative product identity and price eligibility rules.
