# Task 6 Product Stock Components REF01 Integration Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Task 6 by adding Owner-only Product Stock Components configuration and targeted Inventory V2 reads through the proven REF01 bootstrap integration point while keeping `src/ref01-entry.js` and frozen QRIS authorities unchanged.

**Architecture:** Product Stock Components remains a separate UI/controller module with no direct RTDB mutation authority. Targeted reads are added to the existing Inventory repository, configuration writes delegate only to `stockComponentWriter.saveProductComponents(...)`, Item Stok administration delegates to existing Inventory V2 authority, and runtime installation occurs inside `src/app/ref01-bootstrap.js` immediately after Inventory Workspace initialization. The existing REF01 `enhance()` lifecycle calls an idempotent Product Stock Components `refresh()`; `src/ref01-entry.js` is never modified.

**Tech Stack:** JavaScript ES modules, Node.js 24 test runner (`node --test`), Firebase Realtime Database client wrappers already present in the repo, existing REF01 build scripts, Git/GitHub, Termux/Linux shell.

**Spec:** `docs/superpowers/specs/2026-09-18-task6-stock-components-ref01-integration-remediation-design.md`

## Global Constraints

- Work only on branch `work/r10-inventory-read-hardening`.
- Planning baseline is commit `c86a9dea593b`.
- `src/ref01-entry.js` must remain byte-for-byte equal to HEAD and SHA-256 `22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b`.
- `src/app/rc01-runtime-loading-hardening.js` remains frozen at SHA-256 `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`.
- Do not modify frozen QRIS authority files.
- Do not create a second Item Stok master writer.
- Mapping save calls only `stockComponentWriter.saveProductComponents(...)`.
- Do not add a bottom-navigation destination.
- Do not add permanent Firebase listeners.
- Keep legacy cup UI/runtime present until the later Task 7/10 cutover.
- Do not change sale deduction behavior in Task 6.
- Do not apply the legacy cup migration.
- Do not publish Firebase rules.
- Do not deploy Cloudflare/Firebase production.
- Do not merge `main`.
- Generated `audit/`, `dist-ref01/`, `dist-rc01/`, `dist-sc03/`, and `dist-sc04/` changes are verification debris and must be restored before commit.
- Every production-code change follows RED → confirmed RED → minimal GREEN → focused verification.
- Build-sensitive and full-suite tests run serially with `--test-concurrency=1`.

---

## File Structure

### Create

- `src/ui/product-stock-components-ui.js`
  - Owner/manajemen Product Stock Components presentation/controller.
  - No direct Firebase write calls.
  - Exposes `installProductStockComponentsUi(...)`, normalization helpers, compact summary helper, and idempotent `refresh()`.

- `tests/r10-stock-components-ui.test.mjs`
  - Repository targeting, Owner/Cashier authority, UI delegation, bootstrap installation order, frozen entry, and presentation-contract tests.

### Modify

- `src/data/repositories/inventory-repository.js`
  - Add targeted Product Stock Components / Item Stok / application reads using the existing `read(operation,path)` helper.

- `src/ui/v31-ux-polish.js`
  - Add Owner-only `Item Stok` shortcut that delegates to existing Inventory V2 workspace.

- `src/app/ref01-bootstrap.js`
  - Import/install Product Stock Components immediately after Inventory Workspace.
  - Call `productStockComponentsUi?.refresh?.()` from existing `enhance()`.
  - Optionally expose the controller in the existing REF01 API object, using the same object-lifecycle style already present.

### Must Not Change

- `src/ref01-entry.js`
- `src/app/rc01-runtime-loading-hardening.js`
- `src/compat/rc01-qris-deferred-settlement-compat.js`
- `src/compat/rc01-qris-manual-bypass.js`
- `scripts/build-ref01.mjs` except generated output is rebuilt from it; no source patch is planned.
- Firebase rules or production data.

---

### Task 1: Targeted Inventory Repository Contract

**Files:**
- Modify: `src/data/repositories/inventory-repository.js`
- Create/Test: `tests/r10-stock-components-ui.test.mjs`

**Interfaces:**
- Consumes: existing `createInventoryRepository({db,...})`, `read(operation,path)`, and `posPath(...)`.
- Produces:
  - `readProductStockComponents(productId): Promise<object|null>`
  - `readStockItem(stockItemId): Promise<object|null>`
  - `readStockItems(): Promise<object|null>`
  - `readStockApplication(applicationId): Promise<object|null>`

- [ ] **Step 1: Add focused repository tests first**

Add this test scaffold to `tests/r10-stock-components-ui.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { POS_ROOT } from '../src/data/firebase-client.js';
import { createInventoryRepository } from '../src/data/repositories/inventory-repository.js';

function fakeDb(values={}){
  const calls=[];
  return {
    calls,
    ref(path){
      return {
        once:async type=>{
          assert.equal(type,'value');
          calls.push(path);
          return {val:()=>values[path]??null};
        }
      };
    }
  };
}

test('Task 6 repository reads only targeted Inventory V2 paths',async()=>{
  const mappingPath=`${POS_ROOT}/global/inventoryV2/productStockComponents/P1`;
  const itemPath=`${POS_ROOT}/global/inventoryV2/ingredients/ING1`;
  const itemsPath=`${POS_ROOT}/global/inventoryV2/ingredients`;
  const appPath=`${POS_ROOT}/global/inventoryV2/stockApplications/APP1`;

  const db=fakeDb({
    [mappingPath]:{ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}},
    [itemPath]:{name:'Cup 22 oz Datar',unit:'pcs'},
    [itemsPath]:{ING1:{name:'Cup 22 oz Datar',unit:'pcs'}},
    [appPath]:{status:'COMPLETED'}
  });

  const repo=createInventoryRepository({db});

  assert.deepEqual(await repo.readProductStockComponents('P1'),{
    ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}
  });
  assert.deepEqual(await repo.readStockItem('ING1'),{
    name:'Cup 22 oz Datar',unit:'pcs'
  });
  assert.deepEqual(await repo.readStockItems(),{
    ING1:{name:'Cup 22 oz Datar',unit:'pcs'}
  });
  assert.deepEqual(await repo.readStockApplication('APP1'),{
    status:'COMPLETED'
  });

  assert.deepEqual(db.calls,[mappingPath,itemPath,itemsPath,appPath]);
  assert.equal(db.calls.includes(`${POS_ROOT}/global/inventoryV2`),false);
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs
```

Expected: FAIL because one or more of the new repository methods do not exist.

- [ ] **Step 3: Implement the four targeted reads**

In `src/data/repositories/inventory-repository.js`, add a small key guard and use the existing repository `read(...)` helper:

```js
function requiredKey(value,label){
  const key=String(value??'').trim();
  if(!key){
    throw Object.assign(
      new Error(`INVENTORY_READ_KEY_REQUIRED:${label}`),
      {code:'INVENTORY_READ_KEY_REQUIRED'}
    );
  }
  return key;
}

function readProductStockComponents(productId){
  return read(
    'productStockComponents',
    posPath(
      'global','inventoryV2','productStockComponents',
      requiredKey(productId,'productId')
    )
  );
}

function readStockItem(stockItemId){
  return read(
    'stockItem',
    posPath(
      'global','inventoryV2','ingredients',
      requiredKey(stockItemId,'stockItemId')
    )
  );
}

function readStockItems(){
  return read('stockItems',posPath('global','inventoryV2','ingredients'));
}

function readStockApplication(applicationId){
  return read(
    'stockApplication',
    posPath(
      'global','inventoryV2','stockApplications',
      requiredKey(applicationId,'applicationId')
    )
  );
}
```

Export these methods from the existing frozen repository API object; do not introduce a new repository object or listener.

- [ ] **Step 4: Run focused GREEN**

Run:

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs
```

Expected: repository test PASS.

- [ ] **Step 5: Verify persistence boundary**

Run:

```bash
node --check src/data/repositories/inventory-repository.js
node scripts/verify-sc02.mjs
node scripts/verify-sc04.mjs
```

Expected: all commands exit `0`; SC02 and SC04 report PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add \
  src/data/repositories/inventory-repository.js \
  tests/r10-stock-components-ui.test.mjs
git commit -m "feat: add targeted stock component reads"
```

---

### Task 2: Owner Product Stock Components UI and Item Stok Delegation

**Files:**
- Create: `src/ui/product-stock-components-ui.js`
- Modify: `src/ui/v31-ux-polish.js`
- Test: `tests/r10-stock-components-ui.test.mjs`

**Interfaces:**
- Consumes:
  - `inventoryRepository.readProductStockComponents(productId)`
  - `inventoryRepository.readStockItems()`
  - `stockComponentWriter.saveProductComponents({productId,components,actor})`
  - existing `runtime.__SJ_V32_INVENTORY_WORKSPACE`
- Produces:

```js
installProductStockComponentsUi(
  runtime=globalThis,
  {
    document=runtime.document,
    inventoryRepository,
    stockComponentWriter
  }={}
)
```

Returned controller:

```js
{
  installed: true,
  management(),
  openProduct(productId),
  saveProduct(productId,rows),
  openEditor(productId),
  openStockItems(),
  refresh(),
  summary(mapping,stockItems)
}
```

- [ ] **Step 1: Add Owner/Cashier and validation RED tests**

Add tests with these concrete assertions:

```js
import {
  installProductStockComponentsUi,
  normalizeProductStockComponentRows,
  summarizeProductStockComponents
} from '../src/ui/product-stock-components-ui.js';

test('Task 6 component rows reject duplicates and non-positive quantities',()=>{
  assert.throws(
    ()=>normalizeProductStockComponentRows([
      {stockItemId:'ING1',qtyPerUnit:1},
      {stockItemId:'ING1',qtyPerUnit:2}
    ]),
    error=>error?.code==='STOCK_COMPONENT_DUPLICATE_ITEM'
  );

  for(const qty of [0,-1,'',null]){
    assert.throws(
      ()=>normalizeProductStockComponentRows([
        {stockItemId:'ING1',qtyPerUnit:qty}
      ]),
      error=>error?.code==='STOCK_COMPONENT_QTY_REQUIRED'
    );
  }
});

test('Task 6 summary is compact for one or multiple components',()=>{
  const items={
    ING1:{name:'Cup 22 oz Datar',unit:'pcs'},
    ING2:{name:'Sedotan',unit:'pcs'},
    ING3:{name:'Tutup Datar',unit:'pcs'}
  };

  assert.equal(
    summarizeProductStockComponents(
      {ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}},
      items
    ),
    'Cup 22 oz Datar ×1'
  );

  assert.equal(
    summarizeProductStockComponents({
      ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true},
      ING2:{stockItemId:'ING2',qtyPerUnit:1,active:true},
      ING3:{stockItemId:'ING3',qtyPerUnit:1,active:true}
    },items),
    '3 item stok'
  );
});

test('Owner can save multiple Item Stok rows only through dedicated writer',async()=>{
  let writerCalls=0;
  const opened=[];

  const ui=installProductStockComponentsUi(
    {
      currentUserRole:'manajemen',
      currentLoginId:'owner-1',
      currentUserName:'Owner',
      __SJ_V32_INVENTORY_WORKSPACE:{
        legacyOpen(tab){opened.push(tab);return true;}
      }
    },
    {
      document:null,
      inventoryRepository:{
        readProductStockComponents:async()=>({
          ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}
        }),
        readStockItems:async()=>({
          ING1:{name:'Cup 22 oz Datar',unit:'pcs'},
          ING2:{name:'Sedotan',unit:'pcs'}
        })
      },
      stockComponentWriter:{
        saveProductComponents:async input=>{
          writerCalls++;
          return input;
        }
      }
    }
  );

  assert.equal(ui.management(),true);
  const model=await ui.openProduct('P1');
  assert.equal(model.summary,'Cup 22 oz Datar ×1');

  const result=await ui.saveProduct('P1',[
    {stockItemId:'ING1',qtyPerUnit:1},
    {stockItemId:'ING2',qtyPerUnit:2}
  ]);

  assert.equal(writerCalls,1);
  assert.equal(result.actor.role,'manajemen');
  assert.deepEqual(Object.keys(result.components).sort(),['ING1','ING2']);

  assert.equal(ui.openStockItems(),true);
  assert.deepEqual(opened,['ingredients']);
});

test('Cashier has no Product Stock Component configuration authority',async()=>{
  let reads=0;
  let writes=0;
  let masterOpens=0;

  const ui=installProductStockComponentsUi(
    {
      currentUserRole:'transaksi',
      __SJ_V32_INVENTORY_WORKSPACE:{
        legacyOpen(){masterOpens++;}
      }
    },
    {
      document:null,
      inventoryRepository:{
        readProductStockComponents:async()=>{reads++;return{};},
        readStockItems:async()=>{reads++;return{};}
      },
      stockComponentWriter:{
        saveProductComponents:async()=>{writes++;}
      }
    }
  );

  await assert.rejects(
    ui.openProduct('P1'),
    error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED'
  );
  await assert.rejects(
    ui.saveProduct('P1',[{stockItemId:'ING1',qtyPerUnit:1}]),
    error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED'
  );
  assert.throws(
    ()=>ui.openStockItems(),
    error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED'
  );

  assert.equal(reads,0);
  assert.equal(writes,0);
  assert.equal(masterOpens,0);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs
```

Expected: FAIL with module-not-found or missing-export errors for `product-stock-components-ui.js`.

- [ ] **Step 3: Implement pure normalization and authority helpers**

`src/ui/product-stock-components-ui.js` must define at minimum:

```js
const text=value=>String(value??'').trim();

function fail(code,detail=''){
  const error=new Error(detail?`${code}:${detail}`:code);
  error.code=code;
  throw error;
}

export function isStockComponentManager(role){
  const value=text(role).toLowerCase();
  return value==='owner'||value==='manajemen';
}

export function normalizeProductStockComponentRows(rows=[]){
  const seen=new Set();
  const components={};

  for(const raw of Array.isArray(rows)?rows:[]){
    const stockItemId=text(raw?.stockItemId);
    if(!stockItemId)fail('STOCK_COMPONENT_ITEM_REQUIRED');

    if(seen.has(stockItemId)){
      fail('STOCK_COMPONENT_DUPLICATE_ITEM',stockItemId);
    }

    if(raw?.qtyPerUnit===''||raw?.qtyPerUnit==null){
      fail('STOCK_COMPONENT_QTY_REQUIRED',stockItemId);
    }

    const qtyPerUnit=Number(raw.qtyPerUnit);
    if(!Number.isFinite(qtyPerUnit)||qtyPerUnit<=0){
      fail('STOCK_COMPONENT_QTY_REQUIRED',stockItemId);
    }

    seen.add(stockItemId);
    components[stockItemId]=Object.freeze({
      stockItemId,
      qtyPerUnit,
      active:true
    });
  }

  return Object.freeze(components);
}
```

`summarizeProductStockComponents(...)` must return exactly:
- `Belum diatur` for no active mapping;
- `<name> ×<qty>` for one active mapping;
- `<N> item stok` for multiple active mappings.

- [ ] **Step 4: Implement the controller with no direct RTDB mutation**

The controller must:

```js
const management=()=>isStockComponentManager(roleOf(runtime));

async function openProduct(productId){
  assertManager();
  const [mapping,items]=await Promise.all([
    getRepository().readProductStockComponents(productId),
    getRepository().readStockItems()
  ]);
  return modelFrom(mapping,items,productId);
}

async function saveProduct(productId,rows){
  assertManager();
  const components=normalizeProductStockComponentRows(rows);
  const actor=actorOf(runtime);
  await getWriter().saveProductComponents({
    productId,
    components,
    actor
  });
  return Object.freeze({productId,components,actor});
}

function openStockItems(){
  assertManager();
  const workspace=runtime?.__SJ_V32_INVENTORY_WORKSPACE;
  if(typeof workspace?.legacyOpen==='function'){
    return workspace.legacyOpen('ingredients');
  }
  if(typeof runtime?.SJInventoryV2?.open==='function'){
    return runtime.SJInventoryV2.open('ingredients');
  }
  fail('STOCK_ITEM_MASTER_UNAVAILABLE');
}
```

The file must not contain direct calls matching:

```text
.set(
.update(
.transaction(
.remove(
```

- [ ] **Step 5: Add Product Master presentation**

The UI module must inject exactly one section marked:

```html
<section data-sj-stock-components="true">
```

inside the existing `#modal-edit-master` surface for Owner/manajemen only.

Required copy:

```text
PEMAKAIAN STOK
Atur item fisik yang terpakai saat 1 produk terjual.
Atur Pemakaian Stok
Item Stok
```

The editor supports add/remove rows, selects from existing Item Stok records, and saves through `saveProduct(...)`.

`refresh()` must be idempotent:
- return `false` if document/role/surface is unavailable;
- return `true` if the section already exists or is successfully injected;
- never duplicate `[data-sj-stock-components]`.

- [ ] **Step 6: Add V31 Owner Item Stok shortcut**

In `src/ui/v31-ux-polish.js`, add:

```js
export function ensureStockItemsShortcut(document,runtime,role,activities){
  if(
    !isOwnerOperationalRole(role)||
    !activities||
    activities.querySelector?.('[data-sj-v31-stock-items]')
  ) return false;

  if(typeof document?.createElement!=='function')return false;

  const button=document.createElement('button');
  button.type='button';
  button.className='sjvc02-activity sj-v31-stock-items-entry';
  button.dataset.sjV31StockItems='true';
  button.innerHTML=
    `<span class="ico">${renderIcon('inventory',{size:21,label:'Item Stok'})}</span>`+
    `<b>Item Stok</b>`+
    `<span>Kelola master item fisik yang dipakai produk</span>`;

  button.addEventListener?.('click',()=>{
    try{
      const v3=runtime?.__SJ_V32_INVENTORY_WORKSPACE;
      if(typeof v3?.legacyOpen==='function'){
        return v3.legacyOpen('ingredients');
      }
      if(typeof runtime?.SJInventoryV2?.open==='function'){
        return runtime.SJInventoryV2.open('ingredients');
      }
      runtime?.showToast?.(
        'Item Stok belum siap. Buka Bahan & Gudang terlebih dahulu.',
        'warning'
      );
    }catch(_){}
  });

  activities.appendChild?.(button);
  return true;
}
```

Call it from the existing V31 activities decorator only for the existing Owner operational-role path.

- [ ] **Step 7: Run focused GREEN**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs
node --check src/ui/product-stock-components-ui.js
node --check src/ui/v31-ux-polish.js
```

Expected: all PASS.

- [ ] **Step 8: Verify no UI-owned persistence**

```bash
rg -n '\.(set|update|transaction|remove)[[:space:]]*\(' \
  src/ui/product-stock-components-ui.js \
  src/ui/v31-ux-polish.js
```

Expected: no matches from Task 6 code.

- [ ] **Step 9: Commit Task 2**

```bash
git add \
  src/ui/product-stock-components-ui.js \
  src/ui/v31-ux-polish.js \
  tests/r10-stock-components-ui.test.mjs
git commit -m "feat: add owner stock component configuration UI"
```

---

### Task 3: REF01 Bootstrap Integration Without Touching Frozen Entry

**Files:**
- Modify: `src/app/ref01-bootstrap.js`
- Test: `tests/r10-stock-components-ui.test.mjs`
- Verify unchanged: `src/ref01-entry.js`

**Interfaces:**
- Consumes: `installInventoryWorkspaceV32(runtime)` and `installProductStockComponentsUi(runtime)`.
- Produces:
  - Product Stock Components controller installed after Inventory Workspace.
  - Existing REF01 `enhance()` calls `productStockComponentsUi?.refresh?.()`.
  - Frozen entry remains unchanged.

- [ ] **Step 1: Add bootstrap-order RED test**

Add:

```js
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

test('Task 6 installs through REF01 bootstrap after Inventory Workspace and leaves entry frozen',()=>{
  const bootstrap=readFileSync(
    new URL('../src/app/ref01-bootstrap.js',import.meta.url),
    'utf8'
  );
  const entry=readFileSync(
    new URL('../src/ref01-entry.js',import.meta.url),
    'utf8'
  );
  const headEntry=execFileSync(
    'git',
    ['show','HEAD:src/ref01-entry.js'],
    {encoding:'utf8'}
  );

  assert.equal(entry,headEntry);
  assert.doesNotMatch(
    entry,
    /product-stock-components-ui|installProductStockComponentsUi/
  );

  assert.match(
    bootstrap,
    /product-stock-components-ui\.js/
  );
  assert.match(
    bootstrap,
    /installProductStockComponentsUi\(runtime\)/
  );

  const inventoryIndex=bootstrap.indexOf(
    'installInventoryWorkspaceV32(runtime)'
  );
  const componentsIndex=bootstrap.indexOf(
    'installProductStockComponentsUi(runtime)'
  );

  assert.ok(inventoryIndex>=0);
  assert.ok(
    componentsIndex>inventoryIndex,
    'Product Stock Components must install after Inventory Workspace'
  );

  assert.match(
    bootstrap,
    /productStockComponentsUi\?\.refresh\?\.\(\)/
  );
});
```

- [ ] **Step 2: Run RED**

```bash
node --test --test-concurrency=1 \
  --test-name-pattern="Task 6 installs through REF01 bootstrap" \
  tests/r10-stock-components-ui.test.mjs
```

Expected: FAIL because bootstrap import/install/refresh are not present.

- [ ] **Step 3: Add bootstrap import**

Add next to the existing Inventory Workspace UI imports:

```js
import {
  installProductStockComponentsUi
} from '../ui/product-stock-components-ui.js';
```

Do not edit `src/ref01-entry.js`.

- [ ] **Step 4: Install after Inventory Workspace**

Use the proven existing line:

```js
let inventoryWorkspace=installInventoryWorkspaceV32(runtime);
```

Immediately after it, define:

```js
const productStockComponentsUi=
  installProductStockComponentsUi(runtime);
```

Do not move or reorder unrelated P5, Finance, QRIS, R8, or presentation installation.

- [ ] **Step 5: Reconcile from existing `enhance()` lifecycle**

Within the existing `enhance()` body, after `ensureInventoryWorkspaceV32()` has run and before the function returns `true`, add exactly one idempotent call:

```js
productStockComponentsUi?.refresh?.();
```

Do not create a MutationObserver, interval, timeout loop, `.on('value')`, or new permanent listener.

- [ ] **Step 6: Preserve controller in REF01 runtime API**

If the existing API object enumerates installed controllers, add:

```js
productStockComponentsUi
```

alongside `inventoryWorkspace`, `p5Packaging`, `financeWorkspace`, and related controllers.

Do not change API semantics for existing fields.

- [ ] **Step 7: Run bootstrap GREEN**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs
node --check src/app/ref01-bootstrap.js
```

Expected: PASS.

- [ ] **Step 8: Prove frozen entry before broad regression**

```bash
git diff --exit-code HEAD -- src/ref01-entry.js
sha256sum src/ref01-entry.js
```

Expected:
- `git diff` exits `0`;
- hash equals:

```text
22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b
```

Then run:

```bash
node --test --test-concurrency=1 \
  tests/emg-d1-p1-contract.test.mjs \
  tests/p0-bw01-manual-bridge-off.test.mjs
```

Expected: all PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add \
  src/app/ref01-bootstrap.js \
  tests/r10-stock-components-ui.test.mjs
git commit -m "feat: integrate stock components through REF01 bootstrap"
```

---

### Task 4: Task 6 Release Verification and Final Gate

**Files:**
- No planned production-code changes.
- Verification-only generated output in `audit/` and `dist-*` must be cleaned before final status.
- All Task 6 source files are reviewed as a set.

**Interfaces:**
- Consumes the completed Task 1–3 commits.
- Produces a clean, pushed Task 6 checkpoint ready for Task 7.

- [ ] **Step 1: Verify branch and frozen authorities before build**

```bash
git branch --show-current
git status --short
git diff --exit-code HEAD -- src/ref01-entry.js
sha256sum src/ref01-entry.js
sha256sum src/app/rc01-runtime-loading-hardening.js
```

Expected:

```text
branch = work/r10-inventory-read-hardening
status = clean
ref01-entry hash =
22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b

R6B hash =
a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44
```

- [ ] **Step 2: Run focused Task 6 suite**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs
```

Expected: all Task 6 tests PASS.

- [ ] **Step 3: Run frozen authority tests fail-fast**

```bash
node --test --test-concurrency=1 \
  tests/emg-d1-p1-contract.test.mjs \
  tests/p0-bw01-manual-bridge-off.test.mjs
```

Expected: PASS with zero failures.

- [ ] **Step 4: Run SC02 and SC04**

```bash
node scripts/verify-sc02.mjs
node scripts/verify-sc04.mjs
```

Expected: both report PASS.

- [ ] **Step 5: Rebuild REF01 before build-sensitive tests**

Clean generated artifacts first:

```bash
git restore --worktree -- \
  audit dist-ref01 dist-rc01 dist-sc03 dist-sc04 2>/dev/null || true

git clean -fd -- \
  audit dist-ref01 dist-rc01 dist-sc03 dist-sc04 >/dev/null 2>&1 || true
```

Then:

```bash
npm run build:ref01
```

Expected: build exits `0`.

- [ ] **Step 6: Verify built integration and preserved legacy cup UI**

```bash
test -f dist-ref01/src/ui/product-stock-components-ui.js

grep -F \
  "product-stock-components-ui.js" \
  dist-ref01/src/app/ref01-bootstrap.js

grep -F \
  "installProductStockComponentsUi(runtime)" \
  dist-ref01/src/app/ref01-bootstrap.js

grep -F \
  "legacy-cup-01b-product-cup-ui.js" \
  scripts/build-ref01.mjs
```

Expected: every command exits `0`.

- [ ] **Step 7: Run build-sensitive tests serially**

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-components-ui.test.mjs \
  tests/legacy-cup-01b-product-cup-ui.test.mjs \
  tests/r10-cup-reconciliation-release-gate.test.mjs
```

Expected: all PASS.

- [ ] **Step 8: Run full serial regression**

```bash
node --test --test-concurrency=1 tests/*.test.mjs
```

Expected: zero failures.

Do not run the full suite concurrently because shared `dist-*` artifacts make build-sensitive tests race.

- [ ] **Step 9: Recheck frozen authorities after full regression**

```bash
git diff --exit-code HEAD -- src/ref01-entry.js

test "$(
  sha256sum src/ref01-entry.js | awk '{print $1}'
)" = \
"22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b"

test "$(
  sha256sum src/app/rc01-runtime-loading-hardening.js | awk '{print $1}'
)" = \
"a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44"
```

Expected: all commands exit `0`.

- [ ] **Step 10: Restore generated artifacts**

```bash
git restore --worktree -- \
  audit dist-ref01 dist-rc01 dist-sc03 dist-sc04 2>/dev/null || true

git clean -fd -- \
  audit dist-ref01 dist-rc01 dist-sc03 dist-sc04 >/dev/null 2>&1 || true
```

Expected: generated output no longer appears in `git status`.

- [ ] **Step 11: Audit exact Task 6 source scope**

The complete Task 6 source delta from the pre-Task-6 code baseline may contain only:

```text
src/app/ref01-bootstrap.js
src/data/repositories/inventory-repository.js
src/ui/product-stock-components-ui.js
src/ui/v31-ux-polish.js
tests/r10-stock-components-ui.test.mjs
```

`src/ref01-entry.js` must not appear.

Run:

```bash
git diff --check
git status --short
```

Expected: clean worktree after Task 1–3 commits.

- [ ] **Step 12: Push branch and verify remote**

```bash
git push -u origin work/r10-inventory-read-hardening
git fetch origin work/r10-inventory-read-hardening --quiet

test "$(git rev-parse HEAD)" = \
     "$(git rev-parse origin/work/r10-inventory-read-hardening)"
```

Expected: remote equals local HEAD.

- [ ] **Step 13: Record final Task 6 evidence**

Final handoff must report:

```text
TASK 6 OWNER UI / TARGETED REPOSITORY
TDD RED                 : CONFIRMED
TARGETED READS          : PASS
OWNER CONFIG            : ENABLED
CASHIER CONFIG          : DENIED
ITEM STOK MASTER        : EXISTING INVENTORY V2 AUTHORITY
REF01 INTEGRATION       : src/app/ref01-bootstrap.js
REF01 ENTRY             : FROZEN / UNCHANGED
FROZEN QRIS GATE        : PASS
SC02 / SC04             : PASS
REF01 BUILD             : PASS
LEGACY CUP UI           : PRESERVED
FULL SERIAL REGRESSION  : PASS, 0 failures
R6B                      : UNCHANGED
STATUS                   : CLEAN
REMOTE                   : SYNCED
PROD                     : no Firebase write / migration / rules publish / deploy
NEXT                     : Task 7 — Legacy Sale Cutover Without Permanent Listener
```

No production deployment or migration is part of Task 6.

---

## Plan Self-Review

### Spec coverage

- Targeted repository reads: Task 1.
- Owner-only configuration and Cashier denial: Task 2.
- Multiple Item Stok rows / validation / compact summary: Task 2.
- Existing Item Stok master authority delegation: Task 2.
- No direct UI persistence: Task 2.
- No bottom-nav destination: Task 2 tests and implementation boundary.
- Bootstrap integration after Inventory Workspace: Task 3.
- Existing REF01 `enhance()` lifecycle reuse: Task 3.
- Frozen `src/ref01-entry.js`: Task 3 and Task 4 fail-fast gates.
- Frozen QRIS authority: Task 3 and Task 4.
- Legacy cup UI preserved: Task 4.
- No production write/deploy/migration/rules change: Global Constraints + Task 4.
- Full serial regression and clean remote checkpoint: Task 4.

### Placeholder scan

The plan contains no unresolved placeholders, deferred implementation markers, cross-task shorthand, or unspecified validation/error-handling steps.

### Interface consistency

The plan uses the same signatures throughout:

```js
readProductStockComponents(productId)
readStockItem(stockItemId)
readStockItems()
readStockApplication(applicationId)

installProductStockComponentsUi(runtime,{
  document,
  inventoryRepository,
  stockComponentWriter
})

stockComponentWriter.saveProductComponents({
  productId,
  components,
  actor
})
```

The runtime controller name is consistently `productStockComponentsUi`, and the REF01 lifecycle hook is consistently `productStockComponentsUi?.refresh?.()`.

