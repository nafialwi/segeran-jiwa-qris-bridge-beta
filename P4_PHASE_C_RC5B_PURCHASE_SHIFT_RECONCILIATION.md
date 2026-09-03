# P4 Phase C RC5-B — Purchase & Shift Reconciliation

Status: **IMPLEMENTED FOR LOCAL READ-ONLY UAT — PRODUCTION MUTATION NOT AUTHORIZED**

## Evidence carried forward from RC5-A

The TEH Rp25.000 purchase is COMMITTED and tied to `2026-08-29-S1`. Inventory movement, Stock and WAC evidence are present. The purchase carries an `expenseRef`, but the linked expense cannot be verified. This is exactly the case RC5-B is designed to reconcile without deleting history.

## LINK_REPAIR

Eligible only when:
- purchase is COMMITTED;
- canonical shift and existing `expenseRef` are present;
- the expense path is missing.

The writer reconstructs a system-linked inventory-purchase expense from immutable purchase evidence. If the path is occupied by any nonmatching row, it fails closed. Original purchase is unchanged.

## PURCHASE_REVERSAL

Automatic reversal is deliberately narrow:
- ingredient purchase only;
- COMMITTED;
- purchase quantity/cost evidence complete;
- no prior confirmed reversal;
- no downstream consumption;
- no ambiguous opname/unknown downstream inventory mutation;
- warehouse stock remains sufficient;
- corrected inventory value/WAC remains nonnegative and coherent;
- explicit reason is mandatory;
- fresh Owner self re-auth is mandatory.

When safe, a single Inventory V2 transaction records a compensating movement, adjusts current warehouse/WAC, and appends the confirmed reconciliation event. Original purchase stays COMMITTED for audit traceability.

## Finance semantics

- LINK_REPAIR does not create a second business expense.
- PURCHASE_REVERSAL is a compensating cash inflow, not revenue, expense or refund.
- Original purchase cash-out remains in the purchase month.
- Reversal cash compensation appears in the month the reconciliation event occurs.

## Shift semantics

RC5-B exposes canonical Shift Audit evidence (state/session/locked/closing snapshot/issues). It does not auto-close or rewrite historical shift data. Any shift correction remains a separate governed decision after evidence review.
