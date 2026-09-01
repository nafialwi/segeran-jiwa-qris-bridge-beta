# Release Manifest — Prompt 5 QA Batch 1 Corrective v2.2

Authority: Prompt 5 / nine-image refinement pack. This release only closes additional REF_01–REF_03 QA gaps discovered on real device.

Key production changes:
- `src/ui/icons.js`: dedicated solid refinement icon geometry.
- `src/ui/bottom-nav.js`: active icon no longer produced by blind SVG fill replacement.
- `src/ui/icon-authority.js`: legacy refinement renderers use stronger semantic icon treatment.
- `src/ui/settings-refinement.js`: REF_01 responsibility icons use solid treatment.
- `src/ui/stock-refinement.js`: non-writer REF_03 stock presentation decorator.
- `src/ui/ref01.css`: Stock header/capsule icon convergence hardening.
- `src/app/ref01-bootstrap.js`: installs Stock presentation decorator.
- `tests/ref01-qa-batch1-visual-convergence.test.mjs`: regression gates for the real-device findings.

Generated audit evidence is intentionally excluded from the stable SHA256 project manifest because `verify:*` updates timestamped audit outputs.
