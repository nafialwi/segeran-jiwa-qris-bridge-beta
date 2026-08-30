# SC-02 Implementation Report — Core/Data/Domain Extraction

## Objective

Build testable modular seams around the proven v1.0.40 business engines without changing the running compatibility application.

## Completed

### Core / data contracts

- Centralized immutable roots `toko_segeranjiwa_v58` and `segeranjiwa_qris_beta_v1`.
- Added normalized POS/QRIS path builders.
- Added a legacy runtime bridge so high-risk operations have one explicit delegation point.

### QRIS

- Added `createQrisAdapter()` that delegates pending creation, cancel, ambiguity resolution, status and commercial-state rendering to existing `SJQrisSignalBeta`.
- The adapter has no direct Firebase reference/write implementation.
- QRIS finalization remains owned by the existing engine.

### Pricing / costing

- Extracted v1.0.40 pricing order and rounding into pure functions.
- Extracted landed cost, moving WAC, stock/recipe line cost, profit and aggregation functions.
- Added `safeProfit()` so absent HPP remains unknown (`null`) instead of becoming zero.

### Domain boundaries

- Transaction commit delegates once to `processTransaction()`.
- Inventory recipe lifecycle delegates to `SJInventoryV2`.
- Purchase recovery delegates to `SJCostingV1` while preview calculations are pure.
- Debt helpers are pure; live repayment/advance commands delegate to existing authorities.
- Shift lifecycle delegates to `SJShift`.
- Refund/VOID delegates to the existing hardening/fallback hierarchy.

### Read boundaries

- Added read-only repositories for transactions, inventory, purchases, debts, shifts and reports.
- Added report adapter for existing report evidence/detail calculations.

## Deliberately not changed

- No UI/refinement change.
- No renderer cutover.
- No Firebase Rules/schema change.
- No session/login behavior change yet.
- No transaction/QRIS/inventory mutation replacement.
- No GitHub/Cloudflare integration yet.

## Verification evidence

Fresh workspace verification produced:

- monolith audit: 698 declared functions, 368 mutation-site tokens, 59 layer markers, 104 normalized path families;
- 40/40 legacy inline scripts parse;
- 15 critical legacy contract tokens present;
- 23 extracted Data/Domain JavaScript files scanned, 0 direct Firebase mutation calls;
- compatibility dist SHA256 identical to frozen baseline;
- 41/41 automated tests PASS.

Final packaged-copy verification must also pass before this report is treated as the release checkpoint.

## Decision

SC-02 is a **modular foundation**, not yet the live source-authority cutover. SC-03 must migrate feature callers/renderers and remove legacy layering while keeping the one-writer contracts. GitHub URL is therefore not required yet.
