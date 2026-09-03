# P4 RC5-D Funding Semantics & Controlled Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct Inventory Purchase funding semantics so Owner-funded TEH does not reduce business cash, expose controlled-resolution readiness, and add WAC cost-review evidence without rewriting historical WAC or deleting purchase/shift history.

**Architecture:** Keep RC5-C repositories and the existing three exact mutation writers unchanged. Extend pure Finance analytics/service logic to classify purchase funding (`CASH`, `OWNER`, `BANK`, `OTHER`), derive confirmed business liquidity separately from non-business/unknown funding, and derive a read-only WAC review + controlled resolution plan from existing audit evidence. Finance UI renders those facts; LOCAL QA remains mutation-disabled.

**Tech Stack:** ES modules, Node.js built-in test runner, existing Firebase RTDB compatibility layer, existing P4 Finance/Inventory V2 runtime.

**Spec:** RC5-D approval in chat following RC5-C Android QA evidence for purchase `TEH` Rp25.000.

## Global Constraints

- Production v2.9 is untouched; LOCAL QA remains read-only.
- P1 v3.0, P2 v3.1, P3 v3.2 LOCKED are not reopened.
- Original purchase remains COMMITTED; historical shift is not rewritten or fake-closed.
- No automatic WAC rewrite in RC5-D.
- Existing `purchase-reconciliation-writer.js` remains the only purchase reconciliation writer; SC04 exact allowlist must remain exactly three writer files.
- `OWNER` purchase funding is direct Owner funding and must not reduce business cash/liquidity totals.
- `CASH` purchase funding is a confirmed business cash outflow.
- `BANK` purchase funding is not treated as confirmed business outflow until a bank-balance/payment authority exists; it must remain visible as unverified external-business funding.
- `OTHER` purchase funding is not assumed to be business cash; it must remain visible as unresolved funding.
- Purchase reversal compensation follows the same source semantics as the original funding and must never become P&L expense or refund.
- HPP unknown remains `Belum tersedia`, never Rp0 by assumption.

---

### Task 1: Funding-source semantics in Finance analytics

**Files:**
- Modify: `src/domain/finance-v33-analytics.js`
- Test: `tests/v33-p4-rc5d-funding-semantics.test.mjs`

**Interfaces:**
- Produces: `classifyPurchaseFundingV33(purchase, options?)`
- Produces cash-flow rows with funding metadata: `fundingTreatment`, `fundingAmount`, `confirmedBusinessFlow`, `requiresAuthority`.
- Produces `model.inventoryPurchases` breakdown: confirmed business cash out, Owner funded, Bank unverified, Other unresolved.

- [ ] RED: prove OWNER Rp25.000 purchase is visible but contributes Rp0 to `cashFlow.totalOut` and running business-cash balance.
- [ ] RED: prove CASH purchase contributes Rp25.000 outflow.
- [ ] RED: prove BANK without authority and OTHER do not silently reduce cash-flow totals and are flagged.
- [ ] RED: prove PURCHASE_REVERSAL compensation mirrors source treatment.
- [ ] GREEN: implement minimal source classifier and apply it to purchase/reversal rows.
- [ ] GREEN: update inventory purchase breakdown while preserving P&L semantics.
- [ ] REFACTOR: keep row visibility while separating display funding amount from confirmed in/out.

### Task 2: WAC cost-review and controlled-resolution read model

**Files:**
- Modify: `src/domain/finance-v33-service.js`
- Test: `tests/v33-p4-rc5d-funding-semantics.test.mjs`

**Interfaces:**
- Produces: `buildWacCostReviewV33({purchase, downstreamInventory})`.
- Produces: `buildControlledResolutionPlanV33({audit})` or equivalent immutable `resolutionPlan` on purchase audit.

- [ ] RED: TEH old WAC 20 -> purchase WAC 22 -> current WAC 22 with downstream consumption + OPNAME must return `REVIEW_REQUIRED` and forbid automatic WAC rewrite.
- [ ] RED: resolution plan must classify `LINK_REPAIR` and historical shift acknowledgement as safe candidates when eligible, while purchase reversal stays blocked.
- [ ] GREEN: derive WAC review facts/reason codes only from existing evidence.
- [ ] GREEN: add funding treatment, WAC review, and resolution plan to `loadPurchaseAudit()`.
- [ ] GREEN: add monthly funding breakdown to `loadMonth()` without writer/schema changes.

### Task 3: Finance UI conformance for funding and cost review

**Files:**
- Modify: `src/ui/finance-v33-workspace.js`
- Modify only if necessary for layout: existing Finance CSS authority file used by RC4/RC5.
- Test: `tests/v33-p4-rc5d-funding-semantics.test.mjs`

**Interfaces:**
- Cash-flow purchase row shows funding treatment even when confirmed in/out is zero.
- Cash-flow KPI area shows Owner-funded / funding-needs-review amount without calling it cash out.
- Purchase audit shows `Dampak Arus Kas Usaha`, `WAC Cost Review`, and `Rencana Resolusi Terkontrol`.

- [ ] RED: OWNER-funded TEH row renders `Dana Owner · tidak mengurangi kas usaha` and Rp25.000 funding evidence while cash movement displays Rp0.
- [ ] RED: WAC card renders old/new/current WAC and `REVIEW_REQUIRED`, with explicit “auto WAC rewrite dilarang”.
- [ ] RED: controlled resolution card renders LINK_REPAIR eligible, Historical Shift ACK eligible, PURCHASE_REVERSAL blocked.
- [ ] GREEN: implement presentation only; existing forms/controllers remain unchanged and disabled under LOCAL QA.
- [ ] GREEN: preserve 252 `!important` budget and direct-RTDB-mutation prohibition in UI/domain files.

### Task 4: Regression, safety gates, and Android LOCAL QA package

**Files:**
- Create: `P4_PHASE_C_RC5D_FUNDING_SEMANTICS_CONTROLLED_RESOLUTION.md`
- Update: `P4_PHASE_C_IMPLEMENTATION_REPORT.md`
- Update: `P4_PHASE_C_LOCAL_QA.md`
- Update: `P4_PHASE_C_UAT_AND_DEPLOYMENT_GATE.md`

- [ ] Run RC5-D targeted RED→GREEN suite.
- [ ] Run related P4/RC5 regression suites.
- [ ] Run full `npm test`.
- [ ] Run `npm run verify:sc04` and confirm exact three-writer allowlist remains.
- [ ] Run `npm run verify:ref01`.
- [ ] Run LOCAL QA smoke on `127.0.0.1:4173`, check header and READ ONLY badge.
- [ ] Build clean candidate from official RC5-C ZIP + RC5-D source delta.
- [ ] Generate source/package SHA256 manifests, package ZIP, extract again, and verify artifact from ZIP itself.
