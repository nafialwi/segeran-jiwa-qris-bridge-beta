# RC01-S08 — Real-Device Browser UAT

## Gate purpose

Automated verification proves F/A/R contracts that can be tested in Node/static source. It cannot prove Android browser/WebView camera, printer, system Back, notification lifecycle, or visual/device behavior. This UAT must run against the exact RC preview deployment produced by S07.

## Device preparation

- use the same Owner and Kasir devices/roles used for prior acceptance where practical;
- do not replace/uninstall the current production APK for browser UAT;
- record the RC Preview URL and RC package SHA256 before starting;
- avoid real QRIS payment until the controlled QRIS prerequisites below are green.

## Owner path

1. Open preview and login as Owner.
2. Close/reopen browser/tab; valid session must restore.
3. Turn network off, reopen/refresh, then restore network; preserved session must revalidate automatically after `online` without duplicate login/shift.
4. Navigate Dashboard → Jual → Cart/Checkout → back; Android/system Back must follow route/modal hierarchy instead of exiting unexpectedly.
5. Open barcode scanner: permission prompt, camera start, cancel/close, and manual fallback must remain usable.
6. Exercise QRIS UI states without real payment first: pending readiness, amount, cancel/retry, duplicate-pending protection.
7. Complete a safe test sale appropriate to the existing environment and inspect receipt.
8. Use existing printer path where hardware is available.
9. Use WhatsApp/share receipt.
10. Use **Simpan PDF / Cetak** and verify Android/browser print or Save-as-PDF flow opens without changing transaction data.
11. Open a notification and verify its deep-link target; returning/back must remain coherent.
12. Open closing/report and verify totals/history/HPP coverage labels remain coherent.
13. Background/resume the browser and confirm the session/active state remains coherent.

## Kasir path

1. Login as Kasir and confirm Owner-only surfaces remain unavailable.
2. If an active shift exists, close/reopen and confirm that shift restores rather than duplicating.
3. Repeat offline → reconnect restoration.
4. Jual → Cart → Checkout → receipt; verify +/- cart controls and payment flow.
5. Android Back must not jump into Owner routes or destroy current shift state.
6. Barcode/camera fallback, QRIS states, printer/share/PDF and notification/deep-link must work within Kasir permissions.
7. Closing/handover path must preserve the existing shift authority and cup/reconciliation semantics.

## Controlled real QRIS prerequisite

Do not make a real QRIS test payment until all are confirmed:

- pending ready is correct;
- transaction amount is exact;
- there is no duplicate pending payment;
- cancel/retry has been exercised safely;
- operator understands which test transaction will occur.

## Evidence to return

A single consolidated UAT batch is enough. Report each area as `PASS` or give the exact symptom. Representative screenshots are useful for:

- Owner Dashboard;
- Kasir Dashboard;
- sale/checkout + receipt action;
- QRIS critical state;
- scanner/camera;
- notification deep-link;
- closing/report.

Also report Android/browser model/version for any device-specific failure.

## Gate interpretation

- Functional/browser success contributes to **F-PASS / A-PASS / R-PASS**.
- Real-device visual comparison contributes to **V-PASS**.
- **W-PASS is not granted by browser UAT; it requires AppMint/WebView UAT after the AppMint Gate is opened.**
