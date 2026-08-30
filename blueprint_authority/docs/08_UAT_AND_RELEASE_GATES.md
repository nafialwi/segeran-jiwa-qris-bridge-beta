# 08 — UAT & RELEASE GATES

## 1. PASS model

Tidak boleh lagi menggunakan kata PASS tanpa kategori.

| Gate | Arti |
|---|---|
| **F-PASS** | fungsi/alur/data benar |
| **A-PASS** | architecture/routing/IA benar |
| **V-PASS** | visual real-device cukup dekat refinement |
| **R-PASS** | perubahan tidak merusak area lain |
| **W-PASS** | WebView/AppMint integration lulus |

Final screen/module hanya dianggap selesai bila gate relevannya jelas.

## 2. Automated gates minimum

Setiap major work package:

- source parse/build;
- unit/domain tests;
- integration tests;
- no duplicate write-path audit;
- fixed root check;
- role guard tests;
- transaction regression;
- inventory/WAC regression;
- QRIS contract checks;
- shift state tests;
- report read-only tests;
- package/hash check bila menghasilkan release artifact.

## 3. Browser/mobile UAT checkpoints

User tidak perlu menguji setiap build.

### Checkpoint A — setelah Persistent Session

Tes singkat:

1. login;
2. tutup/reopen;
3. pastikan user tetap masuk;
4. logout manual;
5. pastikan kembali login;
6. Kasir active shift restore bila skenario tersedia.

### Checkpoint B — setelah Full Refinement

Representative screenshots:

- Owner Dashboard;
- Kasir Dashboard;
- Jual;
- Cart;
- Checkout;
- QRIS waiting/critical state;
- Operasional;
- Stok;
- Restock;
- Shift/Closing;
- Laporan;
- Pengaturan.

Tidak perlu satu screenshot untuk setiap sub-menu jika component family sama.

### Checkpoint C — setelah F03

Skenario transaksi/costing terpilih.

## 4. AppMint roadmap

### APPMINT GATE 1 — WebView Integration Candidate

Dibuka setelah:

- structural consolidation selesai;
- persistent session browser UAT lulus;
- refinement main screens telah V-PASS candidate;
- major functional regression hijau.

Fokus:

- app close/reopen;
- Android Back;
- keyboard/IME;
- camera/barcode;
- QRIS behavior;
- printer;
- share/PDF;
- notification/deep-link;
- status/system bar;
- offline/reconnect;
- lifecycle/background/resume.

### APPMINT GATE 2 — Release Candidate

Setelah WP-F03 + full hardening.

### APPMINT FINAL

Hanya jika RC menemukan fix batch yang perlu re-install. Target bukan install setiap versi.

## 5. QRIS real-payment policy

Tidak perlu melakukan real QRIS payment hanya untuk screenshot UI.

Real payment baru dilakukan pada controlled UAT ketika:

- pending ready benar;
- amount benar;
- no duplicate pending;
- cancel/retry contract sudah diuji;
- operator memahami transaksi test yang akan terjadi.

## 6. Release freeze

Urutan freeze:

1. Structural Freeze
2. UI Freeze
3. Financial/Schema Safety Freeze
4. Release Candidate
5. AppMint/WebView PASS
6. Final Release

Setelah UI Freeze, perubahan visual hanya untuk blocker nyata.
