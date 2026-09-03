# P4 RC5-B Purchase & Shift Reconciliation Design

## Goal
Add a safe correction path for committed Inventory V2 purchases discovered by RC5-A audit without deleting historical purchase evidence, duplicating existing transaction/expense/inventory authorities, or modifying production during LOCAL QA.

## Scope
RC5-B adds two explicit purchase reconciliation operations and one read-only shift audit:

1. `LINK_REPAIR` — restore the system-linked shift expense only when a committed purchase declares an `expenseRef` and that exact row is missing. The row is reconstructed from immutable purchase evidence. Existing non-matching rows are never overwritten.
2. `PURCHASE_REVERSAL` — compensate an invalid/test purchase using an append-only reconciliation event plus an Inventory V2 compensating movement. Automatic reversal is allowed only when no downstream consumptive movement for the same item exists after the purchase and the current warehouse quantity/value can be safely reduced.
3. Shift audit — expose canonical P3 shift status/closing evidence and reasons for incomplete closing metadata. RC5-B does not auto-close or rewrite historical shifts.

## Persistence
New append-only namespace:

`global/inventoryV2/purchaseReconciliations/{purchaseId}/{operationId}`

A purchase reversal also writes a compensating Inventory V2 movement under:

`global/inventoryV2/movements/{movementId}`

and atomically adjusts the existing Inventory V2 balance/cost authority inside one transaction on `global/inventoryV2`.

A link repair writes only the exact original purchase-linked shift expense path:

`{shiftKey}/opex/{expenseRef}`

and the corresponding reconciliation event. It refuses to overwrite any existing non-matching row.

Original `global/inventoryV2/purchases/{purchaseId}` remains immutable/COMMITTED.

## Reversal Safety
Automatic reversal is fail-closed. It is rejected if:

- purchase is not COMMITTED;
- another confirmed reversal already exists;
- item type/id or purchase quantity/cost evidence is missing;
- any downstream consumptive movement for the same item exists after purchase time;
- current warehouse stock is below purchase quantity;
- corrected inventory value would be negative;
- Owner re-auth is missing/stale;
- operationId is duplicated.

Transfers and non-consumptive movements do not by themselves block reversal because total inventory quantity/value is unchanged. OPNAME or unknown negative movements after purchase are treated as ambiguous and block automatic reversal.

## WAC Correction
When safe automatic reversal is allowed:

- current total quantity = outlet + warehouse for ingredients; outlet legacy quantity is not mutated;
- corrected warehouse = current warehouse - purchased quantity;
- corrected total value = current total quantity × current WAC - purchase landed cost;
- corrected WAC = corrected total value / corrected total quantity when corrected total quantity > 0;
- when corrected total quantity becomes 0, WAC returns to purchase `oldWac` (or 0 when unavailable).

The writer records before/after quantities and WAC in the reconciliation event and compensating movement.

## Finance Semantics
A COMMITTED purchase continues to appear as its original cash outflow. A confirmed `PURCHASE_REVERSAL` reconciliation contributes an equal compensating cash inflow, so net liquidity becomes zero for a fully reversed test purchase. It remains `businessExpense = 0`; no P&L expense/refund is fabricated.

`LINK_REPAIR` has no additional cash-flow effect because it restores missing linkage evidence only.

## UI / LOCAL QA
Purchase Audit gains a `Rekonsiliasi` section showing eligibility and blockers. In LOCAL QA, write controls are visible but disabled/read-only so visual/runtime QA is possible without production mutation.

Shift warnings link to read-only `Audit Shift` with canonical state, session id, locked/closing evidence, and exact incomplete fields.

## Security / Idempotency
Both write operations require Owner re-auth proof. `operationId` is exact-idempotent. Reconciliation records are append-only. `.remove()` remains forbidden.

## SC04
SC04 evolves narrowly from two to three exact writer files by adding only:

`src/data/writers/purchase-reconciliation-writer.js`

Its static path/method contract is exact; no wildcard writer allowance is introduced.
