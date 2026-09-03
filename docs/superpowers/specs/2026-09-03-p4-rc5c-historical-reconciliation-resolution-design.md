# P4 RC5-C Historical Reconciliation Resolution Design

## Goal
Turn RC5-B audit findings into deterministic, audit-safe resolution evidence without deleting or rewriting the original purchase, movement, expense history, or historical shift node.

## Scope
RC5-C adds three bounded capabilities:

1. **LINK_REPAIR dry-run** — read-only classification of the exact purchase-linked expense target as `MISSING`, `ALREADY_VALID`, or `OCCUPIED_MISMATCH`, plus a preview of the system-linked expense record that would be created by the existing RC5-B writer.
2. **Downstream inventory evidence** — show purchase quantity, purchase stock/WAC evidence, current warehouse/outlet quantity and WAC, and all relevant post-purchase movements grouped as transfer, consumption, opname/adjustment, or ambiguous. This evidence explains why automatic reversal is safe or blocked.
3. **Historical shift resolution** — append a `HISTORICAL_SHIFT_ACK` event under the existing purchase reconciliation namespace when a committed purchase is attached to a canonical historical shift whose P3 state is `NOT_STARTED` or whose close evidence is incomplete. The shift node itself is never modified or auto-closed.

## Persistence
No new namespace and no new writer file.

Historical acknowledgement uses the existing append-only path:

`global/inventoryV2/purchaseReconciliations/{purchaseId}/{operationId}`

with:

- `type = HISTORICAL_SHIFT_ACK`
- `status = CONFIRMED`
- immutable purchase/shift references
- issue codes captured from the read-only shift audit
- Owner note/reason
- Owner re-auth evidence metadata already enforced by the writer boundary

Original purchase remains `COMMITTED`; historical shift remains unchanged.

## LINK_REPAIR Dry-Run
Dry-run never mutates RTDB. It uses immutable purchase evidence plus the exact current value at `{shiftKey}/opex/{expenseRef}`.

Classification:

- `MISSING` — exact target is empty; LINK_REPAIR can reconstruct the expected linked expense.
- `ALREADY_VALID` — current row already has matching `purchaseRef`, amount, and `systemLinked=true`; no repair is needed.
- `OCCUPIED_MISMATCH` — any other row occupies the exact ID; automated repair is blocked and overwrite remains forbidden.

The preview must include amount, category, name, source, purchaseRef, systemLinked, supplier when known, and target shift/expense ID. It is presentation evidence only.

## Downstream Inventory Evidence
For the purchase item, RC5-C reads Inventory V2 movements after purchase time excluding the purchase's own movement. It reports:

- purchase quantity and landed cost;
- stockBefore/stockAfter and oldWac/newWac from purchase evidence;
- current warehouse/outlet/total quantity and current WAC from Inventory V2 authority;
- downstream movement list with time, type, delta, location, and classification;
- total consumptive quantity observed;
- opname/adjustment/ambiguous counts;
- reversal eligibility/blockers from the existing RC5-B reconciliation plan.

No attempt is made to infer a safe manual quantity correction when evidence is ambiguous.

## Historical Shift Resolution
`HISTORICAL_SHIFT_ACK` is eligible only when:

- purchase is `COMMITTED`;
- purchase shift key is canonical;
- shift audit state is `NOT_STARTED`, or shift audit has `SHIFT_STATUS_INCOMPLETE` / `CLOSING_EVIDENCE_INCOMPLETE`;
- no confirmed acknowledgement already exists for the same purchase/shift issue set.

It is not a shift CLOSE event. It does not set `locked`, `sessionControl`, `closingSnapshot`, cash values, or any historical shift metadata.

Finance warning behavior after confirmed acknowledgement:

- acknowledged historical `NOT_STARTED` association is not presented as “shift belum ditutup”;
- it remains visible as an informational reconciled historical issue in purchase audit/history;
- genuinely ACTIVE shifts continue to block/alert normally.

## Security and LOCAL QA
- Dry-run and downstream evidence are read-only and available in LOCAL QA.
- Historical acknowledgement write requires Owner self re-auth, explicit note/reason, idempotent operationId, and writable runtime.
- In LOCAL QA the acknowledgement control is visible but disabled.
- `.remove()` remains forbidden.
- SC04 exact writer allowlist remains **three files**; no expansion is required.

## Explicit Non-Goals
- No automatic purchase reversal when RC5-B blockers exist.
- No automatic manual stock/WAC compensation.
- No deletion of purchase/expense/movement/reconciliation history.
- No synthetic close of `2026-08-29-S1` or any historical shift.
- No production deployment or production write during Android LOCAL QA.
