# Segeran Jiwa POS v2.8 — Verification Summary

## Pre-implementation baseline
- `npm run verify:ref01`: 174/174 PASS.
- Frozen SHA256 matched the required production value before and after the baseline run.

## Integrated working-tree verification
- `npm run verify:ref01`: 194/194 PASS.
- Locked icon guard: 61/61 PASS.
- SC-01/SC-02/SC-03/SC-04: PASS.
- SC-04 modular RTDB mutations: 0.
- Frozen SHA256 remained unchanged after the full run.

## TDD evidence added in v2.8
- `tests/v28-icon-foundation.test.mjs`
- `tests/v28-runtime-hardening.test.mjs`
- `tests/v28-reporting.test.mjs`
- `tests/v28-finished-goods-stock.test.mjs`

Each v2.8 behavior was first exercised as a failing test before the minimal implementation was applied. Obsolete v2.7 visual/report assertions were updated only where the locked v2.8 acceptance contract explicitly replaced the old behavior.

## Fresh-package verification
Fresh extraction verification: 194/194 PASS; 311-file source manifest matched before and after verification; frozen SHA256 remained unchanged. Evidence: `verification_logs/05_V28_FRESH_PACKAGE_VERIFY_REF01.log`.
