# Legacy catalog removal — gated runbook (NO deletion SQL included)

**STOP:** Do not delete anything based only on current 62,575-product count. Product has no direct source identifier.

1. Stop/disable Open Food Facts import jobs; record the exact code path and disable rerun on startup.
2. Run the read-only audit on the correct development DB and inspect the full JSON. Capture DB identity independently.
3. Independently establish **which Product IDs are actually Open Food Facts imports** using original ingestion logs, verified import scripts, source crosswalks, or DB snapshots. Barcode alone is not sufficient proof.
4. Take `pg_dump` backup, verify file integrity and restore it to an isolated DB. Keep rollback point.
5. Inspect all product FKs; pay particular attention to baskets, price observations, staged matches and frontend/API references.
6. Define legacy-to-new canonical Product ID mapping wherever dependencies must be preserved.
7. Review an explicit candidate deletion/archival manifest with Product ID, evidence of origin, FK count, preserve/migrate decision.
8. Reconcile all dependencies in transaction on isolated DB; review changed row counts and backfill actions.
9. Only then prepare a reviewed archive/delete migration (prefer soft deactivation when identity is uncertain).
10. Re-run total/FK checks and application tests. Preserve rollback and compare user baskets before/after.
11. Require manual final approval before production rollout.

**No commands in this document perform catalog deletion.**
