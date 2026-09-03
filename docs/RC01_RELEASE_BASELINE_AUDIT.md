# RC01-S01 — Release Baseline & Environment Audit

Date: 2026-09-03

## Authority

- P5 v3.4 / F03-01: FINAL LOCKED by user acceptance.
- Locked nested source SHA256: `485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530`.
- Working copy: isolated from the immutable continuity/nested ZIP.
- Production v2.9: LIVE / UNTOUCHED.
- POS root: `toko_segeranjiwa_v58`.
- QRIS root: `segeranjiwa_qris_beta_v1`.

## Fresh baseline verification

`npm run verify:ref01` from a clean extraction:

- full tests: 429/429 PASS;
- B01–B05: 61/61 PASS;
- presentation `!important`: 252/252;
- Finance verifier: 9/9 PASS;
- SC02/SC03/SC04/REF01: PASS;
- modular mutation allowlist: exactly three P4 dedicated writers;
- destructive remove: forbidden.

Raw log: `verification_logs/RC01_BASELINE_VERIFY.log`.

## Remote environment coordinates

### GitHub

User-confirmed existing repository:

`https://github.com/nafialwi/segeran-jiwa-qris-bridge-beta`

User screenshot confirms:

- default branch `main`;
- second branch `qris-bridge-v0.3.0-archive`;
- current `main` visibly contains POS source/build structure including `dist-sc04`, `dist`, `docs`, `scripts`, and `src`.

The historical repository name is retained intentionally. RC-01 must not create a replacement repository merely to rename it.

Authenticated remote inspection/push is not available in this execution environment. Container DNS cannot reach GitHub, and public search did not independently index this private workflow state. Therefore current commit/Cloudflare branch binding will not be guessed.

### Cloudflare

Continuity context identifies project/preview coordinate `segeran-jiwa-pos-preview` / `https://segeran-jiwa-pos-preview.pages.dev`, but the active branch binding and custom-production-domain mapping cannot be independently verified from this execution environment. RC-01 therefore treats Cloudflare remote mutation as an external gate until configuration is observed directly.

## RC capability audit

| Capability | Current evidence | RC classification |
|---|---|---|
| Owner/Kasir routing/role guards | Existing route contracts + broad regression | AUTOMATED_COVERED |
| Login/session persistence | SC04 manager/runtime tests | AUTOMATED_COVERED |
| Cold-start offline | Envelope retained, auto-login withheld until server validation | AUTOMATED_COVERED |
| Offline → reconnect recovery | No bootstrap listener retries `session.restore()` after `OFFLINE_REVALIDATION_REQUIRED` | RELEASE_FIX_REQUIRED |
| Android/system Back | Existing legacy `SJMobileFoundation.handleBack`, `popstate`, `backbutton`, Escape hierarchy | REAL_DEVICE_REQUIRED |
| Barcode/manual fallback | Barcode feature + smart camera fallback | AUTOMATED_COVERED + REAL_DEVICE_REQUIRED |
| Camera permission/lifecycle | `getUserMedia`, BarcodeDetector, track stop path exists | REAL_DEVICE_REQUIRED |
| QRIS | Existing `SJQrisSignalBeta` adapter/authority preserved | AUTOMATED_COVERED + REAL_DEVICE_REQUIRED |
| Printer | Native/PrinterBridge/RawBT path exists | REAL_DEVICE_REQUIRED |
| Receipt share | WhatsApp deep link with clipboard fallback exists | REAL_DEVICE_REQUIRED |
| PDF/print-to-PDF | No explicit release PDF/print fallback in current source | RELEASE_FIX_REQUIRED |
| Notification/deep-link | Existing notification refinement wraps authority, tests present | AUTOMATED_COVERED + REAL_DEVICE_REQUIRED |
| Closing/Handover/Refund/VOID | Existing SJShift / operational authorities + P5 tests | AUTOMATED_COVERED + REAL_DEVICE_REQUIRED |
| Reports/HPP/Profit | P5 v3.4 safe-evidence semantics + 429 suite | AUTOMATED_COVERED + REAL_DEVICE_REQUIRED |
| Build/hash/package | REF01 build exists; no dedicated RC verifier/build manifest yet | RELEASE_FIX_REQUIRED |
| GitHub/Cloudflare preview | coordinates known, authenticated configuration unavailable here | EXTERNAL_GATE |
| AppMint/WebView | cannot be proven by static/Node tests | REAL_DEVICE_REQUIRED |

## S01 conclusion

RC-01 may continue locally. Three release-boundary gaps are actionable without production mutation:

1. offline/reconnect retry after a preserved session cannot validate at cold start;
2. explicit receipt print/PDF fallback is absent;
3. dedicated RC build/verifier/manifest is absent.

No database/schema/root/rules/business-authority change is required for these fixes.
