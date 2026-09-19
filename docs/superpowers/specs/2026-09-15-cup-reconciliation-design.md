# R10 Cup Reconciliation Design

## Goal

Tambahkan modul **Jejak Rekonsiliasi Cup** di Bahan & Gudang untuk menelusuri selisih cup per tanggal dan shift sampai penyelesaiannya melalui Opname Inventory V2.

## UX

Lokasi:

`Bahan & Gudang → Rekonsiliasi Cup`

Hirarki:

1. KPI: Belum Diselesaikan / Perlu Opname / Sudah Diselesaikan.
2. Accordion per tanggal.
3. Daftar rekonsiliasi cup dalam tanggal tersebut.
4. Detail satu rekonsiliasi pada screen sendiri.
5. Tindak lanjut melalui Opname existing.
6. Jejak proses sampai rekonsiliasi selesai.

Tanggal terbaru terbuka secara default. Tanggal lama collapsed.

## Single Source of Truth

Inventory V2 adalah satu-satunya sumber stok resmi.

Cup Reconciliation TIDAK boleh:
- melakukan `.set()`, `.update()`, `.transaction()` langsung ke stok;
- membuat writer stok baru;
- mengubah saldo Inventory V2 otomatis dari closing shift.

Cup Reconciliation hanya:
- observe;
- compare;
- explain;
- link;
- track.

## Existing Evidence

Closing shift sudah menyimpan:

- `cupControl.closing`;
- `cupControl.reconciliation`;
- `reconciliation.reasons`;
- `reconciliation.inventoryOpnameDrafts`;

pada session, shift-level continuity, dan closing snapshot.

Data tersebut adalah evidence rekonsiliasi.

## Reconciliation Identity

Setiap baris menggunakan reference deterministik berdasarkan:

`shiftKey + sessionId + cupCode`

Format internal:

`CUP-RECON|<shiftKey>|<sessionId>|<cupCode>`

Reference ini dibawa ke Opname melalui note existing. Tidak dibuat database authority baru.

## Status

`RESOLVED`
- variance = 0; atau
- ditemukan movement OPNAME Inventory V2 yang membawa reconciliation reference terkait.

`NEEDS_OPNAME`
- variance != 0;
- belum ada Opname yang menyelesaikan reference.

`UNRESOLVED`
- evidence closing belum lengkap/valid atau membutuhkan tindak lanjut tetapi belum terhubung ke penyelesaian.

## Date Accordion

Header tanggal menampilkan:
- tanggal;
- jumlah rekonsiliasi;
- jumlah unresolved;
- jumlah needs opname;
- jumlah resolved.

Urutan tanggal terbaru → lama.

Di dalam tanggal, prioritas item:
1. unresolved;
2. needs opname;
3. resolved.

Dalam status sama, urut shift Pagi → Siang → Malam.

## Item Summary

Setiap item menampilkan:
- nama cup;
- shift;
- expected closing;
- physical closing;
- variance;
- status.

Detail tidak diexpand panjang di accordion. Klik item membuka detail screen.

## Detail Screen

Menampilkan:
- identitas cup;
- tanggal/shift;
- expected closing;
- physical closing;
- variance;
- alasan selisih;
- kasir/session evidence jika tersedia;
- status tindak lanjut;
- timeline;
- tombol `Buat Opname Sekarang`;
- link `Lihat Aktivitas Stok`.

## Opname Integration

Tombol `Buat Opname Sekarang` memakai writer Opname existing di Inventory Workspace.

Prefill:
- item = master cup terkait;
- location = `outlet`;
- actual = physical closing;
- note mengandung `[CUP_RECON:<reference>]`.

Tidak ada writer Opname kedua.

Setelah Opname tercatat di Inventory V2 movements, halaman rekonsiliasi mendeteksi reference tersebut dan menampilkan status `Sudah Diselesaikan`.

## Role

Kasir:
- closing shift;
- mengisi alasan variance existing.

Owner:
- melihat histori rekonsiliasi;
- membuka tindak lanjut;
- menjalankan Opname melalui authority existing.

Tidak ditambahkan authority keuangan atau stok baru.

## Compatibility

- Mobile-first.
- Visual mengikuti Bahan & Gudang existing.
- Tidak mengubah perilaku transaksi penjualan.
- Tidak mengubah writer shift existing.
- Tidak mengubah struktur Inventory V2.
- Shift lama tanpa evidence rekonsiliasi lengkap tidak boleh dianggap resolved secara otomatis.

## Safety

LOCAL QA tetap read-only.

Production writer hanya terjadi ketika user secara eksplisit menyelesaikan form Opname existing.
