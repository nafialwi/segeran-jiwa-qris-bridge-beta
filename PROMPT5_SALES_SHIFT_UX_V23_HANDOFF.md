# Prompt 5 Sales & Shift UX v2.3 — Handoff

Deploy target remains Cloudflare Pages with:
- Build command: `npm run build:ref01`
- Output: `dist-ref01`
- Production branch: `main`

## Consolidated real-device QA after deployment
1. Sales header shows date + shift; tap it and confirm old existing shifts are listed.
2. An overdue ACTIVE historical shift shows `BELUM DITUTUP` and Owner can open existing Closing flow.
3. Scan JASJUS barcode `8993200664542`; camera must add the same product that manual product search locates.
4. Unknown barcode must not close the scanner immediately or add another product.
5. Add two products; tap floating cart; mini cart shows actual existing cart lines.
6. Change quantity using `−/+`; product card and total remain synchronized through existing cart authority.
7. Tap Checkout; existing Checkout/Payment flow must remain unchanged.

Icon-family integration is intentionally outside this v2.3 batch and can be layered later.
