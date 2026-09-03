# RC01-S06 — Release Manifest

Date: 2026-09-03

## Release identity

- Release label: **v3.4 RC-01**
- Phase: **RC-01 — Release Hardening + AppMint Gate**
- Immutable P5 authority SHA256: `485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530`
- Legacy migration/compatibility baseline SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- RC working branch: `rc01-release-hardening`
- Production deployment authorization: **NO**

## Release-only deltas

RC-01 does not reopen P5 business/financial authority. The local RC candidate adds only:

1. reconnect revalidation retry after a preserved session could not be validated while offline;
2. browser print / Save-as-PDF receipt fallback (`Simpan PDF / Cetak`);
3. dedicated RC release contract verifier;
4. deterministic `dist-rc01` build + source-critical manifest;
5. local HTTP preview support for `dist-rc01`.

No new Firebase writer, database root, schema, rules, package ID, historical HPP writer/backfill, or production deployment is introduced.

## Automated release evidence

Fresh `npm run verify:rc01` after the local-preview blocker fix:

- full Node suite: **439/439 PASS, 0 fail**;
- B01–B05 icon authority: **61/61 PASS**;
- presentation `!important` budget: **252/252**;
- Finance verifier: **9/9 PASS**;
- SC01 contracts: PASS;
- SC02: PASS, mutations restricted to exactly three P4 dedicated writers;
- SC03: PASS;
- SC04: PASS;
- REF01: PASS;
- RC01 contract verifier: PASS;
- destructive `.remove()` in dedicated writers: absent;
- local RC preview test: PASS.

## Deterministic browser/AppMint static tree

Build command:

`npm run build:rc01`

Output:

`dist-rc01/`

Current deterministic `index.html` SHA256:

`ae0db0fd429bbc7527cb34de4b452313c7f5ab2fe81bfe66afa5fb3f39da6fc4`

`dist-rc01/RC01_SOURCE_SHA256.txt` contains a stable sorted SHA256 manifest for **209 files**. `RC01_RELEASE.json` records the P5 authority hash and explicitly says `productionDeploymentAuthorized=false`.

## Package checksum rule

The final ZIP-level SHA256 cannot be embedded inside the same ZIP without changing that ZIP. Package SHA256 values are therefore recorded in adjacent `.sha256` sidecars and in the outer RC checkpoint manifest created after packaging.
