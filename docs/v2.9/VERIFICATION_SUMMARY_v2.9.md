# Segeran Jiwa POS v2.9 — Verification Summary

Release freeze: 2026-09-02
Package version: 2.9.0

## Fresh integrated verification

Command: `npm run verify:ref01`
Result at release freeze: **217 pass / 0 fail**.

Safety gates:
- B01-B05 locked icon guard: PASS (61/61; B06 excluded)
- SC-01 contracts/audit: PASS
- SC-02: PASS; 0 direct Firebase mutations in extracted JS authority
- SC-03: PASS; 0 direct mutations in modular feature boundaries
- SC-04: PASS; 0 modular RTDB mutations; persistent Firebase Auth LOCAL session preserved
- frozen compatibility hash: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

## v2.9 targeted regression coverage

- P0/browser-runtime: single receipt surface; stable cart delete model; focus-preserving history search; removed `Siap dijual`; stable Refresh placement; truthful shift summary.
- Reporting v2: deterministic scopes; metadata/filtering; adaptive chart; Owner/Kasir presentations; canonical Top Produk/history; current-stock honesty.
- Finished Goods v2: separated Gudang/Gerai balances; searchable picker; delegation to existing Opname/Transfer; no-write exception draft; two-column Operational UI.

## Release policy

Approved Option A: no historical stock snapshot writer in v2.9. Historical reports show sold-item evidence and `Stok Gerai Saat Ini` only.

## Fresh-package proof

A provisional release ZIP was extracted into a clean directory and verified:
- source-critical manifest: **355/355 OK before verifier**;
- full verifier: **217/217 PASS**;
- source-critical manifest: **355/355 OK after verifier**;
- modular direct RTDB mutation tokens: **0**;
- frozen baseline SHA256 unchanged.

Generated `audit/`, `dist*`, and `verification_logs/` are intentionally excluded from the source-critical manifest because the verifier regenerates timestamped audit evidence.
