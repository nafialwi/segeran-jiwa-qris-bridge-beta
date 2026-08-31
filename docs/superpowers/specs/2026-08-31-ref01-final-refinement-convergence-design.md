# REF-01 Full Final Refinement Convergence Design

## Goal
Converge Segeran Jiwa POS onto the nine frozen refinement references as one UI/IA authority without rewriting SC-01..SC-04 business engines or creating parallel Firebase writers.

## Authority
- Visual/composition/icon/hierarchy/interaction: `blueprint_authority/references/refinement/REF_01.png` .. `REF_09.png`.
- Logic/data/write authority: SC-01..SC-04 modular core plus captured v1.0.40 legacy engines.
- Fixed roots: `toko_segeranjiwa_v58` and `segeranjiwa_qris_beta_v1`.
- Unknown HPP is `Belum tersedia`, never synthesized as Rp0.
- Output is a V-PASS candidate only; real-device V-PASS belongs to QA-01.

## Core approach
REF-01 is a single coherent UI runtime, not a pile of late visual patches. The runtime owns tokens, semantic icons, primary navigation labels/states, grouped Settings IA, embedded system states, media affordances, and refinement-only screen metadata. It delegates every transaction, QRIS, stock, debt, shift, refund/VOID, report evidence, user/device, printer, and backup mutation to existing captured authorities.

The candidate build is `dist-ref01/` and appends exactly one module entry (`src/ref01-entry.js`) after the immutable v1.0.40 legacy runtime. `dist/`, `dist-sc03/`, and `dist-sc04/` remain rollback/checkpoint artifacts.

## Implicit visual logic contract
A visible control is interpreted as behavior, not decoration.

- Product/store image affordance -> choose image, validate, preview, replace/remove where existing authority supports it, and persist through existing image/product/store writer.
- Account avatar -> user can choose/replace/remove a profile image; storage uses existing Firebase Storage authority and Firebase Auth profile only, avoiding a new RTDB schema path.
- Barcode camera -> camera scanner plus explicit manual SKU/search fallback.
- Payment proof -> previewable local draft only until an existing transaction evidence writer is available; REF-01 must label it as not yet persisted rather than silently inventing a write field.
- Badges/counters -> derived from real state, never invented demo values.
- Financial KPI -> unknown/missing data renders unavailable, not zero.
- Offline/error/loading/success/permission -> one embedded state family with retry semantics; transient connectivity never has authority to rewrite business state.
- Shift overdue -> date/time/duration/overdue state is visible. Owner can navigate an old open shift into the existing closing/reconciliation authority. No auto-close and no second shift creation.

## Information architecture
Primary navigation: Beranda / Jual / Operasional / Laporan / Pengaturan.

Dashboard answers current-state/action questions. Reports answer historical period/trend/evidence questions. Transaction children remain under Jual. Operational children remain under Operasional. Settings is grouped by responsibility and destructive actions are visually separated.

### Settings groups
- Toko: Produk, Kategori, Bahan & Gudang, Pelanggan, Karyawan
- Akses: Akun Saya, Pengguna, Perangkat Aktif
- Tampilan & Perangkat: Tampilan Aplikasi, Identitas Toko, Printer
- Sistem: Notifikasi, Keamanan & Sinkronisasi, Aktivitas, Diagnostik
- Data: Backup & Restore
- Zona Sensitif: destructive/data-sensitive actions only

## Media persistence
Existing product/logo/QRIS image lifecycle remains `SJProductionArchitectureP3` / existing product and store writers. REF-01 adds a profile-photo controller that calls the existing image compression/storage authority and then `FirebaseAuth.currentUser.updateProfile({photoURL})`; it does not create a new RTDB path or store a base64 avatar in the session envelope.

## Shift stale-state policy
`YYYY-MM-DD-Sn` is parsed as a shift identity. An open shift whose date is earlier than the current local date is `overdue`. REF-01 can select that shift in the existing date/shift controls and then open existing Shift/Closing UI. Close, denomination, expected/actual cash, variance, handover, audit, and notifications remain existing `SJShift` authority.

## Responsive contract
- Mobile: 320, 390, 430 px widths.
- Tablet: >=768 px.
- Desktop: >=1200 px.
- Minimum touch target 44 px for primary interactive controls.
- Active bottom-nav capsule motion: 180-220 ms, reduced-motion safe.

## Exit gates
- Full SC-01..SC-04 regression remains green.
- REF-01 tests cover semantic contracts and implicit visual logic.
- One REF-01 entry only; no stacked REF-01 entries.
- No direct Firebase RTDB mutation in new REF-01 UI/runtime files.
- Fixed roots and compatibility hash remain exact.
- `dist-ref01` packages reproducibly and carries a manifest/release report.
