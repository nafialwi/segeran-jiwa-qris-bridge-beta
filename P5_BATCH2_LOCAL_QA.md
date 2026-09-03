# P5 Batch-2 Android LOCAL QA Checklist

Run from `source`:

```bash
npm run qa:local
```

Open `http://127.0.0.1:4173` and confirm `LOCAL QA · READ ONLY`.

## A. Bahan & Gudang — Kemasan & Cup
1. Open `Operasional → Bahan & Gudang`.
2. Confirm section `Kemasan & Cup` shows exactly five rows:
   - Cup 10 Oz
   - Cup 16 Oz
   - Cup 22 Oz Datar Polos
   - Cup 22 Oz Datar
   - Cup 22 Oz Oval
3. Missing masters must show `Belum terdaftar`.
4. LOCAL QA setup action must be visibly locked/read-only.
5. Registered cup rows show Gerai/Gudang/WAC and Beli/Transfer/Opname actions.

## B. Product/category cup mapping
1. Open product/category management.
2. Confirm category cup mapping uses the existing cup codes.
3. LOCAL QA apply buttons must be disabled.
4. Existing per-product cup field remains available as override.

## C. Buka Shift
1. Open a shift start surface.
2. Confirm `Hitung Cup Awal` is visible before `MULAI SHIFT`.
3. Five physical fields must be present.
4. System Gerai quantity is reference only.
5. Confirm copy `Simulasi input lokal` is shown in LOCAL QA.
6. In LOCAL QA, the five count fields remain editable for **local draft simulation**; START/save remains blocked and nothing is written to production.

## D. Tutup Shift
1. Open closing worksheet for a representative ACTIVE shift.
2. Confirm `Hitung Cup Akhir` appears before final close button.
3. Confirm per-cup `Fisik terpakai`, `Transaksi`, `Selisih`.
4. A variance displays reason choices; in LOCAL QA these inputs remain editable for simulation only.
5. Confirm `Sinkronisasi Inventory V2` explains that Cup Control does not auto-write balances.
6. If system vs physical differs, UI should indicate how many cup types need Opname.

## E. Safety
- LOCAL QA remains read-only.
- INV3 containment remains active.
- No production deployment is part of this candidate.
