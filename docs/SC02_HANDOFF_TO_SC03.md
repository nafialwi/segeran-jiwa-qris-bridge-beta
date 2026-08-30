# SC-02 → SC-03 Handoff

SC-03 may begin **Feature Module Extraction + Legacy De-layering** after this package passes its packaged verification.

## What SC-02 provides

- fixed data-root constants;
- one legacy-authority bridge;
- QRIS adapter around `SJQrisSignalBeta`;
- pure pricing and costing/WAC calculations;
- delegate-only transaction/inventory/debt/shift/refund boundaries;
- read-only repositories/report boundary;
- single-writer ownership map;
- automated no-regression verifier.

## SC-03 rules

1. Do not rewrite business semantics while moving feature code.
2. Move one feature family behind the extracted boundaries, then run regression before removing the corresponding legacy caller/renderer.
3. Never activate two mutation writers for the same action.
4. Keep `SJQrisSignalBeta` as QRIS engine; feature modules call the adapter, not RTDB.
5. Keep `processTransaction()` as commit authority until a separate parity gate explicitly authorizes replacement.
6. Keep v1.0.40 rollback artifact untouched.
7. No visual refinement redesign in SC-03. The nine approved refinement references are applied together later in REF-01 after de-layering.
8. Preserve the complete menu/role capability set. De-layering must not silently remove functionality.
9. Settings/user/session persistence is not a reason to rewrite authentication in SC-03; persistent session is SC-04.
10. Any discovered ambiguity in legacy mutation ownership must stop cutover for that family rather than guessing.

## GitHub timing

SC-02 produces a credible modular **foundation**, but the compatibility runtime is intentionally still the frozen monolith. Therefore GitHub source-authority cutover should wait until SC-03 proves that feature/runtime de-layering works without regression. No GitHub URL is required to start SC-03.
