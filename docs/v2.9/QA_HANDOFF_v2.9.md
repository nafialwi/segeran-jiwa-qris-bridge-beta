# Segeran Jiwa POS v2.9 — QA Handoff

Automated candidate status: green. Production deployment: not performed during v2.9 development.

## Mandatory device/browser UAT before final production acceptance

1. Persistent session on the main Pages domain survives browser close/reopen.
2. Owner and Kasir role guards remain correct.
3. Refresh works without blank-screen tap, cart clearing or date/shift change.
4. Sales: one product and multiple products keep `+/-` synchronized; barcode camera remains functional.
5. Cart: no per-item trash button; global `Kosongkan` works; checkout remains valid.
6. Payment: execute a controlled low-value transaction; success screen shows exactly one Print/WhatsApp/Finish action set; transaction appears once in history.
7. Transaction-history search: type a multi-character ID/product query continuously; Android keyboard stays open.
8. Profile avatar: upload/change/use initials works on the same browser/device. Note: v2.9 avatar is intentionally device-local, not cross-device.
9. Owner Reporting: check Shift, Hari, Minggu, Bulan Ini and Custom; filters must consistently change KPI/chart/Top Produk/history.
10. Cashier Reporting: Laporan Shift remains read-only and includes transactions, items, payment mix, sold items and history.
11. Historical report: inventory label must say `Stok Gerai Saat Ini`; do not interpret it as historical `Stok Akhir`.
12. Finished Goods: Gudang and Gerai are clearly separated; search by product name/SKU/ID works.
13. Owner Set Stok Gudang: verify product/location preselection and existing Stock Opname flow before confirming a real change.
14. Transfer Gudang -> Gerai: verify existing Inventory V2 transfer flow and resulting balances.
15. Exception draft: Rusak/Basi/etc must not change stock immediately; WhatsApp draft states it has not changed stock; Owner reconciliation opens existing Outlet Stock Opname.
16. Legacy stale-shift recovery, Mini Cart, notifications, refund/VOID, debt/kasbon and closing shift remain functional.

## Stop conditions

Do not deploy/accept if any of these occur:
- duplicate transaction;
- duplicate receipt action surface;
- direct stock change from exception draft;
- role guard bypass;
- shift/date changed by Refresh;
- historical current stock presented as historical ending stock;
- browser console/runtime error that blocks a core flow.
