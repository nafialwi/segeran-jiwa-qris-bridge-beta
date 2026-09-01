# Prompt 5 Sales & Shift UX Corrective v2.4 — Implementation Report

## Scope
Corrective response to real-device UAT after v2.3:
1. Owner must be able to choose an arbitrary calendar date (for example 25/26 Aug), inspect daily recap/transactions, then open any real shift from that date and close stale ACTIVE shifts.
2. Sales camera successfully decodes the barcode but v2.3 could still report no match although manual search found the product.
3. Selected product cards must expose inline `− qty +` immediately, while retaining the existing cart/checkout/payment authority.

## Root causes confirmed

### Barcode
`cloudData` is declared as a top-level lexical `let` in the legacy authority and is not a reliable `window.cloudData` property. v2.3 `activeProducts(runtime)` read `runtime.cloudData`, so the new camera resolver could receive an empty catalog even while the legacy/manual renderer read the real lexical catalog. The camera decoder itself was working.

v2.4 reads active products through the existing `SJRefinementSalesV100.activeProducts()` / `SJCommercialUIV5953.activeProducts()` catalog authority before any property fallback.

### Historical date
v2.3 only displayed a recent list of existing shifts and did not provide arbitrary calendar selection. The date chip also could be replaced by a later sales re-render.

v2.4 adds an Owner-oriented calendar selector. Each selected date is read without writes. `Rekap Semua Shift` selects the legacy recap mode (`shift-sel = ''`), whose existing listener aggregates the date without synthesizing S1/S2/S3. Only shift keys that actually exist are listed. Stale ACTIVE records continue to delegate to the existing Closing authority.

The sales renderer is post-enhanced after every render so the date/shift context is restored after search, category changes, scans, and re-renders.

### Product quantity control
The final refinement card always rendered a `+` control. Legacy `updateMenuBadges()` still maintained cart quantities but the refinement cards no longer provided the expected `item-minus-btn` and `item-qty-badge` nodes.

v2.4 decorates every sales card with those legacy-compatible nodes and keeps the existing plus control/listeners. Existing `quickAddCart`, `quickRemoveCart`, `updateCartUI`, stock guard, cart, checkout, payments, and transaction writers remain authoritative.

## Safety / architecture
- No new transaction writer.
- No new inventory writer.
- No new shift writer.
- No new RTDB mutation path.
- Arbitrary date recap uses the existing recap selection and query behavior; it does not select a nonexistent shift.
- Camera still delegates successful products to existing `quickAddCart`.
- Mini cart remains presentation over the existing final cart / checkout.

## Verification
Fresh source verification before packaging: `npm run verify:ref01` => 150 tests, 150 pass, 0 fail.
