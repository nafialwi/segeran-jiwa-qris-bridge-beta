# REF-01 QA Batch 1 Corrective Report

## Scope
Real-device consolidated QA against REF_01–REF_03.

## Findings

| ID | Area | Classification | Root cause | Resolution |
|---|---|---|---|---|
| QA1-01 | Settings > Perangkat Aktif | Functional / Routing | Devices and Printer delegated to the same legacy `openMst(6)` surface | Devices uses owner-guarded compatibility route to existing `openMst(13)`; Printer remains `6` |
| QA1-02 | Bottom Navigation | Visual / Interaction | No single moving capsule; legacy active CSS moved the active item vertically | Single `.sjr02-nav-capsule`, 200 ms motion, active geometry strengthened, legacy active drift neutralized |
| QA1-03 | Operasional > Stok expectation | QA / IA interpretation | QA instruction incorrectly implied Stok must be a seventh Operasional card | No visual change; preserve six REF_03 cards and existing separate Stok route |

## Safety decisions
- Frozen SC-03 Settings child contract remains unchanged.
- No new RTDB writer/schema.
- No second inventory/settings authority.
- No extra Operasional card outside REF_03 authority.

## Regression tests
- `tests/ref01-qa-batch1-routing.test.mjs`
- `tests/ref01-qa-batch1-bottom-nav-motion.test.mjs`

## Automated verification
Full `npm run verify:ref01` after corrective implementation: **135/135 PASS, 0 FAIL**.

## Visual status
Automated gates do not grant V-PASS. Real-device confirmation is still required after deploying this corrective package, specifically:
- Perangkat Aktif opens Perangkat & Session, not Printer;
- bottom nav capsule actually glides between tabs and active item no longer drops;
- separate Stok route remains reachable without altering six-card Operasional authority.
