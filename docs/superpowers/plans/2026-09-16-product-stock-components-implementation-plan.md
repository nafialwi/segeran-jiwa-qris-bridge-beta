# R10-STOCK-COMP01 Product Stock Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cup-specific recipe consumption with a generic, exactly-once Product Stock Components subsystem for discrete physical stock such as cups, lids, straws, boxes, sausages, and similar items.

**Architecture:** Add a separate stock-component domain with Stock Item master data, outlet/warehouse balances, deterministic sale application and restore journals, and product-to-stock-component mappings. New sales consume components only after the POS transaction is confirmed `COMPLETED`; refund/void restore from the immutable historical application snapshot. Inventory V2 Recipe remains for genuine recipe ingredients, while cup-only synthetic-recipe runtime paths are removed after verified cutover.

**Tech Stack:** Vanilla JavaScript ES modules, Node `node:test`, Firebase Realtime Database, Firebase Emulator Suite, existing REF01 build pipeline, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-15-product-stock-components-design.md`

## Global Constraints

- Work only in Segeran Jiwa POS Legacy.
- Firebase RTDB remains production authority.
- Zero-cost only.
- QRIS remains manual and independent from stock-component logic.
- Do not add recurring polling or a permanent transaction listener.
- Unknown stock state must not be rendered as `0`.
- Cashier must not gain arbitrary warehouse/global administration access.
- Do not publish Firebase rules, apply production migration, deploy Cloudflare, merge `main`, or delete production data without explicit user approval.
- Current live CUP-02 rules remain in place until the replacement path is verified.
- `src/app/rc01-runtime-loading-hardening.js` remains byte-identical to the frozen R6B SHA recorded during Task 1.
- Permanent dual-write is forbidden.
- Historical `cp`, reservation, movement, and audit data remain readable.
- New cup consumption must not depend on `__CUP_ONLY__` after cutover.
- Inventory V2 Recipe remains available for genuine recipe products.
- Every code task follows RED → GREEN TDD.
- Functional cutover and dead-code cleanup are separate commits.
- New stock reads must be targeted/bounded and must not undo R10 Inventory read-hardening.

---

## File Structure

### New files

- `src/domain/product-stock-components.js` — pure normalization, aggregation, IDs, snapshots, and restore allocation.
- `src/data/writers/stock-component-writer.js` — exactly-once Firebase writer/recovery.
- `src/domain/stock-component-migration.js` — pure legacy cup migration planner.
- `src/compat/legacy-stock-components-runtime.js` — legacy transaction adapter without permanent listener.
- `src/ui/product-stock-components-ui.js` — Stock Item and product mapping UI.
- `firebase/r10/stock-components-rules.mjs` — rules fragment.
- `firebase/r10/build-stock-components-rules.mjs` — candidate rules builder; never deploys.
- `firebase/r10/stock-components-emulator.mjs` — authorization/lifecycle emulator scenarios.
- `scripts/r10-stock-components-migration.mjs` — dry-run/apply migration CLI with source-hash guard.
- `docs/project-control/R10_STOCK_COMP_RUNTIME_MAP.md` — exact runtime/build/rules anchors.
- `docs/project-control/R10_STOCK_COMP_CLEANUP_AUDIT.md` — caller classification before cleanup.
- `tests/r10-stock-components-domain.test.mjs`
- `tests/r10-stock-component-writer.test.mjs`
- `tests/r10-stock-component-runtime.test.mjs`
- `tests/r10-stock-component-migration.test.mjs`
- `tests/r10-stock-components-ui.test.mjs`
- `tests/r10-stock-components-rules-contract.test.mjs`
- `tests/r10-stock-components-cleanup-contract.test.mjs`

### Existing files expected to change after Task 1 proves their runtime role

- `src/domain/packaging-cup-v34.js`
- `src/ui/cup-product-costing-v34.js`
- `src/compat/legacy-cup-01b-product-cup-ui.js`
- `src/ui/v31-ux-polish.js`
- exact REF01 source entry recorded as `REF01_ENTRY` in `R10_STOCK_COMP_RUNTIME_MAP.md`
- exact legacy refund/void owner recorded as `REFUND_VOID_OWNER`
- exact canonical Firebase rules source recorded as `RULES_SOURCE`
- reconciliation consumer files recorded by Task 1

---

### Task 1: Runtime Anchor Map and Safety Baseline

**Files:**
- Create: `docs/project-control/R10_STOCK_COMP_RUNTIME_MAP.md`

**Interfaces:**
- Produces exact repository facts used by later tasks:
  - `LEGACY_TX_WRITER`
  - `REF01_ENTRY`
  - `RULES_SOURCE`
  - `REFUND_VOID_OWNER`
  - `RECONCILIATION_FILES`
  - `FROZEN_R6B_SHA256`

- [ ] **Step 1: Verify linked worktree, branch, and cleanliness**

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short
git rev-parse HEAD
git rev-parse --git-dir
git rev-parse --git-common-dir
```

Expected branch: `work/r10-inventory-read-hardening`. Working tree must be clean.

- [ ] **Step 2: Capture exact writers and runtime imports**

```bash
rg -n \
'function processTransaction|async function processTransaction|processTransaction[[:space:]]*=|commitLegacy\(' \
src baseline > /tmp/r10-stock-tx.txt

rg -n \
'cup-product-costing-v34|legacy-cup-01b-product-cup-ui|packaging-cup-v34|__SJ_V34_CUP_SALE_READY|__CUP_ONLY__' \
src baseline tests > /tmp/r10-stock-cup.txt

rg -n \
'voidTx\(|REFUND_ATOMIC|refundBase\(|cpLaku|stockLedger' \
src baseline > /tmp/r10-stock-corrections.txt

rg -n \
'database.rules|build.*rules|firebase deploy --only database|reservations|balances/ingredients' \
firebase scripts package.json > /tmp/r10-stock-rules.txt
```

- [ ] **Step 3: Identify the REF01 entry and reconciliation consumers**

```bash
rg -n \
'cup-product-costing-v34|legacy-cup-01b-product-cup-ui' \
. -g '!node_modules/**' -g '!dist*/**' -g '!audit/**'

rg -n \
'buildCupInventoryRowsV34|theoreticalCupUsageV34|buildCupOutletOpnameDraftsV34|packaging-cup-v34' \
src tests
```

- [ ] **Step 4: Record frozen R6B hash**

```bash
sha256sum src/app/rc01-runtime-loading-hardening.js
```

- [ ] **Step 5: Write the runtime map with exact observed values**

The document must include the exact command-proven values and explicitly state `No production writes performed: yes`. If any required anchor cannot be proven, stop before Task 2.

- [ ] **Step 6: Run baseline verification**

```bash
npm run build:ref01
npm test
```

Expected: build exits 0 and the branch retains its established baseline with no new failures.

- [ ] **Step 7: Commit**

```bash
git add docs/project-control/R10_STOCK_COMP_RUNTIME_MAP.md
git commit -m "docs: map stock component runtime anchors"
```

---

### Task 2: Pure Product Stock Components Domain

**Files:**
- Create: `src/domain/product-stock-components.js`
- Create: `tests/r10-stock-components-domain.test.mjs`

**Interfaces:**
- Produces:
  - `normalizeStockComponents(raw)`
  - `componentsForProduct(productId, mapping)`
  - `aggregateSaleComponents(lines, mapping, stockItems)`
  - `stockApplicationId(shiftKey, txId)`
  - `stockRestoreId(kind, shiftKey, txId, correctionId)`
  - `buildApplicationSnapshot(input)`
  - `restoreAllocation(application, refundLines, alreadyRestored)`
  - `stockComponentFingerprint(value)`

- [ ] **Step 1: Write failing normalization and aggregation tests**

Test exact behaviors:
```js
const raw={
  STK_CUP22D:{qtyPerUnit:1,active:true},
  STK_STRAW:{qtyPerUnit:1,active:true}
};
assert.deepEqual(normalizeStockComponents(raw),[
  {stockItemId:'STK_CUP22D',qtyPerUnit:1,active:true},
  {stockItemId:'STK_STRAW',qtyPerUnit:1,active:true}
]);
```

Also assert zero, negative, and non-finite `qtyPerUnit` throw `STOCK_COMPONENT_QTY_INVALID`; multiple products sharing one Stock Item aggregate correctly.

- [ ] **Step 2: Run RED**

```bash
node --test tests/r10-stock-components-domain.test.mjs
```

Expected: fail because the new module is absent.

- [ ] **Step 3: Implement deterministic pure functions**

Application identity:
```js
export const stockApplicationId=(shiftKey,txId)=>
  `STOCK_APPLY|${safeToken(shiftKey)}|${safeToken(txId)}`;
```

Restore identity:
```js
export const stockRestoreId=(kind,shiftKey,txId,correctionId)=>
  `STOCK_${String(kind).toUpperCase()}|${safeToken(shiftKey)}|${safeToken(txId)}|${safeToken(correctionId)}`;
```

Returned arrays/records must be immutable and deterministically sorted.

- [ ] **Step 4: Add Rp0 and historical-snapshot tests**

A completed sale with total `0` still aggregates physical components. A later mapping change must not alter the already-built application snapshot.

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/r10-stock-components-domain.test.mjs
```

Expected: 0 failures.

- [ ] **Step 6: Commit**

```bash
git add src/domain/product-stock-components.js tests/r10-stock-components-domain.test.mjs
git commit -m "feat: add product stock component domain"
```

---

### Task 3: Exactly-Once Stock Component Writer

**Files:**
- Create: `src/data/writers/stock-component-writer.js`
- Create: `tests/r10-stock-component-writer.test.mjs`

**Interfaces:**
- Produces `createStockComponentWriter({db,root,now,serverTimestamp})`.
- Writer methods:
  - `applyCompletedSale({shiftKey,txId,transaction,mapping,stockItems,actor})`
  - `restoreVoid({shiftKey,txId,voidId,transaction,actor})`
  - `restoreRefund({shiftKey,txId,refundId,refundLines,transaction,actor})`
  - `recoverApplication({shiftKey,txId})`
  - `readApplication({shiftKey,txId})`

Canonical paths:
```text
global/stockItems
global/stockBalances
global/productStockComponents
global/stockApplications
global/stockMovements
```

- [ ] **Step 1: Write RED first-apply/retry tests**

Assert first apply decrements outlet once, retry returns `ALREADY_APPLIED`, one deterministic `SALE_COMPONENT` movement exists per component, application becomes `COMPLETED`, and transaction stores `stockComponentApplicationId` plus `stockComponentsApplied`.

- [ ] **Step 2: Run RED**

```bash
node --test tests/r10-stock-component-writer.test.mjs
```

- [ ] **Step 3: Implement claim lifecycle**

States:
```text
CLAIMED
COMPLETED
ERROR
SHORTAGE
```

Claim with RTDB `transaction()`. Only the valid claim owner may mutate balances.

- [ ] **Step 4: Implement balance transaction and deterministic movements**

For each Stock Item, mutate `global/stockBalances/{stockItemId}` transactionally. If outlet stock is insufficient, do not make it negative; set application `SHORTAGE` with requested/current quantities.

Movement IDs must be deterministic from application identity and Stock Item ID.

- [ ] **Step 5: Add multi-device and partial-failure recovery tests**

Two concurrent callers for the same transaction must produce one decrement. A retry after partial failure must complete without a second decrement.

- [ ] **Step 6: Run GREEN**

```bash
node --test tests/r10-stock-component-writer.test.mjs
```

Expected: 0 failures.

- [ ] **Step 7: Commit**

```bash
git add src/data/writers/stock-component-writer.js tests/r10-stock-component-writer.test.mjs
git commit -m "feat: add exactly-once stock component writer"
```

---

### Task 4: Refund and Void Restore Semantics

**Files:**
- Modify: `src/domain/product-stock-components.js`
- Modify: `src/data/writers/stock-component-writer.js`
- Modify: `tests/r10-stock-components-domain.test.mjs`
- Modify: `tests/r10-stock-component-writer.test.mjs`

**Interfaces:**
- Restore source is only the historical `stockComponentsApplied` snapshot.

- [ ] **Step 1: Write RED full-void test**

A sale that applied three cups and three straws restores `+3/+3` once. Retry with the same `voidId` changes nothing.

- [ ] **Step 2: Write RED partial-refund tests**

Sale quantity 3, refund quantity 1 restores one unit of every corresponding component. A second refund quantity 2 restores the remainder. Any further restore fails with `STOCK_RESTORE_EXCEEDS_APPLIED`.

- [ ] **Step 3: Run RED**

```bash
node --test tests/r10-stock-components-domain.test.mjs tests/r10-stock-component-writer.test.mjs
```

- [ ] **Step 4: Implement cumulative restore guards**

Use deterministic restore IDs and cumulative restored quantities stored under the original application. Never recalculate from current product mapping.

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/r10-stock-components-domain.test.mjs tests/r10-stock-component-writer.test.mjs
```

Expected: 0 failures.

- [ ] **Step 6: Commit**

```bash
git add src/domain/product-stock-components.js src/data/writers/stock-component-writer.js tests/r10-stock-components-domain.test.mjs tests/r10-stock-component-writer.test.mjs
git commit -m "feat: restore stock components on corrections"
```

---

### Task 5: Legacy Cup Migration Planner and CLI

**Files:**
- Create: `src/domain/stock-component-migration.js`
- Create: `tests/r10-stock-component-migration.test.mjs`
- Create: `scripts/r10-stock-components-migration.mjs`

**Interfaces:**
- Canonical IDs:
```js
export const LEGACY_CUP_STOCK_IDS=Object.freeze({
  c10:'STK_CUP_C10',
  c10p:'STK_CUP_C10P',
  c16:'STK_CUP_C16',
  c22p:'STK_CUP_C22P',
  c22d:'STK_CUP_C22D',
  c22o:'STK_CUP_C22O'
});
```
- Produces `buildLegacyCupMigration(...)` and `validateMigrationPlan(plan)`.

- [ ] **Step 1: Write RED migration tests**

Cover all six cup codes, preservation of outlet/warehouse balances, conversion of `product.cp` to quantity `1`, unrelated product stability, idempotent rerun, and zero source deletion.

- [ ] **Step 2: Run RED**

```bash
node --test tests/r10-stock-component-migration.test.mjs
```

- [ ] **Step 3: Implement the pure migration plan**

The result contains:
```js
{
  stockItems:{},
  stockBalances:{},
  productMappings:{},
  sourceCupRows:[],
  coverage:{mappedProducts:0,unmappedCupCodes:[],invalidProducts:[]},
  sourceHash:''
}
```

- [ ] **Step 4: Implement safe CLI**

Default:
```bash
node scripts/r10-stock-components-migration.mjs --dry-run
```

Apply requires both `--apply` and `--expected-source-hash`. If the live source hash differs, abort before any write.

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/r10-stock-component-migration.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add src/domain/stock-component-migration.js tests/r10-stock-component-migration.test.mjs scripts/r10-stock-components-migration.mjs
git commit -m "feat: add idempotent cup stock migration"
```

---

### Task 6: Generic Owner UI

**Files:**
- Create: `src/ui/product-stock-components-ui.js`
- Create: `tests/r10-stock-components-ui.test.mjs`
- Modify: `src/ui/v31-ux-polish.js`
- Modify: `REF01_ENTRY` recorded in Task 1

**Interfaces:**
- Produces management UI for `Item Stok` and product block `PEMAKAIAN STOK`.

- [ ] **Step 1: Write RED UI tests**

Assert Owner can manage Stock Items and multiple product components; Cashier cannot administer them; duplicate Stock Item selection is blocked; positive quantity is required; single mapping shows `Cup 22 oz Datar ×1`; multiple mappings show `N item stok`.

- [ ] **Step 2: Run RED**

```bash
node --test tests/r10-stock-components-ui.test.mjs
```

- [ ] **Step 3: Implement UI module**

Export:
```js
export function installProductStockComponentsUi(
  runtime=globalThis,
  {document=runtime.document}={}
)
```

Reuse existing mobile-first cards/modals. Do not add a new bottom-nav destination.

- [ ] **Step 4: Integrate through recorded REF01 entry**

Read the exact path from `docs/project-control/R10_STOCK_COMP_RUNTIME_MAP.md`, import/install the new UI after legacy core initialization, and keep the old cup UI present until the functional cutover task.

- [ ] **Step 5: Run GREEN and build**

```bash
node --test tests/r10-stock-components-ui.test.mjs
npm run build:ref01
```

- [ ] **Step 6: Commit**

Commit the new UI, test, `src/ui/v31-ux-polish.js`, and the proven REF01 entry.

---

### Task 7: Legacy Sale Cutover Without New Listener

**Files:**
- Create: `src/compat/legacy-stock-components-runtime.js`
- Create: `tests/r10-stock-component-runtime.test.mjs`
- Modify: `REF01_ENTRY` recorded in Task 1
- Modify `src/domain/transaction-service.js` only if Task 1 proves it is required for the actual legacy commit path

**Interfaces:**
- Produces `installLegacyStockComponentsRuntime(runtime=globalThis,{writer}={})`.

- [ ] **Step 1: Write RED runtime tests**

Cover:
- no mapping → base sale only;
- mapped component → base sale then one apply;
- total Rp0 → apply;
- Owner and Cashier consume identically;
- reinstall/refresh cannot re-apply;
- two identical simultaneous sales attach to their own transaction;
- ambiguous match returns `STOCK_TX_MATCH_AMBIGUOUS` instead of guessing.

- [ ] **Step 2: Run RED**

```bash
node --test tests/r10-stock-component-runtime.test.mjs
```

- [ ] **Step 3: Implement post-commit adapter**

Algorithm:
1. snapshot cart and transaction keys;
2. call the current final `window.processTransaction` exactly once;
3. identify the new transaction using new-key exclusion, normalized cart fingerprint, bounded timestamp, and `COMPLETED` status;
4. invoke `applyCompletedSale`;
5. retain recoverable state for transient/ambiguous failure;
6. never alter pricing/payment data.

Do not identify the transaction using total/cashier alone.

- [ ] **Step 4: Preserve genuine Recipe behavior**

Test:
- genuine Recipe product with no Stock Components still follows Inventory V2 Recipe once;
- genuine Recipe product plus a Stock Component performs one Recipe lifecycle and one Stock Component application.

- [ ] **Step 5: Install after Inventory V2 sale patch**

The REF01 install order must make the Stock Component wrapper the final outer sale wrapper and prevent later patch maintenance from replacing it.

- [ ] **Step 6: Run GREEN**

```bash
node --test tests/r10-stock-component-runtime.test.mjs
npm run build:ref01
```

- [ ] **Step 7: Commit**

Commit runtime, tests, and only the proven integration files.

---

### Task 8: Refund/Void Integration

**Files:**
- Modify: `REFUND_VOID_OWNER` recorded in Task 1
- Modify: `src/compat/legacy-stock-components-runtime.js`
- Modify: `tests/r10-stock-component-runtime.test.mjs`
- Modify: existing refund/void test files identified in Task 1

**Interfaces:**
- Calls `restoreRefund` or `restoreVoid` only after existing financial correction is verified committed.

- [ ] **Step 1: Write RED correction regressions**

Assert financial behavior is unchanged; Stock Components restore once; mapping changes after sale do not affect restore; historical transactions without a component snapshot do not invent a restore.

- [ ] **Step 2: Run RED focused tests**

Run the new runtime test plus the repository refund/void suites identified in Task 1.

- [ ] **Step 3: Integrate restore calls**

After existing `verifiedUpdate`/verified financial completion, call the Stock Component restore. If stock restore fails, record pending stock restore and surface Owner attention; do not reverse the already-committed financial correction.

- [ ] **Step 4: Run GREEN**

Repeat the focused tests and require 0 new failures.

- [ ] **Step 5: Commit**

Commit only the proven correction owner, runtime adapter, and corresponding tests.

---

### Task 9: Firebase Rules Candidate and Emulator Gate

**Files:**
- Create: `firebase/r10/stock-components-rules.mjs`
- Create: `firebase/r10/build-stock-components-rules.mjs`
- Create: `firebase/r10/stock-components-emulator.mjs`
- Create: `tests/r10-stock-components-rules-contract.test.mjs`

**Interfaces:**
- Builds a candidate from `RULES_SOURCE` recorded in Task 1.
- Never publishes rules.

- [ ] **Step 1: Write RED rules contract**

Assert authenticated sale actor can read sale-required Stock Item/mapping data; Cashier cannot edit master/mapping or arbitrarily overwrite balances; Owner can perform management flows; malformed/negative values are denied; unrelated rules remain unchanged.

- [ ] **Step 2: Run RED**

```bash
node --test tests/r10-stock-components-rules-contract.test.mjs
```

- [ ] **Step 3: Implement rules fragment and candidate builder**

The builder reads the exact Task 1 baseline, merges only new Stock Component paths, writes generated output under `firebase/r10/out/`, prints baseline/candidate hashes and a path diff, and contains no deploy command.

- [ ] **Step 4: Implement emulator scenarios**

Cover Owner, Cashier legitimate sale application, arbitrary Cashier overwrite denial, unauthenticated denial, duplicate application, refund/void restore, purchase/transfer/opname.

- [ ] **Step 5: Run GREEN**

```bash
node --test tests/r10-stock-components-rules-contract.test.mjs
node firebase/r10/stock-components-emulator.mjs
```

- [ ] **Step 6: Commit**

```bash
git add firebase/r10 tests/r10-stock-components-rules-contract.test.mjs
git commit -m "test: define stock component firebase authorization"
```

---

### Task 10: Reconciliation Authority Cutover

**Files:**
- Modify: `src/domain/packaging-cup-v34.js`
- Modify: reconciliation files recorded in Task 1
- Modify: existing reconciliation tests

**Interfaces:**
- Post-cutover theoretical closing uses Stock Component sale/restore/transfer evidence and current Stock Item balances.
- Pre-cutover shifts may still read historical `cp`.

- [ ] **Step 1: Write RED post-cutover reconciliation tests**

Assert:
```text
opening + transfer in - sale component usage + refund/void restore = theoretical closing
```

and variance is compared with physical closing.

- [ ] **Step 2: Write historical-reader test**

A pre-cutover transaction containing only legacy `cp` remains readable but causes no new stock write.

- [ ] **Step 3: Run RED**

Run the existing reconciliation suite plus the new cases.

- [ ] **Step 4: Switch post-cutover authority**

Keep cup names/catalog helpers required by historical UI. Stop using `decorateRecipeWithCupV34()` for new sales.

- [ ] **Step 5: Run GREEN**

Require the reconciliation suite to pass with no new failures.

- [ ] **Step 6: Commit**

Commit only reconciliation/domain changes and their tests.

---

### Task 11: Legacy Cup Runtime Cleanup

**Files:**
- Create: `docs/project-control/R10_STOCK_COMP_CLEANUP_AUDIT.md`
- Create: `tests/r10-stock-components-cleanup-contract.test.mjs`
- Modify/Delete after caller audit:
  - `src/ui/cup-product-costing-v34.js`
  - `src/compat/legacy-cup-01b-product-cup-ui.js`
  - cup-only functions in `src/domain/packaging-cup-v34.js`
  - cup-only rules/helpers proven to have no remaining active caller

**Interfaces:**
- Final active authorities:
  - Stock Components → discrete physical stock.
  - Inventory V2 Recipe → genuine recipes.

- [ ] **Step 1: Generate caller inventory**

```bash
rg -n \
'__CUP_ONLY__|decorateRecipeWithCupV34|__SJ_V34_CUP_SALE_READY|__SJ_V34_CUP_SALE_USAGE|legacy-cup-01b-product-cup-ui|reserveRecipeConsumption\(.*cup' \
src baseline firebase tests
```

Classify every match as `ACTIVE_NEW_RUNTIME`, `GENUINE_RECIPE`, `HISTORICAL_READER`, `DEAD_CUP_WRITER`, or `TEST_ONLY`.

- [ ] **Step 2: Write cleanup audit**

Record every match and its classification in `docs/project-control/R10_STOCK_COMP_CLEANUP_AUDIT.md`.

- [ ] **Step 3: Write RED cleanup contract**

Assert no production runtime creates `__CUP_ONLY__`, no new sale enters Recipe only because `product.cp` exists, the new product editor does not require the legacy cup picker, historical readers remain allowed, and genuine Recipe APIs still exist.

- [ ] **Step 4: Run RED**

```bash
node --test tests/r10-stock-components-cleanup-contract.test.mjs
```

- [ ] **Step 5: Remove only `DEAD_CUP_WRITER` code**

Delete dead runtime/UI helpers proven unused. Do not delete historical database data.

- [ ] **Step 6: Run GREEN**

```bash
node --test tests/r10-stock-components-cleanup-contract.test.mjs
```

- [ ] **Step 7: Commit cleanup separately**

```bash
git add -A
git commit -m "refactor: remove superseded cup stock runtime"
```

---

### Task 12: Full Verification and Production Approval Gate

**Files:**
- No production mutation.
- Evidence/docs may be updated and committed.

**Interfaces:**
- Produces release-candidate evidence and a proposed production sequence.

- [ ] **Step 1: Verify frozen R6B**

```bash
sha256sum src/app/rc01-runtime-loading-hardening.js
```

Must match Task 1.

- [ ] **Step 2: Run all focused R10 tests**

```bash
node --test \
tests/r10-stock-components-domain.test.mjs \
tests/r10-stock-component-writer.test.mjs \
tests/r10-stock-component-runtime.test.mjs \
tests/r10-stock-component-migration.test.mjs \
tests/r10-stock-components-ui.test.mjs \
tests/r10-stock-components-rules-contract.test.mjs \
tests/r10-stock-components-cleanup-contract.test.mjs
```

Expected: 0 failures.

- [ ] **Step 3: Run build and full regression**

```bash
npm run build:ref01
npm test
```

Also run the repository's existing SC02/SC03/SC04, V32/REF01/RC01, reconciliation, refund/void, costing/HPP, and finance gates exactly as exposed by `package.json`.

- [ ] **Step 4: Run emulator**

```bash
node firebase/r10/stock-components-emulator.mjs
```

Expected: PASS.

- [ ] **Step 5: Run migration dry-run only**

```bash
node scripts/r10-stock-components-migration.mjs --dry-run
```

Required evidence: all six cup codes resolved, all valid legacy `cp` mappings covered, invalid mappings `0`, balances preserved, writes performed `0`, source hash printed.

- [ ] **Step 6: Build rules candidate only**

```bash
node firebase/r10/build-stock-components-rules.mjs
```

Required evidence: baseline hash, candidate hash, diff limited to Stock Component paths, no deploy.

- [ ] **Step 7: Verify Git state**

```bash
git status --short
git log --oneline --decorate -14
```

Expected: clean worktree.

- [ ] **Step 8: Stop at explicit production approval**

Do not publish rules, apply migration, deploy Cloudflare, merge `main`, or remove production data.

Proposed production sequence after explicit approval:
1. publish tested rules candidate;
2. verify live rules hash;
3. apply idempotent migration using the dry-run source hash;
4. verify migrated product counts and balances;
5. deploy application candidate;
6. perform one controlled mapped-product sale;
7. refresh/retry and confirm no second decrement;
8. perform one controlled refund/void restore;
9. observe production;
10. only then remove any obsolete production rule/data compatibility that the cleanup audit proves unnecessary.

---

## Final Acceptance Checklist

- [ ] Owner can create/edit generic Stock Items.
- [ ] A product can use multiple Stock Components.
- [ ] Completed Rp0/100%-discount sale consumes physical components.
- [ ] Sale decrement is exactly once under retry/refresh/multi-device.
- [ ] Full void restores exactly once.
- [ ] Partial refunds restore proportionally and cannot over-restore.
- [ ] Restore uses historical snapshot, not current mapping.
- [ ] All six legacy cup codes migrate automatically.
- [ ] Existing cup outlet/warehouse balances are preserved.
- [ ] Migration rerun is idempotent.
- [ ] Cashier cannot administer Stock Items.
- [ ] No permanent transaction listener/polling was added.
- [ ] Genuine Recipe products still work.
- [ ] New cup sales no longer depend on synthetic Recipe.
- [ ] Dead cup runtime writer code is removed after cutover.
- [ ] Historical cup data remains readable.
- [ ] No permanent dual-write remains.
- [ ] Post-cutover reconciliation uses Stock Components.
- [ ] Firebase emulator authorization passes.
- [ ] Full regression passes.
- [ ] Frozen R6B is unchanged.
- [ ] Production remains untouched until explicit approval.

