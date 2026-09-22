# Segeran Jiwa Legacy — Project State

Updated: 2026-09-22

## Current milestone

R10 FINAL RELEASE CANDIDATE LOCK

Engineering convergence and Human UAT are complete. The project is stopped before production cutover.

## Active authority

- Development/RC branch: work/r10-preuat-convergence
- Verified runtime source before RC documentation lock:
  1fa3b79ee5b33c7d1ee449fdc66871f12c73caf4
- Final RC documentation:
  docs/project-control/R10_RC_FINAL_LOCK.md
- Production cutover gate:
  docs/project-control/R10_PRODUCTION_CUTOVER_GATE.md
- Draft PR: GitHub PR #6

## Verification state

- PU-01 through PU-10: COMPLETE
- PU-11 Human UAT desktop/mobile: ACCEPTED
- PU-12 remediation: COMPLETE
- Final serial regression: 798 / 798 PASS
- Final Mobile UAT targeted contract: 14 / 14 PASS
- REF01 candidate SHA-256:
  320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf
- Mobile UAT command: npm run uat:mobile

## Production authority

Production remains untouched by the R10 Final RC lock.

- origin/main at lock preparation:
  4b32e91111fa2e78b34ff80ba0f432971b3c24fa
- Production tag: r9-cup01-prod-20260914
- Production tag commit:
  8018c40ae74f0b01d8b31d558828d26cd867bca2

Fresh production evidence is mandatory at the cutover gate.

## Rollback authority

- baseline/legacy-v1.0.40.html
- dist/index.html
- SHA-256 for both:
  877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f

## Next action

Do not repeat ordinary engineering or PU-01 through PU-12.

Next authorized workflow is Production Cutover Gate, and only after explicit Owner approval. Until then:
- no main merge;
- no production deployment;
- no Firebase production Rules publish;
- no production migration/write.
