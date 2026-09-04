# RC01-S10C-R4 — Startup/QRIS Resurgence Convergence Report

Date: 2026-09-04
Status: LOCAL IMPLEMENTATION + VERIFICATION PASS; PHONE UAT / PREVIEW DEPLOYMENT PENDING
Production v2.9: UNTOUCHED

## Trigger evidence

R3 Phone UAT reproduced spontaneous QRIS signal write activity after an apparently clean startup convergence. Diagnostics repeatedly moved from `Critical 0 / Advisory 0 / Active 0` to `Critical 2 / Active 2` while the server remained `CONNECTED`.

Root-cause reproduction against the exact R3 source found two independent defects:

1. **S10C double trace after generated lifecycle wrapping.** Generated HTML loads S10C, then legacy P3 wraps Firebase methods, then the S10A.2 QRIS shield wraps `transaction()`. On the next S10C retry-install tick, R3 wrapped the shield again. One physical Firebase transaction therefore produced two S10C registry rows.
2. **Late quarantine retry was not actually bounded under persistent failure.** R3 re-queued the same provider after every failure. The documented one-retry behavior only held when the second attempt succeeded.

## R4 correction

### A. Trace de-duplication

`src/compat/rc01-sync-authority.js` now recognizes the already-installed S10A.2 outer transaction shield as a known lifecycle wrapper when S10C has previously instrumented the Firebase prototype. It does not add a second S10C layer around that shield.

Acceptance: one authoritative quarantine transaction reaches one physical Firebase transaction and creates exactly one S10C active row.

### B. Retry terminal hold

`src/compat/rc01-qris-deferred-settlement-compat.js` now maintains per-provider attempt state and a session-local terminal hold:

- attempt 1 may schedule one retry;
- attempt 2 is the final autonomous attempt;
- a second failure places that provider in `lateHeld` for the current page session;
- duplicate later evaluations cannot restart the write loop;
- the QRIS shield remains blocked/fail-closed;
- a single local diagnostic `QRIS_LATE_QUARANTINE_FAILED_HELD` records the original Firebase error code/message for root-cause evidence.

No Firebase Rules, root, schema, package ID, writer authority, finance semantics, or production deployment is changed.

## TDD evidence

RED was observed before implementation:

- real lifecycle test: expected one diagnostics row, observed **2**;
- persistent-failure test: expected no third retry, observed another **500 ms** retry timer.

After the minimal correction, both tests passed. Existing R3 late-quarantine, S10C sync-authority, and lifecycle tests also passed.

## Fresh verification

Command:

```bash
npm run verify:rc01:s10c-r4
```

Result:

- tests: **498**
- pass: **498**
- fail: **0**
- v2.8 icon guard: 61/61 PASS
- v3.0 presentation containment: PASS
- v3.1 UX guard: PASS
- v3.2 Reporting + Inventory guard: PASS
- v3.3 Finance: 9/9 PASS
- SC01/SC02/SC03/SC04: PASS
- RC01 release contract: PASS, mutation allowlist 4/4
- S10A: PASS, mutation allowlist 4/4
- S10A.1: PASS, mutation allowlist 4/4
- S10A.2: PASS, mutation allowlist 4/4
- S10C base: PASS
- S10C-R1: PASS
- S10C-R4: PASS

Historical R2/R3 verifier scripts intentionally retain their old exact S10C source-hash locks and are **not** replayed as R4 authority. R4 directly locks the unchanged R2 runtime, S10A.2 shield/writer/bootstrap hashes, the new R4 sync/compat hashes, generated-source equality, and R3 behavior contracts.

## Locked source hashes

- frozen legacy baseline: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- S10A writer: `cac56daf9cc8495041dcff1a861edeb9a3caf5723e329ef6445653525948b8a8`
- R2 convergence runtime: `925f03e19db85327a1faf0b9c7473101ea045dcc85d2080e3afb6ba82b2848db`
- S10A.2 shield: `c2787bb2cc7878a1d7348a66c0b1682c3ebfa4470a90cccc9188953c4e122064`
- S10A bootstrap: `be8380798923df1ce45edbf2bd6c36e08eaa076843db6b13bdacbed117fbead9`
- **R4 sync authority:** `a5283642e0a7fcf2679845a60783628d1121340ef8c9bd94d0b10d3200474050`
- **R4 deferred-settlement compat:** `731fca10a891a1f3832b9b4201e77747073f6f3f0796e20994f39b7f84d94933`

`dist-ref01/index.html` and `dist-rc01/index.html` remain byte-identical because R4 changes external copied JS assets, not the HTML shell. The R4 verifier additionally requires generated JS copies to match the R4 source exactly.

## Next gate

1. Apply R4 only on the exact R3 tree authority.
2. Run fresh `npm run verify:rc01:s10c-r4` in Codespaces.
3. Commit locally on the non-production preview branch.
4. Stop before push/deploy for review.
5. After approved Preview deployment, repeat Phone UAT startup observation for at least 60 seconds.
6. Only if startup stays converged proceed to late QRIS Rp5.000 and normal QRIS UAT.
