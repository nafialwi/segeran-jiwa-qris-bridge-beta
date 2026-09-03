# P5 Batch-2 Final QA — Android LOCAL QA

## Expected flow

1. Open `Bahan & Gudang`.
2. In `Kemasan & Cup`, press `Simulasikan Master Cup · LOCAL ONLY`.
3. Fill Gudang awal, Gerai awal, and WAC awal for all five cup types.
4. Confirm the preview of total cups and initial inventory value.
5. Press `Gunakan Simulasi Lokal`.
6. Cup cards should now show simulated Gerai/Gudang/WAC values and `LOCAL ONLY` state.
7. Open Shift start screen. `Hitung Cup Awal` must show simulated Gerai references.
8. Fill all five opening counts. The values are kept only in page memory for closing simulation.
9. `MULAI SHIFT` must display `🔒 MULAI SHIFT · READ ONLY` and be disabled.
10. Open closing audit. Existing real shift may be legacy, but LOCAL opening simulation should allow reconciliation preview.
11. Fill `Cup Masuk simulasi` where needed, then fill physical closing counts.
12. Verify physical usage, theoretical transaction usage, variance and variance reason.
13. Verify Inventory V2 Opname Draft when physical closing differs from system Gerai.
14. `TUTUP SHIFT` persistence must display READ ONLY and remain disabled.

No step above writes production data.
