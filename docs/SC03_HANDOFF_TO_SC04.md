# SC-03 Handoff to SC-04

## Authority entering SC-04

Use this SC-03 project as the modular source candidate. Keep `baseline/legacy-v1.0.40.html` and compatibility `dist/index.html` immutable at SHA256 `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.

SC-04 must build on:

- `src/app/bootstrap.js` — one-time modular runtime cutover;
- `src/app/router.js` — navigation authority;
- `src/app/app-state.js` — primary/child state;
- `src/core/legacy-command-registry.js` — captured final legacy callers;
- `src/core/role-guard.js` — current role semantics;
- `src/modules/runtime-registry.js` — active registry with 42 boundaries (40 active, 2 deferred);
- `src/modules/**` — feature boundaries;
- SC-02 Data/Domain adapters — unchanged high-risk writer ownership.

## SC-04 scope

SC-04 is Persistent Session + GitHub + Preview Foundation. It may implement safe session restoration, Firebase Auth persistence integration when available, a safe local session envelope, restoration of user/role/device/active shift, logout invalidation, disabled/revoked device handling, offline restore policy, and source/reproducible preview workflow.

## Hard prohibitions carried forward

- Never store PIN/password plaintext.
- Never create a second QRIS engine or direct QRIS Firebase writer.
- Never bypass `processTransaction()` for transaction commit.
- Never change POS root `toko_segeranjiwa_v58` or QRIS root `segeranjiwa_qris_beta_v1` without a separately approved migration.
- Never duplicate an active shift during session restoration.
- Do not mix REF-01 visual redesign into SC-04.
- Keep unknown HPP unavailable rather than coercing to zero.

## Required first action in SC-04

Run `npm run verify:sc03` before changing session behavior. The expected SC-03 checkpoint is 61/61 automated tests passing, 42 feature boundaries with 40 active and 2 deferred, and zero verifier violations. SC-04 should add failing persistence/session tests before implementation and keep the SC-03 caller/role/menu gates green.

## GitHub gate

SC-03 has reached the automated modular runtime exit gate. Therefore SC-04 is the correct point to establish GitHub as source authority. The next work package may request the empty repository URL from the user, as defined by the roadmap.
