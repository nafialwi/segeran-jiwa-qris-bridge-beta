# P5 Batch-2 — Cup & Packaging Authority Audit

Date: 2026-09-03
Status: IMPLEMENTED CANDIDATE — Android LOCAL QA pending

## Locked authority decisions

1. Product cup mapping authority remains the existing product field `cp`.
2. Existing codes are retained: `c10`, `c16`, `c22p`, `c22d`, `c22o`.
3. Cup stock authority is Inventory V2 ingredients/balances/costs, unit `pcs`.
4. Cup physical opening/closing count evidence is stored through the existing Shift `verifiedShiftWrite` START/CLOSE authority.
5. Sale theoretical cup usage is derived from immutable transaction-item `cp` snapshots; product master fallback is compatibility-only when an older line lacks the snapshot.
6. Cup WAC is included in new RECIPE sale costing by decorating the existing recipe read surface before the existing costing reservation snapshots the quote.
7. There is no new sale writer, cup stock writer, or shift writer.
8. Closing physical counts do NOT directly mutate Inventory V2 balances. A mismatch creates an `inventoryOpnameDrafts` evidence list; stock synchronization remains the existing Inventory V2 Opname authority.

## Five fixed Segeran Jiwa cup types

- `c10` — Cup 10 Oz
- `c16` — Cup 16 Oz
- `c22p` — Cup 22 Oz Datar Polos
- `c22d` — Cup 22 Oz Datar
- `c22o` — Cup 22 Oz Oval

## Reconciliation math

`physicalUsed = opening + inboundToOutlet - closing`

`variance = physicalUsed - theoreticalSaleUsage`

A non-zero variance requires a reason at shift close.

## Accepted variance reasons

- Rusak
- Tumpah / remake
- Pemakaian internal
- Sampling
- Salah hitung
- Lainnya

## Inventory synchronization rule

Manual closing count is shift reconciliation evidence, but it is not permitted to become a second inventory mutation path. If closing physical quantity differs from the Inventory V2 outlet balance, Batch-2 stores an Opname Draft containing ingredient, system quantity, physical quantity, delta, and note. Owner then reconciles through `Bahan & Gudang → Kemasan & Cup → Opname`, which delegates to the existing hidden Inventory V2 writer.

## Legacy containment

The old legacy day-level cup counters (`cpSisa/cpPlus/cpLaku/cpRusak`) are not promoted as P5 stock authority. P5 uses Inventory V2 balances for stock, transaction snapshots for theoretical usage, and Shift evidence for physical reconciliation.
