# RC01-S10C-R2 — QRIS Evaluation Convergence

## Trigger
Phone UAT on the S10C-R1 Preview still showed a red Firebase pending banner and repeated CRITICAL `TRANSACTION` rows on `segeranjiwa_qris_beta_v1/signals/*`. The count decreased over time but new 0–1 second rows continued to appear, proving repeated evaluation rather than only a stale queue draining.

## Root cause
The frozen QRIS lifecycle calls `evaluateAllSignals()` from both signal and pending listeners. Repeated pending snapshots can schedule the same eligible signal many times before the first evaluation settles. S10C-R1 suppresses idempotent commits inside the transaction updater, but the transaction call has already entered the CRITICAL write registry by then. Therefore many overlapping calls can still freeze the POS even when Firebase ultimately commits no state change.

## Correction
- Keep the frozen baseline byte-identical; patch only deterministic generated HTML during the existing REF01 build lifecycle.
- Load a read/write-free R2 convergence runtime before QRIS Beta.
- Coalesce each provider signal to at most one active evaluation plus one trailing evaluation using the freshest callback.
- Skip legacy `UNMATCHED -> UNMATCHED` and `AMBIGUOUS -> AMBIGUOUS` bookkeeping before `qrisRef(...).transaction()` is called when the local signal snapshot already proves the target state.
- Preserve meaningful transitions such as `DETECTED -> UNMATCHED`, `UNMATCHED -> MATCHED`, ambiguity resolution, S10A.2 authoritative quarantine, and all existing normal QRIS writer paths.

## Safety locks
No Firebase root/schema/rules/package-ID change. No new Firebase writer. Safe-default write classification remains CRITICAL. R1 shield and S10C sync-authority hashes are frozen by the R2 verifier. Production remains untouched pending Preview UAT.
