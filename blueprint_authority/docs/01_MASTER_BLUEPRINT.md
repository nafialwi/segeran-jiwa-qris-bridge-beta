# 01 — MASTER BLUEPRINT

## 1. Tujuan

Membuat Segeran Jiwa POS menjadi aplikasi yang:

- stabil untuk dipakai sendiri sehari-hari;
- tetap mempertahankan semua business logic yang sudah matang;
- tampil konsisten dengan Final Refinement Pack yang disepakati;
- tidak lagi bergantung pada penumpukan patch CSS/renderer di satu HTML monolith;
- mudah diuji, di-debug, dan di-rollback;
- dapat tetap menghasilkan satu `dist/index.html` untuk AppMint;
- tidak mewajibkan login ulang hanya karena aplikasi ditutup;
- tetap zero-cost pada fase pengembangan saat ini.

## 2. Keputusan arsitektur

### Dipilih

**Modular Web Core + Build Output Single HTML + AppMint sementara sebagai APK wrapper.**

Source development dipisah menjadi modul. `index.html` final adalah **hasil build**, bukan source utama yang diedit terus-menerus.

### Tidak dipilih sekarang

- Full rewrite native Kotlin.
- Migrasi database besar.
- Mengganti Firebase.
- Mengganti QRIS engine dengan implementasi baru.
- Redesign bebas di luar Final Refinement Pack.
- Menambah framework besar hanya demi terlihat modern.

## 3. Source of truth

### Functional / rollback authority

`v1.0.40` menjadi **Legacy Migration Authority**.

Hal-hal yang sudah terbukti secara logic tidak boleh ditulis ulang tanpa alasan teknis dan test yang jelas.

### Visual / interaction / information architecture authority

Sembilan gambar refinement yang dikonfirmasi ulang 30 Agustus 2026 menjadi **Visual Authority Utama**.

Aturan terpenting:

- Beranda Owner = *current operational snapshot*.
- Beranda Kasir = *shift-centric operational dashboard*.
- Jual = sales execution.
- Operasional = kegiatan harian toko.
- Laporan = historical analytics, trend, categories, evidence.
- Pengaturan = master data + access + device + system, grouped list.
- Bottom navigation, icon grammar, state presentation, spacing, hierarchy mengikuti refinement.

## 4. Target source tree

```text
segeran-jiwa-pos/
├── src/
│   ├── app/
│   ├── core/
│   ├── data/
│   ├── domain/
│   ├── modules/
│   └── ui/
├── tests/
├── assets/
├── docs/
├── scripts/
├── package.json
└── dist/
    └── index.html
```

## 5. Aturan dependensi

```text
UI
 ↓
Feature Module
 ↓
Domain / Business Service
 ↓
Repository / Data Adapter
 ↓
Firebase / Local Persistence / QRIS source
```

Larangan target akhir:

```text
Screen -> Firebase write langsung
Screen -> menghitung ulang HPP sendiri
Screen -> membuat transaksi sendiri
Screen -> membuat QRIS pending sendiri
Screen -> memodifikasi state screen lain melalui DOM acak
```

## 6. Target pengalaman pengguna

### Saat membuka aplikasi

- jika sesi masih valid: langsung ke Beranda;
- jika Kasir masih memiliki shift aktif: shift itu dipulihkan;
- jika akun dicabut/nonaktif/role berubah: sesi direvalidasi dan dipaksa login bila perlu;
- logout manual selalu menghapus sesi;
- PIN/password tidak disimpan plaintext.

### Saat transaksi

`Jual -> Keranjang -> Checkout -> Payment Method -> Success`

Semua metode tetap tersedia sesuai role dan konfigurasi:

- Tunai;
- QRIS;
- Transfer;
- Kasbon.

## 7. Target engineering

- satu renderer final per screen family;
- satu design token system;
- satu icon registry;
- satu Session Manager;
- satu routing authority;
- satu transaction service authority;
- satu inventory authority;
- satu report calculation authority;
- adapter legacy hanya sementara selama migrasi;
- automated regression dijalankan setiap work package;
- tidak ada kata “PASS” tunggal tanpa gate yang jelas.

## 8. Definisi selesai

Segeran Jiwa POS baru dianggap selesai bila:

1. business regression hijau;
2. role guard hijau;
3. QRIS flow hijau;
4. shift/closing hijau;
5. inventory/purchase/WAC hijau;
6. report evidence aman;
7. persistent session hijau;
8. refinement screen families telah V-PASS;
9. no visible legacy renderer bleed;
10. AppMint/WebView final gate lulus;
11. rollback package dan source tag tersedia.
