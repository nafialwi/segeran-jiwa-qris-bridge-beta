# RC01-S10A.1 Targeted Real-Device QRIS UAT

Use only the Cloudflare Preview deployment for the S10A.1 commit. Do not use Production.

## A — Durable late Rp5.000 convergence
1. Open/refresh the Preview with the existing durable `Perlu Tindakan` Rp5.000 late-after-cancel evidence.
2. Wait at least 60 seconds.
3. PASS: the `Perlu Tindakan` card remains after refresh.
4. PASS: no repeated legacy toast `QRIS Rp5.000 masuk dan belum cocok dengan transaksi pending.`
5. PASS: the red `MENUNGGU KONFIRMASI FIREBASE` banner clears when ordinary sync is otherwise healthy.
6. Open Diagnostics. PASS: no new `QRIS_EVENT_CREATE permission_denied` entry is created by the late Rp5.000 signal after the S10A.1 page load.

## B — Normal QRIS regression
1. Create one new small QRIS pending with no cancelled same-amount candidate in the matching window.
2. Receive/verify one legitimate payment signal.
3. PASS: pending progresses through the existing QRIS matching/finalization path exactly once.
4. PASS: no S10A late quarantine is created for the normal signal.
5. PASS: event-channel permission degradation, if the environment denies `/events`, does not block payment finalization or leave Firebase sync pending.

## C — Park + cash continuity
1. Park QRIS A using `Parkir QRIS & Layani Berikutnya`.
2. Complete cash transaction B.
3. PASS: B remains unchanged when A later receives its signal.
4. PASS: A can be restored/finalized once from its immutable snapshot.

## D — True cancel late signal
1. Create a controlled pending, then use true `Batalkan Pending` before any signal is linked.
2. Feed/observe a later signal for that cancelled pending.
3. PASS: signal becomes `LATE_AFTER_CANCEL` or `LATE_OR_NEW_AMBIGUOUS`, `REVIEW_REQUIRED`, `autoMatchBlocked=true`.
4. PASS: no legacy unmatched toast loop and no persistent Firebase pending banner.
