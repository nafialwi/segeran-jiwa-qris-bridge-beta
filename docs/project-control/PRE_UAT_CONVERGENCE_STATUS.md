# PRE-UAT Convergence Status

Last updated: 2026-09-20  
Branch: `work/r10-preuat-convergence`  
Production/live: **UNTOUCHED**  
Firebase Rules live: **UNTOUCHED**  
Main branch: **UNTOUCHED**

## Purpose

This branch is the isolated pre-UAT stabilization line for Segeran Jiwa POS Legacy R10. It must remain safe to inspect, test, and iterate without changing the live application, production Firebase data, production Firebase Rules, or `main`.

## Checkpoint status

| Checkpoint | Status | Safe commit / reference | Scope |
|---|---|---|---|
| PU-01 Authority Lock | COMPLETE | `fcae4dc` | Cup/PSC authority, inactive item safeguards, migration retirement |
| PU-02 Cup Convergence | COMPLETE | `76598cd` | Cup Control becomes the operational Cup authority; legacy Cup UI becomes compatibility/history only |
| PU-03 Data & Bandwidth Convergence | COMPLETE | `b5e3766` | targeted inventory reads, reduced broad/duplicate data access |
| PU-04 Product UX Convergence | COMPLETE | `f2d20755c2f1` | Edit Product / Cup / Product Stock Components presentation convergence |
| PU-05 Inventory Convergence | COMPLETE | `89763c004306` | Item Stok visible navigation converged to V3 presentation; legacy writer remains internal only |
| PU-06 Presentation Convergence | COMPLETE | `a8ee91a75bd6` | modal hierarchy, z-index, focus restoration, scroll locking, mobile full-height consistency |
| PU-07 Business Invariants | COMPLETE | `1e09b8db1404` | transaction identity, refund identity, partial refund mapping, shortage terminality, inactive-item preflight, stale editor safety |
| PU-08 Observability & Recovery | COMPLETE | `bd7c08bfe8bf` | stock sync health, pending/shortage visibility, safe stock-only retry, device-local Owner kill switch |
| PU-09 Safe UAT Environment | COMPLETE | `ba692458280b` | loopback-only Firebase Emulator UAT, synthetic seed, isolation banner, external-write firewall |
| PU-10 Final Engineering Gate | NEXT | - | full regression, build, Rules emulator, SC02/SC04, frozen hashes, PR readiness |
| PU-11 Human UAT | PENDING | - | mobile/desktop, Owner/Cashier, sale/refund/void/shift |
| PU-12 UAT Remediation | CONDITIONAL | - | only if Human UAT finds defects |

## PU-05 result

Visible inventory navigation now uses one presentation authority:

- `ingredients` legacy route resolves to the V3 Item Stok manager.
- Operational `Item Stok` shortcut opens V3 instead of exposing the legacy Inventory V2 screen.
- Product Stock Components `Item Stok` access opens V3 instead of exposing the legacy Inventory V2 screen.
- Cup remains excluded from the V3 operational Item Stok list.
- User-facing inventory text removes implementation jargon such as `Inventory V2 writer`, `Inventori Advanced`, and `writer existing`.
- Legacy Inventory V2 mutation surfaces remain available only as contained/internal writer adapters for purchase, transfer, opname, ingredient save/archive, and advanced Recipe compatibility. PU-05 does not rewrite those proven writers.

## PU-05 verification evidence

Focused convergence gate:

- 24 tests
- 24 PASS
- 0 FAIL

Final adjacent regression:

- 59 tests
- 59 PASS
- 0 FAIL

Build:

- `npm run build:ref01` PASS
- REF01 candidate SHA-256: `320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf`

Frozen authorities:

- `src/ref01-entry.js` PASS
- `src/app/rc01-runtime-loading-hardening.js` PASS
- `baseline/legacy-v1.0.40.html` PASS

Generated `dist-ref01` output was restored/cleaned after verification and is not part of the checkpoint source commit.

## PU-06 result

Presentation layers now have explicit ownership and lifecycle rules:

- Shared layer tokens define modal, child-sheet, workspace, and critical surface levels.
- Product Stock Components child editor locks background scroll while open, marks the parent Edit Product modal hidden from accessibility while the child dialog owns focus, closes on Escape/backdrop, traps Tab within the dialog, and restores focus to the launch control on close.
- Inventory V3 owns a centralized open/close/suspend lifecycle instead of directly toggling display in unrelated branches.
- Inventory V3 locks background scroll while active, supports Escape, restores focus on close, and suspends safely before handing off to contained legacy/Finished Goods/Costing surfaces.
- Inventory V3 is a full-height single surface on narrow mobile viewports rather than a floating card layered over another UI.
- New PSC/Inventory controls receive focus-visible treatment.
- No transaction, stock-writer, Firebase Rules, or production data logic changed in PU-06.

## PU-06 verification evidence

Focused presentation contract:

- 5 tests
- 5 PASS
- 0 FAIL

Final adjacent regression after build-ref01:

- 66 tests
- 66 PASS
- 0 FAIL

Build:

- npm run build:ref01 PASS
- REF01 candidate SHA-256: 320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf

Frozen authorities:

- src/ref01-entry.js PASS
- src/app/rc01-runtime-loading-hardening.js PASS
- baseline/legacy-v1.0.40.html PASS

Generated dist-ref01 output was restored/cleaned after verification and is not part of the PU-06 source commit.

## PU-07 result

Business invariants are now explicitly fail-closed across sale application and correction recovery:

- An existing Stock Application cannot silently accept a different sale-line fingerprint under the same shift/transaction identity.
- A reused refund correction ID cannot silently accept a conflicting refund payload; new refund restores carry a deterministic request fingerprint.
- Refund corrections without an original lineIndex preserve that absence so a unique product can be resolved against the immutable historical sale snapshot, while duplicate-product ambiguity still fails closed.
- A refund that claims physical stock return but contains no refund lines cannot be recorded as a successful zero-effect stock restore.
- Active Product Stock Component mappings now validate the mapped Item Stok master before the financial sale owner runs; archived/inactive/missing/Cup items are blocked before sale commit.
- Shortage remains terminal for the historical sale application; later replenishment does not cause a delayed automatic deduction.
- A full VOID after partial refund restores only the remaining historical allocation and never over-restores.
- A stale Product Stock Components editor cannot save an Item Stok that was archived after the editor loaded because save re-reads and validates the current master.

## PU-07 verification evidence

Focused business-invariant contract:

- 8 tests
- 8 PASS
- 0 FAIL

Adjacent stock/runtime/correction regression:

- 60 tests
- 60 PASS
- 0 FAIL

Full serial regression:

- 774 tests
- 774 PASS
- 0 FAIL

Build:

- npm run build:ref01 PASS
- REF01 candidate SHA-256: 320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf

Frozen authorities:

- src/ref01-entry.js PASS
- src/app/rc01-runtime-loading-hardening.js PASS
- baseline/legacy-v1.0.40.html PASS

Generated audit and dist outputs produced by the regression chain were restored/cleaned after verification and are not part of the PU-07 source commit.

## PU-08 result

Stock-component synchronization now has explicit observable and recoverable operational state without introducing a second database authority:

- The R10 stock runtime exposes a read-only health snapshot with enabled state, pending count, shortage count, pending kind totals, latest error code, and control reason.
- Failed sale-component application persists recoverable stock-only work with attempt/error evidence; retry never reruns the financial sale owner.
- Failed refund/VOID stock restoration remains recoverable after the financial correction has committed; retry invokes only the stock restore path and never repeats the financial mutation.
- Shortage is visible as an attention condition but remains terminal/non-retryable, preserving the PU-07 shortage invariant.
- An Owner/manajemen-only kill switch can stop new mapped Product Stock Component sales before the financial sale owner is invoked.
- The kill switch does not block products that have no Product Stock Components mapping.
- While the switch is disabled, already-committed financial corrections can queue their stock restoration safely for a later stock-only retry.
- Inventory V3 Ringkasan displays Sinkronisasi Pemakaian Stok state, pending/stock-kurang counts, safe retry, and enable/disable controls without direct Firebase mutation from the UI.
- Recovery state and the kill-switch control are persisted through the existing browser local-store boundary. The kill switch is intentionally **device-local**, not a global production/database switch.
- No new polling loop, permanent transaction listener, production writer, or parallel stock authority was introduced.

## PU-08 verification evidence

Focused PU-08 observability/recovery contract:

- 9 tests
- 9 PASS
- 0 FAIL

Focused + adjacent regression:

- 65 tests
- 65 PASS
- 0 FAIL

Full serial regression:

- 783 tests
- 783 PASS
- 0 FAIL

Build:

- npm run build:ref01 PASS
- REF01 candidate SHA-256: 320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf

Frozen authorities:

- src/ref01-entry.js PASS
- src/app/rc01-runtime-loading-hardening.js PASS
- baseline/legacy-v1.0.40.html PASS

Generated audit/dist outputs produced by verification were restored/cleaned before the checkpoint commit.

## PU-09 result

Human UAT now has a dedicated writable environment that is technically separated from production rather than relying on operator discipline:

- UAT uses Firebase Emulator Suite for Realtime Database, Authentication, and Storage on loopback only.
- The UAT project identity is fixed to demo-segeran-jiwa-uat; Firebase CLI recognizes it as a demo project and non-emulated service access for that project fails.
- The HTML UAT injector runs before the first legacy Firebase initialization and rewrites every Firebase app initialization to demo-only configuration before routing Database/Auth/Storage to local emulators.
- The UAT injector refuses to run from a non-loopback hostname.
- UAT and LOCAL QA are mutually exclusive. LOCAL QA stays read-only; UAT is writable only because its backend is local/demo.
- A permanent on-screen UAT TERISOLASI / EMULATOR LOCAL / BUKAN LIVE indicator is injected only in explicit UAT mode.
- A UAT network firewall blocks external mutating fetch requests and blocks the Segeran Jiwa emergency Worker entirely while UAT is active; loopback emulator traffic remains allowed.
- The deterministic UAT seed contains only synthetic Owner/Cashier identities, synthetic products, and synthetic inventory. It contains no production auth UID, email, or production project identity.
- Emulator database/storage rules under firebase/uat are deliberately permissive for local UAT only and are never referenced by a deploy command.
- npm run uat:local starts the isolated backend and preview on 127.0.0.1:4174, restores the deterministic seed by default, verifies the UAT mode header/router, and shuts the emulator processes down with the launcher.
- SJ_UAT_KEEP_DATA=1 npm run uat:local can preserve emulator state across a manual UAT session when continuity is needed.
- No production Firebase Rules, production database, production Storage, production Worker, production deploy target, or main branch is changed by PU-09.

## PU-09 verification evidence

Focused PU-09 isolation contract:

- 10 tests
- 10 PASS
- 0 FAIL

Adjacent LOCAL QA / presentation / recovery regression:

- 35 tests
- 35 PASS
- 0 FAIL

Actual Firebase Emulator smoke gate:

- Database/Auth/Storage emulator start PASS
- project demo-segeran-jiwa-uat
- namespace demo-segeran-jiwa-uat-default-rtdb
- deterministic seed reset/verify PASS
- production writes reported: 0
- clean emulator shutdown PASS

Bounded real UAT launcher check:

- UAT app served on http://127.0.0.1:4174
- mode header UAT ISOLATED PASS
- injected router marker PASS
- visible isolation banner PASS
- emulator ports 9000 / 9099 / 9199 PASS while running
- clean shutdown and closed-port verification PASS

Final full serial regression after PU-09:

- 793 tests
- 793 PASS
- 0 FAIL

Build:

- npm run build:ref01 PASS
- REF01 candidate SHA-256: 320412df473905ae59aa9fe9c85f1c8acae20e0a4be8471c572b3d2fc607c5cf

Frozen authorities:

- src/ref01-entry.js PASS
- src/app/rc01-runtime-loading-hardening.js PASS
- baseline/legacy-v1.0.40.html PASS

Additional safety audit:

- UAT source production deployment/mutation command scan PASS
- exact intended source scope PASS
- generated audit/dist/debug artifacts restored or removed before commit

## Engineering progress

Mandatory engineering checkpoints before Human UAT: PU-01 through PU-10.

- Completed: 9 / 10
- Pre-UAT engineering progress: **90%**
- Human UAT: not started
- Production cutover: not started

The R10 transaction engine, exactly-once stock application, refund/void restoration, Firebase Rules candidate/emulator, Cup Control foundation, prior core regression work, business-invariant hardening, stock-sync observability/recovery, and an isolated writable UAT environment are complete. The remaining engineering checkpoint before Human UAT is the final engineering gate.

## Safety contract

Until Human UAT is accepted and explicit production approval is given:

- do not deploy production;
- do not merge the convergence branch to `main`;
- do not publish Firebase Rules;
- do not run live migrations;
- do not write production data;
- do not use production-connected Cloudflare preview for write UAT.

## Resume point

Continue from **PU-10 — Final Engineering Gate**.

Do not repeat PU-01 through PU-09 unless a regression test proves a defect in those completed checkpoints.
