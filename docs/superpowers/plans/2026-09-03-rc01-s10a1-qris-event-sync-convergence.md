# RC01-S10A.1 QRIS Late Event & Sync Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop S10A late-quarantine QRIS signals from re-entering the legacy QRIS event/toast path and prevent denied best-effort QRIS event writes from keeping Firebase sync in a pending/error loop, without changing Firebase Rules or payment authority.

**Architecture:** Add one early classic compatibility shield before the frozen legacy `SJQrisSignalBeta` script. It wraps only the QRIS `events/*` transaction path: S10A-blocked providers are suppressed before any write; ordinary event writes still attempt persistence, but a `permission_denied` response degrades the non-authoritative event channel for the current page session so later event writes become controlled no-ops. The existing S10A compat marks late providers synchronously during conflict classification and suppresses only the immediate legacy unmatched toast for that late amount.

**Tech Stack:** Vanilla browser JavaScript, Firebase RTDB compat API, Node.js `node:test`, existing REF01/RC01 build/verifier pipeline.

**Spec:** Approved bounded follow-up in conversation: `RC01-S10A.1 — QRIS Late Event & Sync Convergence` from Preview commit `6203a8c` behavior.

## Global Constraints

- Frozen `baseline/legacy-v1.0.40.html` must remain SHA256 `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- No Firebase Rules/root/schema-global change.
- No new payment/inventory/finance writer authority; mutation allowlist remains exact 4/4.
- `signals/*` and `pending/*` payment authority remain unchanged.
- QRIS `events/*` is notification-only/best-effort; denied persistence must not block payment or global sync health.
- S10A late statuses remain `LATE_AFTER_CANCEL` and `LATE_OR_NEW_AMBIGUOUS`, `resolutionState=REVIEW_REQUIRED`, `autoMatchBlocked=true`.
- Production/main/Cloudflare Production remain untouched until Preview + targeted UAT pass.

---

### Task 1: RED regression for late-event suppression and denied-event degradation

**Files:**
- Create: `tests/rc01-s10a1-qris-event-sync-shield.test.mjs`
- Modify: `tests/rc01-s10a-qris-compat-contract.test.mjs`

**Interfaces:**
- Consumes: global classic-script contract (`db`, `showToast`, Firebase Reference prototype).
- Produces: executable contract for `window.SJRC01S10A1QrisEventShield` with `markBlocked(providerId, amount)`, `isBlocked(providerId)`, `eventChannelState()`.

- [ ] **Step 1: Write a VM-backed failing test** that loads `src/compat/rc01-qris-event-sync-shield.js` with a fake Firebase reference prototype and proves a persisted `LATE_AFTER_CANCEL/REVIEW_REQUIRED/autoMatchBlocked=true` provider short-circuits `events/<provider>__RECEIVED` without calling the underlying transaction.
- [ ] **Step 2: Run** `node --test tests/rc01-s10a1-qris-event-sync-shield.test.mjs` and verify RED because the shield file/API does not exist.
- [ ] **Step 3: Extend the same test** so a normal QRIS event calls the underlying transaction once, a `permission_denied` rejection resolves as controlled non-authoritative degradation, and the next event write is suppressed without a second underlying write.
- [ ] **Step 4: Add toast regression** proving `markBlocked('P1',5000)` suppresses the immediate legacy `QRIS Rp5.000 masuk dan belum cocok...` toast while unrelated toast text still passes through.
- [ ] **Step 5: Add build-order RED contract** requiring the early shield script to appear before the frozen legacy QRIS Beta marker, while existing REF01 classic compat and S10A compat remain ordered before module entry.

### Task 2: GREEN early event shield + S10A handoff

**Files:**
- Create: `src/compat/rc01-qris-event-sync-shield.js`
- Modify: `src/compat/rc01-qris-deferred-settlement-compat.js`
- Modify: `scripts/build-ref01.mjs`

**Interfaces:**
- Produces: `window.SJRC01S10A1QrisEventShield` with `markBlocked`, `isBlocked`, `eventChannelState`.
- Consumes: `db.ref(...)` read API and current Reference prototype; does not create direct payment writes.

- [ ] **Step 1: Implement the minimum shield**: parse only `segeranjiwa_qris_beta_v1/events/<provider>__<suffix>` references; read `signals/<provider>` before a late-provider event write when not already cached; suppress only when late quarantine is durable or the provider was synchronously marked.
- [ ] **Step 2: Implement best-effort event degradation**: ordinary event writes call the existing transaction; only `permission_denied` switches the event channel to session-local `DENIED_DEGRADED` and resolves a synthetic non-committed transaction result. Non-permission errors still reject.
- [ ] **Step 3: Patch only the immediate late unmatched toast**: the shield wraps `showToast`, with a short-lived amount marker set by `markBlocked(providerId, amount)`; no global suppression of normal QRIS warnings.
- [ ] **Step 4: In `queueLate()` call `markBlocked(providerTransactionId, amount)` synchronously before the legacy evaluator resumes.
- [ ] **Step 5: Inject the shield before the frozen QRIS Beta `<script>` in `build-ref01.mjs`, without modifying the baseline file; keep existing end-of-body REF01/S10A/module injection unchanged.
- [ ] **Step 6: Run** `node --test tests/rc01-s10a1-qris-event-sync-shield.test.mjs tests/rc01-s10a-qris-compat-contract.test.mjs` and verify GREEN.

### Task 3: Release verifier, full regression, and correction-pack evidence

**Files:**
- Create: `scripts/verify-rc01-s10a1.mjs`
- Modify: `package.json`
- Create: `docs/RC01_S10A1_IMPLEMENTATION_REPORT.md`
- Create: `docs/RC01_S10A1_REAL_DEVICE_UAT.md`

**Interfaces:**
- Produces: `npm run verify:rc01:s10a1`.
- Preserves: S10A writer allowlist 4/4, fixed roots, frozen baseline hash.

- [ ] **Step 1: Add verifier** requiring the early shield file, early build order, late-only pre-write suppression tokens, permission-denied degradation token, unchanged 4/4 writer allowlist, fixed roots, and baseline hash.
- [ ] **Step 2: Add package script** `verify:rc01:s10a1 = npm run verify:rc01:s10a && node scripts/verify-rc01-s10a1.mjs`.
- [ ] **Step 3: Run fresh full gate** `npm run verify:rc01:s10a1`; expected test total is previous 459 plus the new S10A.1 regression tests, 0 fail.
- [ ] **Step 4: Build RC01 and record new runtime SHA256**; verify `dist-ref01/index.html` and `dist-rc01/index.html` match.
- [ ] **Step 5: Verify** `git diff --check`, baseline SHA256, mutation allowlist exact 4/4, and no Firebase Rules/root/package-ID changes.
- [ ] **Step 6: Write targeted UAT**: refresh with durable Rp5.000 late card; no legacy unmatched toast; no new `QRIS_EVENT_CREATE permission_denied`; sync banner clears; late card survives; normal QRIS still creates/matches/finalizes normally.
- [ ] **Step 7: Commit locally and create a deterministic source ZIP + GitHub-web-upload gate package; stop before remote push.
