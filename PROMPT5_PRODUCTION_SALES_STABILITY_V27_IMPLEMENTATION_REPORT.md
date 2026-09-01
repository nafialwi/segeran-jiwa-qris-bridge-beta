# Prompt 5 — Production Sales Stability Corrective v2.7

## Scope

Release ini dibuat setelah POS sudah aktif dipakai dan menangani lima masalah produksi tanpa menunggu final Icon Family:

1. urutan produk yang disimpan dari Edit Produk belum diikuti renderer Penjualan;
2. semua role membutuhkan tombol Refresh/Sync dari aplikasi;
3. produk seperti ES TEH dapat gagal masuk cart karena recipe legacy mengintersep `quickAddCart`;
4. state `− qty +` tidak selalu mengikuti cart aktual;
5. launcher Riwayat Penjualan baru muncul setelah interaksi/tap tambahan.

## Root cause dan corrective

### 1. Display order Penjualan

`displayOrder` sudah disimpan oleh manajemen produk, tetapi renderer Sales final tidak melakukan sorting dengan authority tersebut. v2.7 mengganti model `activeProducts()` REF-01 untuk melakukan sorting menggunakan `SJHarden.orderValue()` dengan fallback source order yang stabil. Tidak ada field database baru.

### 2. Manual Refresh untuk Owner dan Kasir

Ditambahkan `installManualSyncControls()` pada header surface REF-01. Tombol menggunakan `SJRef01ProductionSalesCompat.refreshNow()` yang:

- meminta Firebase kembali online (`goOnline`) bila tersedia;
- melakukan read ulang `/global`;
- melakukan read ulang shift yang sedang dipilih;
- memperbarui render Sales/Report/Shell existing;
- tidak melakukan browser reload;
- tidak melakukan `.set()`, `.update()`, `.transaction()`, atau `.remove()`.

Session persistence SC-04 tidak disentuh.

### 3. ES TEH / recipe legacy tidak boleh mengintersep penjualan normal

Root cause utama adalah Inventory V2 legacy menjalankan `patchCart()` berkala dan dapat menulis ulang global `quickAddCart`. Produk dengan active recipe kemudian diarahkan ke recipe cart/picker walaupun fitur racikan belum final.

Corrective v2.7 tidak menghapus recipe dan tidak membuat cart kedua. Sebaliknya:

- classic compatibility bridge mengakses single legacy lexical `cart` yang sama;
- final product card/tombol plus memanggil `addNormalProduct()` secara langsung;
- Smart Barcode Resolver memprioritaskan `SJRef01ProductionSalesCompat.addNormalProduct()`;
- sehingga periodic rewrite `quickAddCart` oleh Inventory V2 tidak lagi menentukan jalur tap/kamera pada REF-01 Sales.

Test eksekusi VM membuktikan produk `ES TEH` dengan legacy recipe aktif tetap masuk sebagai normal cart line dan `inventoryMode !== RECIPE`.

### 4. Quantity control sinkron langsung dengan cart

Product card final membaca `productQty(productId)` dari cart authority existing. State renderer:

- qty 0: tombol `+` tunggal;
- qty > 0: satu stepper lebar `−  qty  +`.

Stepper memakai direct normal-cart adapter untuk produk normal, tetap memakai cart array existing dan `updateCartUI()`. Perubahan dari tap, scanner, atau mini cart dirender ulang ke card.

Visual v2.7 mengikuti contoh UAT: satu rounded rectangle tipis yang hampir memenuhi bagian bawah card, angka tabular tepat di tengah, tanpa plus solid saat item sudah dipilih.

### 5. Riwayat Penjualan deterministik

Launcher `Riwayat Penjualan` sekarang menjadi bagian renderer report sejak initial render:

- Owner: langsung dalam summary report;
- Kasir: langsung dalam `Laporan Shift`;
- click handling menggunakan delegated handler, bukan post-click enhancer untuk menciptakan card.

Kasir tetap read-only. Detail transaksi dan item tetap memakai report/read authority v2.6.

## Production safety

Tidak diubah:

- transaction writer;
- QRIS/payment writer;
- inventory writer;
- shift writer;
- SC-04 session architecture;
- historical shift/closing recovery;
- recipe records di database;
- Smart Barcode matching rules yang sudah lolos UAT.

## Verification

Fresh full source verification terakhir sebelum packaging:

- tests: 174
- pass: 174
- fail: 0
- SC-01 compatibility SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- SC-02 direct Firebase mutations: 0
- SC-03 modular direct mutations: 0
- SC-04 modular RTDB mutations: 0

Packaging harus tetap melewati fresh extraction verification sebelum v2.7 diserahkan untuk deployment.
