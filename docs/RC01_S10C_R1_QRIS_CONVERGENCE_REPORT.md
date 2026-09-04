# RC01-S10C-R1 — QRIS Signal Convergence & P3 Trace De-duplication

## Trigger
Preview phone UAT on 2026-09-04 showed `Critical Pending 380` with repeated `TRANSACTION segeranjiwa_qris_beta_v1/signals/*` entries while device presence heartbeat correctly remained ADVISORY.

## Root cause
1. S10C wraps Firebase write methods before legacy P3 installs. P3 then wraps the already traced method. S10C retry installation saw the P3 wrapper as new and wrapped it again, producing duplicate trace rows for one underlying write.
2. Legacy QRIS signal evaluation can request a transaction that writes the same match-state already stored (for example `UNMATCHED -> UNMATCHED`). That transaction can emit a signal listener event, causing reevaluation and another same-state transaction. Multiple eligible historical signals can amplify this into transaction contention/storm.

## Correction
- Preserve the first S10C trace when P3 wraps it; do not add a second S10C wrapper around a known P3 delegating wrapper.
- Guard non-authoritative QRIS signal transaction updaters so a semantically unchanged result returns `undefined`, producing a non-committed transaction and no signal-listener feedback write.
- Authoritative S10A.2 quarantine updater bypass remains unchanged.
- Meaningful normal QRIS signal transitions still delegate to the original Firebase transaction authority.

## Safety locks
No Firebase root/schema/rules/package-ID/writer allowlist change. Safe default classification remains CRITICAL. Device heartbeat classification remains ADVISORY. Late QRIS quarantine and normal meaningful QRIS transitions remain protected by S10A/S10A.1/S10A.2 verification.
