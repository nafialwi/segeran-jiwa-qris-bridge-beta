# RC-01 Release Hardening + AppMint Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the P5 v3.4 FINAL LOCKED source into a reproducible browser/mobile Release Candidate, close release-only blockers, package/hash it, and stop at the GitHub/Cloudflare/AppMint external gate unless those environments are verifiably available.

**Architecture:** P5 remains immutable. RC-01 runs from an isolated copy and adds only release-boundary hardening: reconnect lifecycle reliability, receipt PDF/print fallback, explicit release verification, reproducible RC output, and release/UAT documentation. Existing Firebase/QRIS/transaction/inventory/finance authorities remain unchanged.

**Tech Stack:** Vanilla ES modules, legacy single-HTML compatibility runtime, Node.js native test runner, existing build scripts, static Cloudflare Pages preview, AppMint WebView wrapper.

**Spec:** `blueprint_authority/docs/06_EXECUTION_ROADMAP_6_TO_10_PROMPTS.md`, `blueprint_authority/docs/08_UAT_AND_RELEASE_GATES.md`, `blueprint_authority/docs/09_ZERO_COST_TOOLCHAIN_AND_REPO.md`, and explicit user-approved RC01 S01-S10 execution model.

## Global Constraints

- P5 locked source SHA256 remains `485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530` and is never rewritten.
- POS root stays `toko_segeranjiwa_v58`; QRIS root stays `segeranjiwa_qris_beta_v1`.
- No new Firebase writer, schema/root/rules/package-ID change, production data correction, or deployment without a separate explicit gate.
- Production v2.9 remains live/untouched during RC candidate work.
- Unknown historical HPP remains unknown; no current WAC/current recipe/current cup-cost fabrication.
- UI/financial freezes permit release-blocker fixes only; no feature expansion or redesign.
- Automated PASS alone cannot open AppMint; browser/mobile real-device evidence is required.

---

### Task 1: RC01-S01 Baseline / Release Authority Audit

**Files:**
- Create: `docs/RC01_RELEASE_BASELINE_AUDIT.md`
- Create: `verification_logs/RC01_BASELINE_VERIFY.log`
- Preserve: `baseline/legacy-v1.0.40.html`

**Interfaces:**
- Consumes: P5 locked package, current build/test scripts, existing GitHub/Cloudflare coordinates supplied by the user.
- Produces: a release authority map used by every later RC task.

- [ ] Verify locked P5 SHA256 before extracting/working.
- [ ] Run `npm run verify:ref01` from a clean extraction; require `429/429`, SC04/REF01 PASS, B01-B05 `61/61`, finance `9/9`.
- [ ] Record GitHub authority as `https://github.com/nafialwi/segeran-jiwa-qris-bridge-beta`, default branch `main`, with Bridge history isolated on `qris-bridge-v0.3.0-archive` per user evidence.
- [ ] Record Cloudflare project/preview authority only when independently supported; do not infer a production custom domain.
- [ ] Audit RC-required capability evidence: Owner/Kasir routes, session, offline/reconnect, Android Back, barcode/camera, QRIS, printer/share/PDF, notification/deep-link, closing/report, rollback/build/package.
- [ ] Classify gaps as `AUTOMATED_COVERED`, `RELEASE_FIX_REQUIRED`, or `REAL_DEVICE_REQUIRED`.

### Task 2: RC01-S03 Offline/Reconnect Restore Retry

**Files:**
- Modify: `src/app/sc04-bootstrap.js`
- Test: `tests/rc01-session-reconnect.test.mjs`

**Interfaces:**
- Consumes: `session.restore()` result with `OFFLINE_REVALIDATION_REQUIRED` / `REVALIDATION_UNAVAILABLE`.
- Produces: browser `online` retry lifecycle that re-runs server validation once connectivity returns, without storing credentials or creating writers.

- [ ] Write a failing test where first startup restore returns `OFFLINE_REVALIDATION_REQUIRED`, an `online` event is emitted, and `session.restore()` is called again.
- [ ] Run `node --test tests/rc01-session-reconnect.test.mjs`; require expected RED because no reconnect listener exists.
- [ ] Implement one idempotent reconnect listener in `installSc04Runtime`; retry only for recoverable revalidation reasons and remove/disable retry after a restored or terminal result.
- [ ] Write a failing test that repeated `online` events cannot launch overlapping restores.
- [ ] Implement the minimal in-flight guard.
- [ ] Run targeted SC04 + RC reconnect tests and then full `npm run verify:ref01`.

### Task 3: RC01-S04 Receipt Print/PDF Release Fallback

**Files:**
- Create: `src/ui/rc01-receipt-output.js`
- Modify: `src/ref01-entry.js`
- Test: `tests/rc01-receipt-output.test.mjs`

**Interfaces:**
- Consumes: existing `SJCommercialUATV5962.lastReceipt`, `sjReceiptText`, receipt modal, and browser print APIs.
- Produces: `runtime.SJRC01ReceiptOutput.printOrSavePdf()`; no persistence/network authority.

- [ ] Write a failing pure test for escaped printable receipt HTML generated from receipt text.
- [ ] Implement `buildPrintableReceiptHtml(text,{title})` with HTML escaping and print CSS.
- [ ] Write a failing runtime test that `printOrSavePdf()` creates a temporary same-document print surface/iframe and calls browser print without mutating POS data.
- [ ] Implement the minimal browser print/PDF fallback with clear failure return when print API is unavailable.
- [ ] Write a failing test that RC enhancement adds one `Simpan PDF / Cetak` action to the receipt success surface without duplicating it on repeated enhance calls.
- [ ] Implement idempotent receipt action enhancement and install it from `src/ref01-entry.js` after REF-01 runtime setup.
- [ ] Run targeted output tests then full regression.

### Task 4: RC01-S02/S04/S05 Release Contract Verifier

**Files:**
- Create: `scripts/verify-rc01.mjs`
- Create: `tests/rc01-release-contract.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: source/build artifacts and immutable release contracts.
- Produces: `audit/rc01-verification.json` and command `npm run verify:rc01`.

- [ ] Write a failing test that `package.json` exposes `verify:rc01` and RC verifier checks the exact fixed roots, legacy baseline hash, RC output integration, reconnect hardening, Android Back authority, barcode/camera fallback, QRIS authority, printer/share/PDF output, notification/deep-link, closing/report, and writer allowlist.
- [ ] Implement `scripts/verify-rc01.mjs` as read-only static/build verification; it must not call Firebase or mutate runtime data.
- [ ] Add `verify:rc01` after `verify:ref01` in package scripts.
- [ ] Run targeted contract test and `npm run verify:rc01`.

### Task 5: RC01-S06 Reproducible RC Build + Manifest

**Files:**
- Create: `scripts/build-rc01.mjs`
- Create: `tests/rc01-build-integrity.test.mjs`
- Create: `docs/RC01_RELEASE_MANIFEST.md`
- Create: `docs/RC01_ROLLBACK.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: verified `dist-ref01` candidate.
- Produces: deterministic `dist-rc01/` containing `index.html`, `src/`, and stable release metadata suitable for Cloudflare/AppMint ZIP packaging.

- [ ] Write a failing test that `build:rc01` exists, creates one deterministic RC output tree, preserves the P5 baseline hash, and includes the RC receipt output module.
- [ ] Implement `build-rc01.mjs` by running/copying the existing REF-01 candidate output; do not rewrite the legacy baseline.
- [ ] Add a stable metadata file with release label `v3.4 RC-01` and P5 source authority hash; omit timestamps from reproducible content.
- [ ] Run build twice and assert identical source-critical manifest/hash.
- [ ] Document rollback to production v2.9 and locked P5 source.

### Task 6: RC01-S07 GitHub / Cloudflare Preview Gate

**Files:**
- Create: `docs/RC01_GITHUB_CLOUDFLARE_GATE.md`

**Interfaces:**
- Consumes: RC package/hash plus verified repository/project settings.
- Produces: either a non-production preview deployment record or an explicit external-action blocker.

- [ ] Compare current remote `main` structure/history with the RC source when read access is available.
- [ ] Determine whether `main` triggers Cloudflare production; if uncertain, do not push `main`.
- [ ] Prefer an RC branch such as `rc01-v3.4-release-candidate` for preview unless the existing Cloudflare configuration proves another safe preview path.
- [ ] Stop before remote mutation if authenticated GitHub/Cloudflare write access is unavailable in-session.
- [ ] Record exact next user action rather than guessing credentials/configuration.

### Task 7: RC01-S08/S09/S10 Real-Device + AppMint Gate Package

**Files:**
- Create: `docs/RC01_REAL_DEVICE_UAT.md`
- Create: `docs/RC01_APPMINT_GATE.md`

**Interfaces:**
- Consumes: Cloudflare preview URL and RC package.
- Produces: explicit `APPMINT GATE OPEN` only after browser/mobile evidence; otherwise `BLOCKED` with exact failing scenarios.

- [ ] Prepare concise Owner/Kasir UAT covering session reopen, reconnect, Android Back, barcode/camera, QRIS, printer/share/PDF, notification/deep-link, closing/report and lifecycle/background-resume.
- [ ] Do not request real QRIS payment unless pending/amount/duplicate/cancel-retry prerequisites are green.
- [ ] Keep AppMint gate closed until user returns representative real-device evidence.
- [ ] When evidence is green, package AppMint-ready RC and request install as UPDATE using the existing AppMint project/signing identity; never instruct uninstall on signature conflict.
