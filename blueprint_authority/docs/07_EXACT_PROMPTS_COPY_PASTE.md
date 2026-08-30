# 07 — EXACT PROMPTS SIAP COPY-PASTE

Gunakan prompt berikut **berurutan**. Tidak perlu mengubah isinya kecuali Anda memang ingin menambahkan kebutuhan baru.

---

## PROMPT 1 — SC-01

```text
Expert, mulai SC-01 Structural Consolidation berdasarkan paket SEGERAN JIWA POS CLEAN BASELINE BLUEPRINT v1.0.

Authority:
- v1.0.40 = Legacy Migration Authority / rollback source.
- Sembilan Final Refinement references = visual/IA authority, tetapi pada SC-01 JANGAN redesign dulu.
- Firebase POS root tetap /toko_segeranjiwa_v58.
- QRIS root tetap segeranjiwa_qris_beta_v1.
- Semua menu, role guard, transaction, QRIS, inventory, purchase/WAC, debt, shift, refund/VOID, report evidence harus dipertahankan.

Kerjakan work package SC-01 sampai checkpoint coherent dalam sekali kerja sejauh aman:
1. freeze/hash baseline;
2. audit seluruh monolith: functions, CSS/renderer layers, routes, menu, Firebase reads/writes, QRIS, auth/session, shift, reports;
3. buat source modular scaffold, build pipeline, tests, docs dan dist/index.html target;
4. buat extraction map + legacy debt register;
5. jangan mengubah business behavior dan jangan polish UI;
6. jalankan verification fresh sebelum klaim PASS.

Jangan meminta saya memilih detail implementasi yang sudah diputuskan blueprint. Jika pekerjaan terlalu besar untuk satu sesi, berhenti hanya pada checkpoint aman dan laporkan apa yang sudah selesai, sisa pekerjaan dalam SC-01, risiko, dan tindakan saya. Jangan lompat ke SC-02 sebelum SC-01 benar-benar siap.
```

---

## PROMPT 2 — SC-02

```text
Expert, lanjutkan SC-02 Core/Data/Domain Extraction dari hasil SC-01. Jangan kembali mengembangkan HTML monolith sebagai source utama.

Target:
- ekstrak Firebase/data adapters, repositories, common core, transaction, pricing, inventory, purchase/WAC, debt, shift, refund/VOID, report calculation;
- QRIS harus tetap memakai existing SJQrisSignalBeta melalui adapter, bukan engine baru;
- tidak boleh ada duplicate write path;
- roots/schema/Rules tetap;
- behavior equivalence terhadap v1.0.40 harus dibuktikan dengan tests/regression;
- unknown HPP tetap Belum tersedia, bukan Rp0;
- buat write-map dan no-regression checks.

Kerjakan sebanyak mungkin dalam satu work package coherent. Jangan melakukan refinement visual. Fresh verification wajib. Pada akhir sesi, jika modular baseline sudah layak menjadi source authority, beritahu saya secara eksplisit bahwa ini saatnya memberikan URL GitHub; kalau belum, jangan minta URL GitHub dulu.
```

---

## PROMPT 3 — SC-03

```text
Expert, lanjutkan SC-03 Feature Modules + Legacy De-layering.

Gunakan blueprint sebagai authority. Migrasikan app shell/router/role guard, Dashboard, Sales/Cart/Checkout, Payments, Operational/Stock/Restock, Shift/Closing/Refund, Reports, Settings ke module boundaries yang jelas. Legacy bridge boleh sementara, tetapi setiap screen family hanya boleh mempunyai satu visible final renderer path. Jangan membuat correction CSS layer baru di akhir HTML.

Pastikan seluruh menu existing tetap ada dan dipetakan ke kelompok yang benar. Pastikan Owner/Kasir guard tetap benar. Pastikan child transaction flow tetap parent route Jual dan bottom navigation tidak desinkron.

Tidak perlu meminta screenshot untuk tiap halaman. Jalankan full regression dan laporkan hanya checkpoint penting. Jangan melakukan polish mikro. Jika menemukan conflict arsitektur, perbaiki pada source structure, bukan menambah patch lain.
```

---

## PROMPT 4 — SC-04

```text
Expert, lanjutkan SC-04 Persistent Session + Source Workflow.

Target UX: jika aplikasi/browser ditutup lalu dibuka lagi, user yang session-nya masih valid langsung kembali ke aplikasi; Kasir yang masih mempunyai active shift kembali ke shift itu. Logout manual wajib menghapus session. Revoked device/disabled user/invalid role harus memaksa logout. Jangan pernah menyimpan PIN/password plaintext.

Integrasikan dengan existing Firebase Auth mode LEGACY/HYBRID/SECURE secara aman; utamakan Firebase Auth persisted session ketika tersedia. Buat Session Manager tunggal, bukan localStorage tersebar.

Setelah session regression hijau, jadikan GitHub repository modular sebagai source authority. Jika saya belum memberikan URL repo, baru minta saat memang diperlukan. Setelah GitHub stabil, setup Cloudflare static preview zero-cost jika data/project yang dibutuhkan tersedia. Jangan mengubah Firebase Rules/schema atau mengaktifkan billing.

Kerjakan work package ini secara utuh sejauh aman, dengan fresh verification dan UAT checklist close/reopen/logout/shift restore.
```

---

## PROMPT 5 — REF-01

```text
Expert, mulai REF-01 FULL FINAL REFINEMENT CONVERGENCE sebagai SATU coordinated batch. Saya tidak ingin kembali ke pola satu prompt satu polesan.

Visual/IA authority adalah sembilan refinement references dalam blueprint. Jangan membuat interpretasi baru yang bertentangan dengannya.

Wajib dibenahi sebagai satu sistem:
- Owner Dashboard dan Kasir Dashboard sesuai tanggung jawab masing-masing;
- Dashboard = kondisi operasional sekarang; Laporan = historical analytics/trend/evidence, jangan duplikasi headline information;
- Jual, Cart, Checkout, Tunai, QRIS, Transfer, Kasbon;
- Operasional, Stok, Restock, Pengeluaran;
- Shift, Closing, Refund/VOID;
- Laporan dengan Total Penjualan, Transaksi, Laba Kotor bila diketahui, Trend Penjualan, kategori Penjualan/Produk/Pelanggan/Keuangan, lalu evidence detail existing;
- Pengaturan grouped IA lengkap;
- Produk/Edit Produk/Stock Detail;
- one icon registry dengan semantic icon konsisten;
- bottom navigation states/motion;
- loading/empty/error/offline/success/permission states;
- responsive mobile 320/390/430 + tablet/desktop.

Business logic authority tetap source modular hasil SC-01..04. QRIS matching/recovery/pending/ambiguity/fallback tidak boleh ditulis ulang. Menu lengkap tidak boleh hilang. Jangan membuat visual correction layer yang menumpuk; perbaiki component/token/renderer source.

Jalankan full regression. Output akhir harus berupa V-PASS candidate, bukan klaim visual PASS tanpa real-device screenshot.
```

---

## PROMPT 6 — QA-01

```text
Expert, jalankan QA-01 Consolidated UAT Correction + UI FREEZE berdasarkan satu batch screenshot/temuan yang saya kirim.

Klasifikasikan seluruh temuan menjadi Functional, Architecture/IA, Visual, Regression. Perbaiki SEMUA temuan yang saling terkait dalam satu batch, bukan satu build per detail. Jangan menambah design concept baru; Final Refinement references tetap authority.

Setelah correction, jalankan regression penuh dan audit side-by-side untuk screen families utama. Gunakan status terpisah:
F-PASS = fungsi,
A-PASS = arsitektur/IA,
V-PASS = visual real-device,
R-PASS = tidak merusak area lain.

UI FREEZE hanya boleh diberikan jika tidak ada temuan visual/IA mayor yang tersisa. Setelah freeze, tidak ada lagi polish mikro kecuali blocker, responsive defect, accessibility, atau regression.
```

---

## PROMPT 7 — F03-01

```text
Expert, lanjutkan F03-01 Costing/HPP & Financial Hardening setelah UI Freeze.

Selesaikan HPP STOCK, HPP RECIPE, gross profit, margin, missing-HPP safety, VOID/refund costing, purchase/WAC regression, dan integrasi ke Laporan Keuangan. Unknown/legacy missing HPP tidak boleh diperlakukan Rp0.

Jaga UI Freeze; jangan redesign. Regression wajib meliputi Tunai, QRIS, Transfer, Kasbon, diskon/pricing, inventory, purchase/WAC, shift, VOID/refund, reports. Jangan ubah Firebase Rules/schema/root tanpa checkpoint eksplisit.

Kerjakan sebagai satu financial work package besar dan laporkan hanya blocker nyata atau tindakan UAT yang memang saya perlu lakukan.
```

---

## PROMPT 8 — RC-01

```text
Expert, mulai RC-01 Release Hardening dan tentukan apakah APPMINT GATE sudah boleh dibuka.

Lakukan full end-to-end regression Owner + Kasir: login/session restore, active shift, Jual, Cart, Checkout, Tunai, QRIS, Transfer, Kasbon, Stok, Restock, Pengeluaran, Hutang/Kasbon, Shift/Closing/Handover, Refund/VOID, Reports, Settings, notification/deep-link, barcode/camera, printer/share/PDF, offline/reconnect, Android Back contract dan lifecycle assumptions.

Jangan membuka AppMint gate hanya karena automated tests pass. Browser/mobile candidate harus stabil dulu. Jika gate layak dibuka, buat package RC, hash, rollback, UAT AppMint checklist, dan beri label jelas APPMINT GATE OPEN. Kalau belum layak, selesaikan blocker dalam batch sebelum meminta saya install APK.
```

---

## PROMPT 9 — hanya bila diminta

```text
Expert, jalankan WIC-01 WebView/AppMint-only Fix Batch. Hanya perbaiki masalah yang terbukti khusus APK/WebView dari UAT AppMint. Jangan redesign, jangan menambah fitur, jangan mengubah business engine kecuali root cause memang ada di integration boundary. Gabungkan seluruh WebView findings dalam satu batch dan ulang full regression sebelum RC baru.
```

## PROMPT 10 — hanya bila diminta

```text
Expert, jalankan RC-FIX Final Blocker Batch. Ini bukan fase fitur atau polish. Selesaikan hanya blocker release yang tersisa, jalankan seluruh release gates, buat final package/manifest/hash/rollback, dan nyatakan Final hanya jika semua gate yang relevan benar-benar PASS.
```
