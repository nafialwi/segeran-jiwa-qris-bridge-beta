# R8-B1 Daily UX, Role & Cup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a presentation-only Legacy refinement that removes duplicate transaction-success feedback and exposes read-only Gerai cup stock to Cashier without creating new Firebase reads or writers.

**Architecture:** Add one UI module installed through the non-frozen REF01 bootstrap. The module contains pure decision/render helpers plus runtime decoration; it never performs persistence and uses the already-existing P5 cup-shift cache.

**Tech Stack:** Browser ES modules, Node.js built-in test runner, existing REF01 build pipeline.

**Spec:** `docs/superpowers/specs/2026-09-08-r8-b1-daily-ux-role-cup-design.md`

## Global Constraints
- Do not modify `baseline/legacy-v1.0.40.html`.
- Do not modify R7 frozen authority files.
- No new Firebase read/listener/write in R8-B1.
- Preserve all non-duplicate toast behavior.
- Use current cup catalog authority rather than a literal fixed cup count in UI logic.

---

### Task 1: RED contract tests

**Files:**
- Create: `tests/r8-b1-daily-ux-role-cup.test.mjs`
- Test: `tests/r8-b1-daily-ux-role-cup.test.mjs`

**Interfaces:**
- Consumes: existing `buildCupInventoryRowsV34(raw)`.
- Produces expected interfaces: `shouldSuppressTransactionSuccessToast`, `cupOutletStatusR8`, `renderCashierCupStockSection`, `cashierStockActionPolicy`, `installR8DailyUxRefinement`.

- [ ] **Step 1: Write failing tests** asserting narrow toast suppression, cup rendering including Paper Cup 10 Oz, cashier action policy, no Firebase/background primitives, and REF01 bootstrap wiring.
- [ ] **Step 2: Run** `node --test tests/r8-b1-daily-ux-role-cup.test.mjs` **and confirm RED because the module/wiring does not exist yet.**

### Task 2: GREEN presentation module

**Files:**
- Create: `src/ui/r8-daily-ux-refinement.js`
- Modify: `src/app/ref01-bootstrap.js`
- Test: `tests/r8-b1-daily-ux-role-cup.test.mjs`

**Interfaces:**
- `shouldSuppressTransactionSuccessToast({message,kind,receiptVisible}) -> boolean`
- `cupOutletStatusR8(row) -> {code,label}`
- `renderCashierCupStockSection(cupRows) -> string`
- `cashierStockActionPolicy() -> {hideLabels:string[],keepLabels:string[]}`
- `installR8DailyUxRefinement(runtime, options) -> {installed,enhance}`

- [ ] **Step 1: Implement pure helpers** with no persistence/network calls.
- [ ] **Step 2: Implement runtime installer** that suppresses only the transaction-success toast while `#modal-struk-fs` is visible, reads the existing `p5Packaging.shiftControl.cupRows()` cache, and decorates Cashier Stock.
- [ ] **Step 3: Wire installer into `src/app/ref01-bootstrap.js`** and call `enhance()` inside the existing reconciliation cycle.
- [ ] **Step 4: Run** `node --test tests/r8-b1-daily-ux-role-cup.test.mjs` **and confirm GREEN.**

### Task 3: Regression gate

**Files:**
- Verify only.

- [ ] **Step 1: Run cup/payment targeted regression:** `node --test --test-concurrency=1 tests/legacy-cup-01a-paper10.test.mjs tests/legacy-cup-01b-product-cup-ui.test.mjs tests/v34-p5-batch2-cup-shift.test.mjs tests/v34-p5-batch2-cup-inventory-ui.test.mjs tests/rc01-receipt-output.test.mjs tests/r7-no-new-background-read.test.mjs`.
- [ ] **Step 2: Run R7 regression:** `node --test --test-concurrency=1 tests/r7-*.test.mjs`.
- [ ] **Step 3: Run REF01 build:** `npm run build:ref01`.
- [ ] **Step 4: Run full serial tests:** `node --test --test-concurrency=1 tests/*.test.mjs`.
- [ ] **Step 5: Run canonical verifier scripts available in `package.json`, preserving generated-artifact cleanliness.**

### Task 4: B1 checkpoint package

**Files:**
- Create: `R8_B1_IMPLEMENTATION_REPORT.md`
- Create external one-shot ZIP under `/mnt/data` with guarded installer + payload.

- [ ] **Step 1: Record baseline and post-change frozen hashes plus verification evidence.**
- [ ] **Step 2: Build a file-hash-guarded one-shot installer that creates a feature branch, applies only B1 files, runs verification, commits, and pushes the feature branch; never updates main.**
- [ ] **Step 3: Test the installer against a disposable local git copy of the reconstructed R7 source.**
- [ ] **Step 4: Package installer, payload, manifest, report, spec, and plan into one ZIP.**
