# 04 — FUNCTIONAL SAFETY CONTRACT

Dokumen ini adalah **NO-REGRESSION CONTRACT** selama Structural Consolidation dan Refinement Convergence.

## 1. Fixed data boundaries

- POS RTDB root: `toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- package ID target existing: `id.segeranjiwa.pos`
- Firebase Rules/schema tidak diubah sebagai efek samping refactor.

## 2. Transaction authority

Existing `processTransaction()` / transaction engine behavior harus diekstrak, bukan diganti dengan jalur write baru.

Wajib dipertahankan:

- pricing authorization;
- Tunai;
- QRIS;
- Transfer;
- Kasbon;
- stock effect;
- debt effect;
- receipt/success;
- idempotency/busy guard yang sudah ada;
- audit/error behavior yang relevan.

**Dilarang:** dua transaction engine aktif paralel.

## 3. QRIS contract — HIGH RISK / DO NOT REWRITE

Existing `SJQrisSignalBeta` menjadi logic authority selama migrasi.

Wajib tetap ada:

- pending creation/recovery;
- matching signal;
- active pending identity;
- ambiguity detection/resolution;
- manual fallback contract;
- cancel safety;
- status/evidence;
- transaction finalization integration;
- QRIS separate root;
- no duplicate transaction finalization.

Renderer baru hanya boleh **mengonsumsi state/command engine**, bukan membuat engine QRIS kedua.

QRIS acceptance minimum:

1. QR tidak usable sebelum pending siap.
2. Amount/pending identity benar.
3. timer berasal dari pending expiry nyata jika tersedia.
4. unmatched/ambiguous signal tidak menjadi success palsu.
5. cancel tidak membatalkan payment yang sudah terdeteksi secara tidak aman.
6. retry/offline tidak membuat pending/transaction ganda.

## 4. Inventory / purchase / WAC

Wajib mempertahankan:

- inventory root/meaning existing;
- tracked stock behavior;
- purchase COMMITTED behavior;
- WAC update;
- movement/expense/funding references;
- no duplicate purchase recovery;
- stock/restock transitions existing.

Dilarang membuat “stock fix” kedua di UI.

## 5. HPP / costing safety

- unknown/legacy missing HPP tidak boleh menjadi Rp0;
- HPP hanya dianggap diketahui bila costing evidence tersedia;
- gross profit/margin tidak boleh dihitung dari HPP palsu;
- VOID/refund costing diselesaikan di WP-F03, bukan di UI patch.

## 6. Shift safety

Wajib mempertahankan:

- kas awal;
- active shift ownership;
- current session ID;
- sales/expense realtime;
- cash denomination;
- expected vs actual cash;
- closing snapshot;
- handover;
- Owner/Kasir guards;
- app restart tidak membuat shift baru jika shift existing masih aktif.

## 7. Role guard

Role existing:

- Owner / `manajemen`
- Kasir / `transaksi`

UI hiding bukan security authority. Domain/repository command tetap harus mengecek izin yang tepat.

## 8. Reports

Report flow read-only terhadap business data.

Wajib mempertahankan:

- transaction evidence;
- pricing/payment evidence;
- HPP missing-state safety;
- purchase/movement evidence;
- cash/debt evidence;
- shift evidence;
- period filters;
- no report screen write ke transaction/inventory.

## 9. Persistent session contract

### Tujuan

Menutup APK/browser tab dan membuka lagi **tidak otomatis logout** bila session masih valid.

### Aturan

- tidak menyimpan PIN/password plaintext;
- gunakan existing Firebase Auth persistence bila mode HYBRID/SECURE mendukung;
- local session envelope hanya menyimpan identity/session metadata aman;
- restore selalu re-check user/device/role saat online;
- sensitive owner action dapat meminta PIN ulang;
- logout manual menghapus local session + auth state relevan;
- revoked device/disabled account memaksa logout;
- offline restore boleh memakai last-valid session dengan visible offline status dan command guards;
- active shift authoritative tetap dari shift data, bukan local cache.

## 10. No silent live infrastructure changes

Tidak boleh tanpa explicit checkpoint:

- deploy Firebase Rules;
- switch auth mode;
- migrate schema;
- delete historical data;
- change root path;
- change package ID;
- enable paid billing/service.

## 11. Regression kill-switch

Jika refactor menghasilkan salah satu berikut, work package **gagal** dan harus rollback/fix sebelum lanjut:

- QRIS tidak bisa masuk waiting state;
- transaction duplicate/missing;
- stock/WAC berubah tanpa transaksi yang semestinya;
- role leak;
- shift ownership rusak;
- report mengubah data;
- persistent session menyimpan PIN plaintext;
- menu existing hilang tanpa mapping yang disetujui;
- app tidak dapat menghasilkan `dist/index.html` yang runnable.
