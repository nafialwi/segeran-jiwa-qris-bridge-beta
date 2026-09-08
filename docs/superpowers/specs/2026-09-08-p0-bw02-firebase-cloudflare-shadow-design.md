# P0-BW02 Firebase Bandwidth Hardening + Cloudflare D1 Shadow Design

## Goal
Reduce Realtime Database download amplification immediately without changing economic authority, while preparing a rollback-safe Cloudflare D1/R2 shadow migration path.

## Locked baseline
- Start from R8 Unified Refinement commit `1ffa956`.
- Do not re-enable automatic QRIS bridge/polling.
- Do not replace existing sale/refund/inventory writers with parallel writers.
- Firebase remains production authority during this phase.
- Cloudflare D1/R2 is shadow-only; no production cutover in P0-BW02.

## P0 bandwidth changes
1. New transaction snapshots must not persist image data URLs in `cartData`; transaction lines retain product identity/name/qty/price/cup only.
2. The canonical sale writer exposes the exact successful transaction identity in memory after the root update succeeds. Costing and recipe wrappers consume that identity instead of reading the whole shift before and after every sale.
3. Refund costing locates the original transaction by direct transaction key first; legacy fallback may use a bounded `id` query, never a full-shift `tx` read.
4. Refund costing background recovery changes from repeated 15-second scans to event-driven recovery for new refund rows plus one bounded login recovery pass.
5. Costing reservation recovery is no longer polled continuously. It runs once after login/online recovery conditions and remains manually callable.
6. The P0 patch must not add new broad Firebase listeners, root reads, or periodic business-data polls.

## Deferred from emergency patch
- Full global listener redesign.
- Historical removal of Base64 already stored in old transactions.
- Finance month query refactor.
- Moving product/logo/QRIS media to R2.
These follow after profiler evidence or during migration because they are larger changes.

## Cloudflare shadow architecture
- Pages: existing frontend.
- Worker: API/auth/validation/idempotency boundary.
- D1: normalized business ledger and read models.
- R2: images, transfer evidence, attachments, immutable backup exports.
- Firebase export remains immutable migration source until parity is proven.

## Migration safety
- Import is deterministic and idempotent by legacy IDs.
- Every imported row stores legacy path/key provenance.
- Shadow validation compares counts and financial totals per shift/day/month before any read cutover.
- No dual-write or production cutover is authorized by this design alone.
