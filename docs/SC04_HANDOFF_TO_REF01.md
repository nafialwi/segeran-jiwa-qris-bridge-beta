# SC-04 Handoff to REF-01

REF-01 must treat `src/` from the SC-04 checkpoint as the business/session source authority and keep these contracts fixed:

- compatibility rollback hash `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`;
- POS root `toko_segeranjiwa_v58`;
- QRIS root `segeranjiwa_qris_beta_v1`;
- SC-02 high-risk writer ownership;
- SC-03 router/feature runtime ownership;
- SC-04 one Session Manager and safe-envelope policy;
- Firebase Auth LOCAL persistence for HYBRID/SECURE;
- no cold-start offline auto-login;
- no shift creation during session restore.

REF-01 may change visual/component/token/renderer source but must not replace the session state machine, login validation, QRIS engine, or business writers.
