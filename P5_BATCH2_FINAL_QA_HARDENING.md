# P5 Batch-2 Final QA Hardening

Status: **ENGINEERING COMPLETE — ANDROID LOCAL QA CANDIDATE**
Date: 2026-09-03

## Scope

Final hardening after the first Android Cup Control QA:

1. Initial Cup Setup for all five cup masters using existing authorities only.
2. LOCAL QA in-memory master simulation with Gudang, Gerai and WAC values.
3. Live preview of total initial cup quantity and inventory value before apply.
4. LOCAL QA opening-count memory so closing reconciliation can be simulated without START persistence.
5. LOCAL QA simulated Cup Masuk per cup during closing.
6. START/CLOSE persistence buttons are visibly locked in LOCAL QA.
7. Production initial setup delegates to:
   - existing Inventory V2 ingredient master writer;
   - existing Harga Modal Awal authority;
   - existing Inventory V2 Opname for Gudang and Gerai.
8. Initial setup does **not** create a Purchase/cash-flow event.

## Locked safety behavior

- No new Firebase writer.
- No direct cup stock writer.
- Existing SC04 mutation allowlist remains exactly three P4 writers.
- `.remove()` remains forbidden.
- LOCAL QA simulation is memory-only and disappears on refresh.
- Cup closing still produces Inventory V2 Opname Draft evidence; saldo mutation remains through existing Inventory V2 Opname.
- P4 v3.3 LOCKED remains rollback/source authority beneath P5.
- Production deployment remains blocked.
