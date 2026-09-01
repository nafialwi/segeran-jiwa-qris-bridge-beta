# Prompt 5 — QA Batch 1 Corrective v2.2

## Trigger
Real-device QA after v2.1 showed that routing/capsule state improved, but visual convergence for REF_01–REF_03 was still incomplete.

Observed evidence:
- Settings hierarchy was grouped correctly, but responsibility icons remained outline-heavy compared with the stronger filled icon treatment in REF_01.
- Bottom navigation capsule followed the active tab, but generic outline→fill conversion collapsed internal geometry: Operasional became a solid hexagon and Pengaturan became an unrecognizable blob.
- Stock route opened correctly, but the Stok child header rendered back/help vertically on the left instead of back–title–help in one row; KPI warning/out/safe states still used literal `!`, `×`, `✓` symbols rather than semantic icons.
- Perangkat Aktif routing fix from v2.1 remains retained. Real-device screenshot proof is still pending; automated owner-safe route gate remains present.

## Root causes
1. `bottom-nav.js` used string replacement (`fill="none"` → `fill="currentColor"`) on outline SVGs. This is not a valid solid-icon transformation for compound geometry.
2. `installRefinementIconAuthority()` still returned outline icons to legacy VC01/VC02 renderers, causing cross-screen icon drift from the visual authority.
3. Stock header layout depended on legacy CSS cascade and was not protected by a REF-specific override.
4. Stock KPI warning/safe icons were hard-coded characters in frozen legacy renderer output.

## Corrective implementation
- Added dedicated `renderFilledIcon()` geometry authority for the refinement icon vocabulary.
- Active bottom-nav icons now use dedicated solid geometry while inactive icons remain outline.
- Settings responsibility cards use the stronger filled icon authority.
- Legacy VC01/VC02 semantic icon adapter uses the filled authority, improving dashboard/operational visual consistency without replacing business renderers or writers.
- Added `stock-refinement.js` as a non-writer DOM presentation decorator:
  - tags REF_03 stock surface;
  - replaces `!`, `×`, `✓` with warning-triangle / x-circle / check-circle semantic SVGs;
  - preserves existing stock data and action handlers.
- Added REF-specific CSS to force Stock header into `back | title/subtitle | help` row.

## Safety boundaries retained
- Frozen baseline remains unchanged.
- No direct Firebase/RTDB mutation was added.
- No transaction, inventory, restock, shift, debt, payment, or auth writer was replaced.
- SC-01 → SC-04 gates remain required by `verify:ref01`.

## Automated verification
After implementation, full `npm run verify:ref01` produced 139 tests / 139 pass / 0 fail. REF-01 verifier reported 9 references, 11 screen families, 0 REF-01 RTDB mutations, fixed roots/hash retained.

## Runtime QA status
This package is a corrective candidate, not a visual-final claim. Deployment QA must confirm:
1. active Operasional icon retains cube facets and active Pengaturan icon is recognizable as a gear;
2. Settings icons are visually closer to REF_01;
3. Stok header is one horizontal row and KPI icons are semantic;
4. Perangkat Aktif opens the device/session surface, not Printer.
