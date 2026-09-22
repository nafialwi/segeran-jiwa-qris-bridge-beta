# Segeran Jiwa Legacy — R10 Production Cutover Gate

Status: BLOCKED pending explicit production cutover approval.

The Final RC is complete. This gate defines evidence that must be freshly collected before any production mutation.

## Mandatory fresh evidence

1. current origin/main exact commit;
2. current production Git/tag/deployment identity;
3. current Cloudflare production deployment identity and rollback target;
4. fresh read-only Firebase production Rules export;
5. canonical comparison between live production Rules and approved candidate Rules;
6. current production Firebase project/database/storage identities;
7. pre-cutover backup/export evidence required by the production procedure;
8. exact APK/AppMint package/signing identity if Android production is part of cutover;
9. rollback procedure using actual pre-cutover identities;
10. final branch/tag/RC artifact checksums.

## Mandatory gates

Cutover remains blocked unless:
- Final RC tag resolves to the expected GitHub commit.
- RC source verification is green.
- Live production Rules are freshly read and reviewed.
- Unexpected divergence is explained.
- Rollback target is proven and reachable.
- Explicit Owner approval for production cutover is given in the active session.

## Prohibited before approval

- no main merge;
- no production deploy;
- no Firebase Rules publish;
- no production database migration/write;
- no destructive cleanup;
- no replacement of production APK/AppMint build.

## Rollback principle

Before cutover, rollback is simply: do not promote the RC.

After approved cutover, rollback must use the exact production identities captured immediately before promotion. Never guess a deployment ID, Rules version, Git commit, database snapshot, package identity, or signing state.

Immutable v1.0.40 compatibility SHA-256:
877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f
