# P0-BW02 Firebase Bandwidth Hardening + Cloudflare Shadow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the highest-confidence Firebase download amplification paths and produce a tested D1 shadow schema/import tool without changing production authority.

**Architecture:** Patch frozen legacy behavior only through the existing build composition layer and focused compatibility modules. Preserve canonical economic writers. Add a separate migration toolchain that converts a Firebase backup into deterministic D1 SQL/manifest artifacts for shadow validation.

**Tech Stack:** Node.js tests/build scripts, Firebase RTDB browser SDK (existing), Cloudflare D1 SQLite SQL, R2 manifest metadata.

**Spec:** `docs/superpowers/specs/2026-09-08-p0-bw02-firebase-cloudflare-shadow-design.md`

## Global Constraints
- R8 Unified commit `1ffa956` is rollback baseline.
- No new recurring business-data polling.
- No new direct Firebase writer authority in `src/ui`.
- Automatic QRIS bridge remains disabled.
- D1/R2 remains shadow-only.

---

### Task 1: Bandwidth regression contract
**Files:**
- Create: `tests/p0-bw02-firebase-read-amplification.test.mjs`
- Modify later: `scripts/build-ref01.mjs`, `src/compat/p0-bw02-bandwidth-hardening.js`

- [ ] Write failing tests proving: transaction `cartData` excludes image payloads; costing/recipe sale flow uses exact transaction identity; refund recovery has no full-shift read; refund/costing recovery has no recurring business-data timer.
- [ ] Run test and verify RED.
- [ ] Implement minimum build/runtime patch.
- [ ] Run test and verify GREEN.

### Task 2: Exact transaction identity bridge
**Files:**
- Modify: `scripts/build-ref01.mjs`
- Create: `src/compat/p0-bw02-bandwidth-hardening.js`

- [ ] Patch the canonical sale success path to publish `{txId, shift, cashierId, ts}` only after the existing root update succeeds.
- [ ] Patch recipe sale wrapper to consume this identity instead of before/after full-shift scans.
- [ ] Patch sale-costing wrapper to consume this identity and keep reservation recovery fallback only for unknown outcomes.
- [ ] Verify targeted tests.

### Task 3: Refund and reservation recovery hardening
**Files:**
- Modify: `scripts/build-ref01.mjs`
- Create/modify: `src/compat/p0-bw02-bandwidth-hardening.js`

- [ ] Patch refund original-transaction lookup to direct key read with bounded legacy fallback.
- [ ] Disable legacy recurring refund-costing and reservation-recovery timers in the built candidate.
- [ ] Install event-driven refund recovery plus once-per-login bounded reservation/refund recovery.
- [ ] Verify no new broad/polling reads.

### Task 4: Transaction media payload stop-loss
**Files:**
- Modify: `scripts/build-ref01.mjs`

- [ ] Patch canonical and normalized recipe transaction `cartData` persistence to omit `img/savedImg` data.
- [ ] Preserve runtime cart/receipt visuals before save.
- [ ] Verify transaction business fields remain unchanged.

### Task 5: Cloudflare D1 shadow schema and importer
**Files:**
- Create: `migration/cloudflare-d1/schema_v1.sql`
- Create: `migration/cloudflare-d1/import-firebase-backup.mjs`
- Create: `migration/cloudflare-d1/README.md`
- Create: `tests/p0-bw02-d1-shadow.test.mjs`

- [ ] Write RED importer/schema tests.
- [ ] Create normalized schema with provenance/idempotency indexes.
- [ ] Implement deterministic backup-to-SQL conversion and R2 media manifest extraction.
- [ ] Add parity summary output by shift/date.
- [ ] Verify GREEN.

### Task 6: Release verification and package
**Files:**
- Create: `P0_BW02_FIREBASE_BANDWIDTH_HARDENING_REPORT.md`
- Create one-shot package.

- [ ] Rebuild REF01/RC01 artifacts.
- [ ] Run targeted tests, `npm test`, SC03, SC04, REF01, R7/R8 regressions, and `git diff --check`.
- [ ] Confirm frozen QRIS/loading authority files remain unchanged.
- [ ] Package source patch + migration shadow kit with SHA256 manifest.
