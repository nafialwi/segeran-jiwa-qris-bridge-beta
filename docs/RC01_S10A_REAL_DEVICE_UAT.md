# RC01-S10A Targeted Real-Device QRIS UAT

**Scope:** payment-integrity regression for deferred QRIS settlement only.  
**Environment:** Cloudflare Preview from the S10A RC branch.  
**Hard stop:** do not promote to Production if any STOP condition appears.

## Preconditions

- Use the S10A Cloudflare Preview URL, not Production.
- Confirm cashier identity and active shift are correct.
- Use controlled small nominal transactions and preserve provider evidence/screenshots.
- Do not fabricate provider notifications or historical transactions.
- Start each scenario with no unresolved parked QRIS unless the scenario explicitly creates one.

## Scenario A — Park QRIS A, serve Cash B, recover A exactly once

1. Create QRIS sale **A** and reach `WAITING_QRIS`.
2. Use Back/Close or `Parkir QRIS & Layani Berikutnya`; verify the POS offers Park rather than silently cancelling.
3. Confirm a visible parked badge/surface remains and the live cart is available for the next customer.
4. Complete a separate **Tunai B** transaction.
5. Let the provider notification for QRIS A arrive after A was parked.
6. Verify Tunai B is not modified, duplicated, or replaced.
7. Verify parked A becomes matched/recoverable and remains clearly attributable to A.
8. Ensure the live cart is empty, select `Pulihkan & Selesaikan`, and verify the exact A item/qty/pricing snapshot is restored.
9. Verify A finalizes exactly once through the existing receipt/sale path.
10. Verify inventory/stock effect for A occurs exactly once and the receipt/transaction history contains one A sale only.

**PASS:** Cash B remains independent and A is recovered/finalized once with the original paid snapshot.

## Scenario B — True cancel, then late provider signal

1. Create QRIS sale A and explicitly choose **Batalkan Pending** after the strong warning.
2. Deliver/allow the provider signal for A to arrive later.
3. Verify the signal is shown as **Perlu Tindakan** / `LATE_AFTER_CANCEL`.
4. Verify no sale is automatically created and no unrelated cart is changed.
5. Verify the late signal is not eligible to auto-match a subsequent QRIS.

**PASS:** late money evidence is preserved for review and never silently becomes a new sale.

## Scenario C — Same-amount cancelled A versus newer QRIS B

1. True-cancel QRIS A for nominal X.
2. Create newer QRIS B for the same nominal X after the normal UI allows a new QRIS.
3. Let a plausible late provider signal for A arrive within the legacy time window while B is also plausible.
4. Verify the result is fail-closed as `LATE_OR_NEW_AMBIGUOUS` / **Perlu Tindakan**.
5. Verify B is **not** automatically completed by A's late signal.
6. Verify no duplicate sale, stock change, or receipt is created.

**PASS:** same-amount ambiguity is quarantined and requires review.

## Scenario D — Park survives lifecycle/reconnect

1. Create and Park a QRIS pending with its sale snapshot.
2. Put the browser/app in background, return, then exercise offline → reconnect.
3. Verify the same pending identifier, amount, parked marker, and recovery surface remain authoritative.
4. Let its valid provider signal match and then recover/finalize it.
5. Verify finalization occurs once with the original immutable snapshot.

**PASS:** lifecycle/reconnect does not lose or duplicate parked payment evidence.

## STOP conditions

Stop UAT and do not promote if any of these occurs:

- wrong QRIS signal auto-matches to another pending;
- a cancelled late signal creates a sale automatically;
- live cart is overwritten while it contains another customer's items;
- transaction, receipt, stock, or costing effect is duplicated;
- Tunai B is modified by QRIS A recovery;
- `Perlu Tindakan` is missing for late/ambiguous evidence;
- a same-amount late signal is auto-claimed when both old and new pending are plausible;
- recovery silently changes paid quantity/pricing/item identity;
- finalization proceeds after existing stock/recipe safety revalidation reports an unsafe condition.

## Evidence to return

For each scenario record `PASS` or the exact failed step. Capture screenshots of:

- parked QRIS surface;
- Tunai B receipt/history in Scenario A;
- matched parked A before recovery;
- recovered A receipt/history;
- `Perlu Tindakan` late/ambiguous state for Scenarios B/C;
- lifecycle/reconnect state for Scenario D.

A consolidated response such as `A PASS, B PASS, C PASS, D PASS` is sufficient when no STOP condition occurs.
