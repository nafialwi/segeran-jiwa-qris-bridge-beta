# 05 — STRUCTURAL CONSOLIDATION MIGRATION PLAN

## 1. Strategy

**Extract, isolate, verify — bukan rewrite.**

v1.0.40 diperlakukan sebagai monolith yang harus diurai menjadi modul sambil menjaga behavior.

## 2. Migration layers

### Layer 0 — Freeze

- hash v1.0.40;
- copy immutable baseline;
- inventory global functions/modules;
- inventory direct Firebase writes;
- inventory CSS/renderer layers;
- inventory screens/menu routes;
- create regression harness.

### Layer 1 — Build shell

Buat project modular minimal dengan:

- source folders;
- build script;
- dev server;
- test runner;
- `dist/index.html` output;
- baseline asset copy.

Belum ada redesign.

### Layer 2 — Core/Data extraction

Ekstrak terlebih dahulu yang paling sedikit visual risk:

- Firebase bootstrap;
- constants/root;
- common helpers;
- error journal;
- auth/session helpers;
- repositories/read-write adapters;
- QRIS adapter wrapper;
- legacy bridge.

### Layer 3 — Domain extraction

Ekstrak tanpa mengubah semantics:

- pricing;
- transaction;
- inventory;
- purchase/WAC;
- debt;
- shift;
- refund/VOID;
- report calculation.

Setiap extraction harus punya parity/regression test.

### Layer 4 — Feature modules

Migrasi screen family satu per satu **di source**, tetapi tidak menghasilkan versi user satu per screen.

Urutan aman:

1. App shell / routing / role guard.
2. Dashboard.
3. Sales/cart/checkout.
4. Payments.
5. Operational/stock/restock.
6. Shift/closing/refund.
7. Reports.
8. Settings/master data.

Legacy renderer boleh hidup di `legacy-bridge` sementara, tetapi final screen hanya boleh punya satu visible renderer.

### Layer 5 — UI system

Konsolidasikan:

- tokens;
- typography;
- icon registry;
- card/list/button/input;
- chips/status;
- bottom nav;
- loading/empty/error/success/offline/permission states.

### Layer 6 — Persistent session

Tambahkan Session Manager setelah auth/session behavior existing dipetakan.

Tidak mengubah credential policy tanpa test.

### Layer 7 — Refinement convergence

Baru setelah structural parity:

- terapkan Final Refinement Pack;
- de-duplicate Dashboard vs Reports;
- normalize icons;
- grouped Settings;
- dedicated payment screens;
- responsive polish;
- critical states.

### Layer 8 — UI Freeze

Setelah UAT:

- no new visual concept;
- hanya blocker/accessibility/responsive corrections;
- design tokens dan icon registry dibekukan.

### Layer 9 — WP-F03 / financial hardening

- STOCK HPP;
- RECIPE HPP;
- gross profit/margin;
- VOID/refund costing;
- report integration;
- historical safety.

### Layer 10 — Release hardening

- full regression;
- browser/mobile preview;
- AppMint WebView gate;
- printer/share/barcode/back/session/lifecycle;
- final package + rollback.

## 3. Legacy cleanup policy

Sebuah legacy block hanya boleh dihapus jika:

1. replacement route hidup;
2. regression test mencakup behavior utama;
3. tidak ada caller aktif yang bergantung padanya;
4. build/parse hijau;
5. baseline rollback tetap tersedia.

## 4. Rules untuk mencegah monolith menumpuk lagi

- tidak append giant `<style>` correction layer ke final HTML;
- tidak monkey-patch function berkali-kali tanpa adapter registry;
- tidak global DOM query dari domain service;
- screen state disimpan per module/router state, bukan efek samping tab lain;
- all icons dari registry;
- all design values dari tokens;
- no feature write langsung ke Firebase selain repository/adapter;
- no “quick fix” tanpa regression test.

## 5. GitHub timing

GitHub menjadi source authority **setelah modular scaffold dan baseline parity minimum tersedia**.

Tidak perlu mencampur dengan TotalKu.

Recommended repo terpisah, misalnya:

`segeran-jiwa-pos`

URL repository baru diperlukan saat work package GitHub integration dimulai.

## 6. Cloudflare timing

Cloudflare dipakai setelah GitHub source mulai stabil untuk preview mobile:

`GitHub -> Cloudflare static preview -> UAT HP`

Tidak diperlukan pada SC-01 pertama.
