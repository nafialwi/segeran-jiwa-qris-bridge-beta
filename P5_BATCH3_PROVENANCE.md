# P5 Batch-3 Provenance

Baseline: `SEGERAN_JIWA_POS_v3.4_P5_BATCH2_FINAL_QA_HARDENING_ANDROID_QA_2026-09-03.zip`
Baseline SHA256: `a5ef3902ae8e6010e4354eb3c63848fa77ef30327c6da0c7c4b5b80b3d1d5580`

Batch-3 source delta is limited to:

- `src/domain/costing-v34-coverage.js` (new, read-only pure domain)
- `src/domain/finance-v33-analytics.js`
- `src/ui/finance-v33-workspace.js`
- `tests/v34-p5-batch3-historical-hpp-coverage.test.mjs` (new)
- `docs/superpowers/plans/2026-09-03-p5-v34-batch3-historical-hpp-profit-coverage.md` (new)
- Batch-3 documentation files

No production database mutation was performed. P4 v3.3 LOCKED remains the finance architecture authority and rollback package inside the baseline remains unchanged.
