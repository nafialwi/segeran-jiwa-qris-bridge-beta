# Segeran Jiwa Legacy R8-B1 Verification Report

Date: 2026-09-08
Status: **IMPLEMENTATION VERIFIED — PREVIEW/UAT NOT YET RUN BY USER**

## Scope implemented
- Suppress the redundant `Transaksi <id> berhasil.` success toast when the receipt/success overlay is already visible. Other toast types and other success messages remain unchanged.
- Show read-only `Cup & Kemasan · Stok Gerai` on the Cashier Stock surface.
- Use the existing P5 cup-shift cache (`p5Packaging.shiftControl.cupRows()`) so B1 adds **no new Firebase read/listener**.
- Include the current catalog rows, including **Cup Paper 10 Oz**.
- Hide cashier Stock actions `Penyesuaian` and `Gudang`; keep `Restock` and `Riwayat`.
- Preserve Owner behavior.

## Source investigation note
The existing Restock request writer is product-centric (`productId`, `global/inventory/<productId>`). B1 therefore does **not** fake a Cup Restock request by writing cup/ingredient data through the product writer. Extending request/receive semantics for cup/ingredient stock belongs in R8-B2 Inventory Safety, where writer authority and receiving variance are audited together.

## TDD evidence
- New R8-B1 contract was observed RED before implementation: 0/6 PASS.
- After implementation: 6/6 PASS.
- A further RED test was added to require reuse of the existing P5 cup cache; it failed before wiring and passed after wiring.

## Final verification evidence
- Targeted cup/payment/R7 tests: PASS.
- Full serial regression: **615/615 PASS, 0 fail**.
- SC03 verifier: PASS — 0 direct mutations.
- SC04 verifier: PASS — direct RTDB mutation allowlist preserved.
- REF01 verifier: PASS — 0 REF01 RTDB mutations.
- RC01-S10C-R6D verifier: PASS.

## Frozen authority hashes preserved
- `baseline/legacy-v1.0.40.html` = `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- `src/app/rc01-runtime-loading-hardening.js` = `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`
- `src/compat/rc01-qris-deferred-settlement-compat.js` = `d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355`
- `src/compat/rc01-qris-manual-bypass.js` = `80d867cca96a0f4b5dfdc2012e51f9e53da999ed4df9e09d4c6aeb7f87363156`
- `src/compat/rc01-sync-authority.js` = `a6c43e32f06f49ccce3bcabb74b710c116fde96ebf47b5db8cf0bcb1ab7d96d4`
- `src/ref01-entry.js` = `22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b`
- `emergency-d1/schema.sql` = `627a5daa62c593ec5de29c50b50dd43538acc260f77e494ea45e177fb01fc44b`
- `emergency-d1/src/core.js` = `8523f65e64ec371c4aaaf1321c6decadc60cdca7e02c5d2750d682e3044c56ad`
- `emergency-d1/src/worker.js` = `2ad8f41b6910b8fb37d284fea656dc7e8a359630a6f9c865c0ce9321920ef917`

## UAT gate before merge
1. Cashier → Operasional → Stok: `Cup & Kemasan` visible with actual Gerai quantities and Paper Cup 10 Oz.
2. Cashier Stock: `Penyesuaian` and `Gudang` no longer appear; `Restock` and `Riwayat` remain.
3. Complete one test payment: only one success surface remains (the existing `Pembayaran berhasil` screen); no extra top transaction-success toast.
4. Trigger a non-transaction warning/info toast to confirm toast system still works.
5. Owner Stock/Inventory remains unchanged and Owner can still access Gudang/adjustment.

Do not merge to Production until this Preview UAT is clean.
