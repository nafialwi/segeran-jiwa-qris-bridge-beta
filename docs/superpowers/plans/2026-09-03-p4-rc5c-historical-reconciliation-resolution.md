# P4 RC5-C Historical Reconciliation Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic dry-run expense repair evidence, downstream inventory evidence, and append-only historical shift acknowledgement without modifying historical purchase/shift records.

**Architecture:** Extend the existing Finance read-model/service for pure read-only evidence and extend the existing purchase reconciliation writer with one new event type (`HISTORICAL_SHIFT_ACK`). Keep SC04 at the same exact three-writer allowlist. UI exposes all evidence in LOCAL QA while write controls remain disabled.

**Tech Stack:** Node 20+, ES modules, Firebase RTDB compatibility API, node:test.

**Spec:** `docs/superpowers/specs/2026-09-03-p4-rc5c-historical-reconciliation-resolution-design.md`

## Global Constraints
- Firebase root remains `toko_segeranjiwa_v58`.
- Original purchase remains COMMITTED and immutable.
- Historical shift node is never written by RC5-C.
- Existing RC5-B reversal blockers remain fail-closed.
- LOCAL QA remains mutation-forbidden.
- Owner self re-auth + operation idempotency required for historical acknowledgement.
- SC04 exact writer allowlist remains three files; `.remove()` forbidden.

---

### Task 1: Pure RC5-C resolution evidence
**Files:**
- Modify: `src/domain/finance-v33-service.js`
- Test: `tests/v33-p4-rc5c-historical-resolution.test.mjs`

**Interfaces:**
- Produces: `buildLinkRepairDryRunV33(...)`, `buildDownstreamInventoryEvidenceV33(...)`, `buildHistoricalShiftResolutionV33(...)`.

- [ ] Write failing tests for MISSING / ALREADY_VALID / OCCUPIED_MISMATCH dry-run classification.
- [ ] Run targeted test and confirm RED because RC5-C functions are absent.
- [ ] Implement dry-run preview from purchase evidence without mutation.
- [ ] Write failing tests for downstream movement classifications and totals.
- [ ] Implement deterministic downstream evidence using Inventory V2 movement/balance/cost authority.
- [ ] Write failing tests for historical shift acknowledgement eligibility and duplicate acknowledgement blocking.
- [ ] Implement pure historical resolution plan.
- [ ] Run targeted tests and confirm GREEN.

### Task 2: Append-only historical shift acknowledgement writer
**Files:**
- Modify: `src/data/writers/purchase-reconciliation-writer.js`
- Test: `tests/v33-p4-rc5c-historical-resolution.test.mjs`
- Verify: `tests/v33-p4-phase-c-sc04-writer-contract.test.mjs`

**Interfaces:**
- Produces: `acknowledgeHistoricalShift({operationId,purchaseId,shiftAudit,note,authorization})`.

- [ ] Write failing tests requiring Owner self re-auth, note, canonical shift, eligible issue, and idempotency.
- [ ] Write test proving purchase and shift nodes remain byte-equivalent after acknowledgement.
- [ ] Implement minimal event append in the existing purchase reconciliation namespace only.
- [ ] Run targeted tests and SC04 contract; confirm GREEN with exact three-writer allowlist unchanged.

### Task 3: Service/controller/UI integration
**Files:**
- Modify: `src/domain/finance-v33-service.js`
- Modify: `src/ui/finance-v33-workspace.js`
- Test: `tests/v33-p4-rc5c-historical-resolution.test.mjs`

**Interfaces:**
- `loadPurchaseAudit()` returns `linkRepairDryRun`, `downstreamInventory`, and `historicalShiftResolution`.
- Controller produces `acknowledgeHistoricalShift(...)` through the existing authorizer.

- [ ] Write failing service/UI tests for the TEH-like case: missing linked expense, downstream consumption/ambiguous movement, NOT_STARTED shift.
- [ ] Implement service evidence aggregation.
- [ ] Render Dry Run, Downstream Inventory Evidence, and Historical Shift Resolution sections.
- [ ] Keep acknowledgement note/PIN/button visible but disabled in LOCAL QA.
- [ ] Ensure writable controller requires Owner re-auth and delegates only to existing reconciliation writer.
- [ ] Run targeted tests and confirm GREEN.

### Task 4: Full verification and Android LOCAL QA package
**Files:**
- Update: implementation/local-QA/UAT handoff documents.
- Create: RC5-C report/package manifests.

- [ ] Run RC5-A/RC5-B/RC5-C related regression.
- [ ] Run `npm test` fresh.
- [ ] Run `npm run verify:sc04` fresh.
- [ ] Run `npm run verify:ref01` fresh.
- [ ] Run clean LOCAL QA smoke at `127.0.0.1:4173`; verify HTTP 200 and READ ONLY.
- [ ] Package from clean RC5-B baseline + verified RC5-C delta, create source/package SHA manifests, verify P3 rollback anchor and ZIP integrity.
