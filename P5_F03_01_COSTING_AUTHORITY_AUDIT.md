# P5 / v3.4 — F03-01 Costing / HPP Authority Audit

Status: **BATCH-1 IMPLEMENTED — READ/CALCULATION HARDENING ONLY — NOT LOCKED**
Date: 2026-09-03
Starting authority: **P4 v3.3 LOCKED**
Official roadmap progress during this candidate: **75%**

## Purpose
Identify which historical HPP evidence can be trusted, which can be reconstructed safely, and which must remain unknown. This batch deliberately avoids persistence/backfill so historical transactions are never rewritten merely to improve report coverage.

## Authority findings

### 1. Transaction costing snapshot — authoritative
Newer sales may persist immutable `tx.costing` evidence. When `costingKnown !== false` and `cogsTotal` is finite, the snapshot is authoritative for period HPP.

This covers both:
- **STOCK** products: sale-time WAC evidence is snapshotted into costing items.
- **RECIPE** products: ingredient WAC and recipe breakdown are snapshotted at sale time.

Classification: `SNAPSHOT_VERIFIED`.

### 2. P4 explicit total HPP — authoritative compatibility evidence
Locked P4 already accepts a transaction with explicit `costKnown=true` and finite top-level `cogs` as known total HPP. P5 preserves that contract.

Classification: `SNAPSHOT_VERIFIED` with source `P4_EXPLICIT_HPP`.

Limitation: total-only evidence is not sufficient to reconstruct refund cost per line when line-level costing is absent.

### 3. COMMITTED costing reservation — safe read-only reconstruction
Inventory V2 costing reservation is created before the legacy transaction and contains a contemporaneous `costingQuote`. A reservation may reconstruct missing `tx.costing` **only** when all of the following are proven:
- reservation status is `COMMITTED`;
- `transactionId` exactly matches the sale transaction;
- canonical shift matches the transaction shift;
- the `costingQuote` itself is complete/known.

This uses sale-time evidence and does not consult today's WAC or recipe.

Classification: `RECONSTRUCTED_VERIFIED`.

### 4. Ambiguous/incomplete reservation — not enough to total HPP
Uncommitted, duplicate/ambiguous, mismatched-shift, or incomplete reservation evidence is retained as evidence of incompleteness, not converted into an estimate.

Classification: `PARTIAL_EVIDENCE`.

### 5. Refund costing
Authoritative refund costing remains `refundCostingTotals` when complete.

If that aggregate is absent, P5 may reconstruct refund COGS only when:
- original sale has authoritative line-level cost snapshot;
- refund quantity is explicitly attributable (`refundedQty` or refund row with exact `lineIndex`);
- requested quantities do not exceed original quantities.

Classification when fully proven: `RECONSTRUCTED_VERIFIED`.

If refund quantity/line attribution is incomplete: `PARTIAL_EVIDENCE`; period HPP/profit remains unavailable.

### 6. VOID / CANCELLED
VOID/CANCELLED sale transactions do not create a second HPP writer. They are excluded from effective period sales/COGS calculations.

Classification: `VOID_EXCLUDED`.

### 7. Current WAC/current recipe — explicitly forbidden for historical reconstruction
The following are **not** historical HPP authority:
- current inventory WAC;
- current product recipe;
- current ingredient cost;
- current stock quantity;
- an inferred average based on today's inventory state.

They may be useful for current operational decisions, but must not retroactively manufacture old sale HPP.

Classification when no contemporaneous evidence exists: `NOT_SAFE_TO_RECONSTRUCT`.

## Read-model classifications
- `SNAPSHOT_VERIFIED`
- `RECONSTRUCTED_VERIFIED`
- `PARTIAL_EVIDENCE`
- `NOT_SAFE_TO_RECONSTRUCT`
- `VOID_EXCLUDED`

## Reporting rule
HPP, Gross Profit, Gross Margin, and Net Profit may be numeric only when every effective transaction in scope has reliable costing evidence. If even one effective sale/refund remains partial or unsafe, aggregate profitability remains `Belum tersedia` rather than silently treating missing HPP as Rp0.

## Persistence decision for Batch-1
**No persistence proposal is needed for this batch.**
- no historical transaction backfill;
- no new HPP writer;
- no current-WAC rewrite;
- no recipe rewrite;
- no SC04 allowlist expansion;
- no production write.

## Historical TEH case boundary
The historical TEH purchase/WAC anomaly remains governed by the P4 controlled reconciliation policy. P5 must not use that current WAC history as permission to rewrite historical HPP.
