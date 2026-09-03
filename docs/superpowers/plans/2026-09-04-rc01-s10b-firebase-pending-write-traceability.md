# RC01-S10B Firebase Pending-Write Traceability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Identify the exact Firebase write method/path/age responsible for `SJProductionArchitectureP3.pendingWrites > 0` without changing transaction outcomes, Firebase authority, or production behavior.

**Architecture:** Add one early compatibility tracer that wraps Firebase RTDB `set/update/remove/transaction` before P3 installs its existing pending-write monitor. The tracer is observational only: it records active calls in memory, exposes a read-only snapshot API, adds a local-only stuck warning after 15 seconds, and decorates the existing Diagnostics screen. Existing P3 wrappers, S10A QRIS shields, business writers, and Firebase Rules remain authoritative and unchanged.

**Tech Stack:** Browser classic JavaScript, Firebase Realtime Database v8-style refs, Node `node:test`, `vm`, existing RC01 build/verifier scripts.

**Spec:** User-approved `RC01-S10B — Firebase Pending-Write Traceability`, continuing from S10A.2 source authority corresponding to Preview commit prefix `12c8ef4`.

## Global Constraints

- Source authority starts from local S10A.2 commit `7668ba681eab1c4438e3052a1ac37eeb2ab4a04c`, whose tree is the verified source payload deployed as Preview `12c8ef4`.
- Frozen `baseline/legacy-v1.0.40.html` must remain byte-identical with SHA256 `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- No Firebase Rules change, new RTDB root/path, package-ID change, writer-authority expansion, or transaction-result mutation.
- Mutation allowlist must remain exact `4/4`.
- S10B may write only to local browser diagnostics (`localStorage` via existing `sjSaveError`) and in-memory trace state; it must perform zero Firebase writes of its own.
- A stuck write warning is informational only and must fire at most once per traced write after age `>= 15000 ms`.
- Production `main` and Cloudflare Production remain untouched.

---

### Task 1: Pending-write lifecycle tracer

**Files:**
- Create: `src/compat/rc01-firebase-pending-write-trace.js`
- Create: `tests/rc01-s10b-pending-write-trace.test.mjs`

**Interfaces:**
- Produces global `window.SJRC01S10BPendingWriteTrace`.
- API: `activeWrites(nowTs?) -> Array`, `snapshot(nowTs?) -> Object`, `scanStuck(nowTs?) -> Array`, `retryInstall() -> boolean`.
- Each active row contains `id`, `method`, `path`, `startedAt`, `startedTs`, `ageMs`, `stuck`.

- [ ] **Step 1: Write failing lifecycle tests**

Test a hanging `update()` and assert the trace API reports method `update`, the normalized RTDB path, and one active row while the underlying promise is unresolved. Test successful and rejected writes disappear from active state and errors propagate unchanged. Test normal return/non-Promise calls do not remain active.

- [ ] **Step 2: Run RED test**

Run:
```bash
node --test tests/rc01-s10b-pending-write-trace.test.mjs
```
Expected: FAIL because `src/compat/rc01-firebase-pending-write-trace.js` does not exist.

- [ ] **Step 3: Implement minimal observational wrapper**

Wrap the Firebase Ref prototype methods without setting `__sjp3` and without changing arguments or outcomes. Record before delegation; settle the trace in success, rejection, synchronous throw, or non-Promise completion. Normalize ref URLs to RTDB path-only strings and cap displayed path length.

- [ ] **Step 4: Verify GREEN lifecycle tests**

Run the targeted test and require all lifecycle cases PASS.

---

### Task 2: Stuck warning and Diagnostics surface

**Files:**
- Modify: `src/compat/rc01-firebase-pending-write-trace.js`
- Modify: `tests/rc01-s10b-pending-write-trace.test.mjs`

**Interfaces:**
- `snapshot()` reads but never mutates `SJProductionArchitectureP3.pendingWrites` and `serverConnected` when available.
- Diagnostics box id: `sj-s10b-sync-trace`.
- Local warning action: `SYNC_WRITE_STUCK`, code `SYNC_WRITE_STUCK`.

- [ ] **Step 1: Add failing stuck-warning tests**

Advance a hanging trace beyond 15 seconds using explicit `scanStuck(nowTs)`. Assert exactly one `sjSaveError('SYNC_WRITE_STUCK', ...)` call per trace even across repeated scans.

- [ ] **Step 2: Add failing diagnostics tests**

Provide a minimal DOM and P3 state. Invoke wrapped `sjRenderDiagnostics()` and assert the generated box shows `Pending 1`, `Traced 1`, method/path, and age. Add a mismatch case where P3 reports more pending writes than the tracer and assert `Untraced` is visible.

- [ ] **Step 3: Implement minimal diagnostics augmentation**

Wrap the already-existing `sjRenderDiagnostics`, insert/update one box immediately before `#sj-error-list`, and poll only for display/age plus one-time local stuck warnings. Do not call Firebase from renderer/poller.

- [ ] **Step 4: Verify GREEN targeted tests**

Require all S10B targeted tests PASS.

---

### Task 3: Early build injection, release verifier, and checkpoint artifacts

**Files:**
- Modify: `scripts/build-ref01.mjs`
- Create: `scripts/verify-rc01-s10b.mjs`
- Modify: `package.json`
- Create: `tests/rc01-s10b-release-contract.test.mjs`
- Create: `docs/RC01_S10B_IMPLEMENTATION_REPORT.md`
- Create: `docs/RC01_S10B_REAL_DEVICE_UAT.md`

**Interfaces:**
- Build marker: script tag with `data-sj-rc01-s10b-pending-write-trace="true"`.
- Injection must occur immediately before the classic script containing `const SJProductionArchitectureP3={` so the tracer wraps raw Firebase methods before `patchWrites()`.
- NPM command: `verify:rc01:s10b`.

- [ ] **Step 1: Write failing release-contract test**

Assert the new build marker exists before the P3 script/marker, frozen baseline hash remains unchanged, mutation allowlist remains 4/4, no Firebase Rules files are modified, and the tracer contains no `db.ref(...).set/update/remove/transaction` calls of its own.

- [ ] **Step 2: Run RED contract test**

Require failure because build injection/verifier are not present yet.

- [ ] **Step 3: Implement build injection and verifier**

Add an early P3 injection helper to `build-ref01.mjs`. Add `verify-rc01-s10b.mjs` to verify baseline, marker order, tracer contracts, mutation authority 4/4, and all prior verifier contracts. Add package command.

- [ ] **Step 4: Run full verification**

Run:
```bash
npm run verify:rc01:s10b
```
Require all tests PASS, RC/S10A/S10A.1/S10A.2/S10B verifiers PASS, mutation allowlist 4/4, and build success.

- [ ] **Step 5: Write UAT/report and package only after fresh verification**

UAT requires no new QRIS payment initially: open Preview, wait for red banner, open Diagnostics, capture `P3 Pending`, traced active method/path/age, and any `Untraced` mismatch. Do not fix the discovered writer within S10B; S10B ends once the exact cause is observable.
