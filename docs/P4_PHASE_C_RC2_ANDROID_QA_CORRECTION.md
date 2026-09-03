# P4 Phase C RC2 — Android QA Finance Routing Correction

Status: **CORRECTION VERIFIED — READY FOR REPEAT LOCAL/ANDROID READ-ONLY UAT; NOT LOCKED; NOT DEPLOYED**  
Date: 2026-09-02

## Android QA finding

The first Phase C candidate rendered the canonical **Laporan Penjualan** correctly, but the Finance v3.3 workspace was not reachable from the visible report surface. Android LOCAL QA exposed that Finance had been mounted to legacy `#lap2` (monthly legacy report), while the current Report Foundation owns `#lap-menu-view`.

This was a presentation/routing integration defect only. No Finance database writer, QRIS coordinator, existing transaction authority, or Firebase path was changed by this correction.

## RC2 correction

- Finance now mounts on canonical Report Foundation host `#lap-menu-view`.
- Owner Laporan exposes an explicit two-surface switcher: **Penjualan | Keuangan**.
- `Penjualan` preserves the existing canonical sales report.
- `Keuangan` displays Finance P4 with the locked tabs: `Ringkasan | Arus Kas | Pengeluaran | Modal & Prive | Tutup Bulan`.
- Event delegation is attached to the persistent report host, so the switcher/workspace is recreated after Report Foundation rerenders its `innerHTML`.
- Cashier/non-owner report flow does not expose the Owner Finance shell.
- Legacy `lap2` Finance containment was removed.
- No `!important` was added; the locked budget remains 252/252.

## TDD / regression evidence

The new integration regression was first observed RED when only canonical `lap-menu-view` existed and then GREEN after the correction.

Fresh results after correction:

- Related Report + Finance regression: **22/22 PASS**.
- Full automated suite: **328/328 PASS**.
- `verify:v33:finance`: **9/9 PASS**.
- SC02 / SC03 / SC04: **PASS**.
- REF01 full verification: **PASS**.
- B01–B05 icon guard: **61/61 exact**.
- `!important`: **252/252**.
- Frozen compatibility baseline remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.

## Remaining gate

Repeat Android LOCAL QA and confirm that opening bottom navigation **Laporan** shows **Penjualan | Keuangan**, and that selecting **Keuangan** exposes all five Finance tabs. LOCAL QA remains READ ONLY. Production deployment remains blocked pending final hardening, P4 lock approval, and separate deployment approval.
