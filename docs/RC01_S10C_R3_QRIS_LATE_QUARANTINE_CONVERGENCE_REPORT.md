# RC01-S10C-R3 — QRIS Late-Quarantine Convergence

## Trigger
Phone UAT on exact R2 Preview still showed the global Firebase pending banner. Live diagnostics proved that CRITICAL `TRANSACTION` rows on `segeranjiwa_qris_beta_v1/signals/<providerId>` were repeatedly regenerated at age 0–1s instead of merely draining. Cloudflare artifact verification matched the exact R2 HTML/runtime hashes, so deployment/cache mismatch was ruled out.

## Root cause
S10A patches the shared `matchSignal()` path to classify late QRIS and enqueue a durable quarantine write. `matchSignal()` is called by multiple QRIS evaluation/render paths. The legacy `queueLate()` implementation scheduled `drainLateQueue()` on every classification and had no per-provider in-flight guard. Multiple zero-delay drains could therefore observe the same queued provider before the first quarantine completed and invoke the authoritative quarantine transaction concurrently. After settlement, stale local signal snapshots could enqueue the same quarantine again before the listener refreshed.

## Correction
- Preserve late QRIS classification and fail-closed auto-match blocking.
- Make late-quarantine requests idempotent per provider while queued or in flight.
- Make the drain single-flight and schedule at most one bounded retry after failure.
- Add an exact single-signal read through the existing S10A runtime DB authority.
- Before calling the existing authoritative quarantine writer, skip the write when durable Firebase signal evidence already equals the requested late status, `REVIEW_REQUIRED`, `autoMatchBlocked=true`, and candidate IDs.
- Keep the existing S10A quarantine writer byte-identical; R3 adds no Firebase mutation method or writer authority.

## TDD evidence
RED reproduced the production symptom:
- 40 duplicate late classifications scheduled 40 drain timers.
- identical durable quarantine performed no preflight read.
- 25 duplicate classifications could create 25 concurrent quarantine attempts.
- the S10A runtime did not expose an exact single-signal read.

GREEN contracts now prove:
- one provider burst schedules one drain and at most one active quarantine writer;
- duplicate classification during an in-flight quarantine cannot create a parallel write;
- identical durable quarantine stops before the Firebase transaction writer;
- failed quarantine gets one bounded retry;
- exact `readSignal(providerTransactionId)` uses the existing QRIS DB authority.

## Safety locks
No Firebase root/schema/rules/package-ID change. No finance/business semantic change. Safe-default write classification remains CRITICAL. Frozen baseline, S10A writer authority, R1 shield/sync authority, and R2 convergence runtime are hash-locked by the R3 verifier. Production remains untouched. Final acceptance still requires Phone UAT showing CRITICAL pending converges to zero and does not regenerate.
