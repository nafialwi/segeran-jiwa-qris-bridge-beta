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
| PU-08 Observability & Recovery | NEXT | - | stock sync health, pending/shortage visibility, safe retry, kill switch |
| PU-09 Safe UAT Environment | PENDING | - | isolated backend, UAT banner, no production writes |
| PU-10 Final Engineering Gate | PENDING | - | full regression, build, Rules emulator, SC02/SC04, frozen hashes, PR readiness |
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

## Engineering progress

Mandatory engineering checkpoints before Human UAT: PU-01 through PU-10.

- Completed: 7 / 10
- Pre-UAT engineering progress: **70%**
- Human UAT: not started
- Production cutover: not started

The R10 transaction engine, exactly-once stock application, refund/void restoration, Firebase Rules candidate/emulator, Cup Control foundation, prior core regression work, and pre-UAT business-invariant hardening are complete. The remaining work is operational observability/recovery, safe UAT isolation, and final release gating.

## Safety contract

Until Human UAT is accepted and explicit production approval is given:

- do not deploy production;
- do not merge the convergence branch to `main`;
- do not publish Firebase Rules;
- do not run live migrations;
- do not write production data;
- do not use production-connected Cloudflare preview for write UAT.

## Resume point

Continue from **PU-08 — Observability & Recovery**.

Do not repeat PU-01 through PU-07 unless a regression test proves a defect in those completed checkpoints.
