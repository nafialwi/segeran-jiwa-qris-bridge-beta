# Segeran Jiwa POS v2.8 — QA Handoff

Automated verification is mandatory and already included. Production/UAT should be performed on a non-destructive test session before deployment to the live Cloudflare target.

## P0 runtime checks
1. Login Owner and Cashier; verify persistent session still restores correctly.
2. Press Refresh from both roles while cart contains items: selected date/shift and cart must not change.
3. Add one product, then multiple products; exercise product tap, +/−, scanner, and Mini Cart. Quantities must stay synchronized.
4. Complete one cash transaction and one QRIS test transaction; confirm exactly one active receipt surface.
5. Open current-user avatar: upload/change image, then switch back to initials.
6. Read a notification, navigate away/back, and confirm unread badge does not return unless a new unread persistent event arrives.

## Reporting checks
1. Owner Laporan Penjualan: test Hari Ini, 7 Hari, 30 Hari, Bulan Ini, and Custom.
2. Toggle chart Omzet/Transaksi/Item and Top Produk Jumlah/Omzet.
3. Compare one known period against transaction history totals/payment methods.
4. Open a transaction drilldown and confirm item lines/refund state.
5. Confirm VOID is excluded and refund reduces period figures where applicable.
6. Confirm unknown HPP reads `Belum tersedia`.
7. Cashier Laporan Shift retains shift summary and adds transaction/item/payment/history information read-only.

## Finished Goods Stock checks
1. Open `Stok Barang Jadi`; verify Gudang → Gerai → Penjualan → Stok Akhir explanation.
2. Confirm normal stock remains at Gerai without a synthetic movement.
3. Owner transfer and Stock Opname buttons must open existing Inventory V2 authority.
4. Cashier damage/loss/expiry/difference must create only a draft/WhatsApp path; it must not directly reduce stock.
5. Owner reconciliation must be completed only through existing Inventory V2/Opname authority.

## Preserve/regression checks
- Barcode camera still scans a known product.
- Historical date/shift selector remains usable.
- Legacy stale shift close recovery remains usable.
- Role guard blocks Cashier from Owner-only surfaces.
- Mini Cart remains usable.
- `displayOrder` remains respected.
- A product with legacy recipe metadata can still enter the normal finished-goods sales cart.

## Deployment gate
Do not deploy if any P0 check above fails. Keep v2.7 production package available for rollback until v2.8 UAT passes.
