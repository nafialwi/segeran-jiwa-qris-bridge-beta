# EMG-D1-P1 Foundation + Emergency Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan Cloudflare D1 standby backend yang dapat menjalankan operasi inti Segeran Jiwa saat Firebase unavailable tanpa mengubah Firebase normal authority.

**Architecture:** Worker terpisah di workers.dev memiliki binding D1 dan secret Owner/HMAC. Client compat terpisah hanya menggunakan `fetch()` ke Worker dan menyediakan layar emergency sendiri; ia tidak mengganti `processTransaction()` normal.

**Tech Stack:** Existing static HTML/compat JS, Node 20+ test runner, Cloudflare Worker, D1, Wrangler.

**Spec:** `docs/superpowers/specs/2026-09-07-emg-d1-p1-design.md`

## Global Constraints
- Firebase tetap default dan tidak ada auto-failover.
- QRIS emergency manual-only; automatic QRIS bridge/polling tetap OFF.
- Frozen QRIS/manual/ref01 authority tidak boleh berubah.
- Secret tidak boleh masuk Git.
- P1 tidak melakukan reconciliation ke Firebase.
- Semua business write D1 harus idempotent via operationId.

---

### Task 1: D1 data model and pure emergency domain rules
**Files:** Create `emergency-d1/schema.sql`, `emergency-d1/src/core.js`; Test `tests/emg-d1-p1-core.test.mjs`.

- [ ] Write RED presence/domain tests.
- [ ] Implement snapshot sanitization, operation ID validation, server-side sale quote, expected cash, HMAC token helpers.
- [ ] Add D1 schema for master snapshots, shifts, transactions/items, cash events, inventory balance/events, audit, auth attempts.
- [ ] Run `node --test tests/emg-d1-p1-core.test.mjs` and require all PASS.

### Task 2: Worker API + idempotency/security
**Files:** Create `emergency-d1/src/worker.js`.

- [ ] Implement strict CORS for canonical/hashed Segeran Jiwa Pages origins.
- [ ] Implement Owner auth with rate lock and 12h HMAC token.
- [ ] Implement health/master sync/get, shift open/active/close, sale, expense, summary and provisioning drill routes.
- [ ] Use D1 UNIQUE operation IDs and batch writes for sale/shift/cash/audit.
- [ ] Enforce server-side prices from active snapshot and stock non-negative guard.
- [ ] Run core/contract tests.

### Task 3: Isolated emergency client
**Files:** Create `src/compat/emg-d1-p1-emergency.js`, generated `src/compat/emg-d1-p1-config.js`; Modify `scripts/build-ref01.mjs`.

- [ ] Add launcher on login and Owner management without overriding normal process transaction.
- [ ] Add authenticated Status / POS / Shift / Expense emergency overlay.
- [ ] Snapshot current cached master data only on explicit Owner action.
- [ ] Add Tunai/Transfer/Manual QRIS sale flow, D1 shift open/close and expense.
- [ ] Inject config/runtime after existing frozen REF01 authority tail.
- [ ] Verify no Firebase SDK reads/writes appear in emergency client.

### Task 4: Cloudflare provisioning
**Files:** Create `scripts/emg-d1-p1-provision.sh`; Generate `emergency-d1/wrangler.toml`.

- [ ] Verify/login Wrangler.
- [ ] Reuse or create D1 in APAC and apply schema local + remote.
- [ ] Generate Owner key and signing key outside repo.
- [ ] Deploy Worker with D1 binding and secret file.
- [ ] Capture workers.dev URL and generate client config.
- [ ] Run remote health, auth, authenticated D1 drill.
- [ ] Print Owner key and private backup path; never stage secret file.

### Task 5: Regression/frozen authority gate and Preview branch
**Files:** Tests `tests/emg-d1-p1-presence.test.mjs`, `tests/emg-d1-p1-contract.test.mjs`.

- [ ] Run targeted P1 tests.
- [ ] Run `npm run verify`.
- [ ] Run `npm run verify:ref01`.
- [ ] Run `npm run verify:rc01:s10c-r6d`.
- [ ] Run `git diff --check` and exact scope/frozen authority checks.
- [ ] Commit `feat: add D1 emergency standby operations`.
- [ ] Push branch `emg-d1-p1-foundation` for Cloudflare Preview.

### Task 6: Preview UAT gate
- [ ] Open hashed Cloudflare Preview.
- [ ] Owner auth D1 and update master snapshot while Firebase normal.
- [ ] Activate emergency overlay in Preview/drill mode.
- [ ] Open D1 drill shift, make Tunai, Transfer, QRIS-manual transactions, record expense, close shift.
- [ ] Confirm normal POS remains Firebase default after emergency overlay closes.
- [ ] Do not merge to Production until P1 Preview PASS.

### R2 Correction Task: Cache-first Owner Beranda + REF01 freshness

**Files:**
- Create: `src/compat/emg-d1-p1-dashboard-fast.js`
- Modify: `scripts/build-ref01.mjs`
- Test: `tests/emg-d1-p1-dashboard-fast.test.mjs`

**Required behavior:** Owner Beranda renders immediately from `cloudData`; exact current-day and previous-day reads occur only after render and are TTL/deduplicated. Force `build:ref01` before the legacy Cup-01B test and before final verification. Preserve Product Cup UI entry and frozen R6/REF01 tail order.
