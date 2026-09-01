# Segeran Jiwa POS — SC-04 Persistent Session + Source Workflow

SC-04 adds one persistent-session authority on top of the SC-03 modular runtime while preserving the frozen v1.0.40 compatibility artifact and all existing high-risk business writers.

## Authority

- `baseline/legacy-v1.0.40.html` remains immutable at SHA256 `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- `dist/index.html` remains the byte-identical compatibility build.
- `dist-sc03/index.html` remains the SC-03 feature/runtime checkpoint.
- `dist-sc04/index.html` is the SC-04 modular candidate and loads exactly one late ES-module entry: `./src/sc04-entry.js`.
- POS root remains `toko_segeranjiwa_v58`.
- QRIS root remains `segeranjiwa_qris_beta_v1`.
- `SJQrisSignalBeta` remains the QRIS authority and `processTransaction()` remains the transaction commit authority.
- Firebase Rules/schema and billing mode are unchanged.

## What SC-04 activates

- one Session Manager as the persistent-session authority;
- one isolated local-storage boundary containing only a non-secret session envelope;
- Firebase Auth `LOCAL` persistence for HYBRID/SECURE mode when Firebase Auth is available;
- online server revalidation of POS user, role, device, and auth mapping before cold restore;
- fail-closed cold start while offline;
- restore of an existing active cashier shift through the captured legacy login/shift authority, without creating a second shift;
- manual logout invalidation before the legacy logout authority runs;
- live user/device revocation guards that force logout on disable/delete/role/device mismatch;
- reproducible source/build verification for the GitHub source-authority handoff.

SC-04 does not perform REF-01 visual refinement and does not create a second transaction, QRIS, inventory, shift, refund/VOID, debt, or reporting writer.

## Verification

```bash
npm run verify:sc04
```

The command rebuilds compatibility, SC-03, and SC-04 candidates; verifies all inline legacy scripts and fixed contracts; re-runs SC-02/SC-03 exit gates; runs the SC-04 session/source exit gate; and executes the complete automated regression suite.

No external npm dependencies are required.

## Start points

- `docs/SC04_SESSION_POLICY.md`
- `docs/SC04_UAT_CHECKLIST.md`
- `docs/SC04_SOURCE_WORKFLOW.md`
- `docs/SC04_IMPLEMENTATION_REPORT.md`
- `docs/SC04_RELEASE_MANIFEST.md`
- `docs/SC04_HANDOFF_TO_REF01.md`
- `audit/sc04-verification.json`
- `SC04_PROJECT_SHA256.txt`

## External source/preview binding

The local SC-04 source checkpoint is prepared for GitHub. An actual repository URL/authorized GitHub connection is required before the remote can become source authority. Cloudflare static preview is intentionally downstream of that GitHub binding and must remain zero-cost; no Firebase backend migration or billing activation is part of this phase.


## QA Batch 1 corrective v2.2
See `PROMPT5_QA_BATCH1_V22_IMPLEMENTATION_REPORT.md` for the post-v2.1 real-device visual corrective work.

## Prompt 5 corrective v2.5
Adds Owner-safe recovery closing for legacy ACTIVE shifts whose session record is missing, and polishes the inline product quantity stepper. Existing shift/cart/transaction writers remain authoritative.

## Prompt 5 — Production Sales Stability Corrective v2.7

v2.7 menutup gap produksi pada display order Penjualan, manual Refresh Owner/Kasir, recipe legacy yang mengintersep cart normal, quantity card sync, dan lifecycle Riwayat Penjualan. Icon Family tetap dipisahkan sebagai asset batch berikutnya. Lihat `PROMPT5_PRODUCTION_SALES_STABILITY_V27_IMPLEMENTATION_REPORT.md` dan `PROMPT5_PRODUCTION_SALES_STABILITY_V27_HANDOFF.md`.
