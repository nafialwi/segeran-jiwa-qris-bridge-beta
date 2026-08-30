# 10 — FUTURE CHAT HANDOFF

Gunakan file ini bila proyek harus pindah chat/session.

## Project

**Segeran Jiwa POS — Clean Baseline Structural Consolidation**

## Current strategic decision

- Stop incremental patching on v1.0.40.
- v1.0.40 = Legacy Migration Authority / rollback source.
- Do not rewrite business logic from scratch.
- Modularize web source first.
- Keep AppMint temporarily as APK wrapper.
- GitHub becomes source authority after modular baseline is stable.
- Cloudflare becomes zero-cost static preview after GitHub.
- Android Studio/native rewrite is deferred.
- Persistent session is required: close/reopen must not automatically logout if session is still valid.
- Final Refinement references re-confirmed 30 Aug 2026 are visual/IA authority.

## Fixed contracts

- POS root: `/toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- QRIS engine logic: preserve existing `SJQrisSignalBeta` contract.
- Transaction logic: preserve existing transaction authority; no parallel transaction engine.
- Unknown HPP != Rp0.
- Report is read-only.
- Owner/Kasir role guards preserved.
- Menu complete; reorganize, do not silently remove.
- No Firebase Rules/schema/root/package-ID changes without explicit checkpoint.
- Zero-cost first.

## Refinement IA decisions

- Owner Dashboard = Penjualan Hari Ini, Kas Tersedia, Hutang Pelanggan, Restock Aktif + Attention + Quick Actions.
- Kasir Dashboard = active shift-centric summary + Mulai Jual.
- Laporan != Dashboard. Laporan = period analytics, Total Penjualan, Transaksi, Laba Kotor when known, Trend, Penjualan/Produk/Pelanggan/Keuangan + evidence drilldown.
- Operasional = daily activity + Restock/Pengeluaran/Shift/Catatan/Refund/Kasbon Karyawan.
- Pengaturan = grouped IA, not generic card grid.
- One icon registry; no mixed icon families.
- Bottom-nav child payment/cart flow remains under parent Jual.

## Execution roadmap

Target: 8 prompts, minimum 6, maximum 10.

1. SC-01 Freeze/Audit/Scaffold
2. SC-02 Core/Data/Domain Extraction
3. SC-03 Feature Modules + Legacy De-layering
4. SC-04 Persistent Session + GitHub + Preview Foundation
5. REF-01 Full Final Refinement Convergence
6. QA-01 Consolidated UAT Correction + UI Freeze
7. F03-01 Costing/HPP/Financial Hardening
8. RC-01 Release Hardening + AppMint Gate
9. WIC-01 only if WebView-specific issues
10. RC-FIX only if final blockers remain

## Working style required

- One prompt = one large work package, not one polish.
- Do as much as safely possible in one session.
- Do not ask user to choose technical details already decided here.
- If limit is reached, stop at a safe checkpoint and report continuation point.
- Fresh verification before any PASS claim.
- Report: current phase, %, completed, remaining, risks/findings, next work, exact user action.
