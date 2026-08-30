# SC-03 Implementation Report — Feature Modules + Legacy De-layering

Date: 2026-08-30

## Status

SC-03 implements the modular caller/runtime boundary required by PROMPT 3 without changing the frozen v1.0.40 compatibility artifact or any high-risk business writer. Roadmap position after this work package: Prompt 3 of the normal 8-prompt roadmap (37.5% by prompt count).

## Implemented

- App route contract for Beranda, Jual, Operasional, Laporan, and Pengaturan.
- Deterministic app state with transaction children permanently parented to Jual.
- Owner/cashier role guard matching the observed v1.0.40 contract.
- Single legacy command registry that captures final legacy caller references and rejects a second public caller owner.
- App Router controlling primary navigation, operational/report/settings children, cart, checkout, and payment entry.
- Runtime bootstrap that loads after the final legacy inline patch chain and replaces approved public entries exactly once.
- 42 feature boundaries across dashboard, sales, payments, operational, reports, and settings, wired into an active runtime registry before App Router dispatch.
- Explicit deferred boundaries for appearance (REF-01) and security/session sync (SC-04/future), so SC-03 does not invent behavior.
- Separate `dist-sc03/` candidate build; compatibility `dist/` remains the exact rollback baseline.
- SC-03 static exit-gate verifier, menu/capability map, legacy caller/renderer map, and no-regression contract.

## Fresh verification evidence

The release command is `npm run verify:sc03`.

Most recent pre-package full run:

- monolith audit: 698 functions, 368 write-site tokens, 59 layer markers, 104 path families;
- compatibility build SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`;
- SC-03 candidate SHA256: `5819aa73662a22bc75d28042d922cd20f24dd0d54e9718ef73e8487ebd12611c`;
- inline scripts: 40/40 parse, 0 failures;
- critical contracts: 15 present, 0 violations;
- SC-02 verifier: 23 extracted JS files, 0 direct Firebase mutations;
- SC-03 verifier: 42 feature boundaries (40 active, 2 deferred), 58 app/core/module JS files, 0 direct mutations, 1 modular entry, 0 violations;
- feature-runtime gate: public wrappers route through the feature registry and all 7 SC-02 domain seams are present (`qris`, `transaction`, `inventory`, `shift`, `refundVoid`, `report`, `debt`);
- automated tests: 61 pass, 0 fail.

## Legacy layer status

Legacy renderer bodies are **intentionally retained** as compatibility implementations. They are no longer independent public navigation owners for the migrated entry points. The SC-03 bootstrap captures the final v1.0.40 functions first, then public calls pass through the active feature runtime registry and App Router before reaching captured compatibility authorities. The modular runtime becomes the only public caller owner for `showView`, `openOpr/closeOpr`, `openLap/closeLap`, `openMst/closeMst`, `openCartModal`, `SJX.openDashboard`, `SJRefinementCheckoutV100.openCheckout`, and `SJCommercialFinalV5961.openPayment`.

No visual renderer/CSS rewrite is part of SC-03. Removal of visible legacy style/renderer bleed remains refinement work, not this structural migration.

## Preserved high-risk authorities

- QRIS: `SJQrisSignalBeta`; no second QRIS engine/writer.
- Transaction commit: `processTransaction()`.
- Inventory/recipe: `SJInventoryV2`.
- Purchase/WAC: `SJCostingV1` and existing recovery chain.
- Debt: transaction creation + `lunasiHutang`; employee advances remain existing authorities.
- Shift/closing/handover: `SJShift`.
- Refund/VOID: `SJOperationalHardening` with existing fallback.
- Reports/evidence: existing SC-02 read-only authority mapping.
- Unknown HPP semantics remain unavailable/null; SC-03 adds no Rp0 fallback.

## Open backlog intentionally not absorbed into SC-03

- persistent session/login restore: SC-04;
- GitHub source authority and Cloudflare preview foundation: SC-04;
- final visual refinement convergence and legacy style/renderer bleed removal: REF-01 / Prompt 5;
- consolidated UAT + UI Freeze: Prompt 6;
- costing/HPP financial hardening including remaining VOID evidence details: Prompt 7;
- real-device QRIS/global V-PASS and AppMint/WebView-specific behavior: later gate / Prompt 8+;
- permission diagnostics hardening remains backlog unless required by later UAT.

## Exit-gate assessment

Automated SC-03 exit conditions are met by the modular candidate: singular migrated caller ownership, deterministic route/parent state, complete live menu mapping, role guard parity tests, fixed roots, unchanged compatibility hash, retained business writers, and full automated regression with zero failures.
