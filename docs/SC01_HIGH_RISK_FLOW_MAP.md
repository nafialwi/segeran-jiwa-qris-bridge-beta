# SC-01 High-Risk Flow Map

SC-01 does not modify these flows. This document defines the extraction order and regression obligations for SC-02/03.

| Flow | Legacy authority / evidence | Primary risk | SC-02 rule |
|---|---|---|---|
| Transaction finalization | `processTransaction()` L1589 | duplicate charge/write, stock reservation rollback | extract behind one transaction service; preserve idempotency/verification |
| VOID | `voidTx()` L1733 | sales reversal + stock restoration + debt/report side effects | no semantic rewrite; parity tests before removal |
| Inventory adjustment | `sjSaveStock()` L1857 | stock balance + ledger divergence | one inventory service + repository |
| Shift lifecycle | `SJShift` L2037 / `window.SJShift` L2174 | owner/cashier session ownership, closing state | preserve state machine and active-session identity |
| QRIS | `SJQrisSignalBeta` L6225 | duplicate pending/finalization, false match | wrap existing engine; never create a second QRIS engine |
| Purchase/WAC | WP-F03 purchase commit starts L7310 | WAC/stock/expense/ref identity drift | extract write orchestration without changing formulas |
| Reports/evidence | REP0 starts L7778 | historical evidence loss, HPP-as-zero error | read-only report service; preserve missing-HPP semantics |
| Auth/session | legacy `doLogin()` L1484 + secure/hybrid login layer | relogin/lifecycle, role mapping | map first in SC-02; persistent restore only in SC-04 |

## Fixed data contracts

- POS root: `/toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- No Rules/schema/root changes during SC-01/SC-02 unless separately approved.

## Regression order for extraction

1. Read helpers/constants.
2. Repository adapters.
3. Pure calculation services.
4. Transaction/inventory/purchase high-risk writes.
5. QRIS adapter around existing engine.
6. Shift/debt/refund/report boundaries.
7. Only then renderer/module migration.
