# R10 UI Convergence / Stale Visual State — Pre-Production

Status: IMPLEMENTED; AUTOMATED GATES PASS; HUMAN UAT PENDING
Production mutation: 0

## Reported symptoms

The mobile UI could visually retain the previous state until the next click/input:
- Shift 1 time/count traces could remain while selecting/opening Shift 2.
- Closing Cup panel could retain the previous shift/session panel.
- Product +/- quantity controls could remain after a completed sale until the next product interaction.
- Checkout/payment method could visually retain Cash/QRIS/Kasbon state from the previous transaction.
- Kasbon customer could remain visible in the next sale until another interaction.

The underlying transaction/shift data was not proven stale; the issue was presentation/state convergence.

## Root causes addressed

1. Cup Opening preserved values from any existing panel without proving the panel belonged to the same shift.
2. Cup Closing reused an existing panel without proving shiftKey + sessionId identity.
3. Mobile close-summary DOM could survive modal reuse.
4. Successful sale cleared the canonical cart but did not always force the mobile product renderer to repaint immediately.
5. cartMethod / saleCustomer are long-lived presentation state and could survive into the next transaction.
6. Some mobile surfaces only converged after click/input caused a later render.

## Fix

### Shift/Cup context identity

Opening panel now carries:
- data-v34-shift-context = shiftKey

Closing panel now carries:
- data-v34-shift-context = shiftKey|sessionId

Opening drafts are preserved only when the context matches.

Closing panel is destroyed/rebuilt whenever shift or session context differs.

### Global UI convergence

New presentation-only module:
- src/ui/ui-convergence-v1.js

It:
- repaints Shift UI after canonical renderWithDay;
- removes stale mobile close summary before a new close modal opens;
- asks Cup Closing authority to re-enhance the current session;
- wraps the existing processTransaction only for post-result presentation convergence;
- detects successful sale by existing legacy cart snapshot: non-empty before -> empty after;
- resets next-sale presentation to Tunai;
- clears previous Kasbon customer presentation;
- rerenders product quantity controls after successful sale;
- synchronizes modal-cart and modal-bayar payment active classes;
- performs a two-frame repaint sentinel so the UI does not wait for a user click.

No transaction persistence logic is replaced.

### Failure safety

If a transaction fails and the cart remains non-empty:
- payment method is NOT reset;
- Kasbon customer is NOT cleared;
- user input remains available for correction/retry.

## Automated evidence

UI convergence unit/context tests:
- 9 / 9 PASS

Critical Shift/Payment/QRIS/Stock integration:
- 45 / 45 PASS

Full repository regression:
- 845 / 845 PASS
- 0 fail
- 0 skipped

REF-01:
- PASS
- 0 REF-01 RTDB mutations

SC-02:
- PASS

SC-04:
- PASS

Production:
- main merge 0
- deploy 0
- Firebase Rules publish 0
- production data writes 0

## Human UAT remaining

1. Close/select S1 -> S2 and verify old time/count presentation does not remain.
2. Open and close current shift modal without touching a field; values must already belong to the current shift/session.
3. Complete a sale and verify product +/- controls immediately return to empty-cart state.
4. Complete a Kasbon sale, start a new sale, and verify checkout starts clean at Tunai with no previous customer.
5. Switch Cash/QRIS/Transfer/Kasbon and verify selected visual state updates immediately without requiring a second click.
