# R10-STOCK-COMP01 Product Stock Components Implementation Plan v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cup-specific synthetic-recipe consumption with generic, exactly-once Product Stock Components while keeping Inventory V2 as the single physical-stock authority.

**Architecture:** Product Stock Components is a discrete-consumption layer inside the existing Inventory V2 authority family. Canonical physical balances remain at `global/inventoryV2/balances/ingredients/<stockItemId>` and movements remain at `global/inventoryV2/movements`; the new mapping lives at `global/inventoryV2/productStockComponents`, and `global/inventoryV2/stockApplications` is only an idempotency/evidence journal. One dedicated stock-component writer owns sale application, correction restore, and Owner-only component mapping persistence; it must never create a parallel stock balance or movement subsystem.

**Tech Stack:** Vanilla JavaScript ES modules, Node `node:test`, Firebase Realtime Database, Firebase Emulator Suite, existing REF01/RC01 build pipeline, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-15-product-stock-components-design.md`

## Global Constraints

- Work only in Segeran Jiwa POS Legacy.
- Firebase RTDB remains production authority.
- Zero-cost only.
- QRIS remains manual and independent from Product Stock Components.
- Inventory V2 is the sole canonical physical-stock authority for Product Stock Components.
- Canonical outlet/warehouse balance path is `global/inventoryV2/balances/ingredients/<stockItemId>`.
- Product mapping path is `global/inventoryV2/productStockComponents/<productId>/<stockItemId>`.
- Exactly-once journal path is `global/inventoryV2/stockApplications/<applicationId>`.
- Existing `global/inventoryV2/movements` is reused for Product Stock Component movements.
- Do not create `global/stockItems`, `global/stockBalances`, `global/stockMovements`, `global/productStockComponents`, or `global/stockApplications`.
- Existing Inventory V2 ingredient/master authority remains the Item Stok master authority.
- Dedicated stock-component writer may persist Product Stock Component mappings only for an Owner/management actor.
- Cashier/transaksi actor must not edit Item Stok master data or Product Stock Component mappings.
- Sale application may be performed by a legitimate sale actor only through the dedicated stock-component writer and later Firebase rules.
- Do not add recurring polling or a permanent transaction listener.
- Unknown stock state must not be rendered as `0`.
- Canonical outlet stock must never be intentionally committed below zero.
- Permanent dual-write is forbidden.
- Historical `cp`, reservations, movements, and audit evidence remain readable.
- New simple cup consumption must not require `inventoryMode='RECIPE'` or `__CUP_ONLY__`.
- Inventory V2 Recipe remains available for genuine recipes.
- A genuine Recipe product and Product Stock Components may coexist only when they refer to different physical consumption; the same physical item must not be deducted twice.
- `src/app/rc01-runtime-loading-hardening.js` must remain byte-identical to frozen R6B SHA `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`.
- New stock reads must be targeted/bounded and must not undo R10 Inventory read-hardening.
- Every code task follows RED → confirmed RED → minimal GREEN → focused verification → serial full regression when required.
- Build-sensitive tests that share `dist-*` directories must run sequentially.
- Functional cutover and dead-code cleanup are separate commits.
- Do not publish Firebase rules, apply production migration, deploy Cloudflare, merge `main`, or delete production data without explicit user approval.
- Current live CUP-02 rules remain in place until a replacement candidate passes rules-contract and emulator gates.

---

## File Structure

### Existing completed files

- `docs/project-control/R10_STOCK_COMP_RUNTIME_MAP.md` — exact runtime/build/rules anchors.
- `src/domain/product-stock-components.js` — pure normalization, aggregation, deterministic IDs, immutable application snapshot primitives.
- `tests/r10-stock-components-domain.test.mjs` — domain and persistence-boundary contract.

### New files planned

- `src/data/writers/stock-component-writer.js` — dedicated Inventory V2 Product Stock Components writer.
- `tests/r10-stock-component-writer.test.mjs` — exactly-once, shortage, recovery, mapping-authority and correction writer tests.
- `src/domain/stock-component-migration.js` — pure legacy `cp` → existing Inventory V2 stock-item mapping planner.
- `tests/r10-stock-component-migration.test.mjs` — migration coverage/idempotency tests.
- `scripts/r10-stock-components-migration.mjs` — dry-run/apply mapping migration CLI with source-hash guard.
- `src/ui/product-stock-components-ui.js` — Owner mapping UI and Item Stok integration surface.
- `tests/r10-stock-components-ui.test.mjs` — Owner/Cashier UI authority tests.
- `src/compat/legacy-stock-components-runtime.js` — post-COMPLETED legacy sale adapter without permanent listener.
- `tests/r10-stock-component-runtime.test.mjs` — sale and correction integration tests.
- `firebase/r10/stock-components-rules.mjs` — candidate-only rules transformer/fragment logic.
- `firebase/r10/build-stock-components-rules.mjs` — candidate builder from fresh exact deployed-rules export.
- `firebase/r10/stock-components-emulator.mjs` — authorization/lifecycle emulator scenarios.
- `tests/r10-stock-components-rules-contract.test.mjs` — rules candidate contract.
- `docs/project-control/R10_STOCK_COMP_CLEANUP_AUDIT.md` — caller classification before cup-runtime cleanup.
- `tests/r10-stock-components-cleanup-contract.test.mjs` — post-cutover cleanup guard.

### Existing files expected to change

- `scripts/sc04-mutation-policy.mjs` — add exactly one approved dedicated writer after RED proves the new writer is required.
- `tests/sc02-integrity.test.mjs` — expected modular mutation allowlist becomes five approved writers.
- SC04 mutation-integrity test file identified by repository search at Task 3 execution time; only the exact existing integrity test is modified.
- `src/data/repositories/inventory-repository.js` — targeted mapping/item/application reads; no full-root read.
- `src/ui/v31-ux-polish.js` and exact REF01 entry from `R10_STOCK_COMP_RUNTIME_MAP.md` — install Owner UI/runtime at later tasks.
- `src/domain/packaging-cup-v34.js`, reconciliation consumers, and legacy cup UI/runtime files — only during cutover/cleanup tasks.
- Exact `REFUND_VOID_OWNER` from `R10_STOCK_COMP_RUNTIME_MAP.md` — only during correction integration.
- No change to frozen R6B.

---

## Progress Baseline

### Task 1: Runtime Anchor Map and Safety Baseline — COMPLETE

Evidence already committed:
- runtime map exists;
- live rules source identified as exact deployed rules rather than an invented tracked canonical file;
- build and regression gates passed;
- frozen R6B hash recorded;
- branch remained isolated.

Commit: `a1aa8d9` (`docs: map stock component runtime anchors`).

### Task 2: Pure Product Stock Components Domain — COMPLETE

Evidence from verified run:
- TDD RED confirmed;
- focused domain suite `14/14 PASS`;
- full serial regression `695/695 PASS`;
- SC02/SC04 PASS;
- REF01/RC01 build-sensitive tests PASS sequentially;
- frozen R6B unchanged;
- clean/synced branch.

Commit: `5b9298de41eb` (`feat: add product stock component domain`).

Architecture amendment approved and committed after Task 2:
- Inventory V2 is canonical physical-stock authority;
- parallel balance/movement authority prohibited;
- mapping and application journal moved into Inventory V2 authority family.

Spec commit: `0f1590d29474` (`docs: lock Inventory V2 stock component authority`).

---

### Task 3: Exactly-Once Inventory V2 Stock Component Writer

**Files:**
- Create: `src/data/writers/stock-component-writer.js`
- Create: `tests/r10-stock-component-writer.test.mjs`
- Modify: `scripts/sc04-mutation-policy.mjs`
- Modify: `tests/sc02-integrity.test.mjs`
- Modify: exact SC04 mutation-integrity test discovered with:
  ```bash
  rg -n "APPROVED_MUTATION_FILES|EXPECTED_WRITERS|mutation allowlist" tests scripts
  ```

**Interfaces:**

Consumes from Task 2:
```js
buildApplicationSnapshot(input)
stockApplicationId(shiftKey,txId)
stockComponentFingerprint(value)
normalizeStockComponents(raw)
```

Produces:
```js
createStockComponentWriter({db,now,serverTimestamp})
```

Writer methods:
```js
saveProductComponents({productId,components,actor})
readApplication({shiftKey,txId})
applyCompletedSale({shiftKey,txId,transaction,mapping,stockItems,actor})
recoverApplication({shiftKey,txId,actor})
restoreVoid({shiftKey,txId,voidId,transaction,actor})
restoreRefund({shiftKey,txId,refundId,refundLines,transaction,actor})
```

Canonical persistence paths:
```text
global/inventoryV2/productStockComponents/<productId>/<stockItemId>
global/inventoryV2/stockApplications/<applicationId>
global/inventoryV2/balances/ingredients/<stockItemId>
global/inventoryV2/movements/<movementId>
```

Dedicated writer config rule:
```text
saveProductComponents -> Owner/manajemen only
```

Sale actor rule in code:
```text
Owner/manajemen or Cashier/transaksi may apply an already-completed sale,
but may not edit Product Stock Component configuration.
```

Exactly-once balance marker is temporary metadata inside the canonical balance row:
```text
global/inventoryV2/balances/ingredients/<stockItemId>/stockComponentOps/<operationId>
```

Marker states:
```text
APPLIED
SHORTAGE
ROLLED_BACK
```

The marker is not a balance authority. It exists only to close the crash window between a targeted balance transaction and the application-journal update. After the application reaches a terminal recorded outcome, marker cleanup is best-effort; correctness must not depend on cleanup succeeding.

- [ ] **Step 1: Write RED authority and persistence-boundary tests**

Create `tests/r10-stock-component-writer.test.mjs` first. The first tests must assert the wished-for API:

```js
const writer=createStockComponentWriter({db,now:()=>1000,serverTimestamp:()=>1000});

await assert.rejects(
  writer.saveProductComponents({
    productId:'P1',
    components:{STK_CUP:{qtyPerUnit:1,active:true}},
    actor:{id:'cashier-1',role:'transaksi'}
  }),
  error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED'
);

await writer.saveProductComponents({
  productId:'P1',
  components:{
    STK_CUP:{qtyPerUnit:1,active:true},
    STK_STRAW:{qtyPerUnit:1,active:true}
  },
  actor:{id:'owner-1',role:'manajemen'}
});
```

Assert the fake RTDB trace contains mapping writes only under:
```text
/global/inventoryV2/productStockComponents/P1
```

Also assert no write path contains:
```text
/global/stockBalances
/global/stockMovements
/global/stockApplications
/global/productStockComponents
```

- [ ] **Step 2: Write RED first-apply and duplicate-apply tests**

Fixture:
```js
const mapping={
  P1:{
    STK_CUP:{qtyPerUnit:1,active:true},
    STK_STRAW:{qtyPerUnit:1,active:true}
  }
};
const stockItems={
  STK_CUP:{name:'Cup 22 oz',unit:'pcs'},
  STK_STRAW:{name:'Sedotan',unit:'pcs'}
};
```

Seed canonical balances:
```js
{
  STK_CUP:{outlet:10,warehouse:0},
  STK_STRAW:{outlet:20,warehouse:0}
}
```

First application:
```js
const first=await writer.applyCompletedSale({
  shiftKey:'2026-09-18-A',
  txId:'TX-1',
  transaction:{status:'COMPLETED',cartData:[{id:'P1',q:2}]},
  mapping,
  stockItems,
  actor:{id:'cashier-1',role:'transaksi'}
});
assert.equal(first.status,'COMPLETED');
```

Expected canonical outlet balances:
```text
STK_CUP    10 -> 8
STK_STRAW  20 -> 18
```

Retry with exactly the same input:
```js
const retry=await writer.applyCompletedSale(/* same identity */);
assert.equal(retry.result,'ALREADY_APPLIED');
```

Expected balances remain `8` and `18`, and exactly one deterministic SALE_COMPONENT movement exists per component.

- [ ] **Step 3: Write RED crash-window recovery test**

Configure the fake DB so:
1. application claim succeeds;
2. first component balance transaction succeeds and leaves `stockComponentOps/<operationId>=APPLIED`;
3. simulated network failure occurs before application progress/terminal patch.

Call:
```js
await writer.recoverApplication({
  shiftKey:'2026-09-18-A',
  txId:'TX-RECOVER',
  actor:{id:'cashier-1',role:'transaksi'}
});
```

Required result:
- the already-applied component is not decremented again;
- remaining components apply once;
- deterministic movements are written once;
- application becomes `COMPLETED`.

This test is the proof that `stockComponentOps` closes the partial-write ambiguity.

- [ ] **Step 4: Write RED shortage and rollback test**

Seed:
```text
STK_CUP outlet=5
STK_STRAW outlet=0
```

A sale needs `2` of each.

Required behavior:
- Cup may be tentatively applied first;
- Straw transaction records `SHORTAGE` without taking outlet below `0`;
- any earlier `APPLIED` marker for this application is transactionally restored and changed to `ROLLED_BACK`;
- final balances equal the pre-application balances;
- application records `SHORTAGE`;
- no `SALE_COMPONENT` movement is published for the failed application;
- retry does not silently consume after the recorded shortage.

- [ ] **Step 5: Run RED and verify the failure reason**

Run:
```bash
node --test --test-concurrency=1 tests/r10-stock-component-writer.test.mjs
```

Expected: FAIL because `src/data/writers/stock-component-writer.js` does not yet exist.

If it fails for syntax, fixture, or unrelated repository reasons, fix the test harness and rerun until the intended missing-writer RED is observed.

- [ ] **Step 6: Implement the minimal dedicated writer**

Create `src/data/writers/stock-component-writer.js`.

Path helper:
```js
import { posPath } from '../firebase-client.js';
import {
  buildApplicationSnapshot,
  normalizeStockComponents,
  stockApplicationId,
  stockComponentFingerprint
} from '../../domain/product-stock-components.js';

const invPath=(...parts)=>posPath('global','inventoryV2',...parts);
```

Owner-role normalization:
```js
const roleOf=actor=>String(actor?.role??'').trim().toLowerCase();

function assertOwner(actor){
  const role=roleOf(actor);
  if(role!=='owner'&&role!=='manajemen'){
    const error=new Error('STOCK_COMPONENT_CONFIG_OWNER_REQUIRED');
    error.code='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED';
    throw error;
  }
}
```

Application-role normalization:
```js
function assertSaleActor(actor){
  const role=roleOf(actor);
  if(!['owner','manajemen','cashier','kasir','transaksi'].includes(role)){
    const error=new Error('STOCK_COMPONENT_SALE_ACTOR_REQUIRED');
    error.code='STOCK_COMPONENT_SALE_ACTOR_REQUIRED';
    throw error;
  }
}
```

Deterministic operation ID:
```js
const opId=(kind,referenceId,stockItemId)=>
  `SCOP_${stockComponentFingerprint({kind,referenceId,stockItemId}).slice(4)}`;
```

Deterministic movement ID:
```js
const movementId=(kind,referenceId,stockItemId)=>
  `SCMV_${stockComponentFingerprint({kind,referenceId,stockItemId}).slice(4)}`;
```

`saveProductComponents` must:
1. call `assertOwner(actor)`;
2. normalize components;
3. transactionally replace only `inventoryV2/productStockComponents/<productId>`;
4. store one child per `stockItemId` with `qtyPerUnit`, `active`, `updatedAt`, and `updatedBy`;
5. never touch balance, movement, or application paths.

Application claim at:
```text
inventoryV2/stockApplications/<applicationId>
```

New claim shape:
```js
{
  id:applicationId,
  kind:'SALE',
  status:'CLAIMED',
  shiftKey,
  txId,
  snapshot,
  createdAt:now(),
  createdBy:String(actor.id||'')
}
```

If existing status is `COMPLETED`, return `ALREADY_APPLIED`.
If existing status is `SHORTAGE`, return the recorded shortage; do not auto-consume later.
If existing status is `CLAIMED` or `ERROR`, enter recovery using its immutable snapshot.

For each component, run a targeted RTDB transaction only at:
```text
inventoryV2/balances/ingredients/<stockItemId>
```

Inside the balance transaction:
```js
const marker=next.stockComponentOps?.[operationId];
if(marker?.state==='APPLIED') return next;
if(marker?.state==='SHORTAGE'||marker?.state==='ROLLED_BACK') return next;

if(Number(next.outlet||0)<requiredQty){
  next.stockComponentOps={
    ...(next.stockComponentOps||{}),
    [operationId]:{
      state:'SHORTAGE',
      applicationId,
      qty:requiredQty,
      at:now()
    }
  };
  return next;
}

next.outlet=Number(next.outlet||0)-requiredQty;
next.stockComponentOps={
  ...(next.stockComponentOps||{}),
  [operationId]:{
    state:'APPLIED',
    applicationId,
    qty:requiredQty,
    at:now()
  }
};
next.lastOp=operationId;
return next;
```

If any component is `SHORTAGE`, rollback every component marker in this application whose state is `APPLIED`:
```js
next.outlet=Number(next.outlet||0)+Number(marker.qty||0);
next.stockComponentOps[operationId]={
  ...marker,
  state:'ROLLED_BACK',
  rolledBackAt:now()
};
```

Only after all components are proven `APPLIED`, write one multi-location patch under the POS root containing:
- `stockApplications/<applicationId>/status = COMPLETED`;
- `completedAt`;
- one deterministic `inventoryV2/movements/<movementId>` row per component.

Movement shape:
```js
{
  id:movementId,
  itemType:'ingredient',
  itemId:stockItemId,
  itemName,
  type:'SALE_COMPONENT',
  location:'outlet',
  delta:-appliedQty,
  refId:txId,
  applicationId,
  shift:shiftKey,
  user:String(actor.name||''),
  userId:String(actor.id||''),
  ts:now(),
  at:new Date(now()).toISOString()
}
```

No sale transaction row is mutated in Task 3.

After terminal application state is persisted, marker cleanup is best-effort targeted balance transactions. A cleanup failure must not change the returned terminal result.

- [ ] **Step 7: Update the modular mutation allowlist through TDD**

Before changing the policy, modify the exact integrity tests so expected writers are:
```js
[
  'src/data/writers/finance-writer.js',
  'src/data/writers/purchase-reconciliation-writer.js',
  'src/data/writers/qris-cash-out-coordinator.js',
  'src/data/writers/qris-deferred-settlement-writer.js',
  'src/data/writers/stock-component-writer.js'
].sort()
```

Run:
```bash
node --test --test-concurrency=1 tests/sc02-integrity.test.mjs <EXACT_SC04_TEST_FILE>
```

Expected RED: policy still reports only four approved writers.

Then add exactly:
```text
src/data/writers/stock-component-writer.js
```
to `APPROVED_MUTATION_FILES` in `scripts/sc04-mutation-policy.mjs`.

Its policy contract must permit only:
```text
transaction
update
```
and only POS paths under:
```text
global/inventoryV2/productStockComponents
global/inventoryV2/stockApplications
global/inventoryV2/balances/ingredients
global/inventoryV2/movements
```

Destructive `.remove()` remains forbidden.

- [ ] **Step 8: Run GREEN gates**

Run:
```bash
node --test --test-concurrency=1 tests/r10-stock-components-domain.test.mjs tests/r10-stock-component-writer.test.mjs
node scripts/verify-sc02.mjs
node scripts/verify-sc04.mjs
```

Then run build-sensitive tests sequentially:
```bash
npm run build:ref01
node --test --test-concurrency=1 \
  tests/legacy-cup-01b-product-cup-ui.test.mjs \
  tests/r10-cup-reconciliation-release-gate.test.mjs
node --test --test-concurrency=1 tests/rc01-build-integrity.test.mjs
```

Expected: all PASS.

- [ ] **Step 9: Run serial full regression and frozen-R6B guard**

Run:
```bash
node --test --test-concurrency=1 tests/*.test.mjs
sha256sum src/app/rc01-runtime-loading-hardening.js
```

Expected:
- `0` failing tests;
- R6B SHA exactly `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`.

- [ ] **Step 10: Commit Task 3**

Commit only Task 3 files:
```bash
git add \
  src/data/writers/stock-component-writer.js \
  tests/r10-stock-component-writer.test.mjs \
  scripts/sc04-mutation-policy.mjs \
  tests/sc02-integrity.test.mjs \
  <EXACT_SC04_TEST_FILE>

git commit -m "feat: add exactly-once Inventory V2 stock component writer"
```

No Firebase rules publish, migration, REF01 runtime integration, or app deploy occurs in Task 3.

---

### Task 4: Refund and Void Restore Semantics

**Files:**
- Modify: `src/domain/product-stock-components.js`
- Modify: `src/data/writers/stock-component-writer.js`
- Modify: `tests/r10-stock-components-domain.test.mjs`
- Modify: `tests/r10-stock-component-writer.test.mjs`

**Interfaces:**

Restore identity:
```js
stockRestoreId(kind,shiftKey,txId,correctionId)
```

Restore source:
```text
the immutable original application snapshot only
```

Restore journal:
```text
global/inventoryV2/stockApplications/<applicationId>/restores/<restoreId>
```

- [ ] **Step 1: Write RED full-void test**

Original application:
```text
soldQty=3
Cup qtyPerUnit=1 -> appliedQty=3
Straw qtyPerUnit=1 -> appliedQty=3
```

First `restoreVoid` must restore `+3/+3`.
Retry with the same `voidId` must restore `+0/+0`.

- [ ] **Step 2: Write RED partial-refund tests**

Sale quantity `3`.
First refund quantity `1` restores one sale-unit allocation.
Second refund quantity `2` restores the remaining allocation.
A further refund must fail:
```text
STOCK_RESTORE_EXCEEDS_APPLIED
```

Change the live product mapping between the sale and refund; expected restore remains based on the historical application snapshot.

- [ ] **Step 3: Run RED**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-domain.test.mjs \
  tests/r10-stock-component-writer.test.mjs
```

Expected: restore cases fail because restore allocation/writer logic is not implemented.

- [ ] **Step 4: Implement restore allocation**

`restoreAllocation(application,refundLines,alreadyRestored)` must:
- use `application.lines` and `application.components[].allocations`;
- never call current mapping;
- cap per-line restoration at original sold quantity;
- aggregate physical restore per stock item;
- throw `STOCK_RESTORE_EXCEEDS_APPLIED` on cumulative overflow.

- [ ] **Step 5: Implement exactly-once restore writer**

Claim:
```text
stockApplications/<applicationId>/restores/<restoreId>
```

Restore balance marker:
```text
balances/ingredients/<stockItemId>/stockComponentOps/<restoreOperationId>
```

Marker state `APPLIED` means the increment has already occurred.

Terminal restore patch writes:
- restore status `COMPLETED`;
- cumulative restored quantities under the original application;
- deterministic movement per stock item with:
  ```text
  type = REFUND_COMPONENT
  ```
  or:
  ```text
  type = VOID_COMPONENT
  ```
- positive `delta`.

Retry uses the terminal restore row and/or balance marker to avoid a second increment.

- [ ] **Step 6: Run GREEN and serial regression**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-domain.test.mjs \
  tests/r10-stock-component-writer.test.mjs

node --test --test-concurrency=1 tests/*.test.mjs
```

Expected: `0` failures.

- [ ] **Step 7: Commit Task 4**

```bash
git add \
  src/domain/product-stock-components.js \
  src/data/writers/stock-component-writer.js \
  tests/r10-stock-components-domain.test.mjs \
  tests/r10-stock-component-writer.test.mjs

git commit -m "feat: restore Inventory V2 stock components on corrections"
```

---

### Task 5: Legacy Cup Mapping Migration Planner and CLI

**Files:**
- Create: `src/domain/stock-component-migration.js`
- Create: `tests/r10-stock-component-migration.test.mjs`
- Create: `scripts/r10-stock-components-migration.mjs`

**Interfaces:**

The migration does **not** create new stock masters or balances.

Input must include:
```js
{
  products,
  cupRows,
  existingMappings
}
```

`cupRows` resolves each legacy cup code to the already-existing Inventory V2 `ingredientId`.

Produces:
```js
{
  productMappings:{},
  resolvedCupItems:{},
  sourceCupRows:[],
  coverage:{
    mappedProducts:0,
    unmappedCupCodes:[],
    invalidProducts:[]
  },
  sourceHash:''
}
```

- [ ] **Step 1: Write RED migration tests**

Cover all six legacy cup codes:
```text
c10
c10p
c16
c22p
c22d
c22o
```

For each mapped product:
```text
product.cp -> existing cupRows[].ingredientId -> qtyPerUnit 1
```

Assert:
- existing `outlet`/`warehouse` balances are input evidence only and are never emitted as writes;
- existing ingredient master records are not copied;
- unrelated products remain unchanged;
- rerun produces the same mapping plan;
- zero source deletion;
- invalid `cp` values are reported, not guessed.

- [ ] **Step 2: Run RED**

```bash
node --test --test-concurrency=1 tests/r10-stock-component-migration.test.mjs
```

Expected: FAIL because migration module is absent.

- [ ] **Step 3: Implement pure migration plan**

Example mapping output:
```js
productMappings[productId]={
  [existingIngredientId]:{
    stockItemId:existingIngredientId,
    qtyPerUnit:1,
    active:true,
    source:'LEGACY_CP_MIGRATION'
  }
};
```

Do not emit:
```text
stockItems
stockBalances
stockMovements
```

- [ ] **Step 4: Implement safe CLI**

Default:
```bash
node scripts/r10-stock-components-migration.mjs --dry-run
```

Dry-run reads:
- current products;
- current cup mapping rows / ingredient IDs;
- current Product Stock Component mappings.

It prints:
- source hash;
- mapped product count;
- all resolved cup codes;
- invalid mappings;
- balance writes `0`;
- master writes `0`;
- planned mapping writes.

Apply requires:
```bash
node scripts/r10-stock-components-migration.mjs \
  --apply \
  --expected-source-hash <HASH>
```

If current source hash differs from `<HASH>`, abort before any write.

Apply may write only:
```text
global/inventoryV2/productStockComponents/<productId>
```

- [ ] **Step 5: Run GREEN**

```bash
node --test --test-concurrency=1 tests/r10-stock-component-migration.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add \
  src/domain/stock-component-migration.js \
  tests/r10-stock-component-migration.test.mjs \
  scripts/r10-stock-components-migration.mjs

git commit -m "feat: add idempotent legacy cup mapping migration"
```

Do not run `--apply` against production in this task.

---

### Task 6: Generic Owner UI and Targeted Mapping Repository

**Files:**
- Create: `src/ui/product-stock-components-ui.js`
- Create: `tests/r10-stock-components-ui.test.mjs`
- Modify: `src/data/repositories/inventory-repository.js`
- Modify: `src/ui/v31-ux-polish.js`
- Modify: exact REF01 entry recorded in Task 1

**Interfaces:**

Repository adds targeted reads:
```js
readProductStockComponents(productId)
readStockItem(stockItemId)
readStockItems()
readStockApplication(applicationId)
```

`readProductStockComponents(productId)` path:
```text
global/inventoryV2/productStockComponents/<productId>
```

`readStockItem(stockItemId)` path:
```text
global/inventoryV2/ingredients/<stockItemId>
```

`readStockApplication(applicationId)` path:
```text
global/inventoryV2/stockApplications/<applicationId>
```

Normal sale runtime must not call `readStockItems()`; it reads only the mapped IDs it needs.

UI installer:
```js
installProductStockComponentsUi(runtime=globalThis,{
  document=runtime.document,
  inventoryRepository,
  stockComponentWriter
}={})
```

- [ ] **Step 1: Write RED repository tests**

Assert:
- product mapping read targets one product path;
- one stock item read targets one item path;
- application read targets one application path;
- no method performs a full `inventoryV2` root read.

- [ ] **Step 2: Write RED UI authority tests**

Owner/manajemen:
- sees `PEMAKAIAN STOK`;
- can add multiple existing Item Stok rows;
- duplicate item selection is blocked;
- positive `qtyPerUnit` required;
- save calls `stockComponentWriter.saveProductComponents`.

Cashier/transaksi:
- may see sale-facing stock state only where existing app permits;
- does not receive config save controls;
- cannot call Item Stok master administration from this UI.

Presentation:
```text
Cup 22 oz Datar ×1
```
for one mapping, and:
```text
3 item stok
```
for multiple mappings.

- [ ] **Step 3: Run RED**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs \
  tests/inventory-repository*.test.mjs
```

Expected: new UI/repository assertions fail.

- [ ] **Step 4: Implement targeted repository methods**

Use existing `read(operation,path)` helper; do not introduce a new listener.

Example:
```js
function readProductStockComponents(productId){
  return read(
    'productStockComponents',
    posPath('global','inventoryV2','productStockComponents',String(productId))
  );
}
```

- [ ] **Step 5: Implement Owner UI**

Reuse existing mobile-first Inventory/Product Master cards and modals.

Item Stok master creation/edit must delegate to the existing Inventory V2 master authority already used by the app. Do not create a second master writer.

Mapping save must call only:
```js
stockComponentWriter.saveProductComponents(...)
```

Do not add a new bottom-navigation destination.

- [ ] **Step 6: Install through the proven REF01 entry**

Import/install after existing Inventory authority initialization.

Keep legacy cup UI present until Task 7/10 cutover proves the replacement path.

- [ ] **Step 7: Run GREEN, build, and serial regression**

```bash
node --test --test-concurrency=1 tests/r10-stock-components-ui.test.mjs
npm run build:ref01
node --test --test-concurrency=1 tests/*.test.mjs
```

- [ ] **Step 8: Commit Task 6**

Commit only repository/UI/test and proven REF01 integration files.

---

### Task 7: Legacy Sale Cutover Without Permanent Listener

**Files:**
- Create: `src/compat/legacy-stock-components-runtime.js`
- Create: `tests/r10-stock-component-runtime.test.mjs`
- Modify: exact REF01 entry recorded in Task 1
- Modify: `src/domain/transaction-service.js` only if fresh source evidence proves the legacy commit path requires it

**Interfaces:**

Produces:
```js
installLegacyStockComponentsRuntime(runtime=globalThis,{
  writer,
  inventoryRepository
}={})
```

- [ ] **Step 1: Write RED runtime cases**

Cover:
1. no component mapping → base sale only;
2. mapping exists → base sale completes, then one Product Stock Component apply;
3. monetary total `0` → physical apply still occurs;
4. Owner and Cashier consume identically;
5. reinstall/refresh cannot reapply;
6. two simultaneous identical-value sales attach to their own transaction IDs;
7. ambiguous post-commit identification fails `STOCK_TX_MATCH_AMBIGUOUS`;
8. genuine Recipe product without Product Stock Components still uses Recipe only;
9. genuine Recipe + separate Stock Component performs one Recipe lifecycle plus one component application;
10. the same physical stock item is never present in both recipe consumption and component application for the same line without an explicit fail-closed conflict.

- [ ] **Step 2: Run RED**

```bash
node --test --test-concurrency=1 tests/r10-stock-component-runtime.test.mjs
```

- [ ] **Step 3: Implement post-COMPLETED adapter**

Algorithm:
```text
A. snapshot cart and pre-sale transaction keys;
B. read only mappings for product IDs present in cart;
C. if no mappings exist, call base sale with no component work;
D. call the current final window.processTransaction exactly once;
E. prove the newly created transaction by new-key exclusion + normalized cart fingerprint + bounded timestamp + COMPLETED status;
F. read only the stock-item masters referenced by those mappings;
G. call applyCompletedSale with the proven shiftKey/txId;
H. surface ERROR/SHORTAGE as Owner attention; never falsify success;
I. never change price/payment fields.
```

Do not identify a transaction using only total or cashier.

- [ ] **Step 4: Preserve Recipe separation**

Before calling the component writer, compare mapped stock item IDs with proven Recipe applied ingredient IDs for the same transaction.

If overlap exists:
```text
STOCK_COMPONENT_RECIPE_OVERLAP
```
and do not double-deduct that item.

- [ ] **Step 5: Install as final outer sale wrapper**

Use the proven REF01 order. Prevent later patch maintenance from silently replacing the wrapper.

No polling and no transaction listener.

- [ ] **Step 6: Run GREEN + build-sensitive gates**

```bash
node --test --test-concurrency=1 tests/r10-stock-component-runtime.test.mjs
npm run build:ref01
node --test --test-concurrency=1 \
  tests/legacy-cup-01b-product-cup-ui.test.mjs \
  tests/r10-cup-reconciliation-release-gate.test.mjs
node --test --test-concurrency=1 tests/rc01-build-integrity.test.mjs
```

- [ ] **Step 7: Run serial full regression and commit**

```bash
node --test --test-concurrency=1 tests/*.test.mjs
```

Then commit runtime/tests and only proven integration files.

Task 7 still performs no production deploy.

---

### Task 8: Refund/Void Runtime Integration

**Files:**
- Modify: exact `REFUND_VOID_OWNER` recorded in Task 1
- Modify: `src/compat/legacy-stock-components-runtime.js`
- Modify: `tests/r10-stock-component-runtime.test.mjs`
- Modify: existing refund/void tests discovered with:
  ```bash
  rg -l "REFUND_ATOMIC|voidTx|refundBase|VOID|REFUND" tests
  ```

**Interfaces:**

Financial correction remains existing authority.
Stock correction follows only after financial correction is proven committed.

- [ ] **Step 1: Write RED integration regressions**

Assert:
- existing cash/finance/refund behavior is unchanged;
- Product Stock Components restore once;
- retry does not restore twice;
- current mapping changes do not affect restore;
- a historical transaction with no Product Stock Component application does not invent a restore.

- [ ] **Step 2: Run RED focused correction suites**

Run the new runtime tests plus exact existing refund/void tests found by repository search.

- [ ] **Step 3: Integrate restore after verified financial completion**

After the existing financial `verifiedUpdate`/commit succeeds:
- derive deterministic original application ID from shift/txId;
- call `restoreRefund` or `restoreVoid`;
- if stock restore fails, persist/retain recoverable application evidence and surface `Perlu perhatian`;
- never reverse an already-committed financial correction merely because stock restoration needs recovery.

- [ ] **Step 4: Run GREEN and serial regression**

```bash
node --test --test-concurrency=1 tests/r10-stock-component-runtime.test.mjs <EXACT_REFUND_VOID_TESTS>
node --test --test-concurrency=1 tests/*.test.mjs
```

- [ ] **Step 5: Commit Task 8**

Commit only proven correction owner/runtime/test files.

---

### Task 9: Firebase Rules Candidate and Emulator Gate

**Files:**
- Create: `firebase/r10/stock-components-rules.mjs`
- Create: `firebase/r10/build-stock-components-rules.mjs`
- Create: `firebase/r10/stock-components-emulator.mjs`
- Create: `tests/r10-stock-components-rules-contract.test.mjs`

**Interfaces:**

Candidate input is a **fresh exact deployed-rules export**, not an invented repository canonical file.

Read-only live export command:
```bash
npx --yes firebase-tools@latest database:get /.settings/rules \
  --project segeranjiwa-id > "$HOME/storage/downloads/database.rules.stock-components.live.json"
```

Candidate builder:
```bash
node firebase/r10/build-stock-components-rules.mjs \
  --live "$HOME/storage/downloads/database.rules.stock-components.live.json" \
  --out-dir "$HOME/.cache/r10-stock-components-rules"
```

The builder never deploys.

- [ ] **Step 1: Write RED rules contract**

Assert candidate semantics:

Owner/manajemen:
- may manage `inventoryV2/productStockComponents`;
- continues to use existing Item Stok master management authority.

Cashier/transaksi:
- may read mappings/items required for a legitimate sale;
- may not edit mappings/master;
- may create/update only legitimate `stockApplications` lifecycle rows;
- may transactionally decrement/increment only `balances/ingredients/<id>/outlet` through a valid application/restore;
- may not modify warehouse arbitrarily;
- may write only matching deterministic Product Stock Component movement evidence.

Everyone:
- malformed/negative quantity denied;
- arbitrary balance overwrite denied;
- unauthenticated access denied where current policy requires auth;
- unrelated live rules remain byte/structure-equivalent outside the exact candidate paths.

- [ ] **Step 2: Run RED**

```bash
node --test --test-concurrency=1 tests/r10-stock-components-rules-contract.test.mjs
```

Expected: FAIL because candidate builder/rules transformer is absent.

- [ ] **Step 3: Implement candidate transformer**

Clone the existing proven role-expression style from the fresh deployed rules for Inventory V2 reservation/balance flows.

Add/modify only the minimal Inventory V2 paths needed for:
```text
productStockComponents
stockApplications
balances/ingredients/.../stockComponentOps
movements
```

Do not use blanket:
```text
".write": true
```

Builder output must print:
- canonical SHA256 of live input;
- candidate SHA256;
- exact changed rule paths;
- deploy command count `0`.

- [ ] **Step 4: Implement emulator scenarios**

Cover:
1. Owner mapping create/update PASS;
2. Cashier mapping edit DENY;
3. Cashier legitimate sale claim + targeted outlet decrement + movement PASS;
4. duplicate application produces one decrement;
5. shortage cannot go negative;
6. refund/void restore PASS once;
7. arbitrary Cashier warehouse increment DENY;
8. arbitrary ingredient edit DENY;
9. unauthenticated write DENY;
10. existing purchase/transfer/opname legitimate flows remain permitted for their existing authorized roles.

- [ ] **Step 5: Run GREEN**

```bash
node --test --test-concurrency=1 tests/r10-stock-components-rules-contract.test.mjs
node firebase/r10/stock-components-emulator.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 9**

```bash
git add \
  firebase/r10/stock-components-rules.mjs \
  firebase/r10/build-stock-components-rules.mjs \
  firebase/r10/stock-components-emulator.mjs \
  tests/r10-stock-components-rules-contract.test.mjs

git commit -m "test: define Inventory V2 stock component authorization"
```

No rules publish occurs.

---

### Task 10: Reconciliation Authority Cutover

**Files:**
- Modify: `src/domain/packaging-cup-v34.js`
- Modify: reconciliation consumer files recorded in Task 1
- Modify: existing reconciliation tests

**Interfaces:**

Post-cutover theoretical evidence for migrated cup items comes from:
- Inventory V2 Product Stock Component applications/movements;
- existing Inventory V2 transfer/purchase/opname evidence;
- canonical Inventory V2 balances.

Pre-cutover historical `cp` remains readable.

- [ ] **Step 1: Write RED post-cutover reconciliation tests**

For a controlled cup item:
```text
opening
+ transfer in
- completed SALE_COMPONENT movement
+ completed REFUND_COMPONENT/VOID_COMPONENT movement
= theoretical closing
```

Physical closing variance is then:
```text
physical closing - theoretical closing
```

- [ ] **Step 2: Write historical compatibility test**

A pre-cutover transaction containing only legacy `cp`:
- remains visible/readable in historical reconciliation;
- causes no new Product Stock Component write.

- [ ] **Step 3: Run RED**

Run current reconciliation suites plus the new post-cutover cases.

- [ ] **Step 4: Switch only post-cutover authority**

Keep cup catalog/name helpers needed for historical UI.

Stop using:
```js
decorateRecipeWithCupV34()
```
for new simple cup consumption.

Do not delete historical cup evidence.

- [ ] **Step 5: Run GREEN and commit**

Require reconciliation suites and serial regression to pass, then commit only reconciliation/domain/test changes.

---

### Task 11: Legacy Cup Runtime Cleanup

**Files:**
- Create: `docs/project-control/R10_STOCK_COMP_CLEANUP_AUDIT.md`
- Create: `tests/r10-stock-components-cleanup-contract.test.mjs`
- Modify/Delete only after caller audit:
  - `src/ui/cup-product-costing-v34.js`
  - `src/compat/legacy-cup-01b-product-cup-ui.js`
  - cup-only functions in `src/domain/packaging-cup-v34.js`
  - cup-only helpers/rules proven to have no active caller

**Interfaces:**

Final authorities:
```text
Product Stock Components -> discrete physical stock
Inventory V2 Recipe      -> genuine recipe consumption
```

- [ ] **Step 1: Generate caller inventory**

```bash
rg -n \
'__CUP_ONLY__|decorateRecipeWithCupV34|__SJ_V34_CUP_SALE_READY|__SJ_V34_CUP_SALE_USAGE|legacy-cup-01b-product-cup-ui|reserveRecipeConsumption\(.*cup' \
src baseline firebase tests
```

Classify every match:
```text
ACTIVE_NEW_RUNTIME
GENUINE_RECIPE
HISTORICAL_READER
DEAD_CUP_WRITER
TEST_ONLY
```

- [ ] **Step 2: Write cleanup audit**

Record every match and classification in:
```text
docs/project-control/R10_STOCK_COMP_CLEANUP_AUDIT.md
```

No caller may be deleted before classification.

- [ ] **Step 3: Write RED cleanup contract**

Assert:
- production runtime no longer creates `__CUP_ONLY__`;
- a new sale never enters Recipe only because `product.cp` exists;
- Product Master no longer requires legacy cup picker after migration/cutover;
- historical readers remain;
- genuine Recipe APIs remain.

- [ ] **Step 4: Run RED**

```bash
node --test --test-concurrency=1 tests/r10-stock-components-cleanup-contract.test.mjs
```

- [ ] **Step 5: Remove only `DEAD_CUP_WRITER` code**

Do not delete production database history.

- [ ] **Step 6: Run GREEN, serial regression, and commit separately**

```bash
node --test --test-concurrency=1 tests/r10-stock-components-cleanup-contract.test.mjs
node --test --test-concurrency=1 tests/*.test.mjs
```

Commit:
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

Produces release-candidate evidence and stops before any production mutation.

- [ ] **Step 1: Verify frozen R6B**

```bash
sha256sum src/app/rc01-runtime-loading-hardening.js
```

Required:
```text
a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44
```

- [ ] **Step 2: Run focused Product Stock Components suites**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-domain.test.mjs \
  tests/r10-stock-component-writer.test.mjs \
  tests/r10-stock-component-runtime.test.mjs \
  tests/r10-stock-component-migration.test.mjs \
  tests/r10-stock-components-ui.test.mjs \
  tests/r10-stock-components-rules-contract.test.mjs \
  tests/r10-stock-components-cleanup-contract.test.mjs
```

Expected: `0` failures.

- [ ] **Step 3: Run build-sensitive suites sequentially**

```bash
npm run build:ref01

node --test --test-concurrency=1 \
  tests/legacy-cup-01b-product-cup-ui.test.mjs \
  tests/r10-cup-reconciliation-release-gate.test.mjs

node --test --test-concurrency=1 tests/rc01-build-integrity.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Run full serial regression**

```bash
node --test --test-concurrency=1 tests/*.test.mjs
```

Use serial mode because repository build-integrity tests share and rebuild `dist-*` directories.

Expected: `0` failures.

- [ ] **Step 5: Run existing verification chains**

Run the repository's SC02, SC03, SC04, V32, REF01, RC01, reconciliation, refund/void, costing/HPP and finance gates exactly as exposed by current `package.json`, but do not invoke a command that deploys production.

- [ ] **Step 6: Run Firebase emulator**

```bash
node firebase/r10/stock-components-emulator.mjs
```

Expected: PASS.

- [ ] **Step 7: Run migration dry-run only**

```bash
node scripts/r10-stock-components-migration.mjs --dry-run
```

Required evidence:
- all six cup codes resolved against existing Inventory V2 item IDs;
- all valid legacy `cp` product mappings covered;
- invalid mappings `0`;
- Item Stok master writes `0`;
- balance writes `0`;
- source hash printed.

- [ ] **Step 8: Build rules candidate only from fresh live export**

Fetch rules read-only:
```bash
npx --yes firebase-tools@latest database:get /.settings/rules \
  --project segeranjiwa-id > "$HOME/storage/downloads/database.rules.stock-components.live.json"
```

Build candidate:
```bash
node firebase/r10/build-stock-components-rules.mjs \
  --live "$HOME/storage/downloads/database.rules.stock-components.live.json" \
  --out-dir "$HOME/.cache/r10-stock-components-rules"
```

Required:
- live canonical SHA printed;
- candidate SHA printed;
- diff limited to approved Inventory V2 Product Stock Component paths;
- deploy count `0`.

- [ ] **Step 9: Verify Git state**

```bash
git status --short
git log --oneline --decorate -18
```

Expected: clean worktree.

- [ ] **Step 10: Stop for explicit production approval**

Do not publish rules, apply migration, deploy Cloudflare, merge `main`, or remove production data.

After explicit approval, proposed production sequence is:

1. publish the tested rules candidate only;
2. read live rules back and verify canonical hash;
3. rerun migration dry-run and verify the source hash has not changed;
4. apply mapping-only migration with the approved source hash;
5. verify mapping counts and prove Item Stok masters/balances unchanged;
6. deploy application candidate;
7. perform one controlled mapped-product sale;
8. verify canonical outlet decrement exactly once;
9. refresh/retry and prove no second decrement/application/movement;
10. perform one controlled refund/void restore and prove exactly-once increment;
11. observe production;
12. only then perform separately approved dead compatibility cleanup.

---

## Final Acceptance Checklist

- [ ] Inventory V2 remains the only physical-stock balance authority.
- [ ] No `global/stockBalances`, `global/stockMovements`, or separate Stock Item master subsystem exists.
- [ ] Owner can manage generic Item Stok through existing Inventory V2 master authority.
- [ ] Owner can configure multiple Product Stock Components.
- [ ] Cashier cannot edit Item Stok master or Product Stock Component mappings.
- [ ] Product mapping persistence is Owner-only through the dedicated stock-component writer.
- [ ] A completed Rp0/100%-discount sale consumes physical components.
- [ ] Sale decrement is exactly once under retry, reconnect, refresh and multi-device recovery.
- [ ] Partial application crash recovery cannot double-decrement.
- [ ] Shortage cannot commit canonical outlet stock below zero.
- [ ] A shortage after partial apply rolls back earlier component deductions before terminal shortage evidence.
- [ ] Deterministic Product Stock Component movements use existing Inventory V2 movements.
- [ ] Full void restores exactly once.
- [ ] Partial refunds restore proportionally and cannot over-restore.
- [ ] Restore uses immutable historical application evidence, not current mapping.
- [ ] All six legacy cup codes migrate to existing Inventory V2 stock-item IDs.
- [ ] Migration does not copy/create cup balances or Item Stok masters.
- [ ] Migration rerun is idempotent.
- [ ] No permanent transaction listener or polling was added.
- [ ] Genuine Recipe products still work.
- [ ] New simple cup sales no longer depend on synthetic Recipe.
- [ ] Recipe/component overlap fails closed instead of double-deducting.
- [ ] Historical cup data remains readable.
- [ ] No permanent dual-write remains.
- [ ] Post-cutover reconciliation uses Product Stock Component/Inventory V2 movement evidence.
- [ ] Firebase emulator authorization passes.
- [ ] Full serial regression passes.
- [ ] Frozen R6B remains byte-identical.
- [ ] Production remains untouched until explicit approval.
