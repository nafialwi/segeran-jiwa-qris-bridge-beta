# SC-04 Persistent Session UAT Checklist

Automated tests prove the session state machine and legacy delegation. The following browser/HP checks are the remaining real-runtime UAT before treating persistent session as device V-PASS/F-PASS in AppMint.

| Scenario | Expected result | Automated evidence | Real browser/HP |
|---|---|---|---|
| Login then close/reopen in SECURE | Returns directly to app without PIN prompt while Firebase session is valid | Covered | Pending real runtime |
| Login then close/reopen in HYBRID | Same user restored after Firebase UID + mapping validation | Covered | Pending real runtime |
| LEGACY close/reopen online | Same user restored only after server user/device validation | Covered | Pending real runtime |
| Cold reopen offline | No silent login; envelope retained for later online validation | Covered | Pending real runtime |
| Cashier with active shift close/reopen | Existing owned shift returns; no second shift/session is created | No shift-create path + delegates legacy `resolveLoginSelection()` | Pending Firebase data observation |
| Manual logout then reopen | Login screen; local session absent; Firebase Auth signed out by legacy authority | Covered | Pending real runtime |
| Owner revokes current device | Current session forced out without waiting for next reopen | Covered live watcher | Pending multi-device runtime |
| Owner disables/deletes current user | Current session forced out | Covered live watcher | Pending multi-device runtime |
| Owner changes current user's role | Current session forced out; next login applies new role | Covered live watcher | Pending multi-device runtime |
| Auth mapping/UID mismatch | Restore rejected and local envelope invalidated | Covered | Pending controlled Firebase test |

## UAT evidence rule

Do not mark the real-browser/HP column PASS from automated tests alone. Capture representative runtime evidence only after a GitHub/Cloudflare preview or equivalent browser candidate is available.
