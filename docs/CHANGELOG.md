# Candidate changes relative to the supplied repository ZIP

- Preserved all `src/` runtime TypeScript and existing `.spec.ts` tests, except generated Prisma client output (regenerated on `npm ci`).
- Preserved Prisma schema, all migrations, runtime seed and super-admin bootstrap.
- Preserved five ingestion stage scripts byte-for-byte, plus operational Calgary store seeder and its two reference JSON files.
- Added one-command runner from the earlier consolidation patch.
- Updated only `package.json` scripts: added `ingest:flipp` and `seed:stores`; removed the legacy `ingest:flyers` entry point (the old implementation is in archive).
- Archived the other standalone scripts and two historical approval JSON files in a separate ZIP; no stage script was deleted from the source ZIP.
- Excluded old nested review packages, local DB dump, raw research, generated build cache, editor files and historical backups.
- Retained all existing `src/` modules including basket/comparison because required for compiling the backend; **no Sherry PR changes have been fetched or merged**.
- Existing docs describing older importers are replaced by a short operational guide to prevent contradictory commands.
- Needs independent test/build checks and a DB replay before adoption.
