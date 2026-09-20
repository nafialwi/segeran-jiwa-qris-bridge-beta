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
| PU-06 Presentation Convergence | NEXT | - | modal hierarchy, z-index, focus, loading/error/empty states, mobile consistency |
| PU-07 Business Invariants | PENDING | - | partial refund, history/mapping invariants, shortage policy, overlap/stale editor |
| PU-08 Observability & Recovery | PENDING | - | stock sync health, pending/shortage visibility, safe retry, kill switch |
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

## Engineering progress

Mandatory engineering checkpoints before Human UAT: PU-01 through PU-10.

- Completed: 5 / 10
- Pre-UAT engineering progress: **50%**
- Human UAT: not started
- Production cutover: not started

The R10 transaction engine, exactly-once stock application, refund/void restoration, Firebase Rules candidate/emulator, Cup Control foundation, and prior core regression work remain completed from the R10 line. The remaining work is convergence, professional presentation, operational observability, safe UAT, and final release gating.

## Safety contract

Until Human UAT is accepted and explicit production approval is given:

- do not deploy production;
- do not merge the convergence branch to `main`;
- do not publish Firebase Rules;
- do not run live migrations;
- do not write production data;
- do not use production-connected Cloudflare preview for write UAT.

## Resume point

Continue from **PU-06 — Presentation Convergence**.

Do not repeat PU-01 through PU-05 unless a regression test proves a defect in those completed checkpoints.
