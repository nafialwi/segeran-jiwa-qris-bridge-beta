# 06 — EXECUTION ROADMAP: 6–10 PROMPT BESAR

## Prinsip

Target normal: **8 prompt besar**.  
Bisa selesai dalam **6 prompt** bila beberapa work package dapat digabung tanpa risiko.  
Batas maksimal normal: **10 prompt**, dengan Prompt 9–10 hanya untuk masalah yang memang muncul pada UAT/native wrapper.

Ini **bukan** berarti satu prompt = satu file atau satu layar. Satu prompt = **satu work package besar dan coherent**.

## Aturan untuk semua prompt

Assistant harus:

- langsung bekerja sejauh aman tanpa meminta user memilih detail yang sudah diputuskan blueprint;
- memakai v1.0.40 sebagai rollback/migration authority;
- menjalankan test sebelum mengklaim PASS;
- tidak membuat version kosmetik hanya karena spacing/icon kecil;
- menggabungkan correction ke batch yang masuk akal;
- berhenti hanya pada checkpoint coherent jika limit kerja tercapai;
- tidak memaksa pekerjaan jika model/tool limit sudah tidak aman;
- melapor dengan format progress yang konsisten;
- meminta tindakan user hanya jika benar-benar dibutuhkan.

---

## PROMPT 1 — SC-01: Freeze, Audit, Scaffold

### Tujuan

Membuat fondasi repository modular dari v1.0.40 **tanpa mengubah behavior**.

### Dikerjakan

- hash/freeze baseline;
- inventory source: CSS layers, global functions, Firebase writes, routes, menu, QRIS, shift, reports;
- buat modular directory skeleton;
- buat build pipeline yang menghasilkan `dist/index.html`;
- buat regression harness awal;
- buat extraction map dan debt register;
- jangan redesign UI.

### Exit gate

- baseline immutable;
- project modular dapat dibuild;
- test harness jalan;
- belum ada business behavior yang sengaja berubah.

### Tindakan user

**Tidak ada**, kecuali sistem benar-benar tidak mempunyai baseline file.

---

## PROMPT 2 — SC-02: Core, Data, Domain Extraction

### Tujuan

Memindahkan engine penting dari monolith ke module tanpa rewrite semantics.

### Dikerjakan

- core helpers;
- Firebase adapter/repositories;
- auth/session primitives existing;
- transaction engine boundary;
- inventory/purchase/WAC;
- debt;
- shift;
- report calculations;
- QRIS adapter wrapping existing `SJQrisSignalBeta`;
- mutation/write-map tests;
- parity tests.

### Exit gate

- no duplicate data engine;
- fixed roots unchanged;
- QRIS contract preserved;
- transaction/inventory/shift/report tests green.

### Tindakan user

Pada akhir tahap ini, **baru URL GitHub boleh diminta** bila modular baseline sudah layak dijadikan repository authority.

---

## PROMPT 3 — SC-03: Feature Modules + Legacy De-layering

### Tujuan

Memisahkan renderer/feature modules dan menghentikan tumpukan legacy visible renderer.

### Dikerjakan

- app shell/router/role guard;
- dashboard modules;
- sales/cart/checkout;
- payments;
- operational/stock/restock;
- shift/closing/refund;
- reports;
- settings;
- legacy bridge untuk compatibility sementara;
- hapus caller legacy yang sudah tidak aktif;
- full regression.

### Exit gate

- setiap screen family mempunyai satu final renderer path;
- route/back/nav state konsisten;
- menu lengkap terpetakan;
- no regression major.

### Tindakan user

**Tidak perlu screenshot setiap layar.** Hanya tes checkpoint bila assistant menemukan risiko runtime yang tidak dapat diautomasi.

---

## PROMPT 4 — SC-04: Persistent Session + GitHub + Preview Foundation

### Tujuan

Membuat aplikasi tidak logout hanya karena ditutup dan menyiapkan workflow source yang sehat.

### Dikerjakan

- Session Manager;
- Firebase Auth persistence integration untuk HYBRID/SECURE bila tersedia;
- safe local session envelope;
- restore user/role/device/active shift;
- manual logout invalidation;
- revoked-device/disabled-user handling;
- offline restore policy;
- GitHub repo source authority;
- Cloudflare static preview bila URL/project sudah tersedia.

### Exit gate

- PIN/password plaintext tidak disimpan;
- close/reopen restores valid session;
- logout manual returns to login;
- shift is restored, not duplicated;
- repo/build reproducible.

### Tindakan user

Di sini user mungkin perlu:

1. memberikan URL repo GitHub atau membuat repo kosong;
2. jika ingin preview, memberikan project/domain Cloudflare atau mengikuti setup singkat sekali.

---

## PROMPT 5 — REF-01: FULL FINAL REFINEMENT CONVERGENCE

### Tujuan

Menerapkan seluruh Final Refinement Pack sebagai **satu coordinated batch**, bukan polesan satu-satu.

### Dikerjakan

- Owner/Kasir Dashboard;
- Dashboard vs Report de-duplication;
- Jual/cart/checkout/payments;
- QRIS critical states;
- Operasional/Stok/Restock;
- Shift/Closing/Refund;
- Reports IA;
- Settings grouped IA;
- Product/edit/stock detail;
- single icon registry;
- bottom nav states/motion;
- loading/empty/error/offline/success/permission states;
- responsive 320/390/430 + tablet/desktop;
- remove visible legacy style/renderer bleed.

### Exit gate

- A-PASS automated/static for all main screen families;
- F-PASS regression retained;
- V-PASS candidate ready for real-device review.

### Tindakan user

User hanya mengirim **representative screenshot set**, bukan satu screenshot per tiny change.

---

## PROMPT 6 — QA-01: Consolidated UAT Correction + UI FREEZE

### Tujuan

Menyelesaikan semua temuan visual/flow dari satu UAT batch dan kemudian membekukan UI.

### Dikerjakan

- classify findings: blocker / functional / architecture / visual;
- correction dalam satu batch;
- no new design concepts;
- compare against nine refinement references;
- role variants;
- back/navigation;
- system states;
- responsive fixes;
- full regression;
- declare UI Freeze hanya jika gates terpenuhi.

### Exit gate

- F/A/V/R status jelas;
- UI Freeze candidate;
- tidak ada backlog kosmetik terbuka yang terus memicu build kecil.

### Tindakan user

Satu UAT batch final browser/mobile.

---

## PROMPT 7 — F03-01: Costing / HPP / Financial Hardening

### Tujuan

Menyelesaikan financial semantics yang belum final tanpa merusak UI Freeze.

### Dikerjakan

- HPP STOCK;
- HPP RECIPE;
- gross profit;
- margin;
- missing-HPP safety;
- VOID/refund costing;
- purchase/WAC regression;
- report finance integration;
- QRIS/barcode/inventory transaction regression.

### Exit gate

- costing evidence benar;
- unknown HPP never Rp0;
- financial reports consistent;
- transaction/inventory regression green.

### Tindakan user

Hanya UAT beberapa skenario transaksi yang ditentukan assistant.

---

## PROMPT 8 — RC-01: Release Hardening + APPMINT GATE

### Tujuan

Membuat Release Candidate yang benar-benar layak diinstal.

### Dikerjakan

- full end-to-end regression;
- owner + cashier role;
- session persistence;
- offline/reconnect;
- Android/system Back contract;
- barcode/camera;
- QRIS;
- printer/share/PDF;
- notification/deep-link;
- closing/report;
- build/hash/package;
- rollback docs;
- open `APPMINT GATE` hanya bila browser candidate sudah stabil.

### Exit gate

- RC package;
- browser/mobile gates green;
- AppMint package ready;
- explicit checklist for install/UAT.

### Tindakan user

**Baru di sini install AppMint/APK jika gate dibuka.**

---

# Prompt kontingensi (hanya bila perlu)

## PROMPT 9 — WIC-01: WebView/AppMint-only Fix Batch

Dipakai hanya bila bug muncul **hanya di APK/WebView**: Back, permission, printer, camera, share, lifecycle, status bar, storage.

Tidak digunakan bila RC1 langsung baik.

## PROMPT 10 — RC-FIX: Final Blocker Batch

Dipakai hanya untuk blocker release setelah AppMint UAT. Tidak boleh menambah fitur baru atau redesign baru.

---

# Kapan roadmap boleh menjadi hanya 6 prompt?

- Prompt 2+3 dapat digabung jika extraction kecil dan regression sangat kuat.
- Prompt 5+6 dapat digabung jika visual UAT pertama sudah dekat refinement.

# Kapan sampai 10 prompt?

Hanya jika:

- ada blocker structural yang nyata;
- AppMint/WebView mempunyai masalah khusus;
- final UAT menemukan blocker release.

Bukan karena “icon kurang 2px” atau “card ingin dipoles lagi”.
