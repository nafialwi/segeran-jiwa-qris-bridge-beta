# Reports & Finished-Goods Inventory v2.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add read-only transaction drilldown and product leaderboards for all roles, simplify finished-goods warehouse operations, relabel recipe cancellation safely, and polish the inline quantity stepper.

**Architecture:** Add pure report analytics in `src/domain`, then presentation-only adapters in `src/ui`. Report adapters read the existing `SJReportFoundationV010.state.model`; inventory adapters delegate all writes to `SJInventoryV2` and existing stock routes. Bootstrap installs the new adapters without modifying the legacy baseline.

**Tech Stack:** ES modules, vanilla DOM, Node test runner, Firebase RTDB existing runtime.

**Spec:** `docs/superpowers/specs/2026-09-01-reports-inventory-v26-design.md`

## Global Constraints
- Do not modify `baseline/legacy-v1.0.40.html`.
- No new direct transaction/payment/inventory/shift RTDB writer.
- Cashier transaction history is read-only.
- Recipe cancellation delegates to existing active/nonactive recipe behavior.

---

### Task 1: Product sales analytics
**Files:** Create `src/domain/report-product-analytics.js`; test `tests/ref01-report-history-inventory-v26.test.mjs`.
- [ ] Write failing tests for normalized transaction items, refund-aware net quantity, VOID exclusion, and qty/revenue leaderboard ordering.
- [ ] Run focused test and verify RED.
- [ ] Implement pure analytics functions.
- [ ] Run focused test and verify GREEN.

### Task 2: Read-only Sales History and transaction item detail
**Files:** Create `src/ui/report-sales-history-refinement.js`; modify `src/app/ref01-bootstrap.js`; test same v2.6 test file.
- [ ] Write failing tests for all-role installer contract, read-only markup, period/filter controls, transaction item detail, and absence of Refund/VOID action buttons for Cashier.
- [ ] Run RED.
- [ ] Implement adapter using `SJReportFoundationV010.state.model` and Core pricing detail authority.
- [ ] Install through REF-01 bootstrap and re-run GREEN.

### Task 3: Finished-goods warehouse hub
**Files:** Create `src/ui/finished-goods-warehouse-refinement.js`; modify bootstrap; test same v2.6 test file.
- [ ] Write failing tests that only product options (`P:`) survive selector filtering and that actions delegate to existing `SJInventoryV2.open('purchase'|'transfer')` and `openOpr(3)`.
- [ ] Run RED.
- [ ] Implement Owner-only hub plus read-only Gudang/Gerai balance preview.
- [ ] Run GREEN.

### Task 4: Recipe cancellation presentation
**Files:** `src/ui/finished-goods-warehouse-refinement.js`; test same v2.6 test file.
- [ ] Write failing test that existing `Nonaktifkan` recipe buttons are relabeled `Batalkan Rumus` without introducing a delete writer.
- [ ] Run RED, implement DOM relabel/note, run GREEN.

### Task 5: Quantity stepper visual polish
**Files:** Modify `src/ui/ref01.css`; update v2.6 test.
- [ ] Write failing CSS contract for single pill, compact 3-column layout, no pseudo separators, circular minus/plus, and centered tabular quantity.
- [ ] Run RED.
- [ ] Implement CSS only.
- [ ] Run GREEN.

### Task 6: Regression, build, package
- [ ] Run `npm run verify:ref01` and require zero failures.
- [ ] Confirm frozen baseline SHA unchanged.
- [ ] Build stable manifest excluding timestamped audit evidence.
- [ ] ZIP candidate, fresh-extract, verify manifest, and run `npm run verify:ref01` again.
