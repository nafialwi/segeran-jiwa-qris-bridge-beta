# P5 v3.4 Batch-3 — Historical HPP & Profit Coverage Hardening Report

Date: 2026-09-03
Status: **ENGINEERING COMPLETE — ANDROID LOCAL QA REQUIRED — NOT LOCKED**
Production: **UNTOUCHED**

## Objective

Make historical HPP coverage auditable and useful without fabricating cost. Batch-3 does not backfill transaction history. It separates total-period profitability from measurable profitability on the subset whose HPP evidence is verified.

## Authority conclusion

Safe HPP evidence remains limited to:

1. immutable `tx.costing` snapshots;
2. explicit legacy/P4 `costKnown=true + cogs` evidence;
3. exact COMMITTED costing reservation linked to the same transaction and canonical shift;
4. refund COGS reconstructed only from original immutable costing line snapshots plus explicit refund quantity/line evidence.

The following are **not** accepted as historical HPP reconstruction sources:

- current WAC;
- current recipe;
- current packaging/cup WAC;
- current product master cost;
- estimates derived only from today's inventory state.

The Android evidence before Batch-3 showed the selected September period with 156 effective transactions lacking safe HPP evidence. Batch-3 intentionally does not manufacture HPP for those rows.

## New diagnostics

`buildCostingCoverageDiagnosticsV34()` adds read-only evidence metrics:

- transaction coverage percentage;
- revenue coverage percentage;
- measured revenue and measured HPP;
- **Laba Kotor Terukur** and **Gross Margin Terukur** for verified-cost transactions only;
- legacy transactions with no contemporaneous cost evidence;
- evidence reason cohorts and affected revenue;
- first observed verified-cost timestamp;
- transactions missing costing after verified evidence has already appeared (`POST_EVIDENCE_COSTING_GAP`).

## Profit semantics

Full-period HPP, Gross Profit, Gross Margin and Net Profit remain unavailable whenever any effective transaction in the period has unknown HPP.

Measured profit is a separate audit metric. It is explicitly labelled as a subset and must never be presented as total-period profit.

## Safety

- New writers: **0**
- Historical HPP writes/backfill: **0**
- Existing SC04 allowlist remains exactly three P4 dedicated writers.
- P4 finance semantics remain unchanged.
- P5 Batch-2 Cup/Packaging architecture remains unchanged.
- Production deployment remains unauthorized.

## Verification

Development-source fresh gates before clean packaging:

- Batch-3 targeted: 5/5 PASS
- Related P4/P5 regression: 47/47 PASS
- Full regression: 429/429 PASS
- SC04: PASS
- REF01: PASS
- B01–B05 icon authority: 61/61 PASS
- CSS `!important`: 252/252
- Mutation allowlist: exactly 3 P4 dedicated writers

Final clean-candidate/artifact verification is recorded in the package verification directory.
