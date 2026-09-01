# Prompt 5 Sales & Shift UX Corrective v2.4 — QA Handoff

## Real-device acceptance targets

### A. Arbitrary date / shift
1. Owner opens Sales and taps date/shift context.
2. Choose a historical date such as 25 Aug 2026 or 26 Aug 2026.
3. `Lihat Rekap Semua Shift` must open that date in recap/read-only context without creating missing S1/S2/S3.
4. Existing shifts for that date are listed only if they exist.
5. A stale ACTIVE shift shows `BELUM DITUTUP` and Owner can delegate to existing Closing.
6. Date/shift label remains visible after sales rerender/search/scan.

### B. Camera barcode
1. Scan a product barcode that is stored in the product edit form.
2. The decoded number must resolve against the same active product catalog used by Sales.
3. A unique match calls the existing `quickAddCart` and closes the camera.
4. Unknown codes keep scanner active; ambiguous codes are never auto-added.

### C. Inline product quantity
1. Tap product once: card changes from `+` to `− 1 +`.
2. Tap plus: quantity increments and cart total changes.
3. Tap minus: quantity decrements; at zero card returns to `+`.
4. Bottom mini cart and checkout continue to reflect the same existing cart state.

## Automated gate
Expected `npm run verify:ref01`: 150 pass / 0 fail.
