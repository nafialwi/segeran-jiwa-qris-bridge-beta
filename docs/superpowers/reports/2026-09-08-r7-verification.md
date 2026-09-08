# R7 Unified Loading Hardening — Verification Report

## Base and scope
- Base source: `emg-d1-p1-r4-sc04-safe` commit `b8a909f` (provided as exact `git archive`).
- Local execution baseline commit: `7b4f208` (byte-equivalent archive import used only inside the execution sandbox).
- R7 branch: `r7-unified-loading-hardening`.
- Production/main is not part of this execution.

## Implemented behavior
- One in-memory R7 read coordinator with latest-wins tokens and timing diagnostics.
- Beranda keeps the complete owner-model authority; P1 fast-dashboard compat is presentation-only.
- Historical Reports render shell/matching cache first and no longer require `today` for local preview.
- Report metric/top-product/local filters do not trigger full remote reload.
- Historical Shift reads are per-date, cached, and latest-selection-wins.
- Finance keeps a full shell or matching cached period while refreshing; unknown values use `—`.
- Floating D1 launcher is removed; manual management/settings card remains.
- No new polling interval, persistent Firebase listener, UI Firebase writer, or localStorage persistence is introduced by R7.

## Automated evidence
Fresh final exact-tree verification on 2026-09-08 produced:
- Termux-safe clean-tree profile: `npm run build:ref01` followed by `node --test --test-concurrency=1 tests/*.test.mjs` produced **609/609 PASS, 0 fail**. The REF01 prebuild is required by an existing legacy cup UI test that reads `dist-ref01/index.html`.
- SC03 verifier: **PASS** — 42 feature boundaries; 66 app/core/module JS files; 0 direct mutations; 1 modular entry.
- SC04 verifier: **PASS** — session/auth guards intact; modular RTDB mutations remain exact-allowlisted to 4 dedicated writers; destructive remove forbidden.
- REF01 build/verifier chain: **PASS**; candidate build completed and its nested regression suite finished 609/609.
- RC01 S10C R6D release verifier: **PASS**; R6A QRIS, R6B loading, R6C notification, baseline, and writer authorities preserved.
- `git diff --check`: **PASS**.
- Frozen-authority diff against exact base `7b4f208` / uploaded `b8a909f`: **PASS / no diff**.

Frozen hashes after the gate:
- `src/app/rc01-runtime-loading-hardening.js` — `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`
- `src/compat/rc01-qris-deferred-settlement-compat.js` — `d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355`
- `src/compat/rc01-qris-manual-bypass.js` — `80d867cca96a0f4b5dfdc2012e51f9e53da999ed4df9e09d4c6aeb7f87363156`
- `src/compat/rc01-sync-authority.js` — `a6c43e32f06f49ccce3bcabb74b710c116fde96ebf47b5db8cf0bcb1ab7d96d4`
- `src/ref01-entry.js` — `22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b`
- `emergency-d1/schema.sql` — `627a5daa62c593ec5de29c50b50dd43538acc260f77e494ea45e177fb01fc44b`
- `emergency-d1/src/core.js` — `8523f65e64ec371c4aaaf1321c6decadc60cdca7e02c5d2750d682e3044c56ad`
- `emergency-d1/src/worker.js` — `2ad8f41b6910b8fb37d284fea656dc7e8a359630a6f9c865c0ce9321920ef917`

## Secret-dependent D1 drill
Authenticated D1 read/write drill is **not executed inside this sandbox**, because the Owner Key/token remain private in the user's Termux environment and are intentionally not copied into the R7 package. R7 does not modify:
- `emergency-d1/schema.sql`
- `emergency-d1/src/core.js`
- `emergency-d1/src/worker.js`

A fresh secret-safe drill remains a user-side Preview gate before Production approval.

## Preview UAT still required
- Beranda renders immediately.
- Historical Report shell renders immediately.
- Historical Report revisit paints matching cache immediately.
- Report local metric/top sorting does not blank/reload.
- Shift A → B → C ends on C even if A/B resolve later.
- Finance period switch never blanks the workspace.
- D1 floating launcher is absent and management card still opens emergency mode.
- Coordinator timing snapshots are captured for Beranda, previous-day Report, previous-day Shift history, and Finance current/previous month.

R7 is not eligible for merge to `main` until these Preview checks and the fresh authenticated D1 drill pass.
