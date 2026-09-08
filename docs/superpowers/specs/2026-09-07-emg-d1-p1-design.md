# EMG-D1-P1 Foundation + Emergency Operations Design

## Goal
Membuat backend darurat zero-cost untuk Segeran Jiwa POS lama menggunakan Cloudflare Worker + D1, tanpa mengganti Firebase sebagai database utama dan tanpa menghidupkan kembali QRIS bridge/polling.

## Locked decisions
- Firebase tetap authority normal/utama.
- Tidak ada failover otomatis atau diam-diam.
- Owner harus membuka Mode Darurat D1 dengan emergency owner key.
- D1 dipakai hanya dari layar darurat terpisah; normal `processTransaction()` tidak dioverride.
- QRIS darurat selalu manual verification; tidak ada listener/polling QRIS.
- Prompt Besar 1 hanya menyediakan standby foundation + operasi darurat. Rekonsiliasi D1 -> Firebase adalah Prompt Besar 2.
- Scope emergency sales P1: Tunai, Transfer, QRIS manual. Kasbon dan diskon kompleks dinonaktifkan.
- Scope operations P1: snapshot master, buka/tutup shift, penjualan, pengeluaran, product inventory event/balance, cup usage event, audit.
- Data credential/PIN/password Firebase tidak boleh masuk snapshot D1.
- D1/Worker tidak menyimpan secret dalam Git; secret disimpan lewat Cloudflare Workers Secrets.
- Preview/UAT menggunakan `is_drill=1`; data drill tidak boleh direkonsiliasi pada Prompt 2.

## Architecture
Normal path tetap: browser POS -> Firebase RTDB. Emergency path adalah browser POS -> HTTPS Worker `workers.dev` -> D1. Emergency client berupa compat script additive yang disisipkan setelah frozen REF01 authority tail, sehingga frozen QRIS/manual/ref01 authority tetap utuh.

Emergency Worker memvalidasi Origin hanya untuk canonical Production `segeran-jiwa-pos-preview.pages.dev` dan hashed Preview di bawah host yang sama. Owner emergency key ditukar dengan token HMAC berumur 12 jam. Semua operasi bisnis memakai `operationId` unik dan D1 UNIQUE constraint untuk idempotency.

## Emergency master snapshot
Snapshot dibuat saat Firebase sehat dari cache `cloudData.global`, lalu disanitasi dua kali: di client dan Worker. Hanya data minimum yang dibawa: store name/QRIS, kategori, produk aktif (id/nama/harga/kategori/cup/stock metadata), user id/nama/role. PIN/password/auth UID rahasia tidak ikut.

## Emergency UI
Satu launcher `MODE DARURAT D1` tersedia bahkan pada layar login, sehingga Owner masih dapat membuka D1 jika Firebase login gagal. Di halaman Manajemen Owner juga ada card darurat. UI terpisah menyediakan tab Status, POS Darurat, Shift, dan Pengeluaran.

## Sales semantics
Server menghitung ulang harga berdasarkan snapshot D1 aktif; client price tidak dipercaya. Tunai mewajibkan uang diterima >= total. Transfer dan QRIS memerlukan konfirmasi manual oleh operator. Setiap transaksi menulis transaction header, items, inventory event, product balance mutation, dan audit dalam D1 batch. Product balance memiliki CHECK `qty >= 0`.

## Shift semantics
Hanya satu shift D1 ACTIVE. Open shift menyimpan kas awal dan cashier. Close shift menghitung expected cash dari kas awal + penjualan Tunai + cash in - expense - cash out, lalu menyimpan kas aktual dan variance. P1 tidak melakukan auto-reconciliation ke Firebase.

## Security
- Secret names: `SJ_EMERGENCY_OWNER_KEY`, `SJ_EMERGENCY_SIGNING_KEY`.
- Secret tidak masuk source/config Git.
- 5 auth failure dalam window 15 menit menyebabkan lock 30 menit per hashed client IP fingerprint.
- Worker menolak Origin di luar Production/Preview Segeran Jiwa.
- Token ditandatangani HMAC-SHA256 dan scope `emergency-owner`.
- Business values divalidasi server-side.

## Provisioning
One-shot Codespace script membuat/reuse D1 `segeran-jiwa-emergency-db`, menerapkan schema, deploy Worker `segeran-jiwa-emergency`, membuat secrets, mengambil workers.dev URL, menulis config client non-secret, menjalankan remote health/auth/D1 drill, lalu full regression repository sebelum commit/push Preview.

## Failure behavior
Jika D1 belum disiapkan, secret salah, snapshot belum ada, shift tidak aktif, stok kurang, atau request invalid, emergency operation fail-closed. Normal Firebase POS tidak diubah dan tetap dapat digunakan normal.

## Prompt 2 boundary
P2 akan menambah daftar unreconciled, preview/approval Owner, idempotent replay ke Firebase, partial failure handling, failback, dan full failure drill. P1 tidak boleh menandai data sebagai reconciled atau melakukan Firebase write dari Worker.

## R2 correction — Owner Beranda cache-first

P1 R2 also corrects the existing Owner dashboard blocking path discovered during real-device use. The normal Owner Beranda must render from already-synchronized `cloudData` immediately and must not wait for `SJX.dayModel()` or previous-day `aggregateExact()` before first paint. Exact Firebase refresh remains read-only and runs only in the background, deduplicated per date, with a 5-minute current-day TTL and a 30-minute previous-day TTL. No periodic interval is introduced and no new Firebase reader/writer is created. Reports keep their existing exact-read behavior; this optimization is scoped only to Owner Beranda.

R2 additionally forces a fresh REF01 build before the Cup-01B regression gate so stale generated `dist-ref01` cannot cause a false/misaligned Product Cup UI failure.
