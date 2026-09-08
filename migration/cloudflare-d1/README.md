# Segeran Jiwa — Cloudflare D1 Shadow Migration Kit

This kit converts an exported Firebase RTDB JSON snapshot into **shadow-only** Cloudflare artifacts. It does not connect to Firebase, Cloudflare, or production by itself.

## Safety model

- Firebase remains the production authority until parity and cutover are explicitly approved.
- The importer is deterministic for the same backup content except for informational import timestamps.
- Every imported business row retains `legacy_path` and `raw_json` provenance.
- Transaction media data URLs are removed from generated SQL. Media bytes are deduplicated by SHA-256 and emitted into `media/` for later R2 upload.
- `operation_id`/legacy IDs are retained where available so a later dual-write/cutover layer can stay idempotent.
- The emergency D1 subsystem under `emergency-d1/` is separate and is not modified by this migration kit.

## Generate shadow artifacts

```bash
node migration/cloudflare-d1/import-firebase-backup.mjs firebase-backup.json /tmp/sj-d1-shadow
```

The output directory contains:

- `shadow_import.sql` — normalized D1 inserts for the supported legacy ledgers.
- `r2_media_manifest.json` — one row per unique media object, with SHA-256, MIME type, R2 target key, local file, and every legacy source path.
- `media/` — extracted media bytes ready for a later explicit R2 upload step.
- `parity_summary.json` — per-shift and global transaction/sales/expense/refund totals for shadow comparison.

Firebase exports wrapped under `toko_segeranjiwa_v58` and exports that already start at that node are both accepted.

## Apply to a local/shadow D1 database

Create the schema first, then import the generated SQL. Example with Wrangler when a D1 database is already configured intentionally:

```bash
npx wrangler d1 execute <SHADOW_DATABASE_NAME> --file=migration/cloudflare-d1/schema_v1.sql --local
npx wrangler d1 execute <SHADOW_DATABASE_NAME> --file=/tmp/sj-d1-shadow/shadow_import.sql --local
```

Do not point these commands at a production D1 database until shadow parity has been reviewed.

## Parity gates before any cutover

At minimum, compare Firebase vs D1 for each shift/date:

1. transaction count;
2. gross/net sales total according to the same legacy semantics;
3. expense total;
4. refund total;
5. transaction IDs and line-item quantities;
6. purchase/inventory ledgers once their dedicated migration mapping is enabled;
7. month-close/finance snapshots before Finance becomes D1-primary.

A successful import is not authorization to cut over. Cutover remains a separate approved phase.
