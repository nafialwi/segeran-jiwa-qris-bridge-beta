# Segeran Jiwa Legacy — P0-BW02 Firebase Bandwidth Hardening Report

Date: 8 September 2026
Rollback baseline: R8 Unified Refinement commit `1ffa956`
Production authority during this phase: Firebase RTDB
Cloudflare D1/R2 status: shadow migration tooling only; no cutover

## Trigger evidence

Firebase Spark showed approximately 21.6 MB RTDB storage but 19.5 GB monthly downloads against the 10 GB no-cost quota. The ratio made read amplification and repeated media payload transfer the emergency priority.

## Source-level causes hardened in P0-BW02

### 1. Product image bytes were duplicated into transaction history
The legacy sale snapshot copied `savedImg`/`img` into each transaction line. Because product images can be Base64 data URLs, the same image bytes could be stored repeatedly across many transactions and later re-downloaded with shift/history/report reads.

P0-BW02 removes image fields from newly persisted transaction `cartData`. Product identity, name, quantity, price, note, and cup code remain intact. Existing historical transaction media is not destructively rewritten in this emergency patch.

### 2. Recipe/HPP wrappers discovered new transactions by full-shift before/after reads
The active recipe and costing wrappers read the whole shift transaction subtree before the sale, executed the canonical writer, then read the whole shift again to discover the new transaction.

P0-BW02 makes the already-created canonical transaction ID available only after the existing root update succeeds. Recipe and HPP wrappers use that exact ID instead of full-shift diff scans.

### 3. Refund costing located original transactions by reading the full shift
P0-BW02 first reads the exact `/<shift>/tx/<originalTxId>` key. A bounded legacy fallback uses `orderByChild('id').equalTo(...).limitToFirst(1)`; the full-shift `tx.once('value')` lookup is removed from this recovery path.

### 4. Costing/refund recovery ran repeatedly in the background
The old business-data recovery timers are disabled. Recovery now uses:
- one bounded recovery pass after a valid login when the costing runtime is available;
- event-driven recovery for newly added recent refund rows;
- existing explicit/manual recovery functions remain callable.

No new recurring business-data interval is introduced.

## Cloudflare shadow migration kit

A separate `migration/cloudflare-d1/` kit was added. It does not connect to production services.

### D1 schema
`schema_v1.sql` defines normalized shadow tables for shifts, transactions/items, expenses, customer debt/payment ledgers, purchases, inventory movements, refunds, restock, cup counts, owner/month-close events, audit logs, media objects, and import provenance. Legacy paths and operation IDs are preserved where applicable.

### Firebase backup importer
`import-firebase-backup.mjs` accepts either:
- a Firebase export rooted at `toko_segeranjiwa_v58`; or
- an export that already starts inside that node.

It produces:
- `shadow_import.sql`;
- `parity_summary.json`;
- `r2_media_manifest.json`;
- deduplicated media files under `media/`.

Base64 media is removed from generated SQL. Media bytes are deduplicated by SHA-256 and given deterministic R2 target keys. The same media appearing in product, transaction, and refund records becomes one media object with multiple legacy source paths.

The generated schema + fixture import were also executed successfully against SQLite in-memory during local verification.

## Automated verification

After implementation and the build-tail compatibility correction:

- P0-BW02 bandwidth + D1 shadow targeted tests: PASS
- Full project suite on final source before package QA: `611/611` PASS
- SC03: PASS
- SC04: PASS
- REF01: PASS
- RC01-S10C-R6D: PASS
- `git diff --check`: PASS

Frozen source authorities were SHA-256 compared with R8 baseline and remained identical:
- `baseline/legacy-v1.0.40.html`
- `src/app/rc01-runtime-loading-hardening.js`
- `src/app/qris-deferred-settlement-bootstrap.js`
- `src/compat/rc01-qris-manual-bypass.js`
- `src/compat/rc01-qris-deferred-settlement-compat.js`
- `src/compat/rc01-qris-evaluation-convergence.js`
- `src/compat/rc01-sync-authority.js`
- `src/compat/rc01-sales-render-recursion-hardening.js`

A later package QA must re-run the full suite from a fresh guarded baseline; this report is not a production cutover authorization.

## Intentionally deferred

The emergency patch does **not** yet perform these larger changes:
- redesign all broad global startup listeners;
- remove Base64 media already stored in historical transaction rows;
- move product/logo/QRIS images to R2 in production;
- refactor all Finance reads to month-scoped server queries;
- remove Firebase as production authority;
- dual-write to D1;
- migrate authentication.

These are follow-up migration/hardening phases because they change larger data/read boundaries.

## Live validation still required

Passing source tests proves that the identified amplification mechanisms were removed from the candidate. It does **not** prove the number of billed Firebase GB already dropped. After Preview/UAT and when Firebase service/quota permits, profile at least:
1. Owner login + 3 minutes idle;
2. Kasir login + 3 minutes idle;
3. one normal sale;
4. refund flow;
5. Finance/history view.

The production cutover decision should use live path/byte evidence plus functional UAT, not static analysis alone.
