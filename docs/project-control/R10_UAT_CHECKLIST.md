# R10 UAT Checklist — Pre-Deploy

Status: human UAT required before any production deployment.

## Environment rule

Run UAT only on LOCAL QA or the non-production PR preview. Do not publish Firebase rules, apply a live migration, or deploy production during UAT.

## A. Product Stock Components

1. Owner opens Product Stock Components and maps one product to one Item Stok. Save succeeds.
2. Owner maps one product to multiple Item Stok rows. Quantities are retained exactly.
3. Cashier cannot edit Product Stock Components configuration.
4. Completed normal sale with a mapping reduces each configured Inventory V2 Gerai item exactly once.
5. Reload/retry/recovery of the same completed sale does not decrement stock a second time.
6. A Rp0 sale still consumes configured physical stock.
7. Insufficient Gerai quantity reports shortage and never creates negative stock.
8. Product with no Product Stock Components mapping completes using its existing base sale behavior.
9. Genuine Recipe product still consumes its Recipe components normally.
10. If Recipe and Product Stock Components target the same physical item, sale fails closed with STOCK_COMPONENT_RECIPE_OVERLAP instead of double-consuming.

## B. Refund / Void

11. Refund with physical stock return restores only the historically applied Product Stock Component quantity.
12. Retrying the same refund does not restore twice.
13. Refund explicitly marked as not returning stock does not restore Product Stock Components.
14. Void restores the historical Product Stock Components exactly once.
15. Historical transaction without a stock application does not invent stock restoration.

## C. Cup Control

16. Opening shift requires physical counts for all supported Cup types.
17. Previous physical closing can be used as continuity reference without reading Inventory V2 Cup balances.
18. Live Restock during an active shift persists through Cup Control and increases the Restock total.
19. Transaction Usage is derived from transaction cup snapshots; VOID/CANCELLED does not count.
20. Refund of a disposable cup does not add the cup back to expected physical stock.
21. Closing calculation follows Expected Closing = Opening + Restock - operational usage.
22. Variance follows Physical Closing - Expected Closing.
23. Negative raw expectation is shown as uncovered usage/anomaly, never as negative stock.
24. Closing requires a reason for non-zero variance/anomaly.
25. On mobile, editing Restock/Physical Closing keeps input focus and does not rebuild the input node unexpectedly.

## D. Separation / Regression

26. Legacy product cp mapping never enters Recipe Inventory reservation.
27. Cup Control does not create Inventory V2 Opname from Cup physical closing.
28. Bahan & Gudang normal load remains responsive and does not read the full inventoryV2 root.
29. QRIS remains manual-only as previously locked.
30. Shift open/handover/close, receipt, sales history, reporting and Settings still open and function as before.
31. Frozen REF01/R6B/baseline authorities remain unchanged.
32. No production rules, data, migration, main branch, or production deployment is changed during UAT.

## UAT acceptance

Record each item as PASS / FAIL / N/A with evidence. Any FAIL blocks production deployment. Production remains locked until explicit approval after UAT.
