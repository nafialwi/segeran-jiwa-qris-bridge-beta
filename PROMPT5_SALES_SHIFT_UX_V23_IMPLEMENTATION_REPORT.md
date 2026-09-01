# Prompt 5 — Sales & Shift UX Corrective v2.3

## Scope
This corrective batch implements three conversation-approved additions without replacing existing business authorities:
1. Historical Date/Shift context and stale-shift recovery.
2. Smart Product Code Resolver for manual Enter and camera scanning.
3. Mini Cart bottom-sheet presentation reusing the existing cart/checkout flow.

## 1. Historical Date / Shift
- Mobile sales status now retains visible date context in the form `DD Mon YYYY · Shift ...`.
- A date context control is added without re-enabling the legacy arbitrary date picker as a write-triggering UI.
- The history sheet performs a read-only Firebase query over existing shift keys from the recent 45-day window.
- Only existing keys matching `YYYY-MM-DD-S1/S2/S3` are rendered. Missing dates/shifts are never synthesized.
- Stale ACTIVE shifts are marked `BELUM DITUTUP` with duration.
- Owner `Buka Closing` delegates to the existing `createStaleShiftAdapter().openClosing()` → `SJShift.openCloseModal()` authority.
- Opening an existing historical shift delegates to the existing date/shift selection mechanism.

## 2. Smart Product Code Resolver
- Camera and manual Enter now share the same canonical resolver.
- Auto-add never uses raw substring matching.
- Resolution order: exact stored code → safe legacy alias token → ambiguous/miss.
- Safe aliases include delimited tokens and standalone 8–18 digit retail-code runs, allowing legacy values such as `EAN:8993200664542` to resolve `8993200664542` without accepting partial code `899320066454`.
- Ambiguous aliases never auto-add.
- Camera evaluates every decoded candidate in a frame and chooses the unique database match instead of `found[0]`.
- When a decoded code does not match, the scanner remains open instead of closing immediately.
- Product-form scanner continues to delegate to the existing barcode authority.
- Successful resolution delegates to existing `quickAddCart(product.id)`, preserving shift guard, stock guard, cart state and checkout state.

## 3. Mini Cart
- No new cart state exists.
- Existing `SJFinalRefinementVC01A2.openCart()` remains the cart renderer and owns item rows, quantity changes, remove actions, customer field and Checkout CTA.
- v2.3 wraps only presentation: cart opens as a mobile bottom sheet (max-height 78%).
- Existing `+ / −`, remove, discounts, customer and Checkout remain existing authority behavior.
- Entering Checkout removes mini-sheet mode and restores the existing full Checkout surface.
- Returning from Checkout to Cart returns through the wrapped existing cart authority.

## Safety
- `baseline/legacy-v1.0.40.html` unchanged.
- No transaction, payment, inventory, debt, shift or Firebase write authority duplicated.
- Historical shift lookup is read-only (`once('value')`).
- Existing SC-03/SC-04 role/session routing remains intact.

## Verification
- Focused new suite: 7/7 PASS.
- Full `npm run verify:ref01`: 146/146 PASS, 0 FAIL.
- SC-01 compatibility hash remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
