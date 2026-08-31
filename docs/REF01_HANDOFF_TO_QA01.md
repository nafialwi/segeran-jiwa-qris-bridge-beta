# REF-01 Handoff to QA-01

REF-01 is an automated F/A/R-PASS candidate and a V-PASS candidate. QA-01 is a consolidated real-device correction pass, not a return to one-prompt-one-polish iteration.

## Representative screenshots/UAT
Capture one coherent batch covering:
1. Owner Dashboard.
2. Kasir Dashboard.
3. Jual with search + scanner affordance + product photo/fallback.
4. Cart.
5. Checkout and payment-method chooser.
6. Tunai plus QRIS waiting/critical state; Transfer/Kasbon representative state.
7. Operasional home.
8. Stok / Stock Detail / Edit Produk including add/replace/remove photo.
9. Restock and Pengeluaran.
10. Shift/Closing/Handover; include stale/open-shift presentation if safely available.
11. Refund/VOID.
12. Reports home plus one evidence-detail report.
13. Grouped Settings including profile-photo and Tampilan Aplikasi.
14. One offline/reconnecting/error/permission state when safely reproducible.

Use mobile 390/430 as the primary evidence set; add 320 for narrow-layout defect detection and tablet/desktop only for responsive anomalies.

## Acceptance classification
Every finding must be classified separately:
- Functional
- Architecture / IA
- Visual
- Regression

Correct related findings in one batch. Do not introduce new design concepts outside the nine refinement references. UI FREEZE is allowed only when there is no major Visual/IA finding and F/A/V/R status is explicit.

## Known deliberate limitation to verify, not silently expand
Transfer proof image is previewable local draft only until an approved existing transaction evidence writer exists. QA must not treat the absence of invented persistence as permission to add a new transaction schema during UI correction.
