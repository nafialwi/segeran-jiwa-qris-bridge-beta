# PU-10 Final Engineering Gate

Date: 2026-09-21
Branch: `work/r10-preuat-convergence`
Execution host: `NAFI-ALWI-PC` through `pc-sj-legacy`
Production/live: **UNTOUCHED**
Production Firebase Rules: **UNTOUCHED**
Production database/storage: **UNTOUCHED**
`main`: **UNTOUCHED**

## Verdict

PU-10 engineering gate is **PASS for Human UAT**.

This verdict means the convergence branch is technically ready to enter the isolated Human UAT phase. It is **not** production approval and must not be interpreted as permission to merge, deploy, publish Firebase Rules, or write production data.

## Authority and branch continuity

At gate start:

- production/main HEAD: `4b32e91111fa`
- convergence HEAD: `fbc9cb3e9691`
- convergence remote: `fbc9cb3e9691`
- working tree: clean
- branch divergence against `origin/main`: 0 commits behind / 47 commits ahead
- merge-tree conflict probe: PASS / no conflict markers
- therefore current `origin/main` is already contained in the convergence branch history

## Build and structural gates

`npm run build:ref01`:

- PASS
- REF01 candidate SHA-256: `320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf`

SC build chain:

- `npm run build` PASS
- `npm run build:sc03` PASS
- `npm run build:sc04` PASS
- inline scripts: 40 / 40 parse, 0 failures
- contract verifier: PASS
- SC-02 verifier: PASS
- SC-03 verifier: PASS
- SC-04 verifier: PASS
- REF-01 verifier: PASS

Observed candidate hashes during PU-10:

- SC-03: `5819aa73662a22bc75d28042d922cd20f24dd0d54e9718ef73e8487ebd12611c`
- SC-04: `47fb219a7d87ee29aecab1d26161ddb45ce461e890c3816b7f35d6fd1f3f9f43`

## Performance and listener budget

Focused bandwidth/loading gate:

- 17 tests
- 17 PASS
- 0 FAIL

The gate covers the established no-root-read / bounded-read / no-recurring-business-polling protections including P0-BW02, PU-03 bandwidth convergence, and R6B loading resilience.

No new broad Inventory V2 root read, permanent transaction listener, or recovery polling loop was introduced by PU-10.

## Full regression

Full serial suite:

- 793 tests
- 793 PASS
- 0 FAIL
- 0 skipped
- 0 cancelled

The previously discussed LEGACY-CUP-01B product-cup UI test is green on the actual convergence branch used for this gate.

## Firebase Rules authorization gate

Static R10 Product Stock Components rules contract:

- 5 tests
- 5 PASS
- 0 FAIL

A user-local Temurin JRE 21 was installed under `$HOME/.local/opt/temurin21-jre` only to run Firebase Emulator Suite. No system package or production service was changed.

Firebase Database Rules emulator gate:

- `RULES_BOUND_TO_TEST_NAMESPACE` PASS
- Owner mapping PASS
- Cashier mapping denial PASS
- unauthenticated denial PASS
- malformed mapping denial PASS
- application claim PASS
- immutable snapshot-seal protection PASS
- sale decrement PASS
- duplicate no-op retry PASS
- sale movement PASS
- cashier warehouse mutation denial PASS
- arbitrary outlet mutation denial PASS
- shortage claim/marker PASS
- arbitrary metadata denial PASS
- application completion PASS
- refund claim / balance restore / movement PASS
- refund duplicate no-op PASS
- VOID balance restore / movement PASS
- final `TASK9_EMULATOR_GATE` PASS

The emulator rerun used the tracked reference rules fixture to exercise the committed Task 9 rule transformer and authorization behavior. It performed **zero production rule publishes and zero production database writes**.

Task 9 had previously captured production rules read-only before its implementation checkpoint. PU-10 intentionally does not claim a fresh production rules export from the PC because the PC Firebase CLI is not currently authenticated. A **fresh read-only production rules export and canonical comparison remains mandatory at the later production cutover gate**, before any rules publication.

This is not a Human UAT blocker because PU-09 routes writable UAT exclusively to the demo/loopback emulator environment.

## Safe UAT environment confirmation

Actual Database/Auth/Storage emulator smoke:

- project: `demo-segeran-jiwa-uat`
- namespace: `demo-segeran-jiwa-uat-default-rtdb`
- deterministic synthetic seed: PASS
- emulator startup: PASS
- smoke verification: PASS
- clean shutdown: PASS
- production writes: 0

The Human UAT launcher remains isolated from production and visibly labels the session as UAT / emulator / non-live.

## Frozen authority integrity

Frozen hashes remain exact:

- `src/ref01-entry.js` = `22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b`
- `src/app/rc01-runtime-loading-hardening.js` = `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`
- `baseline/legacy-v1.0.40.html` = `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

## Release boundary

PU-10 ends at **Human UAT readiness**.

Before Human UAT acceptance:

- do not merge the convergence branch to `main`
- do not deploy production
- do not publish Firebase Rules
- do not run live migrations
- do not write production data

Before any later production cutover:

- fresh-export deployed Firebase Rules read-only
- compare canonical production rule state against the approved Task 9 baseline/candidate
- repeat the required cutover preflight
- require explicit human approval

## Next checkpoint

**PU-11 — Human UAT**

Primary UAT coverage:

- mobile and desktop
- Owner and Cashier
- product edit / Cup / Pemakaian Stok
- sale
- exactly-once retry
- shortage
- refund
- VOID
- opening / restock / closing shift
- slow/offline/recovery behavior
- layer/modal/focus consistency
- inventory and stock-sync observability

PU-12 remains conditional and is opened only for defects found during PU-11.
