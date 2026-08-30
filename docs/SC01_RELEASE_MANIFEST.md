# SC-01 Release Manifest

## Checkpoint

- Name: `Segeran Jiwa POS — SC-01 Clean Baseline Foundation`
- Version: `0.1.0-sc01`
- Migration authority: v1.0.40 VC-02A
- Runtime policy: compatibility-only; no intentional behavior change
- Next work package: SC-02 Core/Data/Domain Extraction

## Primary files

- `baseline/legacy-v1.0.40.html` — immutable rollback/migration authority
- `dist/index.html` — byte-identical compatibility build
- `audit/monolith-audit.json` — machine-readable source inventory
- `audit/monolith-audit.md` — human-readable audit
- `docs/SC01_IMPLEMENTATION_REPORT.md`
- `docs/SC01_AUDIT_SUMMARY.md`
- `docs/SC01_EXTRACTION_MAP.md`
- `docs/SC01_LEGACY_DEBT_REGISTER.md`
- `docs/SC01_FIREBASE_WRITE_MAP.md`
- `docs/SC01_ROUTE_MENU_MAP.md`
- `docs/SC01_SESSION_AUTH_MAP.md`
- `docs/SC01_QRIS_CONTRACT_MAP.md`
- `docs/SC01_CSS_RENDERER_LAYER_MAP.md`
- `docs/SC01_HIGH_RISK_FLOW_MAP.md`
- `docs/SC01_CHECKPOINT_STATUS.md`
- `docs/SC01_HANDOFF_TO_SC02.md`

## Frozen contracts

- POS root: `toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- Package ID: `id.segeranjiwa.pos`
- Existing QRIS authority: `SJQrisSignalBeta`
- Firebase Rules/schema unchanged
- No UI redesign in SC-01
