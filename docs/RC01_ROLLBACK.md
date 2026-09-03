# RC01-S06 — Rollback & Recovery Authority

## Principle

RC-01 is a release candidate, not a production cutover. Production v2.9 remains live/untouched until an explicit production approval after browser/mobile and AppMint/WebView gates.

## Immutable authorities

- P5 v3.4 FINAL LOCKED source SHA256: `485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530`
- P4 v3.3 rollback SHA256: `024459afc271ca139b18f4211c9e01ff3bc1a202bf72e1b8ebd3bd118ca1aca8`
- P3 rollback anchor SHA256: `810e4001a002f868f8799f5713e2d529277aff7090e73bd5207953471268d35b`
- Legacy v1.0.40 compatibility HTML SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

## Before production approval

Rollback is trivial: do not promote the RC candidate. Leave the existing GitHub/Cloudflare production state and installed production APK unchanged.

## If a preview RC fails

1. stop using the failing preview URL/branch;
2. do not merge/push the RC into a production-connected branch;
3. return to the P5 locked source or correct the RC branch as a documented RC delta;
4. run fresh `npm run verify:rc01` before republishing a preview.

## If AppMint/WebView RC fails

- do not uninstall the currently working production POS to force installation;
- if Android reports signature/package conflict, STOP;
- retain the existing AppMint project, package identity and signing identity;
- classify a WebView-only problem under WIC-01 only when it is reproducible only in AppMint/WebView;
- fix as one blocker batch and rerun RC verification.

## If a later production cutover is approved and must be rolled back

The exact rollback procedure must use the then-current production deployment/commit identity captured immediately before cutover. Do not guess a Cloudflare deployment ID, Git commit, Firebase Rules snapshot, or APK signing state. Production cutover approval must first capture those values and a restore procedure.

## Data safety

RC-01 does not authorize database rollback/rewrite, historical HPP backfill, schema/root/rules changes, or balance correction. Any such operation requires its own explicit proposal and approval.
