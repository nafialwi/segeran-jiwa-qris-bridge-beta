# RC01-S10A QRIS Deferred Settlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden QRIS delayed-settlement handling so a cashier can park a paid-but-unconfirmed QRIS sale, serve non-QRIS customers, later restore/finalize the exact original sale, and quarantine late signals after true cancellation so they cannot auto-match to newer QRIS pending rows.

**Architecture:** Keep frozen `SJQrisSignalBeta` as the normal matching/finalization authority. Add one narrow S10A policy module, one dedicated RTDB writer under the existing QRIS root, one bootstrap runtime, and one classic compatibility layer that can access legacy lexical cart/pricing state without editing the frozen baseline. The compatibility layer parks without changing `WAITING_QRIS`, blocks a second QRIS while parked, restores the immutable snapshot under a temporary forced pricing context, and wraps `SJQrisSignalCore.matchSignal` only to fail closed on cancelled-pending conflicts.

**Tech Stack:** Vanilla JavaScript ES modules + classic browser script, Firebase RTDB existing client, Node `node:test`, existing build/verifier scripts.

**Spec:** `docs/superpowers/specs/2026-09-03-rc01-s10a-qris-deferred-settlement-design.md`

## Global Constraints

- Frozen baseline SHA256 remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- P5 locked source authority remains `485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530`.
- Production v2.9 remains LIVE / UNTOUCHED.
- POS root remains `toko_segeranjiwa_v58`; QRIS root remains `segeranjiwa_qris_beta_v1`.
- No Firebase Rules, package-ID, historical HPP, or new-root change.
- The only new modular mutation authority is `src/data/writers/qris-deferred-settlement-writer.js`; allowlist becomes exactly 4 writers.
- `SJQrisSignalBeta.confirmMatched()` + existing `processTransaction()` remain the only normal sale finalization authority.
- AppMint/WebView remains DEFERRED / N-A under CR-01-DIST-01.

---

### Task 1: S10A policy and dedicated writer

**Files:**
- Create: `src/domain/qris-deferred-settlement-policy.js`
- Create: `src/data/writers/qris-deferred-settlement-writer.js`
- Create: `tests/rc01-s10a-qris-deferred-writer.test.mjs`
- Create: `tests/rc01-s10a-qris-late-policy.test.mjs`

**Interfaces:**
- Policy produces `normalizeSaleSnapshot(input)`, `snapshotIdentity(snapshot)`, `classifyLateSignalConflict(signal,pendingRows,nowMs,windowMs)`, `isUnresolvedParkedPending(row)`.
- Writer produces `attachSnapshotAndPark(...)` and `quarantineLateSignal(...)` and exposes `QRIS_DEFERRED_SETTLEMENT_WRITER_CONTRACT`.

- [x] **Step 1: Write failing policy/writer tests** for immutable/idempotent snapshot attach, parked status preservation, conflicting snapshot rejection, late-after-cancel, same-amount ambiguity, and quarantine idempotency.
- [x] **Step 2: Run targeted tests and verify RED** because the S10A modules do not exist yet.
- [x] **Step 3: Implement pure policy** with the legacy 15-minute match window and 2-minute clock-skew semantics, safe snapshot normalization, and no historical reconstruction.
- [x] **Step 4: Implement dedicated writer** using only RTDB `transaction` on existing `pending/{id}` / `signals/{providerId}` rows and only approved additive fields.
- [x] **Step 5: Run targeted tests and verify GREEN.**

### Task 2: Runtime bootstrap and read-only parked-pending discovery

**Files:**
- Create: `src/app/qris-deferred-settlement-bootstrap.js`
- Create: `tests/rc01-s10a-qris-runtime.test.mjs`
- Modify: `src/ref01-entry.js`

**Interfaces:**
- Runtime exposes immutable `writer`, `policy`, `readPending(id)`, `readPendingRows()`, `findOwnedUnresolvedParked(cashierId)`, and fixed roots.
- Runtime obtains DB only from the already-installed P4 runtime unless explicitly injected in tests.

- [x] **Step 1: Write failing runtime tests** for one-time installation, P4 DB reuse, exact root exposure, and owned parked filtering.
- [x] **Step 2: Run runtime test and verify RED.**
- [x] **Step 3: Implement bootstrap** without initializing Firebase or adding writes outside the writer.
- [x] **Step 4: Install runtime in `src/ref01-entry.js` after P4 and before final RC enhancements.**
- [x] **Step 5: Run runtime tests and verify GREEN.**

### Task 3: Classic legacy compatibility layer — Park, Guard, Restore, Late Quarantine

**Files:**
- Create: `src/compat/rc01-qris-deferred-settlement-compat.js`
- Create: `tests/rc01-s10a-qris-compat-contract.test.mjs`
- Modify: `scripts/build-ref01.mjs`

**Interfaces:**
- Classic layer uses legacy lexical `cart`, `payMethod`, `currentLoginId`, `currentUserName`, `activeDate`, `SJPrice`, `SJQrisSignalBeta`, `SJQrisSignalCore`, `SJCommercialFinalV5961`.
- It delegates all persistence to `__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME.writer`.
- It exposes `window.SJQrisDeferredSettlementS10A` only as a narrow UI/recovery API.

- [x] **Step 1: Write failing compatibility/build contract tests** proving classic injection order, no direct Firebase mutation, Park/Restore labels, second-QRIS guard, forced pricing wrapper, and `SJQrisSignalBeta.confirmMatched()` delegation.
- [x] **Step 2: Run compatibility tests and verify RED.**
- [x] **Step 3: Implement snapshot capture** from live cart + `SJPrice.quote/fingerprint`, excluding images/base64 while preserving inventory/recipe identity metadata needed by the existing transaction engine.
- [x] **Step 4: Implement Park flow**: attach immutable snapshot + metadata, prove persisted result, clear live cart, `SJPrice.resetSession()`, reset payment UI, and preserve pending `WAITING_QRIS`.
- [x] **Step 5: Implement synchronous second-QRIS guard** around the final `SJCommercialFinalV5961.openPayment` chain while allowing Tunai/Transfer/Kasbon.
- [x] **Step 6: Implement parked badge/recovery modal**; recovery requires empty live cart, restores snapshot rows, installs exact forced `SJPrice.quote/fingerprint` context, verifies pending fingerprint, delegates to `SJQrisSignalBeta.confirmMatched()`, and clears forced context in `finally`.
- [x] **Step 7: Wrap `SJQrisSignalCore.matchSignal`** so any plausible cancelled same-amount candidate forces fail-closed `UNMATCHED` with S10A conflict metadata; asynchronously quarantine via the dedicated writer; late statuses become ineligible to legacy auto-matching.
- [x] **Step 8: Run compatibility tests and verify GREEN.**

### Task 4: Mutation policy, verifier, and S10A release contract

**Files:**
- Modify: `scripts/sc04-mutation-policy.mjs`
- Modify: `scripts/verify-rc01.mjs`
- Create: `scripts/verify-rc01-s10a.mjs`
- Modify: `tests/v33-p4-phase-c-sc04-writer-contract.test.mjs`
- Modify: `tests/rc01-release-contract.test.mjs`
- Create: `tests/rc01-s10a-release-contract.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Mutation allowlist is exactly the prior three writers plus `qris-deferred-settlement-writer.js`.
- `npm run verify:rc01:s10a` runs the full RC gate then the S10A-specific verifier.

- [x] **Step 1: Update tests first** so they require exact 4-writer authority and S10A contract tokens.
- [x] **Step 2: Run targeted contract tests and verify RED.**
- [x] **Step 3: Add S10A writer validation** to mutation policy: only `transaction`; only `qrisPath('pending',...)` / `qrisPath('signals',...)`; no direct POS root/literal db paths/remove.
- [x] **Step 4: Update RC verifier** to exact 4/4 and require S10A bootstrap/compat/writer contracts.
- [x] **Step 5: Add dedicated S10A verifier** for baseline hash, fixed roots, classic injection order, no direct compat writes, exact new writer, quarantine statuses, snapshot/park/recovery tokens, and no forbidden root/package/rules changes.
- [x] **Step 6: Add `verify:rc01:s10a` package command and run targeted contract tests GREEN.**

### Task 5: Full verification, artifact, and handoff

**Files:**
- Create: `docs/RC01_S10A_IMPLEMENTATION_REPORT.md`
- Create: `docs/RC01_S10A_REAL_DEVICE_UAT.md`
- Generated package outside source tree: `SEGERAN_JIWA_POS_v3.4_RC01_S10A_QRIS_HARDENING_LOCAL_SOURCE.zip`

- [x] **Step 1: Run all new targeted S10A tests.**
- [x] **Step 2: Run fresh `npm run verify:rc01:s10a`; require zero failures.**
- [x] **Step 3: Re-hash frozen baseline and confirm fixed roots/package identity and exact mutation allowlist.**
- [x] **Step 4: Build `dist-ref01` and `dist-rc01`; record new runtime SHA256 and file count.**
- [x] **Step 5: Write implementation report and targeted real-device scenarios A-D from the approved spec.**
- [ ] **Step 6: Commit the isolated S10A branch locally and create deterministic source ZIP + SHA256.**
- [ ] **Step 7: STOP before GitHub/Cloudflare mutation. Return F/A/V/R/W status and give the exact user action needed for external preview deployment.**
