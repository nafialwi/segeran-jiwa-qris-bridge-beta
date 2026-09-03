# P4 RC5-B Purchase & Shift Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement append-only purchase link repair/reversal plus read-only shift audit, while preserving Inventory V2 authority and LOCAL QA read-only safety.

**Architecture:** Add one narrowly allowlisted purchase reconciliation writer. Domain service computes eligibility/evidence; writer performs only exact approved mutations. Finance consumes reconciliation records as compensating cash-flow evidence. UI exposes audit/reconciliation state and disables writes in LOCAL QA.

**Tech Stack:** Node 20+, ES modules, Firebase RTDB compatibility API, node:test.

**Spec:** `docs/superpowers/specs/2026-09-03-p4-rc5b-purchase-shift-reconciliation-design.md`

## Global Constraints
- Firebase POS root remains `toko_segeranjiwa_v58`.
- P3 v3.2 remains rollback authority and is not modified.
- Original committed purchases are never deleted or rewritten.
- LOCAL QA remains mutation-forbidden.
- Owner re-auth + idempotency required for every reconciliation mutation.
- `.remove()` remains forbidden.
- No duplicate sale/expense/shift/QRIS writer.

---

### Task 1: Reconciliation domain eligibility and finance semantics
**Files:**
- Modify: `src/domain/finance-v33-analytics.js`
- Modify: `src/domain/finance-v33-service.js`
- Test: `tests/v33-p4-rc5b-purchase-reconciliation.test.mjs`

**Interfaces:**
- Produces: `buildPurchaseReconciliationPlanV33(...)`, reconciliation-aware `buildCashFlowRows(...)`, `loadPurchaseAudit()` reconciliation evidence.

- [ ] Write failing tests for LINK_REPAIR eligibility, safe reversal, downstream-consumption blocking, and cash-flow compensation.
- [ ] Run targeted tests and confirm RED.
- [ ] Implement minimal pure-domain logic.
- [ ] Run targeted tests and confirm GREEN.

### Task 2: Dedicated reconciliation writer
**Files:**
- Create: `src/data/writers/purchase-reconciliation-writer.js`
- Modify: `src/data/repositories/finance-repository.js`
- Modify: `scripts/sc04-mutation-policy.mjs`
- Modify: `tests/v33-p4-phase-c-sc04-writer-contract.test.mjs`
- Test: `tests/v33-p4-rc5b-purchase-reconciliation.test.mjs`

**Interfaces:**
- Produces: `repairExpenseLink(...)`, `reversePurchase(...)`, exact writer contract.

- [ ] Write failing writer tests for owner proof, duplicate operation, no overwrite, safe inventory transaction, and downstream blocking.
- [ ] Run tests and confirm RED.
- [ ] Implement minimal writer and exact third-file SC04 allowlist.
- [ ] Run tests and confirm GREEN.

### Task 3: Runtime/service/UI and shift audit
**Files:**
- Modify: `src/app/p4-finance-bootstrap.js`
- Modify: `src/domain/finance-v33-service.js`
- Modify: `src/ui/finance-v33-workspace.js`
- Modify: finance UI CSS source used by the workspace.
- Test: `tests/v33-p4-rc5b-purchase-reconciliation.test.mjs`

**Interfaces:**
- Consumes: P4 authorizer and reconciliation writer.
- Produces: reconciliation actions + read-only shift audit UI; mutation buttons disabled in LOCAL QA.

- [ ] Write failing UI/runtime tests.
- [ ] Run and confirm RED.
- [ ] Implement controller/runtime wiring and UI.
- [ ] Run and confirm GREEN.

### Task 4: Full safety verification and Android LOCAL QA package
**Files:**
- Update: P4 implementation/local-QA/UAT handoff docs.
- Create: RC5-B continuity report/package manifests.

- [ ] Run related regression.
- [ ] Run `npm test`.
- [ ] Run `npm run verify:sc04`.
- [ ] Run `npm run verify:ref01`.
- [ ] Run LOCAL QA smoke on `127.0.0.1:4173` and verify READ ONLY.
- [ ] Build ZIP from verified clean source, compute SHA256, verify archive/manifests/rollback anchor.
