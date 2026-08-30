# SC-04 Persistent Session + Source Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist valid POS sessions across browser/app close-reopen without storing credentials, restore the existing active shift without duplicating it, and produce a reproducible modular source checkpoint ready to bind to GitHub/Cloudflare.

**Architecture:** SC-04 adds one Session Manager above the proven legacy auth/login completion authority. HYBRID/SECURE restore requires the Firebase Auth persisted user plus server user/auth/device validation; LEGACY restore is allowed only online after server user/device validation. A safe local envelope is isolated behind `src/data/local-store.js`; it is a non-authoritative hint and never contains PIN/password. Session restoration delegates to the captured legacy `SJSecureRulesCompat.completeLogin` so existing `SJShift.resolveLoginSelection()` remains the only shift-selection authority and no shift is started by SC-04.

**Tech Stack:** Browser ES modules, Firebase Auth compat 10.8.1 already loaded by legacy runtime, Firebase Realtime Database read-only validation, Node 20 built-in test runner, Git.

**Spec:** `blueprint_authority/docs/07_EXACT_PROMPTS_COPY_PASTE.md` PROMPT 4 + `docs/SC03_HANDOFF_TO_SC04.md`

## Global Constraints

- Frozen rollback `baseline/legacy-v1.0.40.html` and `dist/index.html` SHA256 must remain `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- POS root remains `toko_segeranjiwa_v58`; QRIS root remains `segeranjiwa_qris_beta_v1`.
- No PIN/password plaintext or derived Firebase password may be stored in the SC-04 session envelope.
- No new RTDB mutation owner, no Firebase Rules/schema change, no billing.
- Session restore must never call shift start/create; existing `completeLogin()` + `SJShift.resolveLoginSelection()` remains authority.
- Revoked device, disabled/missing user, invalid role, UID/auth mapping mismatch fail closed and invalidate the local envelope.
- Cold-start offline does not auto-login because revocation/disable state cannot be revalidated safely.
- REF-01 visual redesign is out of scope.

---

### Task 1: Safe session envelope and local-store boundary

**Files:**
- Modify: `src/data/local-store.js`
- Modify: `src/core/session-manager.js`
- Test: `tests/sc04-session-manager.test.mjs`

**Interfaces:**
- Produces: `createJsonStore({storage,key})`
- Produces: `createSessionManager({store,auth,repository,legacy,readDeviceId,readOnline,readShiftHint,now,maxAgeMs})`
- Produces manager methods: `prepareAuth()`, `saveAfterLogin()`, `restore()`, `invalidate()`, `snapshot()`

- [ ] Write failing tests for safe-envelope serialization, valid SECURE/HYBRID/LEGACY restore, offline fail-closed policy, expiry, revoked/disabled/invalid-role invalidation, and zero shift-start behavior.
- [ ] Run focused tests and confirm RED for missing SC-04 APIs.
- [ ] Implement minimal local store + session manager.
- [ ] Run focused tests and confirm GREEN.

### Task 2: Firebase Auth persistence and read-only session validation repositories

**Files:**
- Create: `src/data/firebase-auth-session.js`
- Modify: `src/data/repositories/user-repository.js`
- Test: `tests/sc04-session-data.test.mjs`

**Interfaces:**
- Produces: `createFirebaseAuthSession({runtime})` with `ensureLocalPersistence()`, `currentUser()`, `waitForInitialUser()`, `signOut()`.
- Produces: `createUserRepository({db})` with `readUser(username)`, `readAuthUser(uid)`, `readDevice(deviceId)`, `readAuthMode()`.

- [ ] Write failing path/persistence tests.
- [ ] Verify RED.
- [ ] Implement read-only adapters using fixed POS root.
- [ ] Verify GREEN and no RTDB mutation primitives.

### Task 3: Runtime cutover around final legacy auth authority

**Files:**
- Create: `src/app/sc04-bootstrap.js`
- Create: `src/sc04-entry.js`
- Modify: `src/modules/settings/security-sync.js`
- Test: `tests/sc04-runtime.test.mjs`

**Interfaces:**
- Captures: `SJSecureRulesCompat.login`, `.completeLogin`, `.logout` through the existing SC-03 command registry.
- Produces: `installSc04Runtime(runtime, {sc03})`.
- Manual login wrapper waits for Auth LOCAL persistence.
- `completeLogin` wrapper refreshes the safe session envelope only after legacy login succeeds.
- Logout wrapper invalidates envelope then invokes existing logout/signOut/reload authority.
- Startup calls `restore()` once; it does not start a shift.

- [ ] Write failing runtime wrapper tests.
- [ ] Verify RED.
- [ ] Implement minimal cutover.
- [ ] Verify GREEN and keep all SC-03 caller/menu/role tests green.

### Task 4: SC-04 candidate build, verifier, UAT/release docs

**Files:**
- Create: `scripts/build-sc04.mjs`
- Create: `scripts/verify-sc04.mjs`
- Modify: `package.json`
- Create: `tests/sc04-build-integrity.test.mjs`
- Create: `docs/SC04_SESSION_POLICY.md`
- Create: `docs/SC04_UAT_CHECKLIST.md`
- Create: `docs/SC04_IMPLEMENTATION_REPORT.md`
- Create: `docs/SC04_HANDOFF_TO_REF01.md`
- Create: `docs/SC04_SOURCE_WORKFLOW.md`

**Interfaces:**
- Produces: `dist-sc04/index.html` with exactly one `src/sc04-entry.js` module entry.
- Produces: `npm run verify:sc04`.

- [ ] Write failing build/verifier tests.
- [ ] Verify RED.
- [ ] Implement build/verifier/package scripts and docs.
- [ ] Run `npm run verify:sc04` and confirm all historical + SC-04 gates green.

### Task 5: Reproducible local Git source checkpoint and release package

**Files:**
- Create/update: `.gitignore`
- Create: `SC04_PROJECT_SHA256.txt`
- Create: `docs/SC04_RELEASE_MANIFEST.md`
- Generate final ZIP/checksum outside project tree.

**Interfaces:**
- Git source tree excludes generated verification extraction/release artifacts as appropriate.
- Remote GitHub binding is performed only when an actual repository URL/connector is available; no credentials are requested or stored.
- Cloudflare preview is configured only after GitHub source authority exists and project/domain access is available.

- [ ] Initialize/verify local Git repository and record clean source checkpoint.
- [ ] Fresh full verification.
- [ ] Generate deterministic file manifest + release ZIP.
- [ ] Extract ZIP fresh, verify manifest, then run `npm run verify:sc04` from extracted package.
- [ ] Report any remaining external binding action (GitHub URL / Cloudflare project) without changing billing or rules.
