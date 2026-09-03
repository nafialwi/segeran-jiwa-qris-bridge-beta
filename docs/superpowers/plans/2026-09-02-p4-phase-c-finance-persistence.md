# P4 Phase C Finance Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement approved append-only finance persistence, QRIS cash-out coordination/recovery, exact SC04 writer isolation, and the v3.3 Finance workspace without touching production.

**Architecture:** Add two narrowly scoped RTDB mutation authorities: a finance writer and a QRIS cash-out coordinator. All public finance actions flow through a P4 service that requires short-lived sensitive authorization; existing sale/expense/inventory/shift authorities are reused rather than duplicated. UI is a REF-01 presentation enhancement over the existing Reports route and QRIS surface.

**Tech Stack:** Browser ES modules, Firebase Realtime Database v8-style API, Node.js built-in `node:test`, existing legacy bridge/SC03/SC04 runtime.

**Spec:** `docs/superpowers/specs/2026-09-02-p4-phase-c-approved-design.md`

## Global Constraints

- Firebase POS root remains exactly `toko_segeranjiwa_v58`.
- QRIS root remains exactly `segeranjiwa_qris_beta_v1`.
- P3 v3.2 LOCKED remains rollback anchor; no P1-P3 rewrite.
- Production v2.9 is not deployed or mutated by this work.
- Existing sale, expense, inventory, shift, refund, debt, and normal QRIS matching writers remain authoritative.
- Normal QRIS exact-amount matcher must not be loosened.
- Finance historical events are append-only; corrections use reversal/reopen events.
- LOCAL QA must remain read-only against production data.
- No safety verifier may be weakened merely to obtain a green test.

---

### Task 1: Idempotency and Sensitive Authorization Primitives

**Files:**
- Modify: `src/core/idempotency.js`
- Create: `src/core/sensitive-authorizer.js`
- Test: `tests/v33-p4-phase-c-authorization.test.mjs`

**Interfaces:**
- Produces: `createOperationId(prefix, {now, random})`, `assertOperationId(value)`, `createLegacySensitiveAuthorizer({runtime, db, now, maxProofAgeMs})`.
- Authorization result: `{ok:true, role:'owner', ownerId, ownerName, requesterId, requesterRole, reauthenticatedAt}` with no PIN field.

- [ ] Write RED tests for safe operation IDs, Owner direct re-auth, Cashier + Owner approval, failed PIN, non-owner approver, and proof secrecy.
- [ ] Run the new test file and confirm failures are caused by missing implementations.
- [ ] Implement the minimal ID helpers and legacy authorizer using existing `sjVerifyPin` plus fixed POS user reads.
- [ ] Re-run the new tests GREEN and then run all existing SC04/session tests.
- [ ] Commit Task 1.

### Task 2: Append-only Finance Writer + Corrected Read Semantics

**Files:**
- Create: `src/data/writers/finance-writer.js`
- Modify: `src/data/repositories/finance-repository.js`
- Modify: `src/domain/finance-v33-analytics.js`
- Test: `tests/v33-p4-phase-c-finance-writer.test.mjs`

**Interfaces:**
- Produces: `createFinanceWriter({db, now, maxProofAgeMs})` with `postOwnerEvent`, `reverseOwnerEvent`, `closeMonth`, `reopenMonth`, and internal QRIS journal helpers used only by the coordinator.
- Repository adds `readOwnerEvents(period)`, `readMonthCloseEvents(period)`, `readQrisCashOut()`.
- Analytics applies REVERSAL events and confirmed QRIS cash-out inflow semantics.

- [ ] Write RED tests for duplicate `operationId`, one unreversed opening capital, append-only reversal, CLOSE/REOPEN lifecycle, stale/missing Owner proof, repository fixed paths, reversal math, and 20k-in/16k-out cash flow.
- [ ] Run the test file and confirm expected RED failures.
- [ ] Implement transaction-based month-node writers and read-model changes with no delete/update historical API.
- [ ] Run Task 2 tests GREEN and re-run Phase A finance tests.
- [ ] Commit Task 2.

### Task 3: QRIS Cash-out Coordinator with Fail-Closed Recovery

**Files:**
- Create: `src/data/writers/qris-cash-out-coordinator.js`
- Test: `tests/v33-p4-phase-c-qris-cash-out.test.mjs`

**Interfaces:**
- Produces: `createQrisCashOutCoordinator({db, financeWriter, transactionService, authorize, readRequester, readDrawerCash, now})`.
- Public methods: `findEligibleOverpay(pendingId)`, `execute({providerTransactionId,pendingId,authorization})`, `recover({providerTransactionId,authorization})`.
- Final deterministic `cashMovementId` is derived from provider transaction ID so retries cannot create a second drawer movement.

- [ ] Write RED tests covering candidate eligibility, signal/pending claim conflicts, insufficient drawer cash, cashier-without-owner approval, Owner direct authorization, exact sale delegation count, successful 4k/20k/16k finalization, duplicate execute idempotency, partial signal-claim rollback, unknown sale outcome fail-closed behavior, and same-operation recovery.
- [ ] Run the test file and confirm expected RED failures.
- [ ] Implement claim journal, sale delegation, post-sale identification, atomic multi-location finalization, and operation-aware recovery without changing normal matcher code.
- [ ] Run Task 3 tests GREEN plus QRIS adapter and transaction boundary regression tests.
- [ ] Commit Task 3.

### Task 4: P4 Runtime Wiring and Finance Service

**Files:**
- Create: `src/domain/finance-v33-service.js`
- Create: `src/app/p4-finance-bootstrap.js`
- Modify: `src/ref01-entry.js`
- Modify: `src/data/index.js`
- Modify: `src/domain/index.js`
- Test: `tests/v33-p4-phase-c-runtime.test.mjs`

**Interfaces:**
- Produces runtime `__SJ_P4_FINANCE_RUNTIME` with `repository`, `writer`, `authorizer`, `finance`, and `qrisCashOut` services.
- `finance.loadMonth(period)` assembles canonical inputs from month shifts and fixed global authorities.
- Finance write methods require authorization proof; expense creation delegates to existing SC03 operational expense route rather than a new writer.

- [ ] Write RED tests for runtime single-install, fixed DB resolution, month aggregation, Owner write service delegation, and absence of duplicate expense/sale writer APIs.
- [ ] Run RED tests.
- [ ] Implement service/bootstrap wiring with dependency injection for tests and legacy runtime DB resolution.
- [ ] Run Task 4 tests GREEN and SC03/SC04 runtime regressions.
- [ ] Commit Task 4.

### Task 5: Exact SC04 Mutation Allowlist

**Files:**
- Modify: `scripts/verify-sc04.mjs`
- Modify: `scripts/verify-v33-finance.mjs`
- Test: `tests/v33-p4-phase-c-sc04-writer-contract.test.mjs`

**Interfaces:**
- SC04 allows RTDB mutation tokens only in the two approved writer files.
- Finance writer path contract is limited to owner events, month close events, and QRIS cash-out journal under `global/financeV1`.
- Coordinator path contract is limited to approved finance QRIS evidence, existing shift cash movements, and QRIS `signals`/`pending` state extension.
- `.remove()` remains prohibited everywhere in modular source.

- [ ] Write RED verifier-contract tests that expect the old “zero mutations” rule to fail once an approved writer exists and reject a synthetic unauthorized mutation file/path.
- [ ] Run RED tests.
- [ ] Evolve verifier to exact file allowlist + path/method contract; do not relax unrelated checks.
- [ ] Run `npm run verify:sc04` and Task 5 tests GREEN.
- [ ] Commit Task 5.

### Task 6: Finance Workspace and QRIS Cash-out UI

**Files:**
- Create: `src/ui/finance-v33-workspace.js`
- Create: `src/ui/qris-cash-out-ui.js`
- Modify: `src/app/ref01-bootstrap.js`
- Modify: `src/ui/ref01.css`
- Test: `tests/v33-p4-phase-c-finance-ui.test.mjs`

**Interfaces:**
- Finance workspace renders exactly five tabs: `Ringkasan`, `Arus Kas`, `Pengeluaran`, `Modal & Prive`, `Tutup Bulan`.
- Owner-event and close actions collect PIN only in transient UI state, call authorizer, then service; PIN is cleared immediately.
- Pengeluaran CTA routes to existing `operational.expense` authority.
- QRIS cash-out UI only offers action for a valid overpay candidate; Cashier UI requires Owner ID + PIN approval, Owner UI requires Owner PIN.

- [ ] Write RED rendering/interaction tests for five tabs, unknown HPP copy, existing expense authority delegation, Owner event/close re-auth calls, and QRIS overpay authorization behavior.
- [ ] Run RED tests.
- [ ] Implement workspace/Qris UI, integrate with REF-01 enhancement lifecycle, and add mobile-safe styles.
- [ ] Run Task 6 tests GREEN plus P1-P3 UI regression tests.
- [ ] Commit Task 6.

### Task 7: Full Verification, Fresh Package, and Phase C Handoff

**Files:**
- Create: `P4_PHASE_C_IMPLEMENTATION_REPORT.md`
- Create: `P4_PHASE_C_UAT_AND_DEPLOYMENT_GATE.md`
- Update generated verification logs/checksum files only after fresh verification.

**Interfaces:**
- Output is a new Phase C candidate package; it does not deploy production.

- [ ] Run focused P4 Phase C tests.
- [ ] Run `npm test` and record exact test count/pass/fail.
- [ ] Run `npm run verify:ref01` and record exact verifier result.
- [ ] Run fresh source manifest/checksum verification and confirm P3 rollback SHA remains unchanged.
- [ ] Build a continuity-ready Phase C ZIP with source, docs, verification logs, and checksum manifest.
- [ ] Report remaining Android/UAT/final-hardening items and keep production deployment explicitly blocked.
