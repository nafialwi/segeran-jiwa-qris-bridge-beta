# P5 / v3.4 — Batch-1 Costing / HPP Hardening Implementation Report

Status: **ANDROID LOCAL QA CANDIDATE — NOT LOCKED**
Date: 2026-09-03
Starting authority: **P4 v3.3 LOCKED**
Official roadmap progress: **75%**

## Delivered

### Pure costing evidence resolver
Created `src/domain/costing-v34-evidence.js`.

It resolves each transaction into one of the evidence classes:
- snapshot verified;
- safely reconstructed;
- partial evidence;
- not safe to reconstruct;
- void excluded.

### Safe reconstruction sources
The resolver can use:
- immutable `tx.costing`;
- P4 explicit `costKnown=true + cogs` compatibility evidence;
- exact COMMITTED costing reservation tied to the same transaction and canonical shift;
- authoritative refund costing totals;
- original line-cost snapshot + explicit refund quantities.

It explicitly refuses current-WAC/current-recipe historical reconstruction.

### Finance repository/service integration
Added read-only costing-reservation loading. Period transactions are enriched before entering the locked P4 Finance analytics.

No database writer or schema was added.

### Finance analytics
Added costing evidence coverage and conditional profitability:
- HPP;
- Laba Kotor / Gross Profit;
- Gross Margin;
- Net Profit remains conditional on complete costing.

If coverage is incomplete, profitability remains unavailable.

### Finance UI
Finance is labeled **`Finance v3.4 · P5 Costing`** and Ringkasan includes:
- HPP;
- Laba Kotor;
- Gross Margin;
- `Coverage HPP v3.4` panel with counts for snapshot verified, safe reconstruction, partial evidence, and unsafe reconstruction.

The panel explicitly states that current WAC/current recipe is not used to fabricate historical cost.

## TDD evidence
P5-specific test file: `tests/v34-p5-costing-evidence.test.mjs`.

Covered behaviors:
1. STOCK/RECIPE transaction snapshot verification.
2. Exact COMMITTED reservation reconstruction.
3. Current WAC/current recipe rejection.
4. Ambiguous reservation partial evidence.
5. Refund COGS reconstruction from explicit refunded quantities.
6. Incomplete refund evidence remains partial.
7. Global refund rows with exact line index.
8. VOID exclusion.
9. Finance gross-profit/margin complete vs withheld on incomplete coverage.
10. Repository/service and UI integration.

A P4 compatibility regression was found during full-suite execution: an existing P4 fixture carried explicit top-level `costKnown=true,cogs` without `tx.costing`. The resolver was corrected to preserve that already-locked authority; the old test was not weakened.

## Fresh verification
- P5 targeted contract: **10/10 PASS**.
- P4 runtime compatibility + P5: **13/13 PASS** after compatibility hardening.
- Related costing/refund/finance/inventory regressions: **61/61 PASS**.
- Full suite: **394/394 PASS**.
- SC04: **PASS**; mutation restricted to the same 3 dedicated P4 writers.
- REF01: **PASS**.
- B01–B05 icon authority: **61/61 PASS**.
- `!important` budget: **252/252**.
- Finance v3.3 semantic verifier: **9/9 PASS**.

## Mutation/safety state
P5 Batch-1 adds **0 writers** and **0 destructive operations**. Production deployment remains blocked.

## What is not claimed yet
- P5 is **not LOCKED**.
- Historical HPP coverage on actual production data is not assumed to improve until Android LOCAL QA shows the evidence counts.
- Transactions lacking contemporaneous proof stay unknown.
- No automatic database backfill has been approved or implemented.
