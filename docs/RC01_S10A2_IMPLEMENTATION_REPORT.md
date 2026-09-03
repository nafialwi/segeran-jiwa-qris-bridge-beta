# RC01-S10A.2 Implementation Report — Quarantined Signal Match-State Isolation

## Authority and scope
- Base release line: RC-01 v3.4.
- Tested external parent authority: Cloudflare Preview commit `7270fe8` (`fix(qris): converge late event sync`).
- Local execution base: tree-equivalent S10A.1 authority commit `f362dab` used only for isolated implementation/rehearsal.
- Scope approved: stop frozen legacy `QRIS_MATCH_STATE` transactions from re-touching S10A late-quarantined signals; preserve authoritative quarantine writer and normal QRIS paths.
- Explicitly unchanged: Firebase Rules, RTDB roots, global schema, package ID, production deployment, `main`, finance/inventory authorities.

## Root cause closed
S10A.1 successfully suppressed legacy `events/*` writes/toasts, but the frozen legacy evaluator could still call `transaction()` on `segeranjiwa_qris_beta_v1/signals/{providerId}` using `QRIS_MATCH_STATE`. Because the P3 global Firebase write monitor wraps the base Reference transaction, a disconnect/permission failure on that stale late-provider transaction could keep the visible sync state in `PENDING` even though the authoritative late quarantine was already persisted.

S10A.2 extends the existing early shield rather than creating a second patch:
1. Exact signal-reference parsing recognizes only `segeranjiwa_qris_beta_v1/signals/{safeProviderId}`.
2. For a provider synchronously marked blocked or durably persisted as `LATE_AFTER_CANCEL` / `LATE_OR_NEW_AMBIGUOUS` + `REVIEW_REQUIRED` + `autoMatchBlocked=true`, an unmarked signal transaction resolves as a synthetic non-committed no-op **before** the monitored base transaction runs.
3. The existing dedicated S10A quarantine writer marks only its updater function in memory with `__sjS10AQuarantine=true`. That updater is explicitly allowed through the shield so quarantine persistence remains authoritative.
4. Unblocked/normal QRIS signal transactions delegate to the existing base transaction unchanged.
5. No marker field is persisted to Firebase.

## TDD evidence
RED phase: targeted test set produced four expected failures:
- blocked signal transaction still committed;
- durable late-review signal transaction still committed;
- quarantine updater marker absent;
- S10A.2 shield contract token absent.

GREEN phase: targeted set finished `17/17 PASS` after the minimum shield/writer changes.

## Fresh full verification
Command: `npm run verify:rc01:s10a2`

Result:
- Tests: **469/469 PASS**
- Fail: **0**
- RC-01 release verifier: PASS
- RC01-S10A verifier: PASS
- RC01-S10A.1 verifier: PASS
- RC01-S10A.2 verifier: PASS
- Mutation allowlist: **4/4**
- B01–B05 icon guard: 61/61 PASS
- Finance verifier: 9/9 PASS
- SC02 / SC03 / SC04: PASS

## Hash and authority checks
- Frozen baseline `baseline/legacy-v1.0.40.html` SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- `dist-ref01/index.html` SHA256: `296feef99052aa35409c93513239c72ae1ad728f2082116cd53b97284d1b7c57`
- `dist-rc01/index.html` SHA256: `296feef99052aa35409c93513239c72ae1ad728f2082116cd53b97284d1b7c57`
- S10A.2 shield asset `src/compat/rc01-qris-event-sync-shield.js` SHA256: `7da40dfe73e36de2df70c1e1efd75efcfaf60fda53325a60a509435368ee7221`
- S10A quarantine writer `src/data/writers/qris-deferred-settlement-writer.js` SHA256: `cac56daf9cc8495041dcff1a861edeb9a3caf5723e329ef6445653525948b8a8`

The HTML shell hash is intentionally unchanged because the script URL/injection is unchanged; the external shield/writer assets are the changed runtime content and are separately hashed above.

## Safety boundaries
- Mutation files remain exactly:
  1. `src/data/writers/finance-writer.js`
  2. `src/data/writers/purchase-reconciliation-writer.js`
  3. `src/data/writers/qris-cash-out-coordinator.js`
  4. `src/data/writers/qris-deferred-settlement-writer.js`
- No fifth writer.
- No Firebase Rules change.
- No new RTDB root.
- No direct mutation added to the compatibility shield.
- No historical HPP fabrication.
- S10A.1 event-channel degradation remains in force.

## Real-device gate still required
Local verification cannot prove the observed Android/Firebase convergence symptom is closed. Production remains HOLD until Cloudflare Preview UAT confirms:
- existing Rp5.000 late card survives;
- no new legacy unmatched toast;
- no new `QRIS_EVENT_CREATE` error;
- no new `QRIS_MATCH_STATE` disconnect/permission error;
- red Firebase pending banner clears after convergence;
- a normal QRIS path remains unaffected.

Historical `SCHEMA_META_* permission_denied` or Firebase Auth diagnostic entries may remain in the error log and are not silently reclassified as fixed by S10A.2.
