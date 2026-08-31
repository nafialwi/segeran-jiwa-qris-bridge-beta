# REF-01 Final Refinement Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one REF-01 UI/IA runtime and candidate distribution that reflects the nine refinement references while retaining SC-01..SC-04 behavior and write ownership.

**Architecture:** Pure refinement contracts/models live under `src/ui/`; one `src/app/ref01-bootstrap.js` installs them once and delegates all business actions to existing SC-03/SC-04 services or captured legacy authorities. `scripts/build-ref01.mjs` produces `dist-ref01` with one entry and `scripts/verify-ref01.mjs` enforces safety/coverage gates.

**Tech Stack:** ES modules, browser DOM, CSS custom properties, Node.js test runner, existing Firebase compat runtime via legacy authority.

**Spec:** `docs/superpowers/specs/2026-08-31-ref01-final-refinement-convergence-design.md`

## Global Constraints
- Keep POS root exactly `toko_segeranjiwa_v58`.
- Keep QRIS root exactly `segeranjiwa_qris_beta_v1`.
- Do not rewrite QRIS matching/recovery/pending/ambiguity/fallback.
- Do not create a second transaction/inventory/debt/shift/refund/report writer.
- Do not store plaintext PIN/password.
- Do not change Firebase Rules/schema/root.
- Output is V-PASS candidate, not real-device V-PASS.

---

### Task 1: UI authority contracts
**Files:** create/replace `src/ui/icons.js`, `src/ui/bottom-nav.js`, `src/ui/screen-shell.js`, `src/ui/refinement-contract.js`, CSS token/layout/component/state files; test `tests/ref01-ui-contract.test.mjs`.
- [ ] Write failing semantic/icon/nav/settings/state/responsive tests.
- [ ] Run focused test and confirm RED.
- [ ] Implement minimal pure authority models and CSS tokens.
- [ ] Run focused test and confirm GREEN.

### Task 2: Implicit media behavior
**Files:** create `src/ui/media-lifecycle.js`; test `tests/ref01-media-lifecycle.test.mjs`.
- [ ] Write failing tests for image validation, product/store authority declaration, profile upload/replace/remove via existing storage + Firebase Auth profile, and no RTDB writer.
- [ ] Run focused test and confirm RED.
- [ ] Implement media controller with dependency injection.
- [ ] Run focused test and confirm GREEN.

### Task 3: Shift stale-state model and adapter
**Files:** create `src/ui/shift-refinement.js`; test `tests/ref01-shift-refinement.test.mjs`.
- [ ] Write failing tests for parsing shift identity, overdue state, duration, and owner navigation to existing closing authority without shift creation.
- [ ] Run focused test and confirm RED.
- [ ] Implement pure model + legacy-navigation adapter.
- [ ] Run focused test and confirm GREEN.

### Task 4: Single REF-01 runtime
**Files:** create `src/app/ref01-bootstrap.js`, `src/ref01-entry.js`, update `src/ui/index.js`; test `tests/ref01-runtime.test.mjs`.
- [ ] Write failing install-once/runtime-family tests.
- [ ] Run focused test and confirm RED.
- [ ] Implement one observer/controller that enhances bottom nav, Settings groups, system-state markers, media surfaces, report/dashboard semantics, and stale-shift presentation.
- [ ] Run focused test and confirm GREEN.

### Task 5: Candidate build and exit verifier
**Files:** create `scripts/build-ref01.mjs`, `scripts/verify-ref01.mjs`, update `package.json`; tests `tests/ref01-build-integrity.test.mjs`, `tests/ref01-exit-gate.test.mjs`.
- [ ] Write failing candidate/build/verifier tests.
- [ ] Run focused tests and confirm RED.
- [ ] Implement build and verifier.
- [ ] Run focused tests and confirm GREEN.

### Task 6: Full regression, release artifact and report
**Files:** create `docs/REF01_IMPLEMENTATION_REPORT.md`, `docs/REF01_RELEASE_MANIFEST.md`, `docs/REF01_HANDOFF_TO_QA01.md`, `REF01_PROJECT_SHA256.txt`.
- [ ] Run `npm run verify:ref01` fresh.
- [ ] Generate project manifest and verify it.
- [ ] Package a clean REF-01 ZIP and verify from fresh extraction.
- [ ] Record F/A/R status and explicitly label visual status `V-PASS candidate` pending QA-01 screenshots.
