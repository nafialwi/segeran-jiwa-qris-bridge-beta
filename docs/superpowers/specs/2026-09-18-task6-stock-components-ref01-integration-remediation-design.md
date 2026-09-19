# Task 6 — Product Stock Components REF01 Integration Remediation Design

**Date:** 2026-09-18  
**Project:** Segeran Jiwa POS Legacy  
**Branch:** `work/r10-inventory-read-hardening`  
**Baseline HEAD:** `2352b248282c`  
**Scope:** Task 6 integration remediation only  
**Status:** APPROVED DESIGN — implementation not started

## 1. Purpose

Task 6 adds the Owner-facing Product Stock Components configuration UI and targeted Inventory V2 reads without weakening existing frozen runtime authorities.

The previous Task 6 attempts revealed an integration constraint that was not explicit enough in the original implementation plan:

- `src/ref01-entry.js` is a frozen authority file.
- Existing regression contracts require it to remain byte-for-byte unchanged.
- Product Stock Components must therefore integrate through the existing REF01 bootstrap chain rather than by editing `src/ref01-entry.js`.

This design amends only the Task 6 integration point. The already-approved Product Stock Components architecture, Inventory V2 stock authority, migration model, writer semantics, and Task 7–12 roadmap remain unchanged.

## 2. Verified Repository Facts

The read-only architecture audit established these facts on baseline `2352b248282c`:

1. `src/ref01-entry.js` imports `installRef01Runtime` from `src/app/ref01-bootstrap.js` and calls it as part of the REF01 runtime chain.
2. `src/ref01-entry.js` currently has SHA-256:
   `22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b`.
3. The same hash is required by the P0-BW01 frozen-authority contract.
4. `tests/emg-d1-p1-contract.test.mjs` also requires no diff from `HEAD` for `src/ref01-entry.js`.
5. `src/app/ref01-bootstrap.js` imports `installInventoryWorkspaceV32`.
6. Inside `installRef01Runtime(...)`, Inventory Workspace is installed before packaging/finance/refinement integrations through:
   `let inventoryWorkspace=installInventoryWorkspaceV32(runtime);`
7. REF01 enhancement already has a stable reconciliation lifecycle through `enhance()`.
8. `scripts/build-ref01.mjs` copies the complete `src` tree, so adding the new UI module requires no special build-copy mechanism.
9. The legacy cup UI remains a separate classic build injection and must remain present until the later cutover/cleanup tasks.

## 3. Integration Decision

### Chosen approach

Install Product Stock Components through `src/app/ref01-bootstrap.js`.

The bootstrap will:

1. import `installProductStockComponentsUi` from `../ui/product-stock-components-ui.js`;
2. install Inventory Workspace first;
3. install Product Stock Components UI immediately after Inventory Workspace exists;
4. retain the returned Product Stock Components UI controller in the REF01 runtime;
5. call its idempotent `refresh()` from the existing REF01 `enhance()` lifecycle;
6. expose the controller through the REF01 runtime API only if consistent with the existing runtime-object pattern.

### Explicit non-goals

Task 6 must not:

- modify `src/ref01-entry.js`;
- modify frozen QRIS authority files;
- create another Item Stok master writer;
- create a new bottom-navigation destination;
- add permanent Firebase listeners;
- change sale deduction behavior;
- remove the legacy cup UI;
- run the legacy cup mapping migration;
- change Firebase rules;
- deploy production.

## 4. Component Boundaries

### 4.1 `src/ui/product-stock-components-ui.js`

Owns presentation and Owner-only configuration flow.

Responsibilities:

- render `PEMAKAIAN STOK` within the existing Product Master surface;
- support multiple existing Item Stok selections;
- require positive `qtyPerUnit`;
- reject duplicate stock-item selections;
- render compact summaries:
  - one component: `Cup 22 oz Datar ×1`
  - multiple components: `3 item stok`;
- save mappings only through `stockComponentWriter.saveProductComponents(...)`;
- delegate Item Stok master administration to existing Inventory V2 authority;
- expose idempotent `refresh()` for REF01 presentation reconciliation.

It does not own Firebase writes directly.

### 4.2 `src/data/repositories/inventory-repository.js`

Adds targeted reads only:

- `readProductStockComponents(productId)`
- `readStockItem(stockItemId)`
- `readStockItems()`
- `readStockApplication(applicationId)`

Paths remain under the existing Inventory V2 authority:

- `global/inventoryV2/productStockComponents/<productId>`
- `global/inventoryV2/ingredients/<stockItemId>`
- `global/inventoryV2/ingredients`
- `global/inventoryV2/stockApplications/<applicationId>`

Normal sale runtime must not use `readStockItems()` as a broad lookup. Task 7 will use only mapped IDs required for a sale.

### 4.3 `src/ui/v31-ux-polish.js`

Adds the Owner-facing `Item Stok` shortcut only as a presentation entry point.

The shortcut delegates to the existing Inventory Workspace / Inventory V2 master authority. It does not create or own a second master editor or persistence path.

### 4.4 `src/app/ref01-bootstrap.js`

Becomes the Task 6 runtime integration owner.

Required order:

```text
installInventoryWorkspaceV32(runtime)
        ↓
installProductStockComponentsUi(runtime)
        ↓
existing P5 / Finance / R8 / presentation integrations
        ↓
existing enhance() lifecycle
        ↓
productStockComponentsUi.refresh()
```

The implementation must preserve existing initialization order for unrelated authorities.

## 5. Role and Authority Rules

### Owner / Manajemen

May:

- see `PEMAKAIAN STOK`;
- load existing Product Stock Component mappings;
- select one or more existing Item Stok records;
- save mappings through the dedicated stock-component writer;
- open the existing Item Stok master administration surface.

### Cashier / Transaksi

Must not:

- receive mapping-save controls;
- invoke Product Stock Component configuration;
- invoke Item Stok master administration from this UI.

Cashier sale-side stock consumption remains a Task 7 concern and is not introduced in Task 6.

## 6. Frozen-Authority Rules

The following Task 6 rule is mandatory:

```text
src/ref01-entry.js == HEAD byte-for-byte
```

Before any broad regression, Task 6 must run the frozen-authority tests:

```bash
node --test --test-concurrency=1   tests/emg-d1-p1-contract.test.mjs   tests/p0-bw01-manual-bridge-off.test.mjs
```

Any failure stops Task 6 immediately.

The implementation must also verify the `src/ref01-entry.js` SHA remains:

```text
22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b
```

on the current baseline unless a separately approved future change explicitly supersedes that frozen contract.

## 7. Error Handling

The Product Stock Components UI must fail closed:

- missing Owner authority → `STOCK_COMPONENT_CONFIG_OWNER_REQUIRED`;
- missing Product ID → `STOCK_COMPONENT_PRODUCT_REQUIRED`;
- missing Item Stok → `STOCK_COMPONENT_ITEM_REQUIRED`;
- duplicate Item Stok → `STOCK_COMPONENT_DUPLICATE_ITEM`;
- non-positive quantity → `STOCK_COMPONENT_QTY_REQUIRED`;
- unavailable Inventory V2 master surface → `STOCK_ITEM_MASTER_UNAVAILABLE`;
- unavailable RTDB client → `STOCK_COMPONENT_DATABASE_REQUIRED`.

Presentation failures may show an existing toast/warning, but must not fabricate saved state or silently bypass the dedicated writer.

## 8. Testing Strategy

Task 6 implementation must follow RED → confirmed RED → minimal GREEN.

Focused tests must cover:

1. targeted repository path for one product mapping;
2. targeted path for one Item Stok;
3. targeted path for one stock application;
4. no new full `inventoryV2` root read;
5. Owner can load and save multiple stock components;
6. duplicate Item Stok is rejected;
7. non-positive quantity is rejected;
8. Cashier configuration authority is denied;
9. Item Stok administration delegates to existing Inventory V2 authority;
10. no bottom-nav destination is introduced;
11. Product Stock Components installs through `src/app/ref01-bootstrap.js`;
12. `src/ref01-entry.js` remains byte-for-byte unchanged;
13. legacy cup UI remains present.

Verification order must be fail-fast:

```text
Focused Task 6 tests
        ↓
Frozen REF01 / QRIS authority tests
        ↓
SC02 / SC04
        ↓
build:ref01
        ↓
build-sensitive integration tests
        ↓
full serial regression
        ↓
frozen R6B hash
        ↓
exact changed-file scope
        ↓
commit / push
```

## 9. Allowed Implementation Scope

Expected source changes for the remediation implementation:

- Create `src/ui/product-stock-components-ui.js`
- Create `tests/r10-stock-components-ui.test.mjs`
- Modify `src/data/repositories/inventory-repository.js`
- Modify `src/ui/v31-ux-polish.js`
- Modify `src/app/ref01-bootstrap.js`

Must remain unchanged:

- `src/ref01-entry.js`
- `src/app/rc01-runtime-loading-hardening.js`
- frozen QRIS authority files
- Firebase production rules
- production data
- legacy cup runtime/UI until later cutover

Generated `dist-*` and `audit/*` output is verification debris only and must be restored before commit.

## 10. Success Criteria

Task 6 is complete only when fresh evidence shows all of the following:

- focused Task 6 tests pass;
- Owner configuration is enabled;
- Cashier configuration is denied;
- targeted Inventory V2 reads are present;
- Item Stok master delegates to the existing Inventory V2 authority;
- `src/ref01-entry.js` is unchanged;
- frozen QRIS/REF01 tests pass;
- SC02 and SC04 pass;
- REF01 build/integration passes;
- legacy cup UI remains present;
- full serial regression passes with zero failures;
- frozen R6B remains unchanged;
- Git working tree is clean after commit;
- branch is pushed to `origin/work/r10-inventory-read-hardening`;
- no production Firebase write, migration apply, rules publish, deploy, or main merge occurs.

## 11. Relationship to the Existing Product Stock Components Plan

This document is a narrow remediation amendment to Task 6 of the locked Product Stock Components implementation plan.

It replaces only the ambiguous instruction:

> modify/install through the exact REF01 entry recorded in Task 1

with the proven integration rule:

> keep `src/ref01-entry.js` frozen and integrate Task 6 through `src/app/ref01-bootstrap.js`, immediately after Inventory Workspace initialization, then refresh through the existing REF01 enhancement lifecycle.

All other Task 6 requirements and all later Task 7–12 requirements remain in force.

