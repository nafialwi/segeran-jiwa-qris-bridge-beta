# 03 — FINAL REFINEMENT AUTHORITY & INFORMATION ARCHITECTURE

## A. Aturan authority

Folder `references/refinement/` berisi sembilan gambar yang dikirim ulang pada 30 Agustus 2026. Gambar-gambar itu menjadi **visual, composition, icon, hierarchy, and interaction authority**.

Aplikasi existing tetap menjadi authority untuk logic/data. Jika visual reference dan existing logic berbeda, **logic tidak dibuang**; UI harus mencari tempat yang benar untuk logic tersebut.

## B. Primary navigation responsibility

| Area | Pertanyaan yang harus dijawab | Bukan tempat untuk |
|---|---|---|
| Beranda | “Apa keadaan toko sekarang dan apa yang harus saya lakukan?” | analitik historis mendalam |
| Jual | “Apa yang dijual dan bagaimana menyelesaikan transaksi?” | manajemen sistem |
| Operasional | “Apa pekerjaan harian toko yang perlu dilakukan?” | business trend/reporting |
| Laporan | “Bagaimana performa periode ini, trennya, dan buktinya?” | current operational launcher |
| Pengaturan | “Apa master data, akun, device dan konfigurasi sistem?” | aktivitas transaksi harian |

## C. Screen authority

### 1. Owner Dashboard

Target composition:

- header Beranda;
- Owner identity/profile + sync/security state;
- empat compact KPI:
  - Penjualan Hari Ini;
  - Kas Tersedia;
  - Hutang Pelanggan;
  - Restock Aktif;
- Perlu Perhatian;
- Aksi Cepat:
  - Penjualan;
  - Stok;
  - Laporan;
  - Restock.

**Dilarang:** menjadikan Dashboard sebagai mini-Laporan dengan grafik/historical analysis besar.

### 2. Kasir Dashboard

Harus berbeda komposisi dari Owner:

- identitas Kasir;
- shift aktif + waktu;
- Ringkasan Shift:
  - Penjualan;
  - Transaksi;
  - Rata-rata/Transaksi;
  - Item Terjual;
- CTA `Mulai Jual`;
- shortcut sesuai izin.

### 3. Jual

- header compact;
- search + scan/barcode;
- category/filter chips;
- product grid mobile yang padat tetapi touch-safe;
- real product image/data;
- `+/-` atau add behavior yang konsisten;
- persistent cart bar;
- tidak ada cart/payment modal legacy yang tiba-tiba mengambil alih final flow.

### 4. Keranjang

- list rows, bukan card tinggi;
- thumbnail kecil;
- qty control compact;
- remove/edit jelas;
- customer/discount sesuai engine;
- subtotal/discount/total compact;
- Checkout CTA jelas.

### 5. Checkout & Payments

Alur final:

`Keranjang -> Checkout -> Tunai/QRIS/Transfer/Kasbon -> Success`

Setiap metode adalah focused flow yang konsisten, bukan fallback ke bottom-sheet lama kecuali reference memang bottom-sheet.

### 6. QRIS

Visual states minimum:

- preparing/not-ready;
- waiting + amount + QR + timer;
- matched/success;
- ambiguous;
- retry/error/offline;
- manual fallback bila memang engine existing membutuhkannya.

**Tidak boleh:** menampilkan QR seolah siap jika pending belum terbentuk; timer palsu; banner diagnostic mentah menumpuk di customer payment screen.

### 7. Operasional

- Ringkasan Aktivitas Hari Ini:
  - Penjualan;
  - Transaksi;
  - Pelanggan;
  - Item Terjual;
- aktivitas:
  - Restock;
  - Pengeluaran;
  - Shift;
  - Catatan Shift;
  - Refund;
  - Kasbon Karyawan;
- contextual tips/status.

### 8. Stok

- Total Item / Menipis / Habis / Aman;
- search + filter;
- compact product list;
- status stok;
- shortcut Restock / Penyesuaian / Riwayat / Gudang;
- role-aware action.

### 9. Restock

- low-stock warning;
- request history/status;
- create request CTA;
- Owner approval/send/reject existing;
- Kasir receive existing;
- tidak menjadi dashboard kedua.

### 10. Shift / Closing / Handover

- current shift identity;
- sales/payment/cash summary;
- notes;
- handover;
- denomination worksheet;
- expected vs actual;
- variance;
- closing confirmation;
- state machine existing tetap authority.

### 11. Refund / VOID

- search transaction;
- selected transaction summary;
- refund vs VOID semantics;
- reason;
- inventory/cash/costing consequences;
- evidence/timeline;
- permission guard.

### 12. Laporan

Laporan **tidak boleh menjadi duplikat Dashboard**.

Landing target:

- period/range selector;
- headline KPI:
  - Total Penjualan;
  - Transaksi;
  - Laba Kotor (jika HPP diketahui);
- Trend Penjualan;
- categories:
  - Penjualan;
  - Produk;
  - Pelanggan;
  - Keuangan;
- `Lihat Semua Laporan` boleh membuka advanced/evidence taxonomy.

Existing WP-REP0 evidence tetap dipakai di layer detail.

**Kas Laci Saat Ini bukan headline report KPI.**  
**Unknown HPP = `Belum tersedia`, tidak pernah Rp0.**

### 13. Pengaturan

Gunakan grouped information architecture, bukan grid semua menu dengan bobot sama.

**Toko**
- Produk
- Kategori
- Bahan & Gudang
- Pelanggan
- Karyawan

**Akses**
- Akun Saya
- Pengguna
- Perangkat Aktif

**Tampilan & Perangkat**
- Tampilan Aplikasi
- Identitas Toko
- Printer

**Sistem**
- Notifikasi
- Keamanan & Sinkronisasi
- Aktivitas
- Diagnostik

**Data**
- Backup & Restore

**Zona Sensitif**
- destructive/data-sensitive action, deliberate and separated.

### 14. System states

Semua modul menggunakan satu state family:

- Loading;
- Empty;
- Error;
- Success;
- Offline;
- Permission Denied;
- Retry.

Tidak boleh kembali ke browser-alert untuk semua state UI yang seharusnya embedded.

## D. Icon contract

Satu `icons.js` / icon registry menjadi authority.

Semantic mapping minimum:

| Fungsi | Semantic icon |
|---|---|
| Beranda | Home |
| Jual | Shopping cart/bag |
| Operasional | Box/operations |
| Laporan | Bar chart |
| Pengaturan | Gear |
| Kas | Wallet/banknote |
| Hutang/Pelanggan | Users |
| Restock/Stok | Package/inventory |
| Shift | Clock |
| Catatan | Clipboard/document |
| Refund/VOID | Circular arrows |
| Karyawan | Person/ID |
| Printer | Printer |
| Notifikasi | Bell |
| Keamanan | Shield-lock |
| Aktivitas | History |
| Diagnostik | System health |
| Backup | Cloud/backup |

Aturan visual:

- satu stroke grammar;
- satu default viewBox/optical box;
- size tokens konsisten;
- icon semantic tidak berubah antar halaman;
- emoji bukan icon utama final UI.

## E. Bottom navigation contract

- Owner primary shell menggunakan primary tabs sesuai refinement;
- role guard menentukan apa yang benar-benar dapat diakses;
- child transaction flow tetap mempunyai parent route `Jual`;
- active/pressed/inactive states mengikuti refinement;
- capsule active bergerak konsisten;
- tidak ada child overlay yang membuat active tab melompat ke route lain.
