# PROMPT 5 Corrective REF-01 Handoff to QA-01

## Why this handoff is different

An earlier REF-01 deployment was technically green but visually diverged from the nine refinement authorities and exposed real-device defects. It is not the final visual authority. This corrective candidate must be reviewed as one consolidated nine-reference batch, not through serial one-button testing.

## Primary comparison authority

1. REF_01 — grouped Settings/profile/data-sensitive hierarchy.
2. REF_02 — bottom navigation icon/label/active/motion behavior.
3. REF_03 — Stok/Hutang/Operasional/Edit Produk.
4. REF_04 — Owner/Kasir Dashboard, Penjualan, Checkout.
5. REF_05 — Shift/Handover, Closing, Refund/VOID, Transaction Detail/Receipt.
6. REF_06 — Reports, Notifications, Product media, advanced Settings responsibilities.
7. REF_07 — Cart, Barcode, Restock, Expense.
8. REF_08 — Checkout, Tunai, QRIS waiting/success/ambiguity.
9. REF_09 — Transfer/Kasbon, Edit Product, Stock Adjustment, system states.

## Consolidated real-device evidence batch

Capture representative screenshots/UAT in one batch:
- Owner Dashboard + owner profile.
- Kasir Dashboard + cashier profile/account route.
- Jual with photo product + no-photo fallback + search/scanner affordance.
- Cart + Checkout.
- Tunai; QRIS waiting and one safe status state; Transfer/Kasbon representative screen.
- Operasional home + Stok + Restock + Pengeluaran.
- Shift active/detail + Closing/Handover if safe; include stale/open shift if available without altering real business data.
- Refund/VOID search/evidence without executing destructive action unless specifically intended.
- Transaction detail and fullscreen receipt; confirm bottom nav does not overlap focused receipt.
- Reports home + one detail/evidence flow.
- Notifications list/filter/deep-link representative state.
- Grouped Settings + photo choose/remove affordance; do not perform sensitive deletion.
- One safe system state: offline/reconnecting or empty/error state.

Primary mobile evidence widths: 390/430. Use 320 only to catch narrow-layout defects. Tablet/desktop only when a responsive anomaly is observed.

## Acceptance classification

Each finding must be classified:
- Functional
- Architecture / IA
- Visual
- Regression

Related findings are corrected in one batch. UI FREEZE requires no major Visual/IA mismatch against the nine references and explicit F/A/V/R status.

## Safety rules during QA
- Do not invent new QRIS/payment/transaction/inventory/debt/refund writers.
- Do not direct-edit Firebase to clear stale shift.
- Do not weaken Owner/Kasir role guards for visual matching.
- Do not treat current Transfer-proof draft as permission to add an unapproved transaction evidence field.
- Do not execute destructive Settings/Refund/VOID solely to obtain a screenshot.
