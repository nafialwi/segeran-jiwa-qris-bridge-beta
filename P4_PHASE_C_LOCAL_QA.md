# P4 Phase C RC5-D — Local QA Quick Start

Status: **READ-ONLY Android/Termux UAT**

Run from extracted `source`:

```bash
npm run qa:local
```

Expected:

```text
Segeran Jiwa dist-ref01 preview [LOCAL QA]: http://127.0.0.1:4173
```

Open `http://127.0.0.1:4173` and confirm **LOCAL QA · READ ONLY**.

## RC5-D QA sequence

1. Open **Laporan -> Keuangan -> Arus Kas**.
2. Set **Periode = Agustus 2026**.
3. Verify `Pembelian TEH` remains visible.
4. If it is the only Inventory Purchase evidence in that scope and is `OWNER` funded, verify **Uang Keluar does not include Rp25.000** and running business balance is not reduced by it.
5. Verify the purchase row states **Dana Owner Rp25.000** / non-business-cash treatment.
6. Open purchase audit and verify **Funding Semantics** shows Purchase Rp25.000 and **Dampak Arus Kas Usaha Rp0**.
7. Verify **Dry-run Link Expense** remains evidence-only and truthful.
8. Verify **WAC Cost Review** shows `REVIEW_REQUIRED` when downstream consumption/opname exists and **Auto Rewrite = Dilarang**.
9. Verify **Rencana Resolusi Terkontrol** separates safe candidates, blocked actions, and manual-review actions.
10. Verify **Audit Shift / Resolusi Shift Historis** remain truthful.
11. Every mutation input/button remains disabled in LOCAL QA.

## Do not do

- Do not edit Firebase manually.
- Do not execute LINK_REPAIR/HISTORICAL_SHIFT_ACK in production yet.
- Do not reverse the purchase automatically.
- Do not rewrite WAC automatically.
- Do not deploy production.

## Final Hardening smoke

Verify only one primary bottom-nav item is visibly active. In purchase audit, `Pulihkan Link Expense` and `Acknowledgement Shift Historis` must display with lock/READ ONLY treatment. Return to Operasional/Bahan & Gudang and confirm INV3 containment is unchanged.
