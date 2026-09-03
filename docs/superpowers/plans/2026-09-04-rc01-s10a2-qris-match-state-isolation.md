# RC01-S10A.2 Quarantined Signal Match-State Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent frozen legacy `QRIS_MATCH_STATE` transactions from touching an S10A late-quarantined signal, so the P3 Firebase write monitor can converge to zero pending writes, while preserving the S10A quarantine writer and every normal QRIS transaction path.

**Architecture:** Extend the existing early `SJRC01S10A1QrisEventShield` rather than introducing another global patch. The shield recognizes exact `segeranjiwa_qris_beta_v1/signals/{providerId}` transaction refs; when a provider is synchronously blocked or durably persisted as `LATE_AFTER_CANCEL` / `LATE_OR_NEW_AMBIGUOUS` + `REVIEW_REQUIRED` + `autoMatchBlocked=true`, unmarked signal transactions become synthetic non-committed no-ops before the P3 monitored base transaction is invoked. The dedicated S10A quarantine writer marks only its own updater function with a non-persisted in-memory property (`__sjS10AQuarantine=true`), allowing that authoritative transaction through the same shield without expanding Firebase authority.

**Tech Stack:** Vanilla browser JavaScript, Firebase RTDB compat API, Node.js `node:test`, existing REF01/RC01/S10A/S10A.1 build and verifier pipeline.

**Spec:** User-approved `RC01-S10A.2 — Quarantined Signal Match-State Isolation`, continuing from tested Cloudflare Preview commit `7270fe8`.

## Global Constraints

- Frozen `baseline/legacy-v1.0.40.html` remains SHA256 `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- No Firebase Rules, RTDB root, schema-global, package-ID, production, or `main` changes.
- Existing mutation allowlist remains exact 4/4; no fifth writer.
- S10A quarantine writer remains the only new authority allowed to persist late fields on `signals/{providerId}`.
- Frozen legacy `QRIS_MATCH_STATE` for quarantined providers becomes controlled no-op before entering the P3 monitored base transaction.
- Normal QRIS providers remain completely eligible for legacy `MATCHED`, `AMBIGUOUS`, `UNMATCHED`, `CONFIRMED`, and finalization behavior.
- Existing S10A.1 event/toast suppression remains intact.
- Production promotion stays HOLD until targeted Preview UAT proves the red Firebase banner clears and normal QRIS remains healthy.

---

### Task 1: RED regression for signal match-state isolation

**Files:**
- Modify: `tests/rc01-s10a1-qris-event-sync-shield.test.mjs`
- Modify: `tests/rc01-s10a-qris-writer.test.mjs`
- Modify: `tests/rc01-s10a-qris-compat-contract.test.mjs`

**Interfaces:**
- Consumes: `window.SJRC01S10A1QrisEventShield.markBlocked(providerId, amount)` and Firebase Reference prototype transaction wrapper.
- Produces: executable contract that a blocked/durable signal provider bypasses legacy signal transactions but an updater tagged `__sjS10AQuarantine=true` still reaches the base transaction.

- [ ] **Step 1: Add a failing shield test**: mark `P1` blocked, call `db.ref('segeranjiwa_qris_beta_v1/signals/P1').transaction(legacyUpdate)`, and require `committed=false` with zero underlying transaction calls.
- [ ] **Step 2: Add a failing durable-refresh variant**: with no in-memory marker but a persisted late-review row in the fake `signals` store, require the same signal transaction to be suppressed before the underlying transaction.
- [ ] **Step 3: Add an authority escape regression**: tag an updater function with `__sjS10AQuarantine=true`; even for blocked `P1`, require exactly one underlying signal transaction and a committed result.
- [ ] **Step 4: Add normal-provider regression**: an unblocked signal transaction must still call the underlying base transaction exactly once.
- [ ] **Step 5: Extend the S10A writer test** so the fake `transaction(updateFn)` asserts the updater used by `quarantineLateSignal()` carries `__sjS10AQuarantine===true` before applying it.
- [ ] **Step 6: Extend the compat/build contract** to require the S10A.2 signal-isolation API/token without any additional build injection.
- [ ] **Step 7: Run targeted tests** and verify RED for missing signal isolation / missing authoritative updater marker, not for syntax or harness errors.

### Task 2: GREEN signal isolation in the existing early shield

**Files:**
- Modify: `src/compat/rc01-qris-event-sync-shield.js`
- Modify: `src/data/writers/qris-deferred-settlement-writer.js`

**Interfaces:**
- Produces in shield: exact signal-ref parser, `signalIsolationState(providerId)` diagnostic state, and transaction branch that suppresses blocked/durable unmarked signal transactions.
- Produces in writer: quarantine updater function marked only in memory with `__sjS10AQuarantine=true`; no persisted marker field.

- [ ] **Step 1: Add exact signal-ref parsing** accepting only `segeranjiwa_qris_beta_v1/signals/{safeProviderId}` and rejecting deeper/ambiguous paths.
- [ ] **Step 2: In the existing transaction wrapper**, handle event refs exactly as S10A.1 does; for signal refs, allow an updater with `__sjS10AQuarantine===true`, otherwise suppress when `isBlocked(providerId)` or `durableLate(providerId)` is true; unblocked providers delegate to `baseTransaction.apply` unchanged.
- [ ] **Step 3: Expose read-only `signalIsolationState(providerId)`** returning `BLOCKED` or `NORMAL` for diagnostics/tests; do not add a Firebase mutation.
- [ ] **Step 4: Refactor `quarantineLateSignal()` to name its updater function, mark that function `__sjS10AQuarantine=true` via `Object.defineProperty`, and pass it to the existing `transaction()` call.
- [ ] **Step 5: Run targeted tests** and verify GREEN.

### Task 3: S10A.2 release verifier, full regression, artifact and targeted UAT

**Files:**
- Create: `scripts/verify-rc01-s10a2.mjs`
- Modify: `package.json`
- Create: `docs/RC01_S10A2_IMPLEMENTATION_REPORT.md`
- Create: `docs/RC01_S10A2_REAL_DEVICE_UAT.md`

**Interfaces:**
- Produces: `npm run verify:rc01:s10a2` chaining S10A.1 and S10A.2 verifier.
- Preserves: mutation allowlist 4/4, roots, frozen baseline, payment authority, S10A.1 event suppression.

- [ ] **Step 1: Add verifier** requiring signal ref isolation tokens, the explicit `__sjS10AQuarantine` updater marker, no second/new shield file, unchanged 4/4 mutation allowlist, fixed roots, and frozen baseline hash.
- [ ] **Step 2: Add package script** `verify:rc01:s10a2 = npm run verify:rc01:s10a1 && node scripts/verify-rc01-s10a2.mjs`.
- [ ] **Step 3: Run fresh full gate** `npm run verify:rc01:s10a2`; require all tests PASS and zero failures.
- [ ] **Step 4: Build RC01 and record runtime SHA256**; require `dist-ref01/index.html` and `dist-rc01/index.html` to be identical.
- [ ] **Step 5: Run completion audit**: `git diff --check`, frozen baseline SHA256, writer allowlist exact 4/4, and no Firebase Rules/root/package-ID drift.
- [ ] **Step 6: Write targeted UAT**: open S10A.2 Preview; late Rp5.000 card survives; no legacy toast; no new `QRIS_EVENT_CREATE`; no new `QRIS_MATCH_STATE`; Firebase banner clears after reload/convergence; then one normal QRIS pending/cancel or safe signal test proves normal provider paths are not shielded.
- [ ] **Step 7: Commit locally and create deterministic source ZIP + GitHub WebUpload Gate package rooted on tested Preview authority `7270fe8`; stop before remote push/Cloudflare mutation.
