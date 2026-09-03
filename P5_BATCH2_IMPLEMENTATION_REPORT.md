# P5 v3.4 Batch-2 — Packaging/Cup Inventory, Shift Reconciliation & Costing Integration

Date: 2026-09-03
Status: ENGINEERING COMPLETE — Android LOCAL QA candidate
Official roadmap: remains 75% (P5 not locked)
Production v2.9: untouched
P4 v3.3: remains LOCKED rollback/source authority

## Implemented

### 1. First-class Cup/Kemasan inventory presentation
- Five Segeran Jiwa cup types are always shown under `Bahan & Gudang`.
- Registered cup masters read Gerai, Gudang, total, and WAC from Inventory V2.
- Missing cup masters remain visible as `Belum terdaftar`.
- Setup delegates to the existing Inventory V2 ingredient-save authority; LOCAL QA keeps setup locked.

### 2. Existing product `cp` remains mapping authority
- No duplicate cup-mapping schema was created.
- Category bulk mapping uses the existing menu transaction authority.
- Product-level `cp` remains an override via existing product edit UI.

### 3. Shift opening physical cup count
- All five cup types require manual integer physical counts before START when all masters are ready.
- Inventory V2 Gerai balance is shown only as reference.
- Opening evidence is stored at session and shift level through existing `verifiedShiftWrite`.
- Handover does not lose the shift-level opening authority.
- LOCAL QA keeps the count fields editable as draft simulation, while START persistence remains blocked by the global read-only guard.

### 4. Shift closing reconciliation
- All five closing physical counts are manual.
- Inbound cup transfers to Gerai are counted from Inventory V2 `TRANSFER_IN` movements.
- Legacy movements without a shift key are included only when timestamp falls inside the active shift window.
- Theoretical consumption is derived from sale transaction `cp` snapshots and excludes VOID/CANCELLED.
- Physical vs theoretical variance is calculated per cup.
- Non-zero variance requires a reason.
- Closing and reconciliation evidence are stored through existing Shift CLOSE payload/closingSnapshot.
- LOCAL QA allows draft closing/variance/reason simulation, while CLOSE persistence remains blocked.

### 5. Inventory V2 Opname Draft
- Closing does not directly mutate cup balance.
- If physical closing differs from Inventory V2 Gerai balance, `inventoryOpnameDrafts` evidence is generated.
- Owner must use existing Inventory V2 Opname authority to synchronize stock.
- This preserves a single inventory writer authority.

### 6. Cup WAC in new RECIPE HPP
- Active recipe variants are decorated read-time with one registered cup ingredient according to product `cp`.
- Existing costing reservation then snapshots ingredient WAC, including cup WAC, at sale time.
- No historical cup HPP is fabricated from current WAC.

## Verification before clean packaging
- P5 Batch-2 targeted: 24/24 PASS
- P3/P4/P5 related regression: 130/130 PASS
- Full suite: 418/418 PASS
- SC04 full chain: PASS
- REF01 full chain: PASS
- Finance verifier: 9/9 PASS
- B01-B05 icon authority: 61/61 PASS
- CSS `!important`: 252/252
- New dedicated writer files: 0
- SC04 mutation allowlist: unchanged, exactly 3 P4 dedicated writers

## Not authorized / not implemented
- production deployment
- automatic Inventory V2 balance mutation from cup closing
- duplicate cup stock writer
- duplicate shift writer
- retroactive fabrication of historical cup HPP
- automatic rewrite of historical TEH WAC

## Final QA Hardening Addendum — 2026-09-03

After the first Android Batch-2 QA, the following bounded hardening was added:

- Initial Cup Setup for all five cup types using existing authorities only: Ingredient Master, Harga Modal Awal, and Inventory V2 Opname.
- Initial cup stock is explicitly **not** fabricated as a Purchase event, so no fake cash-flow is created.
- LOCAL QA can create an in-memory five-cup simulation with Gudang, Gerai, and WAC values.
- Initial setup has a live preview of total cup count and initial inventory value before apply.
- LOCAL QA opening counts are retained in page memory for closing simulation without START persistence.
- LOCAL QA closing supports simulated Cup Masuk per cup.
- START and CLOSE persistence buttons are visibly locked/read-only.
- Search-input partial-render behavior from P3 remains preserved to avoid Android keyboard dismissal.

Fresh final source verification after this addendum: 424/424 PASS; SC04 PASS; REF01 PASS; B01–B05 61/61; `!important` 252/252; writer allowlist unchanged at exactly three P4 dedicated writers.
