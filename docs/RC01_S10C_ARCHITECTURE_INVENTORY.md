# RC01-S10C Architecture Inventory

Authority: exact packaged S10A.2 source; external Preview authority `12c8ef4624877089fa1cf8fed6f6f6ddbf1e86c1`.

| Operation | Method / path | Purpose | S10C class | Evidence / boundary |
|---|---|---|---|---|
| Notification read ACK | `set .../global/notifications/{id}/readBy/{reader}=true` | UI acknowledgement only | ADVISORY | Exact path + exact boolean `true`; false/other payload is CRITICAL |
| Notification batch read ACK | root `update` whose every key is `global/notifications/{id}/readBy/{reader}=true` | UI acknowledgement only | ADVISORY | Mixed multi-location update immediately fails closed to CRITICAL |
| Device heartbeat/presence | `update .../global/deviceSessions/{deviceId}` with only presence keys | Presence/lastSeen telemetry | ADVISORY | Requires `lastSeenTs` plus `lastSeenAt` or `online`; security/revoke fields excluded |
| Device registration / revoke / enable | `update .../global/deviceSessions/{deviceId}` with identity, role, revoke or security fields | Security/session authority | CRITICAL | Same broad root is not downgraded |
| Sales / transaction / shift / closing / stock / finance / refund / restock / costing / QRIS / restore / migration | any RTDB mutation | Business authority | CRITICAL | Safe default; unknown paths are CRITICAL |
| 59.4.0 schema announcement | `.../global/schema` update from `SJMobileUX.schemaMeta()` | Legacy startup capability announcement | STARTUP NO-OP | Original function retained only behind explicit migration API |
| 59.4.1 schema announcement | `.../global/schema` update from `SJMobileProfessionalP1.schemaMeta()` | Legacy startup capability announcement | STARTUP NO-OP | Original function retained only behind explicit migration API |
| 59.4.2 schema announcement | `.../global/schema` update from `SJOwnerProfessionalP2.schemaMeta()` | Legacy startup capability announcement | STARTUP NO-OP | Original function retained only behind explicit migration API |
| P3 schema/systemMeta announcement | `.../global/schema` + `.../global/systemMeta` from P3 `schemaMeta()` | Legacy architecture announcement | STARTUP NO-OP | Reads/version guards remain; explicit migration API retains original writer |

## Bootstrap boundary

`rc01-sync-authority.js` is injected after `window.SJProductionArchitectureP3` exists and before `SJMobileUX.install()` / P3 `install()`. Therefore the registry wraps the Firebase Reference prototype before P3 `patchWrites()` executes, patches startup schema methods before their ordinary install/login calls, bridges P3 `pendingWrites` to CRITICAL count, and decorates the already-final diagnostics renderer deterministically. Polling remains idempotent fallback only.

## Operational lock semantics

Legacy P3 closing/restore/banner checks still read `pendingWrites`, but S10C exposes that compatibility property as the registry CRITICAL count. Advisory writes remain visible in Diagnostics and cannot independently raise the business red lock.
