# RC01-S10A QRIS Deferred Settlement & Parked Sale Hardening Design

**Date:** 2026-09-03
**Status:** APPROVED FOR IMPLEMENTATION
**Phase:** RC-01 Release Candidate Hardening
**Work package:** RC01-S10A
**Trigger:** Real transaction evidence: QRIS Rp5.000 succeeded at provider, GoFood Merchant notification arrived late, local QRIS pending had already been cancelled so the cashier could serve a subsequent cash customer.

## 1. Goal

Make Segeran Jiwa POS safe when QRIS settlement notification is delayed after the customer has paid. The cashier must be able to leave the QRIS screen and serve another non-QRIS customer without cancelling the original payment evidence, while late signals after a true cancellation must never auto-match to a newer QRIS pending.

## 2. Release / Governance Constraints

1. `baseline/legacy-v1.0.40.html` remains byte-identical at SHA256 `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
2. P5 locked authority SHA256 remains `485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530`.
3. Production v2.9 remains LIVE / UNTOUCHED until S10A and RC01-S10 promotion gates pass.
4. No new Firebase root. Existing QRIS root remains exactly `segeranjiwa_qris_beta_v1`.
5. No Firebase Rules change, package-ID change, or historical HPP fabrication.
6. Persistence change is additive only under existing QRIS records and has explicit user approval in this conversation, subject to this written spec review.
7. The existing `SJQrisSignalBeta` remains the only normal QRIS pending/matching/finalization authority. S10A must not create a second general QRIS engine.
8. A new dedicated S10A writer is permitted only for the additive parked/snapshot/late-quarantine fields defined here; it may not write POS sale records, inventory, finance, or any other root.
9. CR-01-DIST-01 remains in force: AppMint/WebView is DEFERRED / N-A for the Web Release and is not W-PASS.

## 3. Problem Statement

Current QRIS behavior conflates two different operator intents:

- leave the QRIS screen temporarily to serve another customer; and
- truly cancel the QRIS pending.

`cancelWaiting()` sets the pending to `CANCELLED`, clears the active pending, and removes it from normal matching. If the provider signal arrives later, it becomes unmatched and can be reconsidered when a newer same-amount QRIS pending exists. This creates a payment-integrity risk: a received payment can be detached from its sale, re-used against a later sale, or cause a customer to be asked to pay twice.

## 4. Design Decision: Park Without Changing the Legacy Matching Status

A parked QRIS pending remains:

`status = WAITING_QRIS`

and receives additive parking metadata instead of a new matching status. This is deliberate: the legacy matcher already accepts `WAITING_QRIS`, so the same `SJQrisSignalBeta` continues to claim the provider signal. S10A does not compete with it.

Additive fields on `segeranjiwa_qris_beta_v1/pending/{pendingId}`:

```text
saleSnapshotVersion: "S10A-1"
saleSnapshot: { ...immutable sale snapshot... }
parkedAt: <server timestamp>
parkedBy: <uid/login authority>
parkReason: "SERVE_NEXT_CUSTOMER"
```

A parked pending is identified by `status === WAITING_QRIS && parkedAt != null`.

## 5. Immutable Sale Snapshot

The snapshot must be captured before a pending can be parked. It is evidence for restoring exactly the sale the customer paid for after the live cart has moved on.

Required snapshot shape:

```text
saleSnapshotVersion: "S10A-1"
saleSnapshot:
  capturedAt
  amount
  cartFingerprint
  pricingFingerprint
  items[]:
    id
    n
    q
    p
    note
    cp
    c
    discountType
    discountValue
  pricing:
    version
    subtotal
    itemDiscountTotal
    transactionDiscountTotal
    discountTotal
    netSubtotal
    serviceCharge
    taxBase
    tax
    total
    settings
    cartDiscount
    lines
```

Rules:

- Snapshot amount must equal pending amount.
- Snapshot cart/pricing fingerprints must reproduce the original pending `cartFingerprint`.
- No image/base64 data is persisted in the snapshot.
- Snapshot is immutable once attached. Repeating capture with the same fingerprint is idempotent; a conflicting replacement is rejected.
- Existing historical cancelled QRIS rows without this snapshot are not reconstructed or fabricated.

## 6. Park Flow

When QRIS is still `WAITING_QRIS` and no provider signal has been linked:

1. Ensure the immutable snapshot is attached.
2. Operator chooses **Parkir QRIS & Layani Berikutnya**.
3. Writer adds `parkedAt`, `parkedBy`, and `parkReason`; status remains `WAITING_QRIS`.
4. Live QRIS/payment surfaces close.
5. Current live cart is cleared and pricing session reset only after the persisted snapshot is proven valid.
6. Sales screen shows a persistent parked badge, for example `1 QRIS diparkir • Rp5.000`.
7. Cashier may perform new **non-QRIS** sales (Tunai, Transfer, Kasbon) normally.
8. Starting another QRIS while an unresolved parked QRIS belongs to that cashier is blocked with an explicit message. This avoids two concurrent QRIS claims on a static QR + notification bridge.

The Park action is not a cancellation and must not write `cancelledAt` or `status=CANCELLED`.

## 7. Provider Signal Arrives While Parked

Because the pending remains `WAITING_QRIS`, the legacy `SJQrisSignalBeta` matcher performs the normal claim and changes it to `MATCHED` with `providerTransactionId`.

S10A observes the parked pending becoming matched and shows a high-visibility status:

`QRIS RpX diterima untuk transaksi yang diparkir.`

No automatic sale finalization occurs while a different live cart contains items. The operator first completes or clears the current non-QRIS customer flow.

## 8. Restore & Finalize a Parked Matched Sale

Finalization must continue through the existing `SJQrisSignalBeta.confirmMatched()` and legacy `processTransaction()` authority; S10A must not create a second POS transaction writer.

To make the old finalizer accept the original pricing/cart context without editing the frozen baseline:

1. Require the live cart to be empty before recovery.
2. Restore the snapshot item rows into the legacy live cart.
3. Activate a temporary **forced pricing recovery context** that wraps `SJPrice.quote()` and `SJPrice.fingerprint()` only for this exact recovered cart and returns the immutable stored pricing/fingerprint.
4. Verify the reconstructed `currentFingerprint()` equals the pending `cartFingerprint` before finalization.
5. Call existing `SJQrisSignalBeta.confirmMatched()`.
6. On successful finalization, clear the forced pricing context and let the existing transaction/stock/report/receipt flow finish normally.
7. On failure, do not fabricate a transaction. Keep the pending/evidence recoverable and surface the failure for retry/reconciliation.

This preserves existing stock reservation, sale writer, HPP/costing, receipt, and QRIS confirmation behavior instead of duplicating them.

## 9. True Cancellation and Late Signal Quarantine

True cancellation remains available but must be visually separated from Park. Its confirmation must state that cancellation only stops the POS pending and cannot reverse a payment already sent by the customer.

The immutable snapshot remains attached after cancellation.

S10A adds a late-cancellation protection layer to `SJQrisSignalCore.matchSignal` without editing the baseline file:

- If a provider signal has a plausible recent `CANCELLED` same-amount pending, it must not auto-match to a newer pending solely on amount/time.
- If only cancelled candidate(s) are plausible, normal matcher output is forced to `UNMATCHED`; S10A then quarantines the signal as `LATE_AFTER_CANCEL`.
- If both a live waiting pending and recent cancelled candidate(s) are plausible, automatic matching is blocked and S10A quarantines as `LATE_OR_NEW_AMBIGUOUS` for manual review.

Additive signal fields may include:

```text
status: "LATE_AFTER_CANCEL" | "LATE_OR_NEW_AMBIGUOUS"
resolutionState: "REVIEW_REQUIRED"
autoMatchBlocked: true
lateDetectedAt: <server timestamp>
lateCandidatePendingIds: [ ... ]
```

These statuses are ineligible for normal automatic re-matching until explicitly resolved. No late signal may silently become payment for a newer sale.

## 10. Operator / Owner UX

### Cashier

- QRIS waiting screen gets a primary `Parkir QRIS & Layani Berikutnya` action.
- Parked QRIS badge remains visible on the Sales workspace.
- Attempting a second QRIS while a parked pending is unresolved is blocked; non-QRIS sales remain allowed.
- When a parked payment matches, badge changes to `QRIS diterima • selesaikan transaksi diparkir`.
- `Pulihkan & Selesaikan` is disabled while the live cart is non-empty.

### Owner

- Late-after-cancel / late-or-new-ambiguous evidence is surfaced as `Perlu Tindakan` and is never auto-dismissed.
- Existing notification observation from RC01-S08 remains separate; S10A only guarantees the new payment-integrity alert is visible in the dedicated QRIS parked/reconciliation surface.

## 11. Data / Writer Boundaries

New dedicated writer file:

`src/data/writers/qris-deferred-settlement-writer.js`

Allowed mutations are restricted to:

```text
segeranjiwa_qris_beta_v1/pending/{pendingId}/saleSnapshotVersion
segeranjiwa_qris_beta_v1/pending/{pendingId}/saleSnapshot
segeranjiwa_qris_beta_v1/pending/{pendingId}/parkedAt
segeranjiwa_qris_beta_v1/pending/{pendingId}/parkedBy
segeranjiwa_qris_beta_v1/pending/{pendingId}/parkReason
segeranjiwa_qris_beta_v1/signals/{providerTransactionId}/status
segeranjiwa_qris_beta_v1/signals/{providerTransactionId}/resolutionState
segeranjiwa_qris_beta_v1/signals/{providerTransactionId}/autoMatchBlocked
segeranjiwa_qris_beta_v1/signals/{providerTransactionId}/lateDetectedAt
segeranjiwa_qris_beta_v1/signals/{providerTransactionId}/lateCandidatePendingIds
```

The writer must not write:

- `toko_segeranjiwa_v58/**`
- Firebase Rules
- a new root
- inventory/finance/receipt transaction data
- historical cost/HPP evidence

The RC verifier mutation allowlist must change explicitly from 3/3 to 4/4 writers and assert the exact new writer path.

## 12. Compatibility Layer Boundaries

New classic compatibility file:

`src/compat/rc01-qris-deferred-settlement-compat.js`

Responsibilities:

- access legacy lexical `cart`, `payMethod`, pricing and UI state without changing frozen baseline;
- capture/restore snapshot data;
- install parked UI controls and second-QRIS guard;
- wrap `SJPrice.quote()` / `SJPrice.fingerprint()` only during explicit parked-sale recovery;
- patch `SJQrisSignalCore.matchSignal` only to block auto-match when recent cancelled candidates create a late-settlement conflict;
- delegate persistence to the dedicated S10A writer runtime;
- never write Firebase directly.

The build inserts this classic file after `ref01-production-sales-compat.js` and before the module entry.

## 13. Runtime Bootstrap

New module runtime:

`src/app/qris-deferred-settlement-bootstrap.js`

It obtains the existing Firebase DB from the already-installed P4 runtime, creates the S10A writer, exposes a narrow immutable runtime API for the classic compatibility layer, and does not alter the fixed Firebase roots.

`src/ref01-entry.js` installs this runtime before final RC enhancements.

## 14. Safety Invariants

1. A parked pending is never silently cancelled because the live cart changed.
2. A second QRIS cannot start for the same cashier while a parked pending is unresolved.
3. Non-QRIS sales can continue while QRIS is parked.
4. A late signal after true cancellation cannot auto-match to a newer pending.
5. A parked sale cannot overwrite a non-empty live cart during recovery.
6. A parked sale finalizes only from its immutable snapshot and through existing transaction authority.
7. A snapshot conflict or missing snapshot blocks parking/recovery; it never falls back to guessed cart/pricing data.
8. Existing historical QRIS evidence is never backfilled with invented cart/HPP data.
9. All operations are idempotent under repeated listener/UI execution.
10. Frozen baseline hash, POS root, QRIS root, and package identity remain unchanged.

## 15. Automated Acceptance

New regression coverage must prove at minimum:

1. Snapshot capture is immutable and idempotent.
2. Park requires `WAITING_QRIS`, same cashier/context, no linked provider, and valid snapshot.
3. Park keeps status `WAITING_QRIS` and adds only parking metadata.
4. Legacy normal matcher still matches a parked pending.
5. Non-QRIS sale remains available while parked.
6. New QRIS is blocked while parked.
7. Restored cart + forced pricing reproduces the exact original pending fingerprint.
8. Recovery refuses to overwrite a non-empty live cart.
9. Late signal after `CANCELLED` is blocked from normal auto-match.
10. Late signal is quarantined as `LATE_AFTER_CANCEL`.
11. Cancelled-vs-new same-amount conflict is quarantined as `LATE_OR_NEW_AMBIGUOUS` rather than auto-matched.
12. Quarantined signals are not eligible for subsequent automatic matching.
13. Repeated park/quarantine calls are idempotent.
14. Baseline SHA remains fixed.
15. No new Firebase root/rules/package identity.
16. Mutation allowlist is exactly the prior three dedicated writers plus `qris-deferred-settlement-writer.js`.
17. Full existing `npm run verify:rc01` suite remains green in addition to the new tests.

## 16. Targeted Real-Device UAT Before Returning to RC01-S10

### Scenario A — Parked QRIS then cash customer

1. Create QRIS sale A.
2. Before provider notification is delivered, choose Park.
3. Confirm parked badge and empty operational cart.
4. Complete cash sale B.
5. Deliver/receive the QRIS signal for A.
6. Confirm A becomes matched but B is unaffected.
7. With live cart empty, restore and finalize A.
8. Verify A appears once in sales history, QRIS total is correct, stock decrements once, and no duplicate transaction exists.

### Scenario B — True cancel then late provider signal

1. Create QRIS A and capture snapshot.
2. Truly cancel A.
3. Deliver its provider signal afterward.
4. Confirm signal is `LATE_AFTER_CANCEL` / review-required and is not linked to a newer transaction.

### Scenario C — Same amount conflict

1. Cancel QRIS A RpX.
2. Start QRIS B RpX in the conflict window.
3. Deliver one signal RpX.
4. Confirm no automatic sale claim occurs and manual review is required.

### Scenario D — lifecycle resilience

Repeat Park → background/resume → reconnect → matched recovery and verify the same pending/snapshot remains authoritative.

## 17. Existing Rp5.000 Incident

The 03 Sep 2026 Rp5.000 payment evidence predates S10A snapshot persistence. S10A must not fabricate the missing sale/cart snapshot retrospectively. The incident remains a manual reconciliation case and a regression scenario reference only.

## 18. Release Gate

RC01-S10 Web Production Promotion Gate remains HOLD until:

- all new S10A tests pass;
- full RC verifier passes;
- frozen baseline/root/writer contracts pass;
- targeted real-device scenarios A-D pass;
- no P0/P1 payment-integrity blocker remains.

Only then may the project return to RC01-S10 for a new explicit production promotion approval.
