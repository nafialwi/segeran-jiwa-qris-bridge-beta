# SC-01 → SC-02 Handoff

SC-02 may begin Core/Data/Domain extraction.

## Mandatory rules

- Extract, isolate, verify; do not rewrite semantics.
- Existing `processTransaction()` behavior is transaction authority until parity replacement is proven.
- Existing `SJQrisSignalBeta` is QRIS authority and must be wrapped by an adapter, not duplicated.
- Assign every active Firebase mutation to exactly one repository/domain command before removing its legacy caller.
- Preserve POS root `toko_segeranjiwa_v58` and QRIS root `segeranjiwa_qris_beta_v1`.
- Unknown HPP remains unavailable, never synthetic Rp0.
- No visual refinement in SC-02.
- GitHub URL is requested only at the end of SC-02 if modular parity is strong enough.

## Start with highest-risk boundaries

1. Firebase bootstrap/constants and repository interfaces.
2. QRIS adapter wrapping existing engine.
3. Transaction/pricing boundary.
4. Inventory + purchase/WAC.
5. Debt.
6. Shift.
7. Refund/VOID.
8. Read-only report calculations/evidence.

See `SC01_FIREBASE_WRITE_MAP.md`, `SC01_QRIS_CONTRACT_MAP.md`, `SC01_EXTRACTION_MAP.md`, and `SC01_LEGACY_DEBT_REGISTER.md`.
