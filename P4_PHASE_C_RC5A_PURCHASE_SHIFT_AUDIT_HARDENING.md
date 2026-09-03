# P4 Phase C RC5-A — Purchase / Shift Audit Hardening

Status: **IMPLEMENTED FOR READ-ONLY UAT — RC5-B REVERSAL NOT IMPLEMENTED**

## Android finding that triggered RC5-A

RC4 displayed an August `Pembelian TEH` Rp25.000 cash-out in Arus Kas while Pengeluaran Bisnis remained Rp0 and Hapus Granular did not expose the record. It also displayed a generic open-shift warning.

The first behavior is semantically expected: a committed Inventory Purchase is cash outflow, while its system-linked opex evidence is excluded from P&L double counting. The audit gap was that the user could not inspect the linked purchase evidence from Finance.

## RC5-A corrections

### Canonical shift state

Finance now mirrors the existing P3 authority semantics:

- CLOSED: `locked`, `shiftStatus=CLOSED`, or `sessionControl.status=CLOSED`;
- ACTIVE: ACTIVE state plus an actual current session id;
- otherwise NOT_STARTED.

Only canonical shift keys matching `YYYY-MM-DD-S1/S2/S3` participate in monthly shift-status evaluation. Prefix-matching noise nodes do not create a false open-shift warning.

When a canonical ACTIVE shift exists, Finance exposes the exact key in the warning.

### Inventory Purchase ACTIVE-shift guard

The V3 inventory workspace now checks the existing `SJShift.currentData()` + `SJShift.state()` authority before delegating a new purchase to the legacy Inventory V2 writer. A purchase requires ACTIVE state and a session id.

This adds no writer. Inventory V2 remains the writer authority.

### Purchase audit detail

Finance repository adds read-only evidence reads for:

- `global/inventoryV2/purchases/{purchaseId}`;
- the linked inventory movement;
- the linked shift expense.

Arus Kas Inventory Purchase rows become auditable. The detail card states explicitly:

- Purchase COMMITTED is not a normal granular business expense;
- cash-out is the purchase amount;
- linked business-expense effect is Rp0 in Finance to prevent double count;
- purchase/expense/movement/stock/WAC evidence status;
- missing or inconsistent linkage warnings;
- no destructive correction is attempted by RC5-A.

## Deliberately deferred RC5-B

RC5-A does not reverse the Rp25.000 record. After Android QA reveals whether the TEH purchase evidence is internally consistent and whether purchased stock has subsequently been consumed/sold, RC5-B can design the appropriate Owner-only append-only reconciliation. Direct Firebase deletion is not acceptable.
