# Segeran Jiwa Legacy R8 Unified Refinement — Design

**Date:** 2026-09-08
**Base authority:** R7 FINAL LOCK
**Scope:** Operational refinement only; no database migration, no new economic writer family, no reopening frozen R7 QRIS/loading authority.

## Goal

Make the Legacy POS follow real outlet work more closely while preserving auditability and the existing R7/P5 financial and inventory authorities.

## R8-B1 — Daily UX, Role, and Cup

- Payment completion has one authoritative success surface; the duplicate success toast is suppressed only when the receipt/success surface is visible.
- Cashier can see outlet cup stock and status needed for daily work.
- Cup presentation follows the active/registered cup catalog and includes Paper Cup 10 Oz without inventing stock for an unregistered master.
- Cashier stock UI exposes useful read/request actions and hides Owner-only adjustment/warehouse actions.
- No Firebase listener, writer, or periodic loop is added by the B1 presentation module.

## R8-B2 — Correction and Inventory Safety

- Purchase correction routes to the existing Finance cashflow/Purchase Reversal authority; no parallel reversal writer is introduced.
- Restock receipt requires the cashier to enter the physical received quantity.
- Requested quantity, received quantity, variance, and variance reason are retained as evidence.
- A non-zero receive variance requires an explanation.
- The existing atomic/idempotent restock receive authority remains the primary claim; R8 only appends verified physical receipt evidence/correction through the existing hardening authority.

## R8-B3 — Shift and Closing Integrity

- Closing uses a blind physical-count stage: cash and every enabled cup count are entered first.
- Expected cash, theoretical cup reconciliation, and variance are hidden until the physical count is locked.
- After lock, comparison/reason fields are revealed and the existing closing writer remains authoritative.
- Opening cash is compared with the immediately previous closed shift's actual cash when available. A difference is allowed but requires an explanation; R8 never fabricates a balancing movement.
- Existing closing health/blocker authority remains in place rather than creating a second blocker/persistence engine.

## Security and Authority Constraints

- Frozen baseline HTML SHA256 remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- SC04 modular mutation allowlist remains exactly the existing four dedicated writers.
- R8 UI modules must not call direct RTDB mutation primitives.
- Existing R7 QRIS manual authority, R7 loading hardening, sync authority, and emergency D1 authority remain byte-identical.
- No historical HPP reconstruction and no Firebase/Supabase migration are part of R8.
