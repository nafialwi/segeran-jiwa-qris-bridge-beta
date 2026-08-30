# SC-02 Write Ownership Map

SC-02 uses a **single-writer strangler rule**. Extracted Core/Data/Domain modules do not take live mutation ownership yet. They either provide pure calculations/read-only repositories or delegate exactly once to the proven v1.0.40 runtime authority.

Fixed roots:

- POS: `toko_segeranjiwa_v58`
- QRIS: `segeranjiwa_qris_beta_v1`

No Firebase Rules or schema changes are authorized in SC-02.

| Mutation family | SC-02 single live authority | Extracted boundary | SC-02 rule |
|---|---|---|---|
| Sales transaction commit | global `processTransaction()` | `domain/transaction-service.js` | `commitLegacy()` delegates once; no second RTDB writer |
| QRIS pending, matching, ambiguity, cancel, finalization | `SJQrisSignalBeta` | `data/qris-adapter.js` | adapter only; QRIS RTDB is never written directly by SC-02 modules |
| Pricing settings persistence | legacy `SJPrice.saveSettings` / existing settings path | `domain/pricing-service.js` pure calculations | no pricing-setting write migration in SC-02 |
| Recipe reservation / rollback / commit / VOID restore | `SJInventoryV2` | `domain/inventory-service.js` | delegate only |
| InventoryV2 purchase, cost snapshots, movement evidence, WAC recovery | `SJCostingV1` plus the existing v1.0.40 purchase-recovery chain | `domain/purchase-wac-service.js` + pure costing functions | WAC preview is pure; live recovery delegates to existing costing authority |
| Legacy stock adjustments, refund stock restore, atomic operational inventory flows | `SJOperationalHardening` and existing legacy inventory writer selected by v1.0.40 | no direct SC-02 writer | do not consolidate writes until SC-03 can prove parity/idempotency |
| Shift sessions, handover, close | `SJShift`, with verified financial/operational writes already used by v1.0.40 | `domain/shift-service.js` | delegate only; preserve active-session identity/state machine |
| Customer debt created by sale/kasbon | `processTransaction()` | transaction boundary + read-only debt repository | no parallel debt creation path |
| Customer debt repayment | legacy `lunasiHutang` flow | `domain/debt-service.js` | delegate UI/command exactly once |
| Employee advance repayment | legacy `lunasiKasbonKaryawan` | `domain/debt-service.js` | delegate exactly once |
| Employee advance creation | legacy `simpanKasbonKaryawan` / active hardening path | `domain/debt-service.js` | delegate exactly once |
| Refund | `SJOperationalHardening.processRefund` when available, then proven v1.0.40 fallback | `domain/refund-void-service.js` | authority hierarchy chosen once; no new RTDB write |
| VOID | `SJOperationalHardening.voidTx` when available, then proven v1.0.40 fallback | `domain/refund-void-service.js` | no semantic rewrite; costing/stock sidecars stay existing |
| Refund/VOID costing sidecar | existing costing/refund chain in v1.0.40 | `domain/costing-service.js` is calculation-only | no new writer |
| Reports/evidence | **none — read-only** | repositories + `domain/report-service.js` | may read historical/current data; must not mutate |

## Ownership rule for SC-03

A legacy mutation caller may be removed only after all of the following are true:

1. the replacement points to exactly one authority;
2. identical/idempotent behavior is covered by regression tests;
3. QRIS/transaction/inventory/shift/debt/refund side effects are mapped;
4. rollback to v1.0.40 remains available;
5. there is no temporary period where both old and new writers can run for the same user action.

SC-02 deliberately stops before live mutation cutover.
