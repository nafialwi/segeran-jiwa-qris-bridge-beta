# R10 Shift Cup & Finished Goods Evidence — Pre-Production

Status: IMPLEMENTED; AUTOMATED GATES PASS; HUMAN UAT PENDING
Production mutation: 0

## Purpose

Make a closed shift auditable without creating a second stock authority.

The closed Shift Session surface now gains two read-only audit entry points:

1. Riwayat Cup
2. Stok Barang Jadi

## Authority model

### Cup

Cup Control remains the sole physical Cup authority.

The shift detail reads existing:
- opening
- restock
- transaction usage
- physical usage
- physical closing
- variance/status/reconciliation

No Inventory V2 Cup balance becomes authoritative.

### Finished goods

global/inventory remains the outlet finished-goods stock authority.

Shift stock evidence is only a time-stamped snapshot/audit layer.

At shift OPEN:
- capture tracked finished-goods system quantities.

At shift CLOSE:
- capture final system quantities;
- summarize sold units;
- summarize return-to-stock refunds;
- expose residual Perubahan lain separately.

Perubahan lain is never labelled as sales. It represents the net effect of non-sale stock changes such as transfer/opname/correction that occurred during the shift. Exact movement audit continues to belong to Inventory V2 / Pergerakan.

## No forced physical count

Kasir is not required to physically count every finished good on every shift.

Physical stock corrections remain under the existing Owner Stock Opname authority.

Kasir's existing problem-report flow remains a draft and does not directly mutate stock.

## Historical behavior

Historical Cup data can be displayed immediately because Cup Control evidence already exists.

Historical finished-goods shifts that predate this feature are not backfilled. Their UI states that stock evidence begins on shifts opened after this feature becomes active.

No historical transaction is replayed.

## Failure behavior

Shift stock evidence is secondary evidence, not the shift business authority.

If an evidence read fails:
- shift OPEN remains available;
- shift CLOSE remains available;
- existing verified shift writer remains authoritative;
- a warning may be shown;
- no fabricated snapshot is written.

## Persistence

Evidence is appended only through the existing verified shift root writer.

No direct Firebase set/update/transaction/remove call is introduced.

Opening evidence:
- session stockEvidence.opening
- shift stockEvidence.opening

Closing evidence:
- session stockEvidence.closing
- session stockEvidence.summary
- shift stockEvidence.closing
- shift stockEvidence.summary
- closingSnapshot.stockEvidence

## Security / Rules compatibility

Fresh production Rules were reviewed.

The existing shift write policy authorizes the verified shift write by role/state and does not apply a child schema validation that rejects additive stockEvidence fields.

No new production Rules surface is required solely for Shift Stock Evidence.

## Automated evidence

Targeted Shift/Cup/Inventory regression:
- 92 / 92 PASS before final bootstrap gates

Feature contract after bootstrap locks:
- 14 / 14 PASS

SC-02:
- PASS
- mutations remain restricted to the existing five dedicated P4 writers

SC-04:
- PASS
- no direct RTDB mutation outside the existing allowlist

Full repository regression:
- 812 / 812 PASS
- 0 fail
- 0 skipped

REF-01:
- verifier PASS
- 0 REF-01 RTDB mutations

Build:
- new modules copied into dist-ref01/src
- source/build module parity verified

## Production safety

This enhancement was developed on branch:
- work/r10-shift-stock-evidence

The previous Final RC and production cutover branches remain immutable historical checkpoints.

At this checkpoint:
- main merge: 0
- production deployment: 0
- Firebase Rules publish: 0
- production database/storage writes: 0
- migration/backfill: 0

## Remaining work

1. Isolated Human UAT, mobile-first.
2. Confirm closed historical shift shows usable Riwayat Cup.
3. Confirm historical shift without stock snapshot explains the limitation clearly.
4. In isolated UAT, start a new shift so opening stock evidence is captured.
5. Exercise a tracked finished-good sale and a non-sale stock change.
6. Close the isolated shift and verify Opening, Terjual, Retur ke stok, Perubahan lain, and Akhir sistem.
7. Verify mobile 360/390 and desktop presentation.
8. Only after Human UAT acceptance, create a revised Final RC and refresh the production cutover gate.
