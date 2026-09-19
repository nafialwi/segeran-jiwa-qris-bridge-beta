# Inventory V2 Read Architecture Hardening — Design

## Context

R10 Cup Reconciliation exposed an older performance problem in Bahan & Gudang. The Inventory V2 authority is valid, but normal presentation reads are too broad: Inventory Workspace v3.2 reads the complete `global/inventoryV2` tree, so current state and append-only ledgers such as movements/purchases/reservations share one read boundary. The cost grows as operational history grows.

## Goal

Reduce normal Inventory V2 read amplification without changing writer authority, stock semantics, Firebase schema, or production data ownership.

## Four-block program

1. **INV01-1 — Audit & Read Foundation**: record the baseline, add read diagnostics, split normal workspace state into child-path reads, and make Activity movements server-bounded.
2. **INV01-2 — Shared Read Engine & Fast Workspace**: add a shared read coordinator, request deduplication, short-lived memory snapshots, stale-while-refresh, and fast warm-open behavior.
3. **INV01-3 — Consumer Migration**: migrate Cup Shift, Costing, Reconciliation, Finance, and Report consumers away from broad reads; add precise cache invalidation.
4. **INV01-4 — Verification & Release Gate**: measure performance/bandwidth, run full regression and LOCAL QA, finish R10 visual UAT, and create release/handoff gates.

## INV01-1 behavior

Normal Bahan & Gudang load must no longer call `readInventoryV2()` or download the full `global/inventoryV2` root. It reads only the workspace current-state children (`ingredients`, ingredient balances, ingredient costs, `productWarehouse`) plus legacy finished-goods outlet stock. Activity uses an RTDB `orderByChild('ts').limitToLast(120)` movement query.

Reconciliation correctness must not be weakened. R10 currently needs historical OPNAME evidence that can be older than the latest 120 movements, so INV01-1 keeps a **lazy full movements read only when reconciliation is actually opened**. That remaining broad reconciliation read is explicitly deferred to INV01-3, where a safe historical evidence strategy can be designed without silently changing resolution semantics.

## Diagnostics

Inventory repository reads record only in-memory metadata: consumer, operation, path, duration, estimated JSON payload bytes, and bounded-query metadata. Diagnostics do not write to Firebase or any persistent store. The runtime exposes this diagnostic object for later automated performance comparison.

## Invariants

- Inventory V2 remains the official stock authority.
- Existing dedicated writers remain byte-identical during INV01-1.
- `src/app/rc01-runtime-loading-hardening.js` remains frozen at its production SHA-256.
- No new Firebase mutation API is introduced.
- No D1/R2 migration or RTDB schema rewrite occurs.
- `readInventoryV2()` remains available for compatibility/recovery consumers, but normal Inventory Workspace must not call it.
- R10 Opname/reconciliation writer routing remains the existing Inventory V2 writer flow.
