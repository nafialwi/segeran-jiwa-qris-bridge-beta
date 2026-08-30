# SC-02 Release Manifest

## Release identity

- Milestone: `SC-02 Core/Data/Domain Foundation`
- Package version: `0.2.0-sc02`
- Frozen compatibility authority: Segeran Jiwa POS v1.0.40
- Expected compatibility SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

## Fixed contracts

- POS root: `toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- QRIS authority: `SJQrisSignalBeta`
- Transaction commit authority: `processTransaction()`
- No Rules/schema change
- No visual refinement
- Missing HPP remains unavailable/null

## Key source artifacts

- `src/core/legacy-bridge.js`
- `src/data/firebase-client.js`
- `src/data/qris-adapter.js`
- `src/data/repositories/`
- `src/domain/pricing-service.js`
- `src/domain/costing-service.js`
- `src/domain/purchase-wac-service.js`
- `src/domain/transaction-service.js`
- `src/domain/inventory-service.js`
- `src/domain/debt-service.js`
- `src/domain/shift-service.js`
- `src/domain/refund-void-service.js`
- `src/domain/report-service.js`

## Verification command

`npm run verify:sc02`

## Next authorized milestone

SC-03 — Feature Module Extraction + Legacy De-layering. No refinement redesign until REF-01.
