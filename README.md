# Segeran Jiwa QRIS Bridge Beta v0.1.1

Aplikasi Android companion khusus **HP Owner Segeran Jiwa**. Bridge membaca notifikasi pembayaran QRIS dari **GoFood Merchant** (`com.gojek.resto`) melalui Android Notification Access, mengekstrak nominal + provider transaction ID, melakukan deduplikasi berdasarkan provider ID, lalu mengirim signal terstruktur ke Firebase.

## Arsitektur Firebase

- Auth/profile Owner tetap dibaca dari `toko_segeranjiwa_v58/global/...`.
- Signal QRIS ditulis ke sibling root `segeranjiwa_qris_beta_v1/signals/{providerTransactionId}`.
- Bridge tidak menulis transaksi POS dan tidak memanggil finalisasi transaksi POS.

## Kontrak parser Beta

- Source package wajib `com.gojek.resto`.
- Title diterima: `Pembayaran QRIS diterima!` setelah trim/case normalization.
- Mendukung notification individual maupun grouped/stacked.
- Mendukung variasi aman seperti `Rp2.000` / `Rp 2.000`, kapitalisasi `ID transaksi`, dan titik opsional setelah `diterima`.
- Provider ID adalah evidence/dedupe key dan tetap case-sensitive.
- Nominal bukan unique identifier.

## Batasan Beta

- Tidak mengunggah isi notification aplikasi lain.
- Tidak pernah menyelesaikan transaksi POS otomatis.
- POS tetap mempunyai QRIS manual sebagai fallback.
- Bridge menggunakan Firebase Auth/RTDB dengan akun Owner Segeran Jiwa; tidak ada admin/master secret di APK.
- Real-device behavior tetap harus dibuktikan melalui acceptance test, terutama screen OFF/background dan koneksi offline.

## Build via GitHub Actions

Upload **isi folder ini sebagai root repository**, kemudian buka:

`Actions` → `Build Segeran Jiwa QRIS Bridge Beta v0.1.1` → `Run workflow`

Workflow wajib menjalankan unit tests sebelum `assembleDebug`. Artifact:

`Segeran-Jiwa-QRIS-Bridge-Beta-v0.1.1-APK`

Debug APK hanya untuk Beta internal dan dipasang di HP Owner.

## Setelah APK terpasang

1. Buka Bridge.
2. Login username + PIN Owner Segeran Jiwa.
3. Tekan `Buka Akses Notifikasi` dan aktifkan Notification Access.
4. Pastikan notifikasi GoFood Merchant aktif.
5. Status target: `Firebase Owner: TERHUBUNG`, `Notification Access: ON`, sumber `com.gojek.resto`.
6. Jika Firebase rules QRIS belum dipublish, jangan mulai acceptance pembayaran; signal dapat gagal terkirim/antre tergantung kondisi koneksi.

Jangan membagikan PIN, refresh token, atau file signing pribadi.
