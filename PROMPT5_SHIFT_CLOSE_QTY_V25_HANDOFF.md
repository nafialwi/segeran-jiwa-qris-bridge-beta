# Prompt 5 v2.5 — QA Handoff

Validate on the deployed Android/browser build:

1. Select an old date such as 29 Aug 2026.
2. Select an unresolved ACTIVE shift that previously displayed `Sesi aktif tidak ditemukan.`
3. Choose `Buka Closing`, enter the required physical cash/reconciliation fields, and submit.
4. Expected: the shift closes through the existing closing writer. It must not create a new active shift/session id.
5. Reopen the date: closed shift must show as closed rather than `BELUM DITUTUP`.

Quantity stepper:
1. Add a product once.
2. Expected card state: a compact aligned `− 1 +` stepper.
3. Tap +, −, and reduce to zero.
4. Expected cart bar, mini cart, and card quantity stay synchronized.

Barcode scanner was already UAT PASS in v2.4 and is regression-only in this patch.
