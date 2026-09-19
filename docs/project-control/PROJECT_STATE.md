# Segeran Jiwa Legacy — Project State

Updated: 2026-09-15

## Production authority

- Branch: `main`
- Production baseline: `8018c40ae74f`
- Production tag: `r9-cup01-prod-20260914`
- Production deployment is unchanged by INV01 work.

## Development checkpoint

- R10 pre-performance checkpoint: `d3d6725b5ce4`
- Safety tag: `r10-pre-inv01`
- Active branch: `work/r10-inventory-read-hardening`
- Last verified implementation commit: `ed8d5e048112`

## Current milestone

`R10-PERF-INV01 — Inventory V2 Read Architecture Hardening`

- INV01-1 Audit & Read Foundation: **DONE**
- INV01-2 Shared Read Engine & Fast Workspace: **NEXT**
- INV01-3 Consumer Migration: PENDING
- INV01-4 Verification & Release Gate: PENDING

## INV01-1 verified state

- Normal Bahan & Gudang no longer calls the full `global/inventoryV2` root.
- Current workspace state is composed from targeted child paths.
- Activity movements use `orderByChild('ts').limitToLast(120)`.
- Inventory read diagnostics are memory-only and available from the Inventory Workspace/runtime diagnostic object.
- Historical reconciliation movements remain a lazy full movements read for correctness; optimization is deferred to INV01-3.
- Dedicated writer files are unchanged.
- Frozen R6B loading-hardening source is unchanged.
- Full serial tests and SC02/SC03/SC04/V3.2/REF01/RC01 gates passed before this checkpoint.

## R10 feature state

Cup Reconciliation feature implementation and LOCAL QA containment are complete. Final visual UAT remains paused until Inventory V2 performance hardening reaches the appropriate verification point.

## Next action

Execute **INV01-2 — Shared Read Engine & Fast Workspace**. Do not merge or deploy production yet.
