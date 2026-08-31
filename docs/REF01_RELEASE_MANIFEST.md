# REF-01 / PROMPT 5 Corrective Release Manifest

## Candidate
- Phase: `REF-01 / PROMPT 5 corrective convergence`
- Package version: `0.5.0-ref01`
- Candidate directory: `dist-ref01/`
- Entry: `src/ref01-entry.js` exactly once
- Candidate HTML SHA256: `e417c5ed2713f696e5e3e07194e65d3d0cd133df383783ca2c669c69fcab4970`
- Candidate build fingerprint before documentation-only changes: `5dd42afbc457e08ec7dd80e2dabd97a6735d605dd57bd4d4a110948495ab1c4d`

The HTML SHA is stable because `dist-ref01/index.html` is the frozen v1.0.40 HTML plus one external module entry; corrective logic lives under `dist-ref01/src/` and is covered by project manifest/fingerprint.

## Rollback / compatibility
- Frozen baseline: `baseline/legacy-v1.0.40.html`
- Compatibility dist: `dist/index.html`
- Frozen SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- Prior candidate directories retained: `dist-sc03/`, `dist-sc04/`

## Automated gates before final packaging
- Full regression: `130/130 PASS, 0 FAIL`
- Refinement authorities: `9/9`
- Implementation evidence: `9/9`, missing files `0`, missing anchors `0`
- Screen-family architecture coverage: `11/11`, unresolved selectors `0`
- Settings groups: `6/6`
- REF-01 direct RTDB mutation files: `0`
- Fixed Firebase roots retained
- One REF-01 entry only
- Default correction MutationObserver: disabled

## Corrective scope added after failed intermediate visual candidate
- grouped REF_01 Settings;
- unified icon authority;
- five-tab role-safe bottom navigation and duplicate-label prevention;
- profile photo choose/replace/remove;
- Reports and Notifications refinement;
- stale Shift recovery;
- Closing/Handover/Refund presentation hardening;
- focused receipt/transaction surfaces to prevent bottom-nav overlap;
- concrete REF_09 system-state selector;
- 9/9 implementation-evidence verifier.

## Classification
- F-PASS: PASS automated/regression
- A-PASS: PASS automated/static
- R-PASS: PASS
- V-PASS: CANDIDATE, pending consolidated QA-01 real-device comparison
- UI FREEZE: NOT YET

## Verification command

```bash
npm run verify:ref01
```

Project manifest and release ZIP SHA256 are generated only after the final post-document verification run.
