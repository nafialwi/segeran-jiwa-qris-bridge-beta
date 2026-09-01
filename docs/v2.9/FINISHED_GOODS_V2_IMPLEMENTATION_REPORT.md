# Segeran Jiwa POS v2.9 — Finished Goods v2 Implementation Report

## Status
Implemented in the isolated v2.9 candidate. Existing Inventory V2 / Stock Opname remains the writer authority.

## User-facing model
- Primary surface: `Stok Barang Jadi`.
- Gudang and Gerai balances are displayed separately.
- Product lookup uses search by name/SKU/ID instead of a large product dropdown.
- Tabs: Gudang / Gerai / Pergerakan.
- Normal sales consume Gerai stock through the frozen production path.
- Normal ending stock stays at Gerai; no fake movement is created.

## Owner actions
- `Set Stok Gudang` delegates to existing Inventory V2 Stock Opname with location `warehouse` and product preselection.
- `Transfer ke Gerai` delegates to existing Inventory V2 transfer with product preselection.
- `Pembelian (Advanced)` remains available only as the existing purchase/costing authority; it is not required to establish physical Gudang stock.
- `Pergerakan` delegates to existing Inventory V2 movements.

## Exception flow
Rusak / basi / sobek / bocor / kedaluwarsa / hilang / selisih:
- creates no stock mutation;
- uses a searchable product picker;
- produces a WhatsApp draft explicitly stating `BELUM MENGUBAH STOK`;
- Owner reconciliation delegates to existing Outlet Stock Opname authority.

## Operational UI
- Mobile Operational activity grid is two columns.
- Finished Goods card is concise: `Stok Barang Jadi — Gudang & Gerai`.
- Finished Goods modal and exception form have dedicated mobile CSS.

## Database safety
No Firebase root/schema change and no new modular `.set/.update/.transaction/.remove` writer was introduced.
