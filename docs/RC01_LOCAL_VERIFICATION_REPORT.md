# RC01 — Local Automated Verification Report

Date: 2026-09-03

## Command

`npm run verify:rc01`

## Fresh result after preview-server correction

- Exit code: **0**
- Node tests: **439/439 PASS**
- Fail: **0**
- B01–B05 locked icon authority: **61/61 PASS**
- V3.0 presentation authority: **PASS**, `!important` **252/252**
- V3.1 UX guard: **PASS**
- V3.2 Reporting + Inventory guard: **PASS**
- V3.3 Finance verifier: **9/9 PASS**
- SC01 contracts: **PASS**
- SC02: **PASS**, mutations restricted to exactly three P4 dedicated writers
- SC03: **PASS**
- SC04: **PASS**
- REF01: **PASS**
- RC01 release contract: **PASS**
- RC build: **PASS**
- `dist-rc01/index.html` SHA256: `ae0db0fd429bbc7527cb34de4b452313c7f5ab2fe81bfe66afa5fb3f39da6fc4`
- deterministic `dist-rc01` manifest: **209 files**

## RC-specific regression coverage added

- offline preserved-session reconnect retry;
- repeated `online` events cannot create overlapping restore attempts;
- printable receipt HTML escapes user/receipt text;
- browser print/Save-as-PDF uses an isolated print frame and no POS persistence;
- receipt success action enhancement is idempotent;
- RC release verifier covers release boundaries and mutation allowlist;
- RC build is deterministic and carries immutable P5 authority;
- local preview server actually serves `dist-rc01` over HTTP.

## Production impact

**NONE.** All work in this report is local isolated RC source/build verification. No GitHub push, Cloudflare deployment, Firebase mutation, AppMint build/install, or production data change was performed.
