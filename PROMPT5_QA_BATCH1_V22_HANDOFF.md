# Handoff — Prompt 5 QA Batch 1 v2.2

## Scope
Corrective convergence for deployed QA observations on REF_01, REF_02, and REF_03.

## Deploy target
- Build command: `npm run build:ref01`
- Output: `dist-ref01`
- Production branch: `main`

## Expected automated gate
- `npm run verify:ref01`
- Expected suite count for this package: 139 tests / 139 pass / 0 fail.

## Consolidated device QA after deployment
Capture or visually verify in one pass:
- Pengaturan: grouped hierarchy + filled responsibility icons; Perangkat Aktif opens device/session surface.
- Bottom nav: moving active capsule; no vertical drop; active cube and gear remain recognizable.
- Stok: back/title/help on one row; four KPI semantic icons; product list works; action handlers remain available.

Do not proceed to REF_04–REF_06 if any of these visual/runtime gates fail.
