# Kavyo teammate database installation (integration branch)

The **authoritative validated database is not a reset target**. This installer uses only the dedicated local `kavyo_team_dev` database. It refuses remote hosts, other database names, and non-public schemas. It does not mutate `main` or the authoritative database.

## Prerequisites

Node.js 22+, PostgreSQL (localhost port 5432), npm dependencies installed (`npm ci`), and a local database role with `CREATEDB` permission. The committed handoff archive, reviewed 95-location Calgary store seed, and Prisma migrations must be present. Use the unified integration branch.

Configure `DATABASE_URL` in your private `.env` (never commit it), using **your own** local PostgreSQL password and the precise destination database:

```dotenv
DATABASE_URL="postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/kavyo_team_dev?schema=public"
JWT_SECRET="REPLACE_WITH_LOCAL_DEVELOPMENT_SECRET"
```

**Fresh installation:**

```bash
npm ci
npm run db:populate
```

**Update an existing teammate database without dropping it** (back it up first):

```bash
npm run db:populate -- --update --ack-backup
```

**Rebuild ONLY disposable `kavyo_team_dev`, discarding its local data** (never use this for the authoritative database):

```bash
npm run db:populate -- --reset --confirm-reset=kavyo_team_dev
```

The installer refuses reset while there are active connections to the destination database. Close applications connected to it before using reset mode. On any failure, the script stops and leaves the intermediate local database in place for inspection; a fresh reset is an explicit separate choice.

## Reproducing historical Flipp records

The committed product handoff archive is **product-centred**, not a complete export. It excludes unlinked staged offers, unlinked advertised offers, store-level price observations, and the raw source capture directories. The team cannot reconstruct those missing records from that archive alone.

To replay all **three existing Flipp pipeline stages** (stage captured offers, promote eligible advertised offers, promote confident canonical products), supply a complete **verified historical capture directory** from the authoritative source, preserving its `report.json` and raw JSON files:

```bash
npm run db:populate -- --capture=PATH_TO_VERIFIED_CAPTURE
```

For an existing destination use `--update --ack-backup` as well. The replay relies on the existing `scripts/run-flipp-ingestion.mjs` which requires a complete, failure-free source capture and checks provenance, conflicts, and generated reports. This mode **does not fetch new flyers** and **does not modify historical validity windows**. If your intent is to import **three specific original retailer flyers**, the verified capture must include those flyer IDs and their item details; the installer does not infer or fabricate them.

The archive and historical captures may be subject to Flipp/retailer terms; confirm permitted sharing before distributing raw content outside the approved project team.

## Population sequence

1. Enforce exact local target identity; refuse unauthorized database names.
2. Create a new `kavyo_team_dev`, or explicitly update/reset it.
3. Apply repository Prisma migrations and generate the client.
4. Seed reference roles, source systems, and three minimal fixture stores.
5. Import the version-controlled reviewed 95-location Calgary store seed (address matching; no deletion of individual stores).
6. Import the version-controlled product-centred handoff archive with its existing transactional insert/identity rules.
7. Optionally replay a complete Flipp capture through all three existing stages.
8. Report current counts for retailers, stores, products, staged offers, advertised offers, evidence, and store-verified price observations. Fail if key counts are below the documented minimum.

The installer imports **no users, credentials, baskets, or private account data** from the authoritative source. It does not treat advertised flyer prices as verified shelf prices.

## Limitations and verification

* This is a **team development fixture**, not a byte-for-byte copy of the authoritative database. The committed product handoff intentionally has narrower scope.
* Only the authoritative source and its approved exports should be used to release newer data packages. Do not promote teammate test records into authority.
* Existing team databases are disposable but are never dropped by the default command.
* The 95-store SQL seed is version-controlled; some store names, suite formatting, or sources may need later review. The imported count is validated at the database level.
* This script's syntax and preflight can be reviewed from GitHub, but executing the complete installer requires a teammate's local PostgreSQL setup and real source files. Confirm a successful full run before announcing a complete reproducible handoff.
