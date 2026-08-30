# SC-04 Release Manifest

Release label: `SEGERAN_JIWA_POS_SC04_PERSISTENT_SESSION_SOURCE_WORKFLOW_v1`

## Immutable compatibility authority

- File: `baseline/legacy-v1.0.40.html`
- SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- Compatibility build: `dist/index.html`
- Compatibility SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

## Modular candidates

- SC-03 candidate: `dist-sc03/index.html`
- SC-03 SHA256: `5819aa73662a22bc75d28042d922cd20f24dd0d54e9718ef73e8487ebd12611c`
- SC-04 candidate: `dist-sc04/index.html`
- SC-04 SHA256 at release verification: `47fb219a7d87ee29aecab1d26161ddb45ce461e890c3816b7f35d6fd1f3f9f43`
- SC-04 modular entries in candidate: 1
- Entry: `./src/sc04-entry.js`
- Package version: `0.4.0-sc04`

## Fixed data and writer contracts

- POS root: `toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- QRIS engine: `SJQrisSignalBeta`
- Transaction commit authority: `processTransaction()`
- Firebase Rules/schema: unchanged
- Billing/Blaze: not enabled by SC-04

## Persistent-session checkpoint

- Session authority: one `Session Manager`
- Local storage boundary: `src/data/local-store.js` only
- Plaintext PIN/password/credential in persisted envelope: none
- HYBRID/SECURE Firebase Auth persistence: `LOCAL`
- Cold-start offline auto-login: disabled / fail-closed
- Restore validation: current POS user + valid role + exact device; HYBRID/SECURE additionally validate Firebase UID/auth mapping
- Active shift restore: delegated to captured legacy login/shift authority; SC-04 contains no shift-create/start path
- Manual logout: invalidates local envelope before legacy logout
- Live revocation guard: active for user/device state
- Direct Firebase RTDB mutation in SC-04 modular layer: 0
- Auth wrapper ownership: login 1 / completeLogin 1 / logout 1
- Pre-package automated regression: 84 pass, 0 fail

## Source workflow checkpoint

- Source verification command: `npm run verify:sc04`
- Project file hash manifest: `SC04_PROJECT_SHA256.txt`
- Local Git checkpoint: created during release packaging when the workspace has no upstream repository
- GitHub remote authority: requires an actual repository target/authorized connection; credentials are never stored in this package
- Cloudflare static preview: downstream of GitHub authority and only on a zero-cost target; no backend migration

## UAT status

Automated session and structural regression is part of this release gate. Real browser/HP UAT for close/reopen, manual logout, revoked/disabled user/device, and active-shift restore remains a deployment/device check and must not be represented as automated PASS.

## Verification command

`npm run verify:sc04`

The release ZIP must be extracted, its `SC04_PROJECT_SHA256.txt` checked before execution, and this command rerun from the extracted copy before the package is considered a valid SC-04 checkpoint.
