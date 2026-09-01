# Segeran Jiwa POS v2.8 — Implementation Report

Date: 2026-09-01
Baseline: `SEGERAN_JIWA_POS_PROMPT5_PRODUCTION_SALES_STABILITY_v2.7`
Frozen legacy SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

## Scope implemented

### A. Icon Foundation B01-B05
- Ships exactly 61 locked production SVG assets (56 outline + 5 dedicated active navigation assets).
- B06 is excluded from production assets.
- Bottom navigation uses dedicated outline/active locked SVGs; active state is not synthesized by filling outline geometry.
- Official refresh uses B03 locked refresh asset.
- Missing semantic icons no longer silently fall back to cube/warehouse-box.
- `verify-v28-icons.mjs` validates count and exact SHA256 of locked assets and is wired into `npm run verify:ref01`.

### B. Production Runtime Hardening
- Owner/Cashier refresh is explicit and deterministic: reads current data and rerenders active surfaces without calling date/shift switching authority.
- Removed global click-to-enhance as primary lifecycle; MutationObserver/runtime scheduling performs deterministic enhancement.
- Cart quantity mutation routes through one presentation synchronization helper for product cards/cart/Mini Cart presentation.
- Receipt reconciliation keeps one active receipt presentation when the refined receipt is present.
- Current-user avatar exposes upload/change/use-initial actions via existing media lifecycle and Firebase Auth profile authority; no new RTDB profile schema.
- Notification badge reconciles to persistent unread events only. Unresolved action conditions stay visible in their action surfaces without being re-added to unread count.

### C. Reporting Architecture
- One canonical Owner `Laporan Penjualan` renderer.
- Owner KPIs: Penjualan Bersih, Transaksi, Rata-rata Transaksi, Item Terjual.
- Period controls: Hari Ini, 7 Hari, 30 Hari, Bulan Ini, Custom.
- Chart metrics: Omzet, Transaksi, Item; data comes from transaction read-model.
- Payment mix, Top Produk toggle Jumlah/Omzet, shift summary, and read-only transaction history entry/drilldown.
- Cashier keeps Laporan Shift presentation and adds Transaksi, Item Terjual, payment mix, and read-only sales history.
- VOID/VOIDED/CANCELLED/CANCELED contribute zero; refunds are deducted where applicable.
- Unknown HPP is displayed as `Belum tersedia`, never synthesized as Rp0.

### D. Finished Goods Stock safe mode
- Introduces dedicated `Stok Barang Jadi` presentation, separate from advanced Inventory/Bahan & Gudang.
- Explicit flow: Gudang → Gerai → Penjualan → Stok Akhir.
- Normal ending stock remains in Gerai; no synthetic movement is created.
- Finished-good products remain visible even when recipe metadata exists; normal sales still use the production compatibility path that bypasses unfinished recipe interception.
- Damage/expiry/loss/difference paths produce an Owner reconciliation draft + WhatsApp text only.
- No new approval RTDB writer was added. Owner stock mutations delegate to existing Inventory V2 / Stock Opname authority.

## Preserved production authorities
- Barcode camera and scanner authority were not rewritten.
- Historical date/shift selector and legacy stale-shift recovery were not rewritten.
- Mini Cart and persistent session remain existing authorities.
- Role guards remain existing authorities.
- `displayOrder` sales ordering remains preserved.
- Transaction, QRIS, inventory, shift, refund, and debt writers were not duplicated.

## Verification result before packaging
- Fresh v2.7 baseline: 174/174 PASS.
- Integrated v2.8 working tree: 194/194 PASS.
- SC-01 contracts: PASS.
- SC-02: PASS, 0 direct Firebase mutations in extracted/modular sources.
- SC-03: PASS.
- SC-04: PASS, 0 modular RTDB mutations.
- Locked icon guard: PASS, 61/61 exact assets.
- Frozen legacy SHA256 before/after integrated verification: unchanged.

Final package verification is recorded separately in `verification_logs/` after a fresh ZIP extraction.
