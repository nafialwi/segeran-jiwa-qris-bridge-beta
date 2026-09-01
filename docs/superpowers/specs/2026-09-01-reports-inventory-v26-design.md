# Segeran Jiwa POS Reports & Finished-Goods Inventory v2.6 Design

## Scope

This corrective batch extends Prompt 5 without waiting for the new icon family. It does not replace frozen transaction, payment, stock, shift, or session writers.

### 1. Sales history for all roles
- Owner and Cashier can open a read-only Sales History from Reports.
- History follows the selected report period and may be filtered by shift, cashier, payment method, or transaction id/product text.
- A transaction row opens a read-only detail showing items, quantities, unit prices, line totals, cashier, shift, payment, pricing totals, refund/VOID state, and costing evidence when available.
- Cashier never receives Refund/VOID administrative actions from this surface.

### 2. Product leaderboard
- Sales History contains Top Products with a toggle between `Jumlah Terjual` and `Omzet`.
- Quantity ranking uses net units after `refundedQty`; VOID transactions count as zero.
- Revenue ranking uses stored pricing line net values when available, otherwise the stored product price times net quantity. No dummy values are invented.

### 3. Finished-goods warehouse flow
- The daily operational UX exposes one Owner-only `Stok & Gudang` entry.
- The hub shows finished products only and presents the flow `Gudang → Gerai → Dijual`.
- `Terima ke Gudang` delegates to the existing `SJInventoryV2.open('purchase')` writer UI and filters the selector to product (`P:`) options.
- `Kirim ke Gerai` delegates to the existing `SJInventoryV2.open('transfer')` writer UI and filters the selector to product (`P:`) options.
- `Stok Gerai` delegates to existing `openOpr(3)` stock authority.
- Inventory reads may read existing Firebase paths, but this refinement introduces no direct inventory write.

### 4. Recipe handling while formulas are not final
- Ingredient/recipe flow is not promoted into the simplified daily warehouse flow.
- Existing recipe variants remain under advanced inventory management.
- Existing `Nonaktifkan` behavior is relabeled as `Batalkan Rumus`; this preserves history and uses the existing recipe writer. No destructive recipe delete is introduced.

### 5. Quantity stepper polish
- Existing cart authority remains unchanged.
- Selected product cards use a compact single capsule `− qty +` with balanced touch targets, centered tabular quantity, circular minus/plus controls, and no visually detached columns.

## Safety constraints
- Frozen baseline `baseline/legacy-v1.0.40.html` must not change.
- No new transaction/payment/inventory/shift RTDB writer in modular source.
- Report access is read-only for Cashier.
- Existing Owner Refund/VOID workflow remains elsewhere and is not exposed to Cashier.
