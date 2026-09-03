# P5 v3.4 Batch-3 Historical HPP & Profit Coverage Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make historical HPP coverage auditable and useful without fabricating costs: show measured profitability for verified-cost transactions, explain unsafe legacy gaps, and detect any new costing regression after verified evidence appears.

**Architecture:** Keep `costing-v34-evidence.js` as the transaction-level evidence resolver. Add a pure read-only coverage diagnostics module that summarizes verified vs unsafe revenue, measured gross profit/margin on covered revenue only, reason cohorts, and post-evidence gaps. Integrate diagnostics into Finance read model/UI; do not persist/backfill historical HPP and do not add writers.

**Tech Stack:** Existing vanilla ES modules, Node `node:test`, Firebase RTDB read-only repository abstraction, existing Finance v3.4 UI.

**Spec:** `docs/superpowers/specs/2026-09-03-p5-v34-costing-hpp-hardening-design.md`

## Global Constraints

- P4 v3.3 LOCKED remains the latest approved finance architecture.
- Unknown historical HPP never becomes Rp0 by assumption.
- Current WAC/current recipe must not reconstruct historical HPP.
- No persistence/backfill in Batch-3.
- No new transaction, inventory, expense, QRIS, shift, refund, or costing writer.
- Gross/net profit for the full period remains unavailable unless effective HPP coverage is complete.
- Measured profit must be explicitly labeled as covered-subset profit, never total-period profit.
- Production deployment remains unauthorized.

---

### Task 1: Costing Coverage Diagnostics

**Files:**
- Create: `src/domain/costing-v34-coverage.js`
- Test: `tests/v34-p5-batch3-historical-hpp-coverage.test.mjs`

**Interfaces:**
- Consumes: transactions already enriched with `_costingEvidenceV34`.
- Produces: `buildCostingCoverageDiagnosticsV34(transactions)` returning count/revenue coverage, measured profitability, reason cohorts, evidence-observed timestamp, and post-evidence gaps.

- [ ] **Step 1: Write RED tests** covering verified subset profit, unsafe legacy reason grouping, partial evidence grouping, VOID exclusion, and a missing-cost transaction after first verified evidence being flagged as `POST_EVIDENCE_COSTING_GAP`.
- [ ] **Step 2: Run `node --test tests/v34-p5-batch3-historical-hpp-coverage.test.mjs` and verify RED** because the diagnostics module does not exist.
- [ ] **Step 3: Implement minimal pure-domain diagnostics** using only transaction snapshots/evidence already present; no current WAC/recipe lookups and no mutation tokens.
- [ ] **Step 4: Re-run targeted tests and require GREEN.**

### Task 2: Finance Read Model and UI Integration

**Files:**
- Modify: `src/domain/finance-v33-analytics.js`
- Modify: `src/ui/finance-v33-workspace.js`
- Test: `tests/v34-p5-batch3-historical-hpp-coverage.test.mjs`

**Interfaces:**
- Consumes: `buildCostingCoverageDiagnosticsV34`.
- Produces: `profit.hppDiagnostics` and Finance coverage UI showing HPP coverage %, revenue coverage %, measured HPP/gross profit/gross margin, reason cohorts, and post-evidence gap alert.

- [ ] **Step 1: Add RED integration tests** proving full-period gross/net profit stays null when coverage is incomplete while `measuredGrossProfit` and `measuredGrossMargin` are available only for the verified-cost subset.
- [ ] **Step 2: Add RED UI tests** requiring labels `Profit Terukur`, `Coverage Revenue`, `Legacy tanpa evidence biaya`, and `Gap costing setelah evidence aktif` where applicable.
- [ ] **Step 3: Implement minimal analytics/UI integration** without changing existing P4 semantics or Finance writer surfaces.
- [ ] **Step 4: Run targeted P4/P5 Finance tests and require GREEN.**

### Task 3: Regression, Safety, and Android LOCAL QA Candidate

**Files:**
- Create: `P5_BATCH3_HPP_PROFIT_COVERAGE_REPORT.md`
- Create: `P5_BATCH3_LOCAL_QA.md`
- Update package/checksum manifests only after all gates pass.

**Interfaces:**
- Consumes: Tasks 1-2 final source.
- Produces: a continuity-ready LOCAL QA ZIP with P4 LOCKED rollback and P5 Batch-2 predecessor provenance.

- [ ] **Step 1: Run related Costing/Refund/Finance/Inventory regressions.**
- [ ] **Step 2: Run full `npm test`; require zero failures.**
- [ ] **Step 3: Run `npm run verify:sc04`; writer allowlist must remain exactly three P4 dedicated writers.**
- [ ] **Step 4: Run `npm run verify:ref01`; require icon 61/61 and CSS `!important` 252/252 guards unchanged.**
- [ ] **Step 5: Build a clean candidate from the approved Batch-2 Final QA baseline plus only Batch-3 delta; verify it again.**
- [ ] **Step 6: Run `npm run qa:local` on the clean candidate and verify `LOCAL QA · READ ONLY` plus Batch-3 Finance coverage surfaces.**
- [ ] **Step 7: Package ZIP, verify SHA256, source/package manifests, `unzip -t`, then extract the final ZIP and repeat full tests + LOCAL QA smoke from the artifact itself.**
