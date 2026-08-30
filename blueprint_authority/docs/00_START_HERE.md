# SEGERAN JIWA POS — CLEAN BASELINE BLUEPRINT v1.0

**Status:** Approved direction for Structural Consolidation  
**Date:** 30 August 2026  
**Legacy Migration Authority:** `SEGERAN_JIWA_POS_v1_0_40_VC02A_OPERATIONAL_STOCK_RESTOCK_v1_0_0.html`

## Baca ini dulu

Dokumen ini dibuat supaya pengembangan Segeran Jiwa POS berhenti dari pola:

`1 prompt -> 1 polesan -> build baru -> bug lain -> polesan lagi`

Mulai dari paket ini, cara kerja proyek berubah menjadi:

**freeze -> rapikan struktur -> buktikan fungsi tetap sama -> session persistent -> refinement satu batch besar -> costing/hardening -> release candidate.**

### Prinsip utama

1. **v1.0.40 tidak diteruskan dengan patch UI baru.** Ia menjadi *Legacy Migration Authority* dan rollback source.
2. **Tidak rewrite business engine dari nol.** Logic yang sudah bekerja diekstrak dan dipertahankan.
3. **Final Refinement Pack yang dikonfirmasi ulang pada 30 Agustus 2026 menjadi visual/IA authority.** Sembilan gambar referensi ada di folder `references/refinement/`.
4. **QRIS tidak boleh disederhanakan atau diganti flow baru.** Matching, recovery, ambiguous handling, manual fallback, pending gate, dan finalization existing harus tetap hidup.
5. **Menu lengkap tidak boleh hilang.** Jika refinement tidak menampilkan sebuah fungsi pada landing page, fungsi tersebut dipindahkan ke kelompok yang benar, bukan dihapus.
6. **Dashboard dan Laporan mempunyai tanggung jawab berbeda.** Dashboard = kondisi toko sekarang dan tindakan. Laporan = analitik historis/tren/evidence.
7. **Tidak ada Firebase root/schema/Rules change diam-diam.** Semua perubahan data architecture harus checkpoint terpisah dan eksplisit.
8. **Persistent session menjadi bagian fondasi.** Menutup aplikasi tidak otomatis logout; password/PIN plaintext tidak disimpan.
9. **AppMint tidak perlu dipasang setiap build.** APK hanya pada gate yang ditentukan.
10. **Zero-cost tetap menjadi prinsip.** PC + GitHub + Cloudflare Free/static preview + Firebase existing + AppMint existing, tanpa menambah layanan berbayar kecuali diputuskan sendiri nanti.

## Urutan baca

1. `01_MASTER_BLUEPRINT.md` — keputusan besar dan target akhir.
2. `02_SYSTEM_MAP.md` — bentuk arsitektur baru.
3. `03_REFINEMENT_AUTHORITY_AND_IA.md` — layar harus mengikuti gambar mana dan informasi apa yang boleh tampil.
4. `04_FUNCTIONAL_SAFETY_CONTRACT.md` — hal-hal yang tidak boleh rusak.
5. `05_STRUCTURAL_CONSOLIDATION_MIGRATION_PLAN.md` — cara memindahkan monolith ke source modular tanpa rewrite.
6. `06_EXECUTION_ROADMAP_6_TO_10_PROMPTS.md` — target 8 prompt besar; minimum 6, maksimum 10.
7. `07_EXACT_PROMPTS_COPY_PASTE.md` — prompt siap copy-paste untuk tahap berikutnya.
8. `08_UAT_AND_RELEASE_GATES.md` — definisi PASS, kapan Anda perlu tes, kapan AppMint dipasang.
9. `09_ZERO_COST_TOOLCHAIN_AND_REPO.md` — PC/GitHub/Cloudflare/AppMint.
10. `10_FUTURE_CHAT_HANDOFF.md` — file handoff jika proyek pindah chat.

## Yang perlu Anda lakukan sekarang

**Tidak ada instalasi. Tidak perlu Android Studio. Tidak perlu AppMint. Tidak perlu Cloudflare URL sekarang.**

Prompt berikutnya cukup gunakan **PROMPT 1** dari `07_EXACT_PROMPTS_COPY_PASTE.md`.
