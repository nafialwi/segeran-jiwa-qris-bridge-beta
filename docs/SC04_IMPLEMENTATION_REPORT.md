# SC-04 Implementation Report

## Implemented

- One SC-04 Session Manager with a single local storage boundary.
- Explicit Firebase Auth LOCAL persistence adapter using the existing Firebase compat app.
- HYBRID/SECURE cold restore with Firebase UID + auth mapping + POS user + device revalidation.
- LEGACY cold restore only after online POS user/device revalidation.
- Cold-start offline fail-closed policy.
- Existing active shift restoration delegated to legacy `completeLogin()` / `SJShift.resolveLoginSelection()`; no shift create/start path exists in SC-04.
- Manual logout local-envelope invalidation before existing logout authority.
- Live user/device watchers that force logout on disable/delete/role-change/revocation/ownership mismatch.
- SC-04 candidate entry/build/verifier while frozen v1.0.40 rollback remains immutable.
- Source/GitHub/Cloudflare workflow documentation without introducing paid services or schema/rules changes.

## Explicitly not implemented

- REF-01 visual refinement.
- New QRIS writer/engine.
- New transaction, inventory, debt, refund, report, or shift writer.
- Firebase Rules/schema changes.
- Billing/Blaze enablement.
- GitHub remote binding until an actual repository URL/authorized connector exists.
- Cloudflare preview deployment until GitHub authority and a Cloudflare project/account target are available.

## Release meaning

Automated SC-04 verification is an architecture/function candidate gate. Real close/reopen/revocation/shift UAT on browser/HP still must be executed against a deployed or directly served candidate before AppMint lifecycle testing.
