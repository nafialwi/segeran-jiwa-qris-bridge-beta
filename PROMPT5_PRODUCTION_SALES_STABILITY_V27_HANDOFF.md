# QA Handoff — Production Sales Stability v2.7

## UAT yang wajib setelah Cloudflare Success

### A. ES TEH production add

1. Biarkan aplikasi terbuka minimal 5–10 detik agar periodic Inventory V2 patch sempat berjalan.
2. Tap ES TEH dari product card.
3. Harus masuk cart normal.
4. Card harus berubah menjadi `− 1 +`.
5. Tap plus lagi → qty 2.
6. Scan barcode ES TEH/JASJUS menggunakan kamera → produk match harus masuk normal cart.

PASS jika tidak muncul recipe picker dan tidak ada produk yang gagal ditambahkan hanya karena legacy recipe.

### B. Urutan produk

1. Owner ubah urutan dua produk dari Edit/Manajemen Produk menggunakan naik/turun existing.
2. Kembali ke Penjualan.
3. Produk harus mengikuti `displayOrder` tersimpan tanpa perlu mengubah nama/kategori.

### C. Refresh semua role

Uji Owner dan Kasir:

1. cari tombol Refresh di header surface REF-01;
2. tekan saat online → harus memberi feedback sinkron;
3. session/login tidak boleh hilang;
4. transaksi/cart tidak boleh dikosongkan oleh refresh;
5. saat offline, aplikasi harus memberi warning tanpa write atau logout paksa.

### D. Riwayat Penjualan

Owner dan Kasir:

1. buka tab Laporan;
2. `Riwayat Penjualan` harus sudah terlihat tanpa tap area kosong;
3. buka → pilih transaksi → produk/item transaksi harus terlihat;
4. Kasir tetap read-only.

### E. Quantity stepper

1. Tambahkan beberapa produk berbeda termasuk ES TEH.
2. Semua produk qty > 0 harus menampilkan stepper yang sama.
3. `−`, qty, `+` harus presisi dan sinkron dengan bottom cart/mini cart.
4. qty 0 harus kembali menjadi tombol plus tunggal.

## Known pending visual work

Icon Family dan chart visual final tidak termasuk v2.7 dan akan diintegrasikan pada batch berikutnya setelah asset icon final tersedia.
