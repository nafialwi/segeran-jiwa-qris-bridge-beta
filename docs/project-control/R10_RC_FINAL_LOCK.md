# Segeran Jiwa Legacy — R10 Final Release Candidate Lock

Locked: 2026-09-22
Phase: Final Release Candidate before production cutover
Branch: work/r10-preuat-convergence

## Final candidate identity

- Runtime/source authority before this documentation-only lock:
  1fa3b79ee5b33c7d1ee449fdc66871f12c73caf4
- Remote branch at lock start:
  origin/work/r10-preuat-convergence = 1fa3b79ee5b33c7d1ee449fdc66871f12c73caf4
- REF01 candidate dist-ref01/index.html SHA-256:
  320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf
- REF01 build fingerprint:
  f3fdfc96431e2a21481f3e41c040ac5e23adb4da2f983a30580df2ec7f397844
- Final mobile UAT harness commit:
  1fa3b79ee5b33c7d1ee449fdc66871f12c73caf4
- Final responsive/focus UAT fix:
  f70456eece458815b54713c2b9d71d103f4f5105
- Windows/WSL RTDB UAT remediation:
  c5504a34e93274dc9477632f4fb01c67cd8f5ff2
- PU-10 engineering checkpoint:
  d2ddaed9e2e61240bcc613975f214e22e3ef295b

## Acceptance state

- PU-01 through PU-10 engineering convergence: COMPLETE
- PU-11 Human UAT desktop: ACCEPTED
- PU-11 Human UAT real mobile/LAN: ACCEPTED
- PU-12 UAT remediation: COMPLETE
- Final mobile UAT targeted tests: 14 / 14 PASS
- Final serial regression: 798 / 798 PASS
- REF01 build/verifier: PASS
- Human UAT confirmation: accepted by Owner on 2026-09-22

## Production remains untouched

This RC lock does NOT authorize or perform:
- merge to main;
- production deployment;
- Firebase production Rules publication;
- production database/storage mutation;
- production migration/backfill.

At lock preparation:
- origin/main: 4b32e91111fa2e78b34ff80ba0f432971b3c24fa
- production tag r9-cup01-prod-20260914:
  8018c40ae74f0b01d8b31d558828d26cd867bca2
- PR #6 remains Draft and unmerged.

## Immutable rollback authority

- baseline/legacy-v1.0.40.html SHA-256:
  877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f
- dist/index.html SHA-256:
  877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f

## Final RC decision

The branch is accepted as the R10 Final Release Candidate.

The next phase is a separately approved production cutover gate. Do not repeat PU-01 through PU-12 unless a concrete regression is found.

## Resume rule

1. Fetch GitHub.
2. Verify the Final RC tag and branch.
3. Verify source cleanliness.
4. Do not merge or deploy production without explicit cutover approval.
