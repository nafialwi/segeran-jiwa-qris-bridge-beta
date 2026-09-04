# RC01-S10C Implementation Report

Work package: **Sync Authority Consolidation & Startup Write Hygiene**.

## Authority

- Code authority: packaged S10A.2 source.
- Preview authority to use for future remote branch: `12c8ef4624877089fa1cf8fed6f6f6ddbf1e86c1`.
- Frozen legacy baseline remains SHA256 `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- Production v2.9 and `main` were not mutated.

## Implemented

- Runtime-only Firebase write registry for `set`, `update`, `remove`, and `transaction`.
- Fail-closed classification: unknown/unproven writes are CRITICAL.
- Narrow ADVISORY boundaries only for exact notification read acknowledgements and exact device presence heartbeat payloads.
- P3 `pendingWrites` compatibility surface now reflects CRITICAL pending count, preserving existing banner/closing/restore guards without broad advisory lockups.
- Active-write Diagnostics includes method, path, age, classification, reason and STUCK state.
- `SYNC_WRITE_STUCK` evidence is local only and emitted once per active write after 15 seconds.
- Ordinary 59.4.0 / 59.4.1 / 59.4.2 / P3 startup schema announcements are no-ops; original schema writers remain reachable only through `runExplicitSchemaMigration()`.
- Deterministic build injection occurs after P3 definition and before legacy lifecycle installs.
- S10A/S10A.1/S10A.2 late QRIS isolation remains unchanged.

## TDD / integration evidence

New S10C tests cover registry lifecycle, error/result preservation, fail-closed classification, exact advisory boundaries, security/revoke fail-closed behavior, P3 critical bridge, stuck evidence, startup schema hygiene, generated script order, release contract, advisory-vs-critical hang behavior, closing/restore lock semantics, late QRIS isolation and normal QRIS path.

Phase 8 full gate after harness-race correction: **485/485 PASS, 0 fail**. B01-B05 61/61 PASS, Finance 9/9 PASS, SC02/SC03/SC04 PASS, REF01 PASS, RC01 PASS, S10A/S10A.1/S10A.2/S10C verifiers PASS, mutation allowlist remains 4/4.

Artifact extraction verification and WebUpload rehearsal are packaging/external-gate evidence and do not change runtime source after this report.
