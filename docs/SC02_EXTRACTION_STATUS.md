# SC-02 Extraction Status

SC-02 establishes stable Core/Data/Domain seams while keeping the compatibility runtime byte-identical to v1.0.40.

| Boundary | Status | Runtime ownership in SC-02 |
|---|---|---|
| Fixed Firebase roots/path builders | **Extracted** | active as testable constants only |
| Legacy runtime bridge | **Extracted** | delegates to proven globals |
| QRIS adapter | **Extracted / delegate-only** | `SJQrisSignalBeta` remains live authority |
| Pricing formulas | **Extracted pure** | parity calculations available; UI still legacy |
| Costing/WAC formulas | **Extracted pure** | live purchase recovery remains legacy authority |
| Purchase/WAC service | **Extracted / delegate-only** | `SJCostingV1` existing engine remains live |
| Transaction service | **Extracted / delegate-only** | `processTransaction()` remains live commit authority |
| Inventory service | **Extracted / delegate-only** | `SJInventoryV2` remains live authority |
| Debt helpers/service | **Extracted pure + delegate-only** | legacy repayment/advance actions remain live |
| Shift service | **Extracted / delegate-only** | `SJShift` remains live authority |
| Refund/VOID service | **Extracted / delegate-only** | existing hardening/fallback hierarchy remains live |
| Transaction repository | **Extracted read-only** | no writes |
| Inventory repository | **Extracted read-only** | no writes |
| Purchase repository | **Extracted read-only** | no writes |
| Debt repository | **Extracted read-only** | no writes |
| Shift repository | **Extracted read-only** | no writes |
| Report repository/service | **Extracted read-only** | no writes; missing HPP stays unknown |
| Feature renderers | **Not migrated** | scheduled for SC-03 / REF-01 |
| Persistent POS session | **Not implemented** | scheduled for SC-04 |

## Compatibility result

`dist/index.html` is intentionally generated as a byte-identical copy of frozen `baseline/legacy-v1.0.40.html` during SC-02. Modular files are therefore testable source boundaries, not a second active application runtime.

This is intentional: business behavior must not change merely because source boundaries have been introduced.
