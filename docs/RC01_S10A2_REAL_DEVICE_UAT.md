# RC01-S10A.2 Targeted Real-Device UAT

Scope: validate only the quarantined-signal match-state isolation correction on Cloudflare Preview. Do not promote Production during this UAT.

## A. Existing Rp5.000 late-quarantine convergence
1. Open the S10A.2 Preview URL and wait 30 seconds.
2. Confirm the existing `Perlu Tindakan` card for Rp5.000 remains visible with `auto-match diblokir: true`.
3. Refresh once, wait another 30–60 seconds.
4. Confirm the legacy `QRIS Rp5.000 masuk dan belum cocok...` toast does not return.
5. Open Pengaturan → Diagnostik. Confirm Internet ONLINE and Firebase OK.
6. Confirm no **new timestamp** `QRIS_EVENT_CREATE permission_denied` is added.
7. Confirm no **new timestamp** `QRIS_MATCH_STATE permission_denied` or `QRIS_MATCH_STATE disconnect` is added.
8. Confirm the red `MENUNGGU KONFIRMASI FIREBASE` banner clears once current writes converge.

PASS requires all eight checks. Historical error-log entries may remain; judge only timestamps after the S10A.2 Preview was opened.

## B. Normal QRIS path non-regression
1. Create one small normal QRIS pending on the S10A.2 Preview. Do not perform a real payment unless explicitly needed/approved.
2. Confirm WAITING_QRIS opens normally and no S10A late-quarantine warning appears for the new provider.
3. Use the normal safe cancel path before any payment is sent, or complete the agreed test if real-payment evidence is intentionally used.
4. Confirm no new `QRIS_MATCH_STATE` error is created solely because of the S10A.2 shield.

## C. Parked QRIS contract smoke check
1. Create a fresh small QRIS pending and use `Parkir QRIS & Layani Berikutnya` before payment.
2. Confirm it remains an unresolved parked WAITING_QRIS and a second QRIS is blocked while a non-QRIS sale remains allowed.
3. Cancel/resolve the test pending safely after confirming no payment was sent.

## Hard stops
- Any new signal becomes matched to the wrong pending.
- A normal QRIS signal transaction is suppressed without being quarantined.
- The S10A quarantine writer fails to persist `LATE_* / REVIEW_REQUIRED / autoMatchBlocked=true`.
- Firebase banner remains stuck with new `QRIS_MATCH_STATE` errors after refresh.
