# P4 Phase C RC5-C — Historical Reconciliation Resolution

Status: **IMPLEMENTED FOR LOCAL READ-ONLY UAT — PRODUCTION MUTATION NOT AUTHORIZED**
Date: 2026-09-03

## Why RC5-C exists

RC5-B Android evidence proved that `Pembelian TEH` Rp25.000 is a real COMMITTED Inventory V2 purchase whose stock/WAC have downstream effects, while its system-linked expense cannot be verified and its historical shift `2026-08-29-S1` is canonically `NOT_STARTED`. Automatic purchase reversal is therefore unsafe and historical shift closure would falsify the record.

RC5-C adds evidence-first resolution without deleting or rewriting those historical facts.

## 1. LINK_REPAIR dry-run

Before any future LINK_REPAIR write, RC5-C classifies the exact linked-expense target as:
- `MISSING` — eligible to reconstruct only the exact expected system-linked expense;
- `ALREADY_VALID` — no repair needed;
- `OCCUPIED_MISMATCH` — fail closed; never overwrite another record.

The dry-run previews category, name, amount, source, supplier, purchaseRef and `systemLinked` evidence. LOCAL QA performs no write.

## 2. Downstream Inventory evidence

Purchase audit now exposes:
- purchase quantity/value and stock before/after;
- current warehouse/outlet stock;
- purchase old/new WAC and current WAC;
- downstream movements with time, type, delta, location and classification;
- observed consumption and ambiguous adjustment/opname blockers.

This evidence explains why automatic purchase reversal is allowed or blocked without guessing historical WAC.

## 3. Historical shift acknowledgement

A `HISTORICAL_SHIFT_ACK` event uses the existing reconciliation namespace:

`global/inventoryV2/purchaseReconciliations/{purchaseId}/{operationId}`

It does **not** close, lock or rewrite the old shift. It records that a committed purchase was historically associated with a canonical `NOT_STARTED`/incomplete shift. The original purchase and shift remain unchanged.

Safeguards:
- Owner fresh self re-auth;
- explicit written note;
- idempotent operationId;
- duplicate confirmed acknowledgement rejected even under another operationId;
- genuinely ACTIVE shift is never eligible;
- no new writer file or SC04 wildcard.

## Finance behavior

A confirmed historical acknowledgement removes the false implication that the historical NOT_STARTED association is an ordinary unclosed shift. Finance labels the association as historically reconciled without claiming that the shift was actually closed.

## LOCAL QA

All reconciliation/acknowledgement writes remain disabled. Android QA is evidence-only. Production v2.9 is untouched and deployment is not authorized.
