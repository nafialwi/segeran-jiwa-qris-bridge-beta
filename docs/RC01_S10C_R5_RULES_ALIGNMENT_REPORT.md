# RC01-S10C-R5 — QRIS Late Quarantine Rules Alignment Report

Date: 2026-09-04
Status: LOCAL IMPLEMENTATION + VERIFICATION PASS; LIVE-RULES EXPORT / FIREBASE PUBLISH / PREVIEW UAT PENDING
Production v2.9: UNTOUCHED
R4 frontend/runtime: FROZEN

## Trigger evidence

R4 real-device Preview UAT proved startup convergence: the repeated Firebase connecting indicator stopped, diagnostics converged to `Critical 0 / Advisory 0 / Active 0 / Server CONNECTED`, and no new `too much recursion` appeared during the new observation window.

The remaining new failure was authoritative late-quarantine persistence:

`QRIS_LATE_QUARANTINE_FAILED_HELD ... permission_denied`

R4 correctly bounded that failure to the initial attempt plus one retry and then entered session-local fail-closed hold. The underlying Firebase Rules contract, however, still accepted normal signal statuses only and did not authorize the S10A late-quarantine state.

## Root cause

The historical v4.1 Rules reference accepts `DETECTED`, `UNMATCHED`, `AMBIGUOUS`, `MATCHED`, and `CONFIRMED` under:

`/segeranjiwa_qris_beta_v1/signals/$signalId`

S10A/R4's dedicated writer legitimately needs to persist:

- `status = LATE_AFTER_CANCEL` or `LATE_OR_NEW_AMBIGUOUS`;
- `resolutionState = REVIEW_REQUIRED`;
- `autoMatchBlocked = true`;
- `lateDetectedAt`;
- non-empty `lateCandidatePendingIds`.

Therefore the application-side fail-closed logic and the server-side Rules contract were inconsistent.

## R5 correction boundary

R5 changes no frontend/runtime source and creates no new Firebase writer authority. It adds a Rules candidate generator that patches exactly two scalar rule expressions on a freshly exported live Rules document:

1. `rules/segeranjiwa_qris_beta_v1/signals/$signalId/.write`
2. `rules/segeranjiwa_qris_beta_v1/signals/$signalId/.validate`

All other Rules content must remain byte-semantically identical as parsed JSON.

The late branch requires:

- authenticated + active Segeran Jiwa account;
- existing signal and safe signal id;
- source status `DETECTED`, `UNMATCHED`, or `AMBIGUOUS`, or an exact idempotent already-late state;
- signal still unlinked/unconfirmed;
- immutable provider, amount, firstSeenAt, lastSeenAt, and sourceDeviceId;
- target late status + `REVIEW_REQUIRED` + `autoMatchBlocked=true`;
- numeric positive `lateDetectedAt`;
- a non-empty candidate list whose first candidate is a real `CANCELLED` pending with the same amount;
- authorization by role `manajemen`, or a cashier whose username owns that cancelled pending.

Matched/confirmed evidence cannot enter the late branch. QRIS root `.write` remains `false`; normal MATCHED/CONFIRMED rules remain inherited unchanged from the live document.

`lateCandidatePendingIds` remains application-authored audit metadata. Rules use child access for the authorization anchor rather than comparing the structured list through `RuleDataSnapshot.val()`.

## Live-Rules safety gate

Historical v4/v4.1 files are **reference-only** and MUST NOT be published directly as R5.

R5 requires a fresh complete export of the currently published Firebase RTDB Rules. The generator:

```bash
node firebase/r5/build-r5-candidate.mjs \
  --live database.rules.LIVE_EXPORT_R5.json \
  --out-dir /tmp/r5-rules
```

produces:

- exact live rollback copy;
- pretty and minified R5 candidate;
- SHA256/lineage gate report;
- exact scalar diff report.

It never publishes Firebase Rules.

Known historical lineage is informational only. Unknown-but-structurally-compatible live Rules are generated with `HOLD_UNKNOWN_LIVE_LINEAGE_MANUAL_REVIEW` and must not be published until reviewed.

## TDD evidence

RED phases were observed for:

- missing R5 policy module;
- missing candidate builder;
- missing R5 verifier/package gate;
- unsafe structured-list `.val()` comparison;
- missing cancelled-pending authorization evidence;
- verifier accepting a candidate after that authorization evidence was removed.

Each was corrected with the minimum bounded implementation before proceeding.

## Fresh full verification

Command:

```bash
npm run verify:rc01:s10c-r5
```

Result:

- tests: **510**
- pass: **510**
- fail: **0**
- v2.8 icon guard: 61/61 PASS
- v3.0 presentation containment: PASS
- v3.1 UX guard: PASS
- v3.2 Reporting + Inventory guard: PASS
- v3.3 Finance: 9/9 PASS
- SC01/SC02/SC03/SC04: PASS
- RC01 release contract: PASS, mutation allowlist 4/4
- S10A / S10A.1 / S10A.2: PASS
- S10C / S10C-R1 / S10C-R4: PASS
- S10C-R5: PASS
- frontend runtime SHA256 unchanged: `219149affb2844e67d9dfde5d2d98a0ef8776275def2d75f13a73724c346934c`

Reference-only v4.1 rehearsal produced exactly two changed scalar paths and kept QRIS root fail-closed. It is evidence for the generator, not authorization to publish that historical candidate.

## External gates remaining

1. Apply R5 source patch in Codespaces on the non-production branch and run the full R5 gate.
2. Push only `rc01-s10c-sync-authority`; do not push/merge `main`.
3. Export complete CURRENT Firebase RTDB Rules before any publish.
4. Build R5 candidate from that export and review lineage + exact two-path diff.
5. Publish only after explicit review of the generated live-derived candidate.
6. Run Termux:X11 / Firefox UAT on Preview, including startup idle, navigation, late QRIS, and normal QRIS.
7. Final lock only if no new `permission_denied`, `QRIS_LATE_QUARANTINE_FAILED_HELD`, `too much recursion`, connecting flicker, retry resurgence, or normal-QRIS regression appears.
