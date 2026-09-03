# P5 / v3.4 Costing & HPP Hardening Design

## Status
Approved roadmap execution derived from P4 v3.3 LOCKED. P4 remains immutable; this file describes the P5 candidate only.

## Goal
Increase trustworthy HPP coverage without fabricating historical cost, while preserving STOCK/RECIPE/refund/void semantics and P4 finance locks.

## Evidence policy
1. `TX_COSTING_SNAPSHOT`: immutable `tx.costing` with `costingKnown !== false` and finite `cogsTotal` is authoritative.
1a. `P4_EXPLICIT_HPP`: locked P4 transactions with explicit top-level `costKnown=true` and finite `cogs` remain authoritative for total HPP compatibility; they are not sufficient for refund line reconstruction unless line snapshots also exist.
2. `COMMITTED_COSTING_RESERVATION`: a COMMITTED Inventory V2 costing reservation whose `transactionId` and canonical shift match the transaction may reconstruct a missing `tx.costing` read-only from its contemporaneous `costingQuote`.
3. Refund HPP is authoritative when `refundCostingTotals` is complete. If absent, refund COGS may be reconstructed only from an authoritative original cost snapshot plus cumulative refund quantities (`refundedQty`) or refund rows with explicit `lineIndex`.
4. VOID transactions contribute zero net sales and zero COGS to period profit; no second HPP writer is created.
5. Current WAC, current recipe, or current ingredient cost must NEVER be used to fabricate historical sale HPP.
6. A partial snapshot is evidence of incompleteness, not permission to estimate a total.

## Classification
- `SNAPSHOT_VERIFIED`: complete immutable transaction cost snapshot.
- `RECONSTRUCTED_VERIFIED`: complete contemporaneous reservation/refund-snapshot reconstruction.
- `PARTIAL_EVIDENCE`: some contemporaneous evidence exists but total HPP cannot be proven.
- `NOT_SAFE_TO_RECONSTRUCT`: no contemporaneous proof sufficient for HPP.
- `VOID_EXCLUDED`: void transaction excluded from period profit.

## Architecture
Create a pure `costing-v34-evidence.js` resolver. Finance repository gains a read-only costing-reservation reader. Finance service enriches month transactions before passing them to the locked P4 finance calculation. Finance analytics exposes richer coverage plus gross profit/margin only when every effective transaction has reliable costing. Finance UI displays evidence coverage and never turns unknown HPP into zero.

## Mutation boundary
No new writer, schema, transaction engine, WAC rewrite, or historical backfill in this batch. SC04 mutation allowlist remains unchanged.

## QA acceptance
- STOCK snapshot complete -> verified.
- RECIPE snapshot complete -> verified.
- Missing transaction costing + exact committed reservation -> reconstructed verified.
- Current WAC/recipe only -> not safe to reconstruct.
- Refund with original snapshot + explicit refund quantities -> refund COGS reconstructed safely.
- Refund without refund quantity evidence -> partial; period HPP/profit remains unavailable.
- VOID excluded.
- Finance HPP, gross profit, gross margin remain unavailable whenever effective unknown/partial rows exist.
- Full P1-P4/QRIS/Inventory/Finance regression remains green.
- LOCAL QA remains READ ONLY.
