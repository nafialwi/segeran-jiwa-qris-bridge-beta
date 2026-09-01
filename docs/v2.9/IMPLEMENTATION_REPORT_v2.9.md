# Segeran Jiwa POS v2.9 — Integrated Implementation Report

Date: 2026-09-02
Status: Integrated candidate, automated verification complete; production deployment intentionally deferred until QA handoff/UAT.
Baseline: Segeran Jiwa POS v2.8 integrated final.

## Scope delivered

### P0 browser-runtime hardening
- Payment-success receipt owns one visible action surface; legacy duplicate receipt actions are hard-hidden by explicit success state.
- Per-item cart trash action is removed from the active mobile cart to eliminate stale/re-entrant deletion. `-`, `+`, item discount and the single `Kosongkan` authority remain.
- Sales-history query updates result regions without replacing the focused input, preventing Android keyboard focus loss on each keystroke.
- Non-tracked product cards no longer display `Siap dijual`; real tracked-stock context remains.
- Header Help/Refresh controls share a stable mobile action group.
- Operational summary labels the active shift instead of falsely claiming full-day aggregation.
- Profile avatar upload/remove uses user-scoped browser-local zero-cost persistence; Firebase Storage and RTDB are not required. Cross-device avatar sync remains outside v2.9.

### Canonical Reporting v2
- One read controller owns `Shift / Hari / Minggu / Bulan Ini / Custom` scope.
- Shift/day/week filters apply to the same transaction, shift and expense read model.
- Owner report: Penjualan Bersih, Transaksi, Rata-rata Transaksi, Item Terjual, payment mix, adaptive real-data chart, Top Produk, Ringkasan Kas & Shift, Barang Terjual and clickable transaction history.
- Cashier retains `Laporan Shift` presentation and adds Transaksi, Item Terjual, payment mix, Barang Terjual, current outlet stock and read-only transaction history.
- Top Produk and transaction history inherit the canonical report scope.
- VOID/CANCELLED remains excluded; refunds are deducted through the existing analytics authority; unknown HPP remains `Belum tersedia`.
- Historical-stock honesty policy: current inventory is labelled `Stok Gerai Saat Ini`, never a fabricated historical `Stok Akhir`.

### Finished Goods v2
- `Stok Barang Jadi` presents **Gudang** and **Gerai** separately.
- Product lookup uses searchable name/SKU/ID rows rather than a large product dropdown.
- Tabs: `Gudang / Gerai / Pergerakan`.
- `Set Stok Gudang` delegates to existing Inventory V2 Stock Opname at warehouse location.
- `Transfer ke Gerai` delegates to existing Inventory V2 transfer.
- `Pembelian (Advanced)` remains the existing cost/purchase authority and is not required to establish a physical Gudang balance.
- Exception conditions (rusak/basi/sobek/bocor/kedaluwarsa/hilang/selisih) create no stock mutation; they produce a WhatsApp draft and delegate Owner reconciliation to existing Stock Opname.
- Operational activity grid is refined for mobile two-column presentation and the Finished Goods card is concise (`Gudang & Gerai`).

## Source change boundary

Compared with v2.8, production changes are limited to modular presentation/read-domain files:
- `src/app/ref01-bootstrap.js`
- `src/compat/ref01-production-sales-compat.js`
- `src/domain/finished-goods-stock.js`
- `src/domain/report-v28-analytics.js`
- `src/domain/report-v29-scope.js` (new)
- `src/ui/critical-operational-refinement.js`
- `src/ui/finished-goods-warehouse-refinement.js`
- `src/ui/media-lifecycle.js`
- `src/ui/production-sales-stability.js`
- `src/ui/ref01.css`
- `src/ui/report-refinement.js`
- `src/ui/report-sales-history-refinement.js`
- `src/ui/transaction-detail-refinement.js`

No frozen legacy monolith replacement was made.

## Deliberately deferred

- Historical inventory closing snapshots / historical `Stok Akhir` writer.
- Cross-device profile-avatar server sync.
- New persistent in-app stock-exception approval queue.
- Any Firebase root/schema migration.
- GitHub/Codespaces/Cloudflare deployment during development.
