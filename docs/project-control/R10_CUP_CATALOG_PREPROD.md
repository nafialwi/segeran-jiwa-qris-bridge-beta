# R10 Cup Catalog / Cup Control Settings — Pre-Production

Status: IMPLEMENTED; AUTOMATED GATES PASS; HUMAN UAT PENDING
Production mutation: 0

## User surface

Owner / Manajemen:
- Pengaturan
- Cup Control

Capabilities:
- list all Cup types
- add a custom Cup
- rename a Cup
- activate / deactivate a Cup
- show how many active products use the Cup
- no hard delete

## Identity and history safety

Cup code is immutable after creation.

Example:
- code: cup24
- name: Cup 24 Oz Datar

The name may change.
The code may not change.

Inactive Cup remains in the catalog evidence so historical transactions and closed-shift evidence can still resolve its code.

A Cup that is still mapped by an active product cannot be deactivated until the product mapping is changed.

## Persistence

Single configuration authority:
- global/settings/cupCatalogV1

The existing global/settings Firebase Rules authority is reused.

No new production Rules root is required.

Writer:
- src/data/writers/cup-catalog-writer.js

Mutation contract:
- Owner / Manajemen only at application layer
- Firebase Rules enforce authenticated active manajemen write
- transaction only
- exact path global/settings/cupCatalogV1
- no set
- no update
- no remove

## Runtime consumption

The same Cup catalog feeds:
1. Pengaturan -> Cup Control
2. Edit Produk -> Kemasan / Jenis Cup
3. Mapping Cup per Kategori
4. Shift Opening Cup
5. Active-shift Cup Restock
6. Shift Closing / reconciliation
7. Transaction expected Cup usage
8. Riwayat Cup

Built-in six Cup types remain zero-configuration fallback.

Custom Cup types do not become Inventory V2 ingredients.
Cup Control remains the physical Cup authority.

## Inactive semantics

New product choices show active Cup types.

Operational shift catalog retains an inactive Cup when necessary for continuity, including:
- a still-existing mapping
- carried physical closing/opening stock

Historical evidence is never deleted by deactivation.

## Automated evidence

Cup Catalog integration gate:
- 85 / 85 PASS

Full repository regression:
- 836 / 836 PASS
- 0 fail
- 0 skipped

REF-01 verifier:
- PASS
- 6 Settings groups
- 0 REF-01 RTDB mutations

SC-02:
- PASS
- mutations exact-allowlisted to 6 dedicated writers

SC-04:
- PASS
- destructive remove forbidden
- Cup Catalog writer constrained to global/settings/cupCatalogV1 transaction only

Build candidate:
- Cup Catalog runtime present
- Cup Catalog writer present
- Cup Catalog settings UI present
- dynamic product picker present
- dynamic shift Cup Control present

## Production safety

At this checkpoint:
- main merge: 0
- production deploy: 0
- Firebase Rules publish: 0
- production database/storage writes: 0
- historical backfill: 0

## Remaining before revised RC

Human UAT on emulator:
1. Open Pengaturan -> Cup Control.
2. Add Cup 24 Oz with code cup24.
3. Confirm Cup 24 Oz appears in Edit Produk.
4. Map a UAT product to cup24.
5. Confirm cup24 appears in Shift Opening / Restock / Closing.
6. Complete one UAT transaction and verify expected usage.
7. Verify Riwayat Cup displays cup24.
8. Confirm deactivation is blocked while product mapping remains.
9. Remove mapping, deactivate cup24, and confirm:
   - it disappears from new product choices;
   - historical closed-shift evidence remains readable.
10. Review mobile and desktop presentation.

Only after Human UAT acceptance should a revised Final RC be created.
