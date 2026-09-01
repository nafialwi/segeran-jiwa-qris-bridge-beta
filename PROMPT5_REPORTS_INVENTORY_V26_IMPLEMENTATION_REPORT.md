# Prompt 5 Reports & Finished-Goods Inventory Corrective v2.6

## Scope implemented

### Sales History — all roles, read-only
- Adds a `Riwayat Penjualan` entry to the Report surface for Owner and Cashier.
- Uses the existing `SJReportFoundationV010.state.model.transactions`; no second transaction store is created.
- Supports report-period selection plus Shift, payment method, cashier, and free-text transaction/product filtering.
- Every transaction row can be opened to show sold products, quantities, unit prices, refund-adjusted net quantity, line revenue, cashier, shift, method, status, subtotal, discount, and total.
- The detail surface contains no Refund/VOID action. Cashier remains read-only; Owner administrative corrections continue through the existing operational authority.

### Product leaderboard
- Adds Top Products with two explicit ranking modes: `Jumlah Terjual` and `Omzet`.
- VOID transactions contribute zero.
- `refundedQty` is subtracted per stored transaction line.
- Revenue uses stored pricing-line net revenue when available and otherwise uses the stored item price times remaining quantity.

### Finished-goods warehouse simplification
- Adds Owner-only `Stok & Gudang` to the Operational screen.
- Daily flow is presented as `Gudang → Gerai → Penjualan` for finished products only.
- `Terima ke Gudang` delegates to `SJInventoryV2.open('purchase')` and filters the existing selector to `P:` product options.
- `Kirim ke Gerai` delegates to `SJInventoryV2.open('transfer')` and filters the existing selector to `P:` product options.
- `Stok Gerai` delegates to `openOpr(3)`.
- Balance preview reads existing `global/inventory` and `global/inventoryV2/productWarehouse` only; this module contains no inventory mutation writer.

### Recipe/formula safety
- Ingredient/recipe management is intentionally not promoted into the daily finished-goods flow.
- Existing recipe toggle is presented as `Batalkan Rumus` / `Aktifkan Rumus`.
- Cancellation is non-destructive and continues to use the existing recipe active/nonactive writer. No permanent recipe deletion was added.

### Quantity stepper
- Replaces the visually detached v2.5 `38|32|38` control with a 96px single pill using `32|28|32` geometry.
- Minus and plus are circular controls; quantity is centered with tabular numerals.
- Cart behavior remains `quickAddCart` / existing remove/badge authority.

## Safety
- `baseline/legacy-v1.0.40.html` unchanged.
- No new direct RTDB mutation in extracted domain/data boundaries.
- No new transaction/payment/inventory/shift writer.
- Existing barcode, historical shift selection, legacy close recovery, checkout, QRIS, stock, and session architecture retained.

## Verification
- Focused v2.6 test: 10/10 PASS.
- Full `verify:ref01`: 163/163 PASS, 0 FAIL.
- SC-02: 0 direct Firebase mutations in extracted boundaries.
- SC-03: 0 direct app/core/module mutations.
- SC-04: 0 modular RTDB mutations.
- REF-01 verifier: 9 references, 11 screen families, 0 REF-01 RTDB mutations.
