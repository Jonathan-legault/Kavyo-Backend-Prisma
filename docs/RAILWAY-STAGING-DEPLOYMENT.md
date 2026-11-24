# Kavyo shared staging — Railway deployment proposal (review required)

**Scope:** one Railway project with a NestJS API and a private PostgreSQL service. This proposal does not create or modify a Railway resource or import any data. Do not merge until reviewed.

## Repository source and release policy

- Backend source: `Jonathan-legault/Kavyo-Backend-Prisma`, `main` only after PR review.
- The GitHub Actions workflow validates Prisma configuration, TypeScript, NestJS build and unit tests on PRs and pushes to `main`.
- In Railway: connect the backend service to GitHub, select `main` as its source, **keep automatic deployment disabled until first staging initialization and validation**.
- After a successful initial launch, enable automatic deployment and **Wait for CI** in the Railway service settings. Railway requires a workflow running on pushes to `main`.
- `railway.json` builds and starts the API only. **It deliberately contains no pre-deploy migration, reset, seed or archive import command.**

## Provisioning checklist (Railway UI)

1. Create a private project called `Kavyo Staging` with access limited to the team.
2. Add a PostgreSQL service. Keep its public networking **disabled**. Configure and verify backups, and test a restore before permitting schema changes.
3. Add a separate API service from the GitHub repository, `main` branch.
4. Set backend service variables in Railway, never in GitHub:
   - `DATABASE_URL`: use a Railway reference variable to the PostgreSQL service's private `DATABASE_URL`. Confirm actual service name, such as `${{Postgres.DATABASE_URL}}`, in Railway rather than copying a presumed name.
   - `JWT_SECRET`: generate a unique, long random secret in the Railway environment.
   - `FRONTEND_URL`: the **exact** approved frontend origin (or comma-separated origin list) including protocol; update when the frontend is deployed.
   - `NODE_ENV=production`.
   - `PORT`: leave Railway-provided value intact; the NestJS entrypoint already uses `process.env.PORT`.
5. Configure a public HTTPS domain on the **API service only**. The database remains private.
6. Start the API only after the staging database has been initialized with the approved schema and data.

## Database initialization is a separate approval gate

**Never point the existing local-only `db:populate` or `db:flyers:import` scripts at the hosted database.** They explicitly reject remote hosts and/or non-disposable database names.

Before initial API launch:
1. Take a copy of the verified historical archive and its matching `.sha256` (SHA-256 must match). The archive is restricted team data and is not committed to Git.
2. Approve redistribution of source flyer payloads and review possible personal/confidential strings in raw payloads and review notes.
3. Approve a one-time **new remote staging import procedure** (not included in this PR), designed for an empty hosted database, with target identity verification, separate migration, transactional data import, count validation and no reset behavior.
4. Apply the 12 reviewed Prisma migrations with `prisma migrate deploy` in an authorized one-time private-network session, then import the reviewed archive once. Confirm exact migration count against current `main` before running.
5. Compare expected counts: 14,699 staged offers; 13,507 advertised offers; 558 products; 95 stores; 47 flyers; 7 retailers; 0 store price observations. Treat these numbers as the historical 2026-11-21 snapshot.
6. Enable database backups and verify restore before authorizing any subsequent schema migration.

**Normal GitHub pushes do not re-import flyers and do not synchronize the authoritative local `kavyo_dev` database.** New flyer captures require a separately approved, evidence-preserving ingestion/update workflow.

## Smoke tests after database setup

- `GET /` should respond with the application's root response (configured Railway health check).
- `GET /db-check` should return connected status and counts; this endpoint currently exposes record counts publicly, so restrict it or change it before any public production release.
- `GET /products?limit=2` should return products.
- Verify `/flyers/summary`, admin authentication, user registration, basket creation and comparison via the intended frontend.
- Remember historical flyer validity: old offers are not current grocery prices.
- Current product image URLs in canonical records may be empty although staged flyer images are preserved; catalog image resolution is a separate feature proposal.
- End-to-end admin fixture tests and npm dependency audit findings require follow-up before production release.

## Rollback and protection

- Previous backend code is recoverable using Railway's deployment history or by reverting the GitHub merge commit.
- This does **not** roll back PostgreSQL migrations or database writes. Take verified backups first.
- Never use `prisma migrate reset` or the local installer reset option on a hosted database.
- Keep `kavyo_dev` local and untouched. Treat Railway staging as an independently managed copy, not a replacement for the authoritative data.
