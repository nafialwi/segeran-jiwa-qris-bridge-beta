# Segeran Jiwa POS v2.9 — Reporting v2 Implementation Report

## Status
Implemented in the isolated v2.9 candidate. No GitHub/Codespaces/Cloudflare deployment was performed.

## Canonical report architecture
- One controller owns Shift / Hari / Minggu / Bulan Ini / Custom scope.
- Shift/day/week filters are applied to the same transaction, shift, and expense read model.
- Owner report includes net sales, transactions, average transaction, items sold, payment mix, adaptive real-data chart, Top Produk, shift/cash summary, sold-item rows, and clickable transaction history.
- Cashier retains Laporan Shift presentation and adds transaction count, item count, payment mix, sold items, current outlet stock, and read-only sales history.
- Top Produk and sales history inherit the canonical filtered model.
- VOID/CANCELLED is excluded; refunds are deducted by the existing v2.8 analytics authority.
- Unknown HPP remains `Belum tersedia`.

## Historical stock honesty lock
No historical inventory snapshot writer was added. The report labels balances as `Stok Gerai Saat Ini`; it does not claim that today's current balance is a historical period-ending balance.

## Safety
No new direct RTDB mutations were introduced in modular source. Firebase roots and frozen transaction/QRIS/inventory/shift/session authorities remain unchanged.
