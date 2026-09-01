# Segeran Jiwa POS v2.8 — Database / Writer Audit

## Safety conclusion
v2.8 does not introduce a new direct RTDB mutation in modular UI/domain/compat source. Existing production writers remain owned by the frozen/existing authorities.

## Fixed database roots
- POS: `toko_segeranjiwa_v58`
- QRIS: `segeranjiwa_qris_beta_v1`

No root rename or schema migration was introduced.

## Frozen legacy proof
`baseline/legacy-v1.0.40.html` SHA256 is:

`877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

The v2.7 isolated baseline and v2.8 candidate produce the same hash.

## Writer ownership
- Transaction/sales writer: existing frozen production authority — unchanged.
- QRIS pending/signal writer: existing frozen QRIS authority — unchanged.
- Inventory/transfer/purchase/opname writers: existing Inventory V2 authority — unchanged; v2.8 finished-goods UI delegates to it.
- Shift/open/close/handover writer: existing frozen shift authority — unchanged.
- Refund writer: existing frozen permission-aware refund authority — unchanged.
- Debt/cashbon writer: existing frozen authority — unchanged.
- Notification read/deep-link writer: existing notification authority — v2.8 changes presentation/badge reconciliation only.
- Persistent session/auth: existing SC-04 authority — unchanged.
- Avatar: uses existing media storage lifecycle plus Firebase Auth `updateProfile`; no new RTDB profile schema.

## New v2.8 database interactions
`finished-goods-warehouse-refinement.js` performs read-only `.once('value')` reads for outlet and product-warehouse balances. Runtime refresh performs read-only reads of the fixed POS root/current selected shift. No direct `.set/.update/.transaction/.remove` was added to modular source.

## Automated evidence
- SC-04 reports `0 modular RTDB mutations`.
- Independent source scan for `.set/.update/.transaction/.remove` under `src/` reports `NONE`.
- Raw audit evidence: `verification_logs/03_V28_DATABASE_WRITER_AUDIT_RAW.log`.
