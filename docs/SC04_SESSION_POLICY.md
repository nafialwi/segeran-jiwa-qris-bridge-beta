# SC-04 Persistent Session Policy

## Authority

SC-04 adds one Session Manager around the final v1.0.40 authentication authority. It does not replace `SJSecureRulesCompat.login()`, `completeLogin()`, or `logout()`; those methods are captured and delegated exactly once through the SC-03 command registry.

## Safe local envelope

The only browser-storage boundary is `src/data/local-store.js`. The session envelope contains only:

- version;
- username restoration hint;
- device ID;
- auth-mode hint;
- Firebase UID hint when Firebase Auth is active;
- saved/last-validated timestamps;
- active shift key and existing shift-session ID as restoration hints.

The envelope never stores PIN, password, derived Firebase password, credential material, display name, or role authority. User role is always re-read from Firebase before restoration.

## Restore rules

### HYBRID / SECURE

A cold restore requires all of the following:

1. browser/network is online;
2. Firebase Auth persisted `currentUser` exists;
3. POS user exists and is not disabled;
4. role is exactly `manajemen` or `transaksi`;
5. current device row exists, belongs to the same user, has matching role, and is not revoked;
6. Firebase UID matches the POS profile when `authUid` exists;
7. `global/authUsers/<uid>` is active and maps to the same username/role.

### LEGACY

LEGACY can restore only while online and only after server user + device-session validation. The local envelope is never accepted by itself. The default LEGACY cold-session age is seven days; after that the user must authenticate again.

### Offline cold start

SC-04 intentionally does **not** auto-login from a cold start while offline. Revocation, disable, and role changes cannot be proven offline, so the safe policy is fail-closed with the envelope retained for later online revalidation.

## Shift restoration

SC-04 never creates or starts a shift. After identity validation it delegates to the captured legacy `completeLogin(username, '', user)` authority. That existing flow calls `SJShift.resolveLoginSelection()` and restores the cashier's existing owned active session. The shift key/session ID stored locally is diagnostic/restoration context only and is never a create instruction.

## Logout / revocation

Manual logout clears the local envelope before calling the existing logout authority, which signs out Firebase Auth and reloads. Live read-only watchers for the current user and device force logout if the user is deleted/disabled, the role changes, the device is revoked, or the device ownership/role no longer matches.
