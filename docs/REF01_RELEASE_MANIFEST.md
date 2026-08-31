# REF-01 Release Manifest

## Candidate
- Phase: `REF-01`
- Package version: `0.5.0-ref01`
- Candidate directory: `dist-ref01/`
- Entry: `src/ref01-entry.js` exactly once
- Candidate HTML SHA256: `e417c5ed2713f696e5e3e07194e65d3d0cd133df383783ca2c669c69fcab4970`

## Rollback / compatibility
- Frozen baseline: `baseline/legacy-v1.0.40.html`
- Compatibility dist: `dist/index.html`
- Frozen SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- Prior candidates retained: `dist-sc03/`, `dist-sc04/`

## Automated gates
- Full regression: `109/109 PASS, 0 FAIL`
- Refinement references: `9/9`
- Screen-family architecture coverage: `11/11`, unresolved selectors `0`
- Settings groups: `6/6`
- REF-01 direct RTDB mutation files: `0`
- Fixed Firebase roots retained
- One REF-01 entry only
- Default correction MutationObserver: disabled

## Classification
- F-PASS: PASS automated/regression
- A-PASS: PASS automated/static
- R-PASS: PASS
- V-PASS: CANDIDATE, pending QA-01 real-device evidence
- UI FREEZE: NOT YET

## Verification
Run:

```bash
npm run verify:ref01
```

The release ZIP/project manifest hashes are generated after the final verification run and accompany the packaged artifact.
