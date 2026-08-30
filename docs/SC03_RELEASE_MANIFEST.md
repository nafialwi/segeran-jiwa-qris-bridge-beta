# SC-03 Release Manifest

Release label: `SEGERAN_JIWA_POS_SC03_FEATURE_MODULES_DELAYERING_v1`

## Immutable compatibility authority

- File: `baseline/legacy-v1.0.40.html`
- SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- Compatibility build: `dist/index.html`
- Compatibility SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

## Modular candidate

- Candidate: `dist-sc03/index.html`
- Candidate SHA256 at release verification: `5819aa73662a22bc75d28042d922cd20f24dd0d54e9718ef73e8487ebd12611c`
- Modular entries in candidate: 1
- Entry: `./src/sc03-entry.js`
- Package version: `0.3.0-sc03`

## Fixed data contracts

- POS root: `toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- QRIS engine: `SJQrisSignalBeta`
- Transaction commit authority: `processTransaction()`

## Feature runtime checkpoint

- Feature boundaries: 42
- Active boundaries: 40
- Deferred boundaries: 2 (`settings.appearance`, `settings.security-sync`)
- SC-02 domain seams verified: 7/7
- Public wrapper path: feature runtime registry → App Router → captured v1.0.40 compatibility authority
- Direct Firebase mutations in SC-03 app/core/modules: 0
- Pre-package automated regression: 61 pass, 0 fail

## Verification command

`npm run verify:sc03`

The release ZIP must be extracted and this command rerun from the extracted copy before the package is considered a valid checkpoint.
