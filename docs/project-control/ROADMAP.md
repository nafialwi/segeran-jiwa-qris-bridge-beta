# Segeran Jiwa Legacy — Master Roadmap

## Production

- R9 Cup Continuity / production baseline — **PRODUCTION**

## R10 Cup Reconciliation

- Domain — DONE
- Renderer / styling — DONE
- Inventory Workspace integration — DONE
- Regression remediation — DONE
- Opname deep-link / resolution — DONE
- Release gate — DONE
- LOCAL QA automated gate — DONE
- LOCAL QA login containment — DONE
- Final visual UAT — PAUSED for Inventory V2 performance hardening

## R10-PERF-INV01 — Inventory V2 Read Architecture Hardening

### INV01-1 — Audit & Read Foundation — DONE

Deliverables:
- project-control baseline
- read diagnostics
- targeted workspace current-state reads
- server-bounded recent Activity movements
- normal workspace full-root read removed
- writer/frozen-source integrity verified

Known deferred item: reconciliation still performs a lazy full movements read when opened so historical OPNAME resolution remains correct.

### INV01-2 — Shared Read Engine & Fast Workspace — NEXT

Scope:
- shared Inventory read coordinator
- in-flight request deduplication
- short-lived memory snapshot
- stale-while-refresh rendering
- fast warm-open Bahan & Gudang
- measured cold/warm diagnostics

### INV01-3 — Consumer Migration — PENDING

Scope:
- Cup Shift
- Cup Costing
- Rekonsiliasi historical movement strategy
- Finance / purchase audit
- Reports
- precise invalidation after existing writers

### INV01-4 — Verification & Release Gate — PENDING

Scope:
- bandwidth/performance comparison
- full regression
- LOCAL QA
- resume R10 visual UAT
- final checkpoint/handoff
- merge/deploy only after explicit approval

## Deferred / discovered but not active

Items discovered outside the active block must be recorded here and must not interrupt the active block unless they are a safety blocker.
