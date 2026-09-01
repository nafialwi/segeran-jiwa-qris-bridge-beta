# Sales & Shift UX Corrective Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add safe historical date/shift recovery, a canonical camera/manual product-code resolver, and a mini-cart bottom sheet without replacing existing cart, checkout, payment, inventory, shift, or transaction authorities.

**Architecture:** Pure product-code resolution lives in `src/domain/product-code-resolver.js`. Runtime UI adapters live in `src/ui/sales-shift-ux-refinement.js` and only wrap existing final refinement authorities. Historical shift discovery is read-only and uses Firebase queries over existing shift keys; all close actions delegate to `SJShift.openCloseModal()` through the existing stale-shift adapter. Mini cart reuses the existing cart renderer and cart state, changing presentation only.

**Tech Stack:** Vanilla JS ES modules, Node test runner, existing SC-03/SC-04 runtime, Firebase RTDB read-only queries, BarcodeDetector API.

**Spec:** Conversation-approved design: Historical Date/Shift + Smart Product Scanner + Mini Cart.

## Global Constraints
- Do not change frozen `baseline/legacy-v1.0.40.html`.
- Do not create a second cart state.
- Do not create a second transaction/payment/inventory/shift writer.
- Auto-add product codes must never use raw substring matching.
- Historical shift discovery is read-only; no arbitrary date selection that can create phantom records.
- Stale shift closing delegates to existing `SJShift.openCloseModal()`.
- Camera scans all detected candidates and stops only after a safe product match or explicit user close.

---

### Task 1: Canonical Product Code Resolver
**Files:** Create `src/domain/product-code-resolver.js`; Test `tests/ref01-sales-shift-ux.test.mjs`.
- [ ] Write failing tests for exact, safe alias, ambiguous, partial-code rejection, and multi-candidate camera resolution.
- [ ] Run focused test and confirm RED.
- [ ] Implement pure resolver.
- [ ] Run focused test and confirm GREEN.

### Task 2: Historical Shift Context
**Files:** Modify `src/ui/shift-refinement.js`; Create `src/ui/sales-shift-ux-refinement.js`; Test `tests/ref01-sales-shift-ux.test.mjs`.
- [ ] Write failing tests for context label, stale row classification, no phantom shift path, and Owner close delegation.
- [ ] Run focused test and confirm RED.
- [ ] Implement read-only recent shift discovery and context sheet integration.
- [ ] Run focused test and confirm GREEN.

### Task 3: Smart Camera Scanner Runtime
**Files:** Modify `src/ui/sales-shift-ux-refinement.js`; Test `tests/ref01-sales-shift-ux.test.mjs`.
- [ ] Write failing runtime tests proving camera/manual use the same resolver and quickAddCart only on a unique match.
- [ ] Run RED.
- [ ] Patch only sales camera mode; product-form camera delegates to existing authority.
- [ ] Run GREEN.

### Task 4: Mini Cart Presentation
**Files:** Modify `src/ui/sales-shift-ux-refinement.js`, `src/ui/ref01.css`; Test `tests/ref01-sales-shift-ux.test.mjs`.
- [ ] Write failing test proving existing final cart authority is wrapped, not replaced by duplicate state.
- [ ] Run RED.
- [ ] Wrap `SJFinalRefinementVC01A2.openCart/openCheckout`, add bottom-sheet class and preserve existing +/-/remove/checkout behavior.
- [ ] Run GREEN.

### Task 5: REF-01 Integration and Full Verification
**Files:** Modify `src/app/ref01-bootstrap.js`, release docs/manifest.
- [ ] Install runtime adapter from REF-01 bootstrap.
- [ ] Run focused tests.
- [ ] Run `npm run verify:ref01`.
- [ ] Build package, stable manifest excluding timestamped audit files, fresh extract, rerun `npm run verify:ref01`.
