# Kavyo full historical flyer data handoff

This replaces the **partial product-centred** handoff for reproducing all three weeks of historical flyer data. The normal `npm run db:populate` baseline mode remains available. Full mode requires a separate archive exported from the actual authoritative PostgreSQL database and **will not download or reprocess flyers**.

## 1. Identify the authoritative source (read-only)

The export script reads only the locally configured `DATABASE_URL`; it will not touch a remote database. Set `DATABASE_URL` to the authoritative local database for these commands, then run:

```powershell
npm run db:flyers:audit -- --source-db=kavyo_dev
```

Change `kavyo_dev` in the command to the actual database name. The script checks that it matches the connection. Inspect counts and week-by-week staged offer totals. If no single database contains the historical records, **do not claim this is a complete three-week export**: investigate the other snapshots or capture directories first.

## 2. Export (read-only)

```powershell
npm run db:flyers:export -- --source-db=kavyo_dev --min-staged=10000
```

Only use `--min-staged=10000` if you expect at least 10,000 actual `staged_offers` rows in that database. If the script refuses, investigate the discrepancy rather than lowering the threshold without documenting why. The exporter creates:

- `data/handoff/kavyo-full-flyer-data.json.gz`
- `data/handoff/kavyo-full-flyer-data.json.gz.sha256`

It refuses to overwrite an existing export. The archive includes **all** source systems, retailers, stores, batches, flyers, staged offers, published advertisements, plus canonical products referenced by staged or published offers, their evidence, and related price observations. Product records unrelated to all flyer offers are intentionally not exported. All raw/normalized payloads, original timestamps, status, prices, and promotion conditions are preserved. Reviewer account IDs are replaced by `null`; reviewer notes, review decision and timestamp remain. No `users`, hashes, roles, baskets, or credentials are exported.

**Review the exported data for confidential strings in source payloads, reviewer notes, or source URLs, and confirm applicable Flipp/retailer permission before distribution.** The raw archive stays out of Git through `.gitignore`; share the archive and checksum via a restricted team file channel. It may be large. Team members get the exact same archive; **do not individually re-scrape changing weekly flyers**.

## 3. Import on each teammate's machine

The teammate needs the unified backend, PostgreSQL 18, `npm ci`, the two handoff files copied to `data/handoff/`, and a private `.env` targeting local `kavyo_team_dev` only.

Fresh database (create-only; refuses existing):

```powershell
npm run db:populate -- --full-archive=data/handoff/kavyo-full-flyer-data.json.gz
```

Rebuild a disposable existing `kavyo_team_dev` only (PERMANENTLY deletes its contents):

```powershell
npm run db:populate -- --reset --confirm-reset=kavyo_team_dev --full-archive=data/handoff/kavyo-full-flyer-data.json.gz
```

The archive and SHA-256 are checked **before** database creation or reset. The installer applies migrations, restores original IDs and the full historical flyer data in a transaction, seeds local authorization roles, adds/matches the reviewed 95-store SQL seed, then prints counts. It requires a newly migrated empty data schema; full mode refuses `--update` and `--capture` to prevent accidental double ingestion. It does not affect the source database.

## 4. Verification and limitations

- Compare counts in the `audit`, `export`, `inspect`, `RESTORED` and final population reports. The import fails on count mismatch or FK/uniqueness errors; the data import transaction rolls back on error.
- If some product rows in the source are unrelated to flyer data, they will not be restored. The full flyer timeline should be complete **only if the selected source database is complete**.
- Historical offers remain historical: dates are not advanced, and old offers should not be advertised as current.
- Store-related references are preserved using the original stores in the archive; the 95-store SQL seed fills missing stores after import.
- Since the source may have performed manual reviews, reviewer user IDs cannot be retained without private account records; those IDs are deliberately detached. Preserve a private audit in the authoritative database.
- This package is built for the Kavyo unified schema at 12 migrations; migration drift or subsequent schema changes require another compatibility review.
- The importer is limited to the exact local `kavyo_team_dev` target; it cannot overwrite `kavyo_dev` or other protected databases.
