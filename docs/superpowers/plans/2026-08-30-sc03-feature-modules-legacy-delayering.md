# SC-03 Feature Modules + Legacy De-layering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all visible feature entry/caller routing behind modular app/feature boundaries while preserving v1.0.40 business writers, final current legacy renderer behavior, fixed Firebase/QRIS roots, and rollback compatibility.

**Architecture:** Use a single SC-03 legacy command registry to capture the final already-installed v1.0.40 caller authorities after all legacy inline scripts have executed. App Router + role guard own parent/child navigation state, while feature modules call only the registry/router or existing SC-02 Domain/Data adapters. SC-03 never creates a Firebase writer and never rewrites QRIS, transaction commit, inventory, WAC, debt, shift, refund/VOID, or report semantics.

**Tech Stack:** Browser ES modules, Node.js built-in test runner, zero external dependencies, existing v1.0.40 monolith as immutable rollback authority.

**Spec:** `HANDOFF/04_SC03_EXECUTION_CONTRACT.md` and `docs/SC02_HANDOFF_TO_SC03.md` with `blueprint_authority/docs/01_MASTER_BLUEPRINT.md`, `02_SYSTEM_MAP.md`, and `03_REFINEMENT_AUTHORITY_AND_IA.md` as authority.

## Global Constraints

- Frozen baseline SHA256 remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- POS root remains exactly `toko_segeranjiwa_v58`.
- QRIS root remains exactly `segeranjiwa_qris_beta_v1`.
- `SJQrisSignalBeta` remains the only QRIS engine; feature modules use the adapter/existing payment caller.
- `processTransaction()` remains transaction commit authority.
- No Firebase Rules/schema/root change and no direct `.set/.update/.transaction/.remove` in SC-03 source modules.
- Unknown HPP remains `null` / `Belum tersedia`, never synthesized to zero.
- Persistent login/session restore remains SC-04; no localStorage credential/session workaround.
- SC-03 performs no visual redesign; current final legacy renderers are retained beneath one modular caller path.
- Child transaction flow remains parent route `Jual`.
- Every active global caller is replaced at most once by the SC-03 bootstrap; captured legacy functions are invoked only through the registry.

---

### Task 1: Command Registry, Role Guard, Route Contract, and App State

**Files:**
- Create: `src/core/legacy-command-registry.js`
- Modify: `src/core/role-guard.js`
- Modify: `src/app/route-contract.js`
- Modify: `src/app/app-state.js`
- Test: `tests/sc03-app-boundaries.test.mjs`

**Interfaces:**
- Produces `createLegacyCommandRegistry(runtime)` with `captureFunction`, `captureMethod`, `invoke`, `installGlobal`, `installMethod`, `snapshot`.
- Produces `createRoleGuard({readRole, notify})` with owner/cashier permissions matching v1.0.40.
- Produces canonical `PRIMARY_ROUTES`, operational/report/settings child contracts and legacy view mapping.
- Produces `createAppState()` with deterministic parent/child route tracking.

- [ ] Write failing tests for single capture/override, role equivalence, route mapping, and Jual parent preservation.
- [ ] Run the focused test and confirm RED for missing SC-03 APIs.
- [ ] Implement minimal registry/guard/contracts/state.
- [ ] Run focused test and full existing regression.

### Task 2: Feature Facade Boundaries

**Files:**
- Create: `src/modules/legacy-feature.js`
- Modify: all SC-03 feature files under `src/modules/dashboard`, `sales`, `payments`, `operational`, `reports`, and `settings`.
- Modify: `src/modules/index.js`
- Test: `tests/sc03-feature-modules.test.mjs`

**Interfaces:**
- Produces route features (`open`, `close`, optional post-render command), payment features (`open(method)`), command features, and explicit deferred boundaries for REF-01-only capabilities.
- All feature files export a real SC-03 boundary; no `SC-01 scaffold placeholder` remains in target feature families.

- [ ] Write failing module inventory/facade tests first.
- [ ] Confirm RED because placeholders are still present.
- [ ] Implement shared facade helper and feature modules with existing legacy route IDs/authorities.
- [ ] Verify no feature module contains Firebase mutation calls.

### Task 3: App Router and Runtime Bootstrap Cutover

**Files:**
- Modify: `src/app/router.js`
- Modify: `src/app/bootstrap.js`
- Modify: `src/app/index.js`
- Modify: `src/core/index.js`
- Test: `tests/sc03-router-runtime.test.mjs`

**Interfaces:**
- `createAppRouter(...)` becomes the single primary/child navigation authority.
- `installSc03Runtime(runtime)` captures final legacy callers and replaces only approved global entry points once.
- Legacy renderers remain captured authorities underneath facades; no renderer rewrite occurs.

- [ ] Write failing router/bootstrap tests for one visible caller path, role denial, child parent-route behavior, and one-time installation.
- [ ] Confirm RED.
- [ ] Implement router/bootstrap minimally.
- [ ] Run focused tests and all regression.

### Task 4: SC-03 Candidate Build and Preview

**Files:**
- Create: `scripts/build-sc03.mjs`
- Modify: `scripts/dev-server.mjs` to accept an optional output directory while keeping existing default behavior.
- Create: `src/sc03-entry.js`
- Modify: `package.json`
- Test: `tests/sc03-build.test.mjs`

**Interfaces:**
- `npm run build:sc03` writes runnable candidate to `dist-sc03/` while leaving `baseline/` and SC-02 compatibility `dist/` untouched.
- Candidate loads one modular SC-03 entry after the legacy inline runtime, so capture occurs after the final legacy patch chain is installed.

- [ ] Write failing build tests first.
- [ ] Confirm RED because build script/candidate do not exist.
- [ ] Implement deterministic copy/injection build and optional preview root.
- [ ] Verify candidate contains fixed roots/legacy authorities plus a single SC-03 module entry.

### Task 5: SC-03 Static Exit-Gate Verifier and Ownership Audit

**Files:**
- Create: `scripts/verify-sc03.mjs`
- Create: `tests/sc03-integrity.test.mjs`
- Create: `docs/SC03_LEGACY_CALLER_RENDERER_MAP.md`
- Create: `docs/SC03_MENU_CAPABILITY_MAP.md`
- Create: `docs/SC03_NO_REGRESSION_CONTRACT.md`

**Interfaces:**
- Verifier checks frozen baseline hash, fixed roots, no direct mutation in SC-03 app/core/modules, candidate entry count, placeholder removal, single override ownership, menu contract completeness, and retained high-risk authorities.

- [ ] Write failing integrity tests for missing verifier/docs and forbidden direct writers.
- [ ] Confirm RED.
- [ ] Implement verifier and authority maps using observed v1.0.40 callers.
- [ ] Run verifier and full regression.

### Task 6: SC-03 Release Checkpoint

**Files:**
- Create: `docs/SC03_IMPLEMENTATION_REPORT.md`
- Create: `docs/SC03_HANDOFF_TO_SC04.md`
- Create: `docs/SC03_RELEASE_MANIFEST.md`
- Create/update: `audit/sc03-verification.json`
- Package: `SEGERAN_JIWA_POS_SC03_FEATURE_MODULES_DELAYERING_v1.zip`

**Interfaces:**
- `npm run verify:sc03` is the fresh completion gate.
- Release report explicitly lists active modular callers and intentionally retained legacy renderers/writers.

- [ ] Run `npm run verify:sc03` from a fresh working copy of the completed project.
- [ ] Record exact PASS/FAIL counts and hashes.
- [ ] Package the project without modifying the frozen baseline.
- [ ] Extract packaged ZIP to a second fresh directory and rerun `npm run verify:sc03`.
