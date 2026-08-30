# SC-02 No-Regression Contract

SC-02 is an extraction milestone, not a feature/redesign milestone.

## Frozen data contracts

- POS root remains exactly `toko_segeranjiwa_v58`.
- QRIS root remains exactly `segeranjiwa_qris_beta_v1`.
- Firebase Rules are unchanged.
- Database schema is unchanged.
- v1.0.40 compatibility artifact SHA256 remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.

## Functional contracts that must remain true

1. **Transactions** — one user confirmation produces one proven `processTransaction()` commit path; no second writer is introduced.
2. **QRIS** — `SJQrisSignalBeta` remains the only pending/matching/ambiguity/cancel/finalization engine. Pending readiness, recovery, manual fallback and ambiguity safety are preserved.
3. **Inventory** — recipe reservation, rollback, commit, normalization and VOID restore continue through the existing inventory authority.
4. **Purchase/WAC** — landed cost and moving WAC formulas retain v1.0.40 behavior; live purchase recovery still uses the proven chain.
5. **Debt/Kasbon** — existing creation/repayment authorities remain; extracted helpers do not create parallel persistence.
6. **Shift** — active shift identity, role guard, handover and closing state machine remain the existing behavior.
7. **Refund/VOID** — no semantic rewrite and no duplicate stock/sales/debt/costing side effects.
8. **Reports/evidence** — extracted boundaries are read-only. Missing/legacy HPP remains `null` / **Belum tersedia**, never converted to Rp0.
9. **Menus/UI** — no menu, renderer, icon, refinement or navigation change is authorized in SC-02.
10. **Auth/session** — no persistent-session behavior change yet; that work is reserved for SC-04 after boundaries are stable.

## Regression gate

SC-02 may be called complete only when:

- extracted Data/Domain source contains no direct `.set()`, `.update()`, `.transaction()` or `.remove()` call;
- all inline scripts in compatibility v1.0.40 parse;
- fixed roots and required legacy authorities are present;
- compatibility dist hash equals frozen baseline;
- all SC-01 + SC-02 automated tests pass from the delivered ZIP after extraction.
