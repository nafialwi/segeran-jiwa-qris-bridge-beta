# P4 Phase C — Approved Finance Persistence Design

Status: **APPROVED FOR IMPLEMENTATION AND TESTING ONLY** on 2026-09-02. Production deployment remains separately gated.

## Source of truth

This design implements the approved `P4_PHASE_B_DATABASE_WRITER_PROPOSAL.md` from `SEGERAN_JIWA_POS_v3.3_P4_DB_APPROVAL_GATE.zip` and preserves P3 v3.2 LOCKED as rollback anchor.

## Fixed database paths

Under `toko_segeranjiwa_v58`:

- `global/financeV1/ownerEvents/{YYYY-MM}/{operationId}`
- `global/financeV1/monthCloseEvents/{YYYY-MM}/{operationId}`
- `global/financeV1/qrisCashOut/{providerTransactionId}`
- existing `{shiftKey}/cashMovements/{cashMovementId}` for physical QRIS cash-out

QRIS evidence remains under `segeranjiwa_qris_beta_v1` and may only be mutated by the dedicated QRIS cash-out coordinator for the approved cash-out resolution flow.

## Authority boundaries

- Existing transaction writer remains the only sale writer.
- Existing `opex` remains the only business-expense writer.
- Inventory V2 remains inventory/purchase writer authority.
- Existing shift `cashMovements` remains drawer movement authority.
- Existing QRIS exact-amount matcher remains unchanged for normal QRIS payments.
- Finance writer owns only Owner Capital / Prive / Month Close finance events.
- QRIS cash-out coordinator owns only overpay claim/finalization/recovery and linked finance evidence.

## Finance event rules

Owner events are append-only. Types: `OPENING_CAPITAL`, `ADDITIONAL_CAPITAL`, `PRIVE`, `REVERSAL`.

- `operationId` is the idempotency key.
- duplicate operation IDs are rejected without overwriting history.
- only one unreversed opening-capital event is active per month.
- correction is a new REVERSAL event referencing the original.
- no delete/update API is exposed for historical events.

Month close events are append-only. Types: `CLOSE`, `REOPEN`.

- one active CLOSE may exist at a time.
- REOPEN references the active CLOSE.
- a later CLOSE is a new event after REOPEN.
- snapshots are never deleted or overwritten.

## Sensitive authorization

- Modal / Tambahan Modal / Prive / Month Close: Owner role + fresh Owner PIN re-auth.
- QRIS cash-out: Owner may authorize directly; Cashier requires explicit Owner identity + Owner PIN approval.
- PIN/credentials are never persisted in finance events, session envelopes, or coordinator journals.
- authorization proof is short-lived and contains identity metadata only.

## QRIS cash-out state machine

Locked business example: sale 4,000; QRIS received 20,000; cash-out 16,000; expense 0; refund 0.

Coordinator sequence:

1. Read/revalidate signal, pending, requester/shift context, cart/pending amount and drawer sufficiency.
2. Claim signal for `operationId` using a conditional transaction.
3. Claim pending for the same operation. If this fails, release only the same signal claim.
4. Record an operation journal under `global/financeV1/qrisCashOut/{providerTransactionId}` with recovery metadata and pre-sale transaction keys.
5. Delegate sale creation to the existing transaction authority exactly once.
6. Identify the created sale from post-sale shift transactions. If outcome is uncertain, fail closed into recovery-required state rather than re-running the sale writer.
7. Atomically finalize the linked shift cash movement, finance evidence, signal terminal resolution, and pending finalization with a root multi-location update.
8. Recovery is `operationId`-aware and may only resume the same claim. It never silently reuses the signal or duplicates a sale.

Final QRIS signal state uses `status=CONFIRMED` and `resolutionState=CASH_OUT_CONFIRMED`. Pending stores the actual sale transaction ID, `qrisReceived`, and `cashOutAmount`.

## Cash-flow semantics

For a confirmed QRIS cash-out, finance Cash Flow must use actual QRIS receipt as the sale inflow, not only sale revenue. The linked cash movement supplies the physical cash outflow. Thus 20,000 inflow - 16,000 outflow = 4,000 net liquidity while P&L revenue stays 4,000.

## SC04 evolution

SC04 changes from “no modular RTDB mutations” to an exact mutation allowlist:

- `src/data/writers/finance-writer.js`
- `src/data/writers/qris-cash-out-coordinator.js`

Any `.set`, `.update`, `.transaction`, or `.remove` elsewhere in `src/**/*.js` is a hard failure. The verifier also checks the approved finance/QRIS path contract and rejects destructive remove usage in the allowlisted files.

## UI scope

Owner Finance workspace has five tabs:

`Ringkasan | Arus Kas | Pengeluaran | Modal & Prive | Tutup Bulan`

- Finance UI reads canonical P4 model.
- Expense actions continue to existing Expense authority.
- Modal/Prive and Month Close actions call only the dedicated finance service/writer after re-auth.
- HPP unknown is rendered as `Belum tersedia`, never Rp0.
- QRIS cash-out control appears only for a valid overpay candidate and requires the sensitive authorization flow.

## Release boundary

Passing Phase C tests/builds does **not** authorize production deployment. Production v2.9 remains untouched until a separate final hardening + deployment approval.
