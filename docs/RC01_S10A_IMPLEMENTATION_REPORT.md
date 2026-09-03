# RC01-S10A QRIS Deferred Settlement & Parked Sale Hardening — Implementation Report

**Date:** 2026-09-03  
**Phase:** RC-01 Release Candidate Hardening  
**Work package:** RC01-S10A  
**Trigger:** real Rp5.000 QRIS payment settled at provider while the local POS pending was still waiting; cashier cancelled the local pending to serve the next cash customer, and the provider notification arrived later.

## 1. Release decision

RC01-S10 production promotion remains **HOLD** until this correction pack is deployed to Cloudflare Preview and passes the targeted real-device QRIS UAT in `docs/RC01_S10A_REAL_DEVICE_UAT.md`.

The existing P5 authority, RC01-S01–S09 evidence, GitHub/Cloudflare pipeline, and CR-01-DIST-01 Web-first distribution decision remain valid. AppMint/WebView remains **DEFERRED / N-A for Web Release** and is not W-PASS.

## 2. Root cause addressed

Legacy QRIS cancellation changed the pending to `CANCELLED` and removed it from the normal matching candidate set. A payment notification arriving after that cancellation could remain unmatched and later be reconsidered against a newer same-amount pending within the legacy plausibility window.

S10A separates **Park** from **true Cancel**. A parked pending remains under the legacy `WAITING_QRIS` authority, while true-cancel late signals are quarantined fail-closed and cannot be auto-matched to a new pending.

## 3. Implemented behavior

### 3.1 Immutable sale snapshot and Park

`src/domain/qris-deferred-settlement-policy.js` normalizes the approved sale snapshot and produces stable evidence identity. `src/data/writers/qris-deferred-settlement-writer.js` atomically attaches the immutable snapshot and Park metadata to the existing QRIS pending row.

Approved additive pending evidence includes:

- `saleSnapshotVersion: "S10A-1"`
- `saleSnapshot`
- `parkedAt`
- `parkedBy`
- `parkReason: "SERVE_NEXT_CUSTOMER"`

Park does **not** change the legacy pending status from `WAITING_QRIS`.

### 3.2 Cashier continuity

The classic compatibility layer adds `Parkir QRIS & Layani Berikutnya`. After persistence is proven, the live cart can be cleared so the cashier may serve a non-QRIS customer. A visible parked/review surface remains available.

A second QRIS is blocked while the same cashier owns an unresolved parked QRIS. Tunai/Transfer/Kasbon remain available.

### 3.3 Deferred recovery and exact finalization authority

A matched parked payment is not silently finalized in the background. Recovery requires an empty live cart. S10A restores the immutable snapshot and delegates final sale creation only through the existing `SJQrisSignalBeta.confirmMatched()` / existing transaction engine.

The existing reliability revalidation still runs before the paid snapshot price is re-applied. If the only difference is current price drift, S10A honors the already-paid immutable price for the recovery attempt. Other safety failures continue to block finalization.

### 3.4 Late-after-cancel quarantine

A plausible provider signal arriving after a true cancellation is classified fail-closed:

- `LATE_AFTER_CANCEL`
- `LATE_OR_NEW_AMBIGUOUS`

Quarantined evidence is marked `resolutionState: "REVIEW_REQUIRED"` and `autoMatchBlocked: true`. It is surfaced as `Perlu Tindakan` and is excluded from normal automatic matching.

The real historical Rp5.000 incident is **not** fabricated retrospectively. It remains manual-reconciliation evidence because no S10A immutable sale snapshot existed at the time of that transaction.

## 4. Persistence and mutation authority

No new Firebase root was introduced.

- POS root remains `toko_segeranjiwa_v58`.
- QRIS root remains `segeranjiwa_qris_beta_v1`.
- Firebase Rules were not changed.
- Package-ID contract remains `id.segeranjiwa.pos`.
- Frozen baseline remains byte-identical.

The modular mutation allowlist is now exactly **4/4**:

1. `src/data/writers/finance-writer.js`
2. `src/data/writers/purchase-reconciliation-writer.js`
3. `src/data/writers/qris-cash-out-coordinator.js`
4. `src/data/writers/qris-deferred-settlement-writer.js`

The new writer uses RTDB `transaction()` only under existing QRIS `pending/{id}` and `signals/{providerId}` rows. It has no POS/inventory/finance mutation authority.

## 5. Verification evidence

Fresh final verification command:

```bash
npm run verify:rc01:s10a
```

Final local result before packaging:

- Full Node suite: **459/459 PASS, 0 fail**
- B01–B05 icon guard: **61/61 PASS**
- Finance verifier: **9/9 PASS**
- SC02: PASS
- SC03: PASS
- SC04: PASS, exact mutation allowlist 4/4
- RC01 release verifier: PASS, exact mutation allowlist 4/4
- RC01-S10A verifier: PASS, exact mutation allowlist 4/4
- Frozen baseline SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- P5 locked source SHA256 reverified: `485219ac9470cd629f080909e91c05700fe1eb5c6c8f393403644de3ef715530`
- `dist-ref01/index.html` SHA256: `b2f5295945d610c0a451be5db13172dbd6791616e4c927315219ff63c824d58c`
- `dist-rc01/index.html` SHA256: `b2f5295945d610c0a451be5db13172dbd6791616e4c927315219ff63c824d58c`

## 6. Explicit non-goals / known safe limitations

S10A does not reserve POS stock merely because a QRIS is parked; such a reservation would require a separate approved POS writer/authority change. Therefore, if product/recipe/stock state becomes unsafe before recovery, existing transaction revalidation may block finalization and require manual reconciliation. Payment evidence remains preserved; S10A must not guess or fabricate a sale.

The existing QRIS pending TTL remains unchanged (approximately 20 minutes in the current authority). S10A does not extend that TTL. Notifications delayed beyond the supported pending window may therefore require manual review rather than automatic recovery.

S10A does not change historical HPP, Firebase Rules, package identity, production deployment, or Cloudflare Production.

## 7. External gate remaining

Local implementation is complete only after the final source package is created. Release promotion is still blocked by:

1. GitHub RC Preview update from the S10A source.
2. Cloudflare Preview deployment success.
3. Targeted real-device Scenarios A–D in `docs/RC01_S10A_REAL_DEVICE_UAT.md`.
4. Fresh production-promotion audit after targeted UAT.

Production v2.9 remains LIVE / UNTOUCHED until explicit production approval.
