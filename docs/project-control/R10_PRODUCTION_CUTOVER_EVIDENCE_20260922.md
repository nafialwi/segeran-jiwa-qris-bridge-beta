# R10 Production Cutover Evidence — 2026-09-22

Status: PRE-CUTOVER EVIDENCE IN PROGRESS
Production mutation status: NOT STARTED
Final RC tag: r10-rc-final-20260922

## Proven current production identity

Git / source:
- origin/main commit: 4b32e91111fa2e78b34ff80ba0f432971b3c24fa
- live production rollback tag: pre-r10-cutover-20260922
- rollback tag commit: 4b32e91111fa2e78b34ff80ba0f432971b3c24fa

Cloudflare Pages:
- project: segeran-jiwa-pos-preview
- stable live URL: https://segeran-jiwa-pos-preview.pages.dev/
- GitHub Cloudflare Pages check external ID for current main:
  b2802c5e-9754-43ae-84b5-a4ef77fadfea
- live index SHA-256:
  06fffea689f26dc0aeed7c2c58dc82122e80425808570243d7e619e0c2d067e1
- clean rebuild of origin/main SHA-256:
  06fffea689f26dc0aeed7c2c58dc82122e80425808570243d7e619e0c2d067e1
- exact live vs origin/main rebuild match: YES
- old production tag rebuild match: NO

This proves the currently served stable Pages artifact corresponds exactly to origin/main at capture time.

## Final RC identity

- Final RC tag: r10-rc-final-20260922
- Final RC commit: 177bb056ae29181f9e0978c212d192bcad7fa089
- Final serial regression: 798 / 798 PASS
- REF01 verifier: PASS
- RC candidate SHA-256:
  320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf
- GitHub RC prerelease source/evidence/checksums: AVAILABLE and independently re-downloaded/verified.

## Firebase production identity proven from live production HTML

- projectId: segeranjiwa-id
- authDomain: segeranjiwa-id.firebaseapp.com
- databaseURL:
  https://segeranjiwa-id-default-rtdb.asia-southeast1.firebasedatabase.app
- storageBucket: segeranjiwa-id.firebasestorage.app
- database application root: toko_segeranjiwa_v58

## Firebase Rules state

R10 intentionally has no invented canonical production Rules file.

Required source of truth is a fresh exact deployed-Rules export:

    npx --yes firebase-tools@latest database:get /.settings/rules --project segeranjiwa-id

The fresh export must then be passed to:

    node firebase/r10/build-stock-components-rules.mjs --live <fresh-export> --out-dir <cutover-evidence-dir>

Firebase CLI authentication:
- authenticated interactively on 2026-09-22;
- project segeranjiwa-id is visible to the authenticated account;
- no service-account credential was introduced.

Fresh production Rules evidence:
- exact deployed Rules export: COMPLETE
- raw export SHA-256:
  d1c51aac70f89cf07062d2546fe9eec86f360c9e12ed8f8df1734d5cb9be1a2e
- live canonical SHA-256:
  43f183db9c18b3a89cdfad209cbce7332c3966b57a0793fd340aa0915c0b1b83
- generated candidate canonical SHA-256:
  204ae8df27b398b7cde420064f5a1f9cfa1a50e46d550f9cfb5682168ad492a2
- candidate file SHA-256:
  39d5e4665f8a7b66483aa044aaee0532fafbe6141b5b10867e8194be94292cf1
- generated rollback file SHA-256:
  3173e62493c84254bd0dea6abb236aae94e4224bf0c3b980a1121c51afdcc2de
- rollback canonical content matches the fresh live export: YES
- changed Rules paths reported by generator: 8
- unexpected changed paths: 0
- semantic changes outside rules/toko_segeranjiwa_v58/global/inventoryV2/: 0
- Rules contract test: 5 / 5 PASS
- production-derived Rules emulator lifecycle gate: PASS
- deploy command count during generation/testing: 0
- production mutation count during generation/testing: 0
- Rules publication: NOT AUTHORIZED and NOT ATTEMPTED

## Rollback snapshot

GitHub tag:
- pre-r10-cutover-20260922
- points exactly to current live origin/main commit 4b32e91111fa2e78b34ff80ba0f432971b3c24fa

GitHub prerelease:
- Pre-R10 Cutover Production Rollback Snapshot — 2026-09-22

Rollback source ZIP SHA-256:
- 2d05fcac556ec875098e65d16c3fe5eaf1215a97c541d4cdeeb1a6eec9b32924

Rollback production-evidence ZIP SHA-256:
- 5f7f9ad7154fae8b600aa252a3f50782d02c889d10fb358aac7bcafd0fb6ac96

The evidence bundle contains the captured live HTML and HTTP headers in addition to the source archive.

## Android / AppMint scope

Existing release documentation records a Web-first distribution decision.

AppMint/WebView is DEFERRED / N-A for the Web Release and is not W-PASS. Therefore APK/AppMint signing identity is not a blocker for this Web production cutover. It becomes mandatory only if Android APK/AppMint replacement is separately added to the cutover scope.

## Mandatory fresh-evidence checklist

1. current origin/main exact commit — COMPLETE
2. current production Git/tag/deployment identity — COMPLETE
3. current Cloudflare production deployment identity and rollback target — COMPLETE
4. fresh read-only Firebase production Rules export — COMPLETE
5. canonical comparison live Rules vs approved R10 candidate — COMPLETE
6. current production Firebase project/database/storage identities — COMPLETE
7. pre-cutover backup/export evidence — COMPLETE
8. APK/AppMint signing identity — N/A FOR WEB-FIRST CUTOVER
9. rollback procedure using actual pre-cutover identities — COMPLETE
10. final branch/tag/RC artifact checksums — COMPLETE

Evidence completion: 10 / 10 = 100%

## Mandatory approval gates

- Final RC tag resolves to expected commit — PASS
- RC source verification green — PASS
- live production Rules freshly read and reviewed — PASS
- unexplained main/deployment divergence — NONE FOUND
- rollback target proven and reachable — PASS
- production credential path ready — PASS
- explicit Owner approval for production mutation — NOT YET GIVEN

## Planned cutover order after the two blocked evidence items are cleared

No step below is authorized yet.

Completed before approval:
1. Firebase CLI authenticated on the Owner-approved account;
2. current live Rules exported read-only and exact rollback copy checksummed;
3. R10 candidate Rules generated from that exact live export;
4. contract + emulator verification completed;
5. exact Rules diff reviewed and limited to R10 Inventory V2 stock-component paths;
6. main / Cloudflare live fingerprint and rollback tag evidence captured.

Remaining controlled sequence:
7. present final go/no-go evidence to Owner and request explicit production-cutover approval;
8. only after approval, execute the separately controlled production mutation sequence;
9. verify production smoke and exactly-once stock behavior;
10. retain rollback anchors until post-cutover acceptance is complete.

## Safety status

At this evidence checkpoint:
- evidence completeness: 100%
- main merge: 0
- production deployment: 0
- Firebase Rules publication: 0
- production database/storage writes: 0
- migration/backfill: 0
- next gate: explicit Owner production-cutover approval
