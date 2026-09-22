# R10 Production Data Readiness — 2026-09-22

Status: DATA READY; OPERATIONAL CUTOVER WINDOW NOT OPEN AT AUDIT TIME
Mode: read-only production audit
Production writes during audit: 0

## Production structure

Root: toko_segeranjiwa_v58

Global production contains the established Legacy operational data and Inventory V2.

Inventory V2 live structure before R10 cutover:
- balances: present
- costs: present
- ingredients: present
- movements: present
- productWarehouse: present
- purchases: present
- recipes: present
- reservations: present
- productStockComponents: absent
- stockApplications: absent

The two absent nodes are new R10 authorities. Their absence before cutover is expected.

## Inventory compatibility

Read-only snapshot results:
- Ingredient masters: 7
- Ingredient balances: 7
- Ingredient master IDs and balance IDs: exact match
- Existing Recipe definitions: 1
- Product Warehouse rows: 6
- Inventory V2 movements: 207 at audit snapshot
- Inventory V2 reservations: 274 at audit snapshot
- Active menu products: 30
- Active menu products carrying Cup codes: 13

No Inventory V2 master/balance migration is required for R10 cutover.

## Recipe authority

The single live Recipe belongs to the existing Recipe authority and consumes the TEH stock item.

R10 Product Stock Components must not duplicate an Item Stok already consumed by a Recipe transaction. Runtime overlap detection fails closed with STOCK_COMPONENT_RECIPE_OVERLAP.

The existing Recipe remains in place. It is not converted or backfilled into productStockComponents during cutover.

## Cup authority

Six historical Inventory V2 ingredient rows have Cup-like names.

They are NOT the R10 Cup stock authority.

Production evidence confirms:
- Cup Control physical counts live under shift/session cupControl;
- Cup Control does not depend on Inventory V2 Cup balances;
- the previous shift Physical Closing exactly equals the next shift Opening;
- no live Recipe uses a Cup ingredient;
- productStockComponents is absent, so no R10 Product Stock Component mapping points at a Cup ingredient.

Decision:
- do not synchronize Inventory V2 Cup balances into Cup Control;
- do not synchronize Cup Control counts back into Inventory V2;
- do not delete the historical Cup ingredient/balance/movement rows during cutover;
- preserve them as legacy historical data;
- Cup Control physical Closing remains the authority for the next Opening.

This prevents the old double-authority problem from returning.

## Historical transaction safety

R10 does not backfill stockApplications for historical sales.

Verified runtime behavior:
- no Product Stock Component mapping -> existing sale path runs exactly once;
- historical refund/VOID without a stockApplication -> SKIPPED as NO_STOCK_APPLICATION;
- no fabricated restore evidence is created;
- no permanent transaction listener or polling loop is introduced;
- failed stock-component recovery cannot roll back an already committed financial correction.

Therefore historical transactions, refunds, shifts, and ledgers remain untouched.

## Migration policy

The former legacy Cup-to-Product-Stock-Components migration CLI is RETIRED.

Its apply mode is refused unconditionally. No automatic production migration/backfill is part of R10 cutover.

Production cutover must start with:
- productStockComponents empty;
- stockApplications empty.

After R10 is live, Owner may configure Product Stock Components deliberately through the Owner UI for products/items that should use the new authority.

Do not map Cup items. Do not duplicate an existing Recipe component for the same sale.

## Shift compatibility

At the audit snapshot:
- 2026-09-22-S1: ACTIVE
- 2026-09-22-S2: NOT_STARTED
- 2026-09-22-S3: NOT_STARTED
- current S1 Cup Control has Opening + Restock evidence;
- prior 2026-09-21-S3 Physical Closing equals current S1 Opening exactly.

This proves live Cup continuity is already compatible.

## Production sync plan

There is NO bulk database synchronization before cutover.

Data classes:

### Keep exactly as-is
- historical shift records;
- transaction reservations;
- refunds;
- users/authUsers;
- existing Inventory V2 masters, balances, movements, purchases, reservations, costs;
- existing Recipe;
- Product Warehouse;
- historical Cup ingredient/balance/movement evidence.

### Start empty by design
- global/inventoryV2/productStockComponents
- global/inventoryV2/stockApplications

### Created naturally after R10 becomes live
- Owner-created Product Stock Component mappings;
- stockApplications for NEW completed sales that actually have a mapping;
- R10 restore evidence for NEW mapped sales/refunds/VOID only.

### Never copy from UAT
- UAT synthetic products, mappings, applications, balances, users, shifts, or transactions.

## Cutover-window gate

R10 must NOT be cut over while any production shift is ACTIVE.

Before cutover, perform a fresh read-only status check and require:
- no shiftStatus == ACTIVE;
- no cashier is in an active session;
- previous shift close evidence is complete;
- current production fingerprint and Firebase Rules have not unexpectedly changed.

Preferred window:
- after S3 is CLOSED and before the next day's S1 is started.

Acceptable shorter window:
- between two shifts after the previous shift is CLOSED and before the next shift is started.

## Cutover mutation scope after approval and window-open

No database backfill is planned.

The controlled mutation sequence is limited to:
1. re-check production identities and no-active-shift gate;
2. capture final rollback evidence;
3. publish the already verified R10 Firebase Rules candidate;
4. promote the locked Final RC web source to main / Cloudflare production;
5. production smoke test;
6. open the next shift under R10;
7. monitor first real transactions and exactly-once stock behavior;
8. rollback immediately if a critical invariant fails.

## Evidence

Relevant targeted gates passed:
- R10 stock-component cutover/migration/runtime set: 31 / 31 PASS
- Cup authority/cutover reconciliation: 5 / 5 PASS
- Historical runtime behavior: 15 / 15 PASS
- Product Stock Component domain/writer/UI set: 35 / 35 PASS
- production-derived Firebase Rules contract: 5 / 5 PASS
- production-derived Firebase emulator lifecycle: PASS
- overall Final RC regression: 798 / 798 PASS

## Decision

Production DATA is ready for R10 without a bulk sync or migration.

Production CUTOVER is not currently authorized merely by this document. At audit time an active shift exists, so the operational window gate is closed.

Next action: wait for a no-active-shift window, refresh the read-only gate, then request explicit Owner production-cutover approval.

## Window refresh — 2026-09-22 23:56 WIB

The previously active S1 has now been verified CLOSED and locked.

- ACTIVE_SHIFT_COUNT: 0
- S1 Cup closing/reconciliation: present
- S1 closing snapshot: present
- S2/S3: NOT_STARTED
- no-active-shift operational gate: PASS
- bulk sync remains unnecessary
- database backfill remains unnecessary
- production mutations performed by this verification: 0

Production cutover window is now OPEN, pending explicit Owner production-cutover approval.
