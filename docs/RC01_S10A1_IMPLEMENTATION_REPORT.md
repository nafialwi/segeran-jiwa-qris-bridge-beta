# RC01-S10A.1 Implementation Report

## Scope
Bounded correction for the real-device finding where a durable S10A late QRIS quarantine coexisted with repeated legacy `QRIS_UNMATCHED` toast/event attempts and `QRIS_EVENT_CREATE permission_denied` noise.

## Changes
- Added early classic `rc01-qris-event-sync-shield.js` before frozen legacy QRIS Beta.
- Late-quarantined providers suppress legacy QRIS event persistence before the underlying transaction.
- QRIS `events/*` remains notification-only. A real `permission_denied` degrades that channel for the page session instead of repeatedly retrying and holding sync pending.
- S10A `queueLate()` synchronously marks the late provider/amount before legacy evaluation resumes.
- Immediate legacy unmatched toast for that blocked late amount is suppressed; unrelated toasts are unchanged.
- Payment authority in `pending/*`, `signals/*`, POS transaction writers, inventory, finance, and HPP is unchanged.

## Explicit non-changes
- No Firebase Rules change.
- No Firebase root change.
- No package ID change.
- No new mutation-authority file; allowlist remains 4/4.
- Frozen legacy baseline remains byte-identical.
- Production/main untouched during local implementation.

## Verification
Fresh local verification:
- Full tests: 464/464 PASS, 0 fail.
- RC01 release verifier: PASS.
- RC01-S10A verifier: PASS.
- RC01-S10A.1 verifier: PASS.
- Mutation allowlist: exact 4/4.
- Frozen baseline SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- `dist-ref01/index.html` SHA256: `296feef99052aa35409c93513239c72ae1ad728f2082116cd53b97284d1b7c57`.
- `dist-rc01/index.html` SHA256: identical `296feef99052aa35409c93513239c72ae1ad728f2082116cd53b97284d1b7c57`.
- Preview authority being corrected: remote commit `6203a8c`; local implementation tree is based on the verified S10A source tree that produced that Preview, with local git history differing only because the web-upload packaging commit was created remotely.

Production impact during implementation: NONE.
