# R10-STOCK-COMP01 — Product Stock Components Design

**Status:** Proposed / Design Approved in Chat  
**Date:** 2026-09-15  
**Project:** Segeran Jiwa POS Legacy  
**Scope:** Replace cup-specific sale consumption with a generic stock-component model while preserving recipe inventory for true recipe ingredients.

## 1. Context

The current legacy POS contains two concepts that overlap for cup handling:

1. Legacy product cup mapping (`product.cp`, e.g. `c22d`) used by transaction records, cup counts, refund/void counters, and reconciliation.
2. Inventory V2 recipe lifecycle (`inventoryMode='RECIPE'`, recipe reservation, reserve/commit/rollback) used for recipe ingredients.

Cup handling was adapted into the recipe lifecycle through a synthetic cup recipe concept. This created unnecessary coupling for a simple discrete physical item. A cup, lid, straw, box, sausage, or similar item behaves operationally like stock: a known quantity is consumed when a sale is completed and restored when the corresponding quantity is voided/refunded.

This design replaces that cup-specific recipe dependency with a generic **Product Stock Components** subsystem.

## 2. Design Decision

### 2.1 Core decision

A product may consume zero, one, or many **Stock Items**.

Examples:

- Es Teh 22 oz:
  - Cup 22 oz Datar ×1
  - Tutup Datar ×1
  - Sedotan ×1
- Sosis Bakar:
  - Sosis ×1
  - Kardus Snack ×1

Consumption is based on physical quantity sold, not on payment value.

Therefore a transaction with a 100% discount or total Rp0 still consumes stock components if:
- the transaction is `COMPLETED`;
- the line quantity is greater than zero;
- the product has configured stock components.

Payment method, actor role, and discount do not change physical consumption.

### 2.2 Recipe remains a separate domain

Inventory V2 recipe functionality remains for genuine recipe ingredients such as powders, milk, syrup, sugar, toppings, and size/racikan variants.

Stock Components are for discrete physical items that should behave like normal stock.

A stock component must not be forced through the recipe lifecycle merely to obtain stock deduction.

## 3. Goals

The subsystem MUST:

- support generic stock items, not only cups;
- support multiple stock components per product;
- maintain outlet and warehouse stock;
- support purchase, transfer, opname, and movement history;
- deduct stock exactly once for a completed transaction;
- restore stock exactly once for void/refund;
- support partial refund;
- be safe against retries, refresh, slow network, and multi-device execution;
- preserve historical transaction evidence;
- migrate existing cup mappings without requiring manual re-entry;
- remove obsolete cup-specific runtime paths after migration and verification;
- keep recipe inventory working for true recipe products;
- remain compatible with the zero-cost deployment policy.

## 4. Non-Goals

This milestone does NOT:

- redesign the complete Inventory V2 recipe engine;
- replace recipe costing/HPP;
- introduce paid infrastructure;
- rewrite the whole POS transaction engine;
- delete historical transaction/audit data;
- require every product to track stock components;
- merge product stock and recipe ingredients into one undifferentiated domain.

## 5. Terminology

**Stock Item**  
A discrete or countable physical item managed by the stock subsystem. Examples: cup, lid, straw, cardboard box, sausage.

**Stock Component**  
A relationship stating that one sold unit of a product consumes a configured quantity of a Stock Item.

**Stock Application**  
The exactly-once operation that applies stock-component consumption for one completed transaction.

**Stock Restore**  
The exactly-once operation that restores previously applied stock when a transaction or line quantity is voided/refunded.

## 6. Data Model

The exact Firebase paths may be adapted to existing naming conventions during implementation, but the logical model MUST remain equivalent.

### 6.1 Stock item master

```text
stockItems/<stockItemId>
  id
  name
  category
  unit
  minStock
  active
  createdAt
  createdBy
  updatedAt
  updatedBy
```

Recommended categories are presentation/filter metadata only, for example:

- Kemasan
- Bahan Jadi
- Bahan Pendukung
- Lainnya

Category MUST NOT control transaction logic.

### 6.2 Stock balances

```text
stockBalances/<stockItemId>
  outlet
  warehouse
  lastOp
```

`outlet` and `warehouse` are the authoritative quantities for the new stock-component subsystem.

`lastOp` is diagnostic/idempotency metadata and is not a replacement for the application ledger.

### 6.3 Product stock components

Conceptually:

```text
productStockComponents/<productId>/<stockItemId>
  qtyPerUnit
  active
```

Example:

```text
productStockComponents/ES_TEH_22/STK_CUP22D
  qtyPerUnit: 1

productStockComponents/ES_TEH_22/STK_TUTUP22D
  qtyPerUnit: 1
```

One product MAY use multiple Stock Items.

One Stock Item MAY be used by multiple products.

### 6.4 Stock application record

Every completed sale that has stock components MUST have an idempotent application record.

Canonical identity:

```text
STOCK_APPLY|<shiftKey>|<txId>
```

Logical record:

```text
stockApplications/<applicationId>
  id
  shiftKey
  txId
  status
  actorId
  actorName
  createdTs
  completedTs
  components[]
```

Each component snapshot MUST contain enough information to restore the exact historical consumption later:

```text
stockItemId
stockItemName
unit
qtyPerUnit
soldQty
appliedQty
```

The transaction SHOULD also contain a compact snapshot/reference to the applied stock components so transaction history remains self-describing.

## 7. Sale Lifecycle

### 7.1 Trigger

Stock application occurs only for a transaction that is confirmed `COMPLETED`.

A completed sale with stock components MUST eventually produce exactly one successful Stock Application.

### 7.2 Calculation

For each transaction line:

```text
requiredQty = soldLineQty × qtyPerUnit
```

Requirements are aggregated per Stock Item before writing.

Example:

```text
2 × Es Teh 22 oz
1 × Sosis Bakar

Result:
Cup 22 oz Datar  -2
Tutup Datar      -2
Sedotan          -2
Sosis            -1
Kardus Snack     -1
```

### 7.3 Exactly-once

The system MUST NOT rely on page state or an in-memory flag for idempotency.

Before applying stock, the transaction/application identity is claimed atomically or transactionally.

Retry, refresh, duplicate callbacks, or another device MUST resolve to one of:

- already applied → do nothing;
- application claimed by this operation → apply once;
- application pending/stale → recover deterministically.

No completed transaction may decrement the same component twice.

### 7.4 Failure behavior

A completed sale MUST NOT be silently lost because stock synchronization timed out.

If the sale is already committed but component stock application cannot finish:

```text
sale = COMPLETED
stock sync = PENDING / ERROR
```

A recovery path retries stock application using the same deterministic application identity.

Recovery MUST be idempotent.

The UI SHOULD surface unresolved stock-sync state to Owner rather than silently ignore it.

## 8. Stock Minus Policy

The implementation MUST explicitly choose one policy and keep it consistent.

Recommended policy for Segeran Jiwa Legacy:

- normal sale SHOULD NOT create a negative Stock Item balance;
- if an estimated/system quantity is insufficient but the physical sale has already completed, record a shortage/pending reconciliation state instead of inventing negative stock silently;
- Owner resolves discrepancies through Stock Opname.

The implementation plan must verify the existing product-stock behavior before finalizing this guard so the user experience remains consistent with the proven legacy stock pattern.

## 9. Refund and Void

### 9.1 Historical snapshot rule

Refund and void MUST restore from the Stock Application snapshot written at sale time.

They MUST NOT recalculate using the product's current component configuration because the mapping may have changed since the original sale.

### 9.2 Full void

If a transaction is voided after components were applied:

```text
restoreQty = original appliedQty
```

Each component is restored exactly once.

Canonical restore identity SHOULD include the source transaction and void identity, for example:

```text
STOCK_VOID|<shiftKey>|<txId>|<voidId>
```

### 9.3 Partial refund

A partial refund restores only the component quantity associated with the refunded product quantity.

Example:

```text
Original:
Es Teh 22 oz qty 3
Cup applied = 3

Refund:
Es Teh 22 oz qty 1

Restore:
Cup +1
Tutup +1
Sedotan +1
```

The system MUST track cumulative restored quantity so repeated/overlapping refunds cannot restore more than was originally applied.

### 9.4 Refund without physical return

If business rules later require a refund that does not return consumable packaging, that must be an explicit operational choice. The initial design keeps behavior aligned with the existing refund/void correction model and must be validated during implementation against current POS behavior.

## 10. Movement Ledger

Every authoritative stock change MUST create an auditable movement.

Recommended movement types:

```text
SALE_COMPONENT
REFUND_COMPONENT
VOID_COMPONENT
PURCHASE
TRANSFER_IN
TRANSFER_OUT
OPNAME
ADJUSTMENT
```

Each movement SHOULD include:

```text
stockItemId
stockItemName
location
delta
refType
refId
txId
shiftKey
actorId
actorName
ts
at
```

Movement history is audit evidence; balances remain the authority for current quantity.

## 11. UI Design

### 11.1 Bahan & Gudang

The management workspace becomes generic rather than cup-specific.

Recommended tabs:

```text
Ringkasan
Item Stok
Transfer
Pembelian
Mutasi
Opname
```

The existing mobile-first visual style is retained.

### 11.2 Stock Item form

Owner can create/edit:

```text
Nama
Kategori
Satuan
Minimum Stok
Status Aktif
```

Balances are changed through operational flows (purchase, transfer, opname), not arbitrary product editing.

### 11.3 Product form

Add a section:

```text
PEMAKAIAN STOK

[ + Tambah Item ]

Cup 22 oz Datar    1 pcs / produk
Tutup Datar        1 pcs / produk
Sedotan            1 pcs / produk
```

The product may have zero components.

The component editor MUST allow:
- choose Stock Item;
- set positive usage quantity;
- remove component;
- prevent duplicate Stock Item rows.

### 11.4 Product display

Product management may show a compact badge:

```text
Cup 22 oz Datar ×1
```

or, when multiple:

```text
3 item stok
```

Detailed component usage belongs in product detail/edit UI to avoid overloading sales cards.

## 12. Existing Cup Migration

Migration MUST be automatic and non-destructive.

Existing cup mappings such as:

```text
cp = c22d
```

are converted to equivalent Stock Components:

```text
STK_CUP22D ×1
```

The six current legacy cup codes are mapped to Stock Items:

```text
c10
c10p
c16
c22p
c22d
c22o
```

The migration MUST preserve the current outlet and warehouse balances for their corresponding cup physical stock.

No operator should have to re-enter all product-to-cup mappings manually.

## 13. Historical Compatibility

Historical transaction data MUST remain intact.

Legacy fields such as `cp`, historical cup counters, old reservation records, old movements, and audit logs are retained as historical evidence.

Compatibility readers may remain temporarily where required to display historical transactions or reconcile pre-migration shifts.

However, legacy historical fields MUST NOT remain an authoritative writer path for new sales after cutover.

## 14. Replacement, Not Coexistence

The target architecture permits only one authoritative runtime writer for new Stock Component consumption.

After migration and release verification, the following cup-specific runtime mechanisms must be audited and removed or disabled when no longer required:

- synthetic `__CUP_ONLY__` recipe generation for packaging;
- cup-only dependency on `inventoryMode='RECIPE'`;
- cup-specific reserve/commit/rollback path;
- runtime bridge `product.cp → synthetic recipe → recipe reservation`;
- rules and helpers used exclusively by the superseded cup reservation path;
- dead compatibility code with no historical-read responsibility.

Recipe reservation logic that is still used by genuine recipe products MUST remain.

Removal MUST be based on caller/consumer audit, not naming alone.

## 15. Legacy `cp` Field Strategy

`cp` remains readable for historical compatibility during migration.

For new runtime behavior, Product Stock Components become authoritative.

Migration may temporarily dual-read:

```text
stockComponents first
fallback to legacy cp only for unmigrated data
```

Permanent dual-write is prohibited.

Once migration coverage is verified, new product saves SHOULD stop depending on `cp` as the operational source of truth.

Whether the field remains as a deprecated compatibility field or is eventually removed from current product records will be decided only after a repository-wide consumer audit.

## 16. Inventory V2 Interaction

Inventory V2 recipe behavior remains available for real recipes.

The new Stock Component subsystem may reuse proven UI/data conventions for:
- outlet/warehouse balance;
- purchase;
- transfer;
- opname;
- movement display.

It MUST NOT require a product to become `inventoryMode='RECIPE'` solely because the product consumes a discrete Stock Item.

The implementation should minimize duplicate infrastructure while preserving clear domain separation.

## 17. Firebase Rules

Rules MUST enforce least privilege and the exactly-once lifecycle.

At minimum:

- active authorized users may read data required for sales;
- Owner/management may configure Stock Items and product mappings;
- sale actors may execute only the bounded stock-application transition allowed for completed transactions;
- arbitrary balance overwrite by cashier is forbidden;
- purchase/transfer/opname remain management operations;
- application/restore identities cannot be reused for a different transaction;
- negative or malformed quantities are rejected where appropriate.

Existing CUP-02 production rules are not rolled back merely because this design supersedes the cup recipe path.

Rule cleanup occurs only after the new writer is deployed, verified, and the old cup reservation path is proven unused.

## 18. Multi-Device and Concurrency

All critical writes MUST be safe when two devices operate concurrently.

Examples:

- two sales consuming the same Stock Item;
- retry of the same sale from another device;
- refund while a recovery is pending;
- transfer and sale occurring close together.

Balance mutation MUST use transactional/atomic semantics appropriate to Firebase RTDB.

Idempotency identity must be server-visible, not device-local.

## 19. Offline Behavior

A new sale that requires authoritative stock mutation SHOULD require sufficient connectivity to commit the POS transaction safely under existing production rules.

If a transaction is already committed and connectivity drops before stock synchronization completes, the system records/reconstructs a pending application and retries later.

Offline handling MUST NOT:
- invent successful stock application;
- decrement twice after reconnect;
- discard a committed sale;
- silently replace authoritative cloud stock with stale local state.

## 20. Reconciliation

Cup reconciliation remains useful after the migration.

Its source changes:

Before:
```text
legacy cp / synthetic recipe / Inventory V2 cup behavior
```

After:
```text
Stock Component applications + current Stock Item balances + physical closing count
```

For migrated cup Stock Items, reconciliation can compare:

```text
opening physical
+ inbound
- applied sale usage
+ restores
= theoretical closing
```

against physical closing.

Discrepancy is still resolved through Stock Opname.

The reconciliation UI should remain generic enough that future stock items can gain similar reconciliation without reintroducing a cup-only transaction engine.

## 21. Migration and Cutover

Migration is staged.

### Phase A — Audit

- enumerate current stock/product/cup writers;
- enumerate readers of `cp`, `cpLaku`, recipe packaging helpers, cup reservation state, refund/void, reconciliation;
- identify which code is historical-reader-only versus active writer;
- confirm current stock behavior used by normal stock products.

### Phase B — New model

- add Stock Item domain;
- add Product Stock Components mapping;
- add deterministic sale application;
- add refund/void restore;
- add ledger;
- add recovery.

### Phase C — Data migration

- create/match cup Stock Items;
- preserve outlet/warehouse cup quantities;
- translate existing product cup mappings;
- verify migration coverage;
- do not delete source data.

### Phase D — Compatibility

- new writer uses Stock Components;
- legacy data remains readable;
- prevent new cup sales from using the synthetic recipe path.

### Phase E — Cleanup

After verification:
- remove dead cup-only runtime writer code;
- remove obsolete cup-only rules;
- remove temporary migration adapters;
- retain only required historical readers.

Cleanup MUST be a separate commit from functional cutover so rollback and review are straightforward.

## 22. Test Strategy

Implementation MUST follow TDD.

Required automated coverage includes:

### Domain

- one component × one product;
- multiple components × one product;
- same component shared by multiple products;
- quantity aggregation;
- zero/invalid component quantity rejection;
- 100% discount still consumes components;
- total Rp0 completed transaction still consumes components.

### Exactly-once

- first apply decrements once;
- retry same transaction does not decrement again;
- refresh does not decrement again;
- competing devices resolve to one application;
- recovery of pending application finishes once.

### Refund / void

- full void restores once;
- duplicate void restore is ignored;
- partial refund restores proportional quantity;
- multiple partial refunds never exceed originally applied quantity;
- component mapping changes after sale do not alter historical restore.

### Migration

- each legacy cup code maps correctly;
- balances preserved;
- product mappings translated;
- unmapped/non-cup products unchanged;
- migration rerun is idempotent.

### Regression

- ordinary product sale remains functional;
- genuine recipe product remains functional;
- HPP/costing remains functional;
- refund/void remains functional;
- transfer/purchase/opname remain functional;
- shift open/close remains functional;
- reconciliation remains functional;
- frozen R6B remains unchanged unless explicitly approved.

## 23. Live UAT Gate

No production live UAT occurs until:

- focused TDD suite passes;
- full regression passes;
- Firebase emulator/rules tests pass;
- migration dry-run passes;
- application idempotency tests pass;
- refund/void tests pass;
- runtime writer audit confirms only one active Stock Component writer;
- cleanup candidates are documented.

Controlled UAT uses one known product and one known Stock Item.

Success requires:

```text
sale COMPLETED
balance decremented exactly once
application record completed
movement written once
transaction snapshot/link present
refresh causes no second decrement
refund/void restores exactly once
```

## 24. Rollback

Functional cutover and cleanup are separate.

Rollback must be able to:

- restore previous application/runtime bundle;
- restore previous Firebase rules;
- leave historical migration evidence intact;
- avoid reversing legitimate stock movements blindly.

The migration must be designed so old fields remain readable during the rollback window.

No destructive data cleanup occurs until the new path has passed production observation.

## 25. Cleanup Policy

The explicit policy is:

> Replacement, not permanent coexistence.

After release stability is demonstrated:

1. audit every legacy cup path;
2. classify as active writer, historical reader, or dead code;
3. remove dead writers first;
4. retain historical readers only where required;
5. remove temporary fallback readers once migration coverage is proven;
6. remove obsolete Firebase rules after no active caller remains;
7. run full regression again after cleanup.

No legacy code is kept merely "just in case" if Git history already preserves it and no runtime consumer requires it.

## 26. Security and Role Boundaries

Owner/management:
- create/edit/archive Stock Items;
- configure Product Stock Components;
- purchase;
- transfer;
- opname;
- view complete movements/reconciliation.

Cashier/transaction role:
- read Stock Items needed for sales;
- trigger bounded sale component application only through the transaction flow;
- cannot arbitrarily overwrite balances or mappings.

Role behavior for completed physical consumption is identical: Owner and Cashier sales consume the same Stock Components.

## 27. Performance

The subsystem should use targeted reads and bounded ledgers.

It MUST NOT reintroduce broad reads of all growing history merely to perform a sale.

Sale needs only:
- current product mapping;
- relevant Stock Item balances;
- deterministic application state.

History/movements are loaded lazily and bounded for UI.

This aligns with the existing R10 Inventory read-hardening direction.

## 28. Decision Summary

Locked design decisions:

- Cup is no longer a special recipe problem.
- Stock Components are generic.
- Multiple components per product are supported.
- Completed transaction quantity drives physical consumption.
- Discount/payment method do not alter consumption.
- Stock Components and Recipe remain separate domains.
- Exactly-once application is mandatory.
- Refund/void restore from historical application snapshot.
- Legacy cup mappings migrate automatically.
- Current cup balances are preserved.
- Historical records are not destructively deleted.
- Permanent dual-write is forbidden.
- Obsolete cup-specific runtime code is removed after safe cutover.
- Cleanup is explicit and separate from functional deployment.
- Inventory read paths remain targeted/bounded.
- Production deploy requires full release gates and explicit approval.

## 29. Acceptance Criteria

The milestone is complete only when all of the following are true:

- Owner can create a generic Stock Item.
- Owner can attach one or more Stock Items to a product.
- A completed sale decrements the correct quantities exactly once.
- Rp0/100%-discount completed sales still consume physical components.
- Refund and void restore correct historical quantities exactly once.
- Purchase, transfer, opname, and movement history work.
- Existing cup mappings and balances migrate without manual re-entry.
- Recipe products continue to work.
- Old cup-only runtime writers are removed/disabled after cutover.
- No permanent duplicate stock authority remains.
- Full regression and controlled production UAT pass.

---

## Architecture Amendment — 2026-09-18

### Status and precedence

This amendment is **FINAL APPROVED** for the Product Stock Components architecture.

If any earlier section in this specification conflicts with this amendment, **this amendment takes precedence**. The earlier concepts remain useful as design history, but they are no longer authoritative where superseded below.

The implementation must **not** introduce a second physical-stock balance authority alongside Inventory V2.

### Final stock authority

Product Stock Components reuses the existing Inventory V2 physical-stock model.

Canonical physical balance:

```text
global/inventoryV2/balances/ingredients/<stockItemId>
```

Each stock item continues to use the existing Inventory V2 physical locations:

```text
outlet
warehouse
```

The user-facing label may be **Item Stok** even though the persisted Inventory V2 master/balance authority remains the existing ingredient-compatible structure.

Examples include:

- Cup 22 oz Datar
- Tutup Datar
- Sedotan
- Sosis
- Kardus Snack
- other discrete consumables configured by the owner

A Product Stock Component is **not automatically a recipe ingredient in product behavior**. The component mapping is a simple discrete physical-consumption contract.

### Superseded paths

The following earlier proposed authorities are **cancelled** and must not be created as new balance or movement authorities:

```text
global/stockItems
global/stockBalances
global/stockMovements
```

They are superseded as follows:

| Earlier proposal | Final authority |
| --- | --- |
| `global/stockItems` | existing Inventory V2 item/master authority |
| `global/stockBalances` | `global/inventoryV2/balances/ingredients/<stockItemId>` |
| `global/stockMovements` | existing `global/inventoryV2/movements` |
| standalone component stock ledger | Inventory V2 movement/audit authority |
| independent physical-stock subsystem | prohibited |

No production migration may create or populate the cancelled paths above.

### Product-to-stock mapping

The product-to-component relationship is new, but remains inside the Inventory V2 authority family:

```text
global/inventoryV2/productStockComponents/<productId>/<stockItemId>
```

Each active mapping defines at minimum:

```text
stockItemId
qtyPerUnit
active
```

`qtyPerUnit` must be finite and greater than zero.

A product may consume multiple stock items. Multiple products may consume the same stock item.

For a completed sale line:

```text
physical usage = sold quantity × qtyPerUnit
```

Payment method, discount, selling price, cashier role, and transaction monetary total do not change physical consumption.

### Exactly-once application journal

Exactly-once state is recorded under Inventory V2:

```text
global/inventoryV2/stockApplications/<applicationId>
```

This is **not a second stock balance or ledger**. It is an idempotency and immutable-evidence journal for one stock application.

Canonical sale application identity:

```text
STOCK_APPLY|<shift>|<txId>
```

The application snapshot must be deterministic and must preserve the transaction-time component allocation so later mapping changes cannot rewrite history.

Allowed lifecycle states:

```text
CLAIMED
COMPLETED
ERROR
SHORTAGE
```

`COMPLETED` is terminal success.

`SHORTAGE` means the requested physical deduction cannot be fully applied without taking canonical outlet stock below zero.

A retry, refresh, reconnect, or second device processing the same sale must not decrement canonical physical stock a second time.

### Writer ownership

Product Stock Components receives one dedicated writer boundary.

The writer may mutate only the paths required for:

1. the Product Stock Components application journal;
2. canonical Inventory V2 outlet balances for the mapped stock items;
3. canonical Inventory V2 movement/audit records.

The writer must not create another balance authority.

The pure domain module:

```text
src/domain/product-stock-components.js
```

remains persistence-free.

Task 3 creates and verifies this dedicated exactly-once writer, but **does not connect it to the live sale flow yet**.

Sale integration remains a later cutover task.

### Relationship to Recipe Inventory V2

Recipe Inventory V2 remains authoritative for genuine recipe consumption.

Product Stock Components is used for simple discrete configured consumption and must not require:

```text
inventoryMode='RECIPE'
__CUP_ONLY__
synthetic recipe variants
```

The two mechanisms may coexist only because they represent different business concepts:

- Recipe Inventory V2: genuine recipe/ingredient consumption.
- Product Stock Components: explicit discrete item consumption per sold unit.

They must not both deduct the same physical item for the same sale line.

### Legacy cup migration

Existing `cp` mappings are migrated to Product Stock Components mappings with quantity `1` for the corresponding physical cup item.

Migration preserves the existing Inventory V2 physical balances.

Migration must not reset stock and must not require manual stock re-entry.

Historical data remains readable:

- legacy `cp`;
- historical Inventory V2 reservations;
- historical movements;
- reconciliation/audit evidence.

After cutover:

- `cp` is no longer the source of truth for new simple cup consumption;
- Product Stock Components mapping is the source of truth;
- permanent dual-write is prohibited.

A temporary compatibility reader is allowed only for migration/cutover evidence and must not become a second writer.

### Refund and void

Refund/void restoration must use the immutable stock-application snapshot captured for the original sale, not the current product mapping.

Restoration must be exactly-once and auditable.

The implementation plan must define deterministic restore identities based on:

```text
STOCK_<KIND>|<shift>|<txId>|<correctionId>
```

where `<KIND>` is the correction type such as `REFUND` or `VOID`.

The correction path must never restore more physical quantity than was originally applied for the sale.

### Shortage and atomicity requirements

Canonical physical stock must never be intentionally driven below zero.

Before a stock application can reach `COMPLETED`, all required component deductions must be proven applied exactly once.

A partial failure must remain recoverable and auditable. It must not be silently reported as success.

The writer design must explicitly test:

- duplicate application attempts;
- retry after interrupted processing;
- multi-component products;
- one shared component across multiple product lines;
- insufficient outlet stock;
- zero-value monetary sales that still consume physical stock;
- mapping changes after the original transaction;
- immutable application evidence;
- no duplicate movement/application on retry.

### Read-performance constraint

The Product Stock Components architecture must preserve the R10 Inventory read-hardening work.

Normal sale processing must use targeted reads/writes for the specific application and stock items involved.

It must not reintroduce:

- full `inventoryV2` root reads;
- recurring polling;
- permanent broad listeners;
- repeated full-history movement scans.

### Task-boundary correction

The implementation plan must be amended before Task 3 coding.

Revised responsibility:

```text
Task 3 — Exactly-Once Product Stock Component Writer
```

Task 3 may add the dedicated writer and its tests against the Inventory V2 authority described here.

Task 3 must **not**:

- connect the writer to production sale runtime;
- publish Firebase rules;
- run production migration;
- deploy the application;
- create `global/stockBalances`;
- create `global/stockMovements`;
- introduce permanent dual-write.

Those integrations remain governed by later implementation-plan tasks and explicit production approval gates.

### Locked invariants

The following are locked:

1. Inventory V2 is the canonical physical-stock authority for Product Stock Components.
2. No parallel physical-stock balance authority is allowed.
3. Mapping lives under the Inventory V2 authority family.
4. Exactly-once application journal is evidence/idempotency state, not a second balance.
5. Existing Inventory V2 movement authority is reused.
6. Recipe Inventory V2 remains for genuine recipes.
7. Simple discrete components do not require synthetic recipes.
8. Historical cup evidence remains readable.
9. No permanent dual-write.
10. No negative-stock success.
11. No production rules, migration, app deploy, or main merge without explicit approval.
12. Frozen RC01 R6B authority must remain unchanged.

---

## Config Scope Clarification — 2026-09-18

This clarification is **FINAL APPROVED** and refines the earlier Architecture Amendment.

The dedicated Product Stock Components writer additionally owns **Owner-only configuration persistence** for:

```text
global/inventoryV2/productStockComponents/<productId>/<stockItemId>
```

This does not create another physical-stock authority.

Authority remains:

```text
Inventory V2 item/master authority
  -> Item Stok master data

global/inventoryV2/balances/ingredients/<stockItemId>
  -> canonical outlet/warehouse physical balance

global/inventoryV2/productStockComponents/<productId>/<stockItemId>
  -> Product Stock Component configuration, dedicated writer, Owner/manajemen only

global/inventoryV2/stockApplications/<applicationId>
  -> exactly-once application/restore evidence

global/inventoryV2/movements
  -> canonical movement/audit evidence
```

Cashier/transaksi may never edit Item Stok master data or `productStockComponents`.

The writer-ownership section of the earlier amendment is therefore interpreted as permitting the dedicated writer to mutate exactly these Product Stock Component scopes:

1. `inventoryV2/productStockComponents` for Owner-only mapping configuration;
2. `inventoryV2/stockApplications` for exactly-once application/restore journals;
3. `inventoryV2/balances/ingredients` for targeted canonical outlet balance operations and their crash-recovery marker metadata;
4. `inventoryV2/movements` for deterministic Product Stock Component movement evidence.

No `global/stockItems`, `global/stockBalances`, `global/stockMovements`, `global/productStockComponents`, or `global/stockApplications` authority may be introduced.
