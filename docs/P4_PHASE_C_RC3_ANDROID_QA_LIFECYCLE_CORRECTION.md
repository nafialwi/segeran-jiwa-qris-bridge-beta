# P4 Phase C RC3 — Android QA Canonical Report Lifecycle Correction

Status: **CORRECTION VERIFIED — READY FOR REPEAT LOCAL/ANDROID READ-ONLY UAT; NOT LOCKED; NOT DEPLOYED**  
Date: 2026-09-02

## Android QA finding after RC2

RC2 corrected the static mounting target from legacy `#lap2` to canonical `#lap-menu-view`, but Android LOCAL QA still showed only **Laporan Penjualan** and no **Penjualan | Keuangan** switcher.

The user evidence showed the report fully rendered from top to bottom, proving this was not a scroll/location issue.

## Root cause

The canonical Report Foundation owns the final contents of `#lap-menu-view` and performs asynchronous full-root rendering through `showHTML()`, which assigns `root.innerHTML = html` after report data has loaded.

RC2 inserted the Finance shell during the REF01 enhancement cycle. That shell could be recreated when `financeWorkspace.enhance()` was invoked manually, but REF01's presentation lifecycle does not use a broad `MutationObserver` and receives no callback after Report Foundation's final asynchronous `innerHTML` replacement. The final report render therefore removed the RC2 switcher/workspace.

The RC2 automated test reproduced only a manual `enhance()` after simulated rerender, so it did not model the actual Android timing.

## RC3 correction

RC3 keeps the existing Finance/database architecture unchanged and corrects only presentation lifecycle ownership:

- Finance decorates the already-canonical `SJReportFoundationV010.Core.renderOwnerSummary` output after Report Refinement has installed its canonical renderer.
- Every final Owner report render therefore contains the **Penjualan | Keuangan** switcher and Finance workspace slot as part of the canonical HTML itself.
- The existing canonical Penjualan report remains present and unchanged as the sales surface.
- The Finance `paint()` path resolves the current `#sj-v33-finance-workspace` node before writing, so it cannot keep painting a detached pre-rerender DOM node.
- Cashier/non-owner output remains undecorated.
- No MutationObserver was added.
- No Finance writer, QRIS coordinator, Firebase path, transaction authority, inventory authority, shift authority, or expense authority changed.
- No `!important` was added; the locked budget remains 252/252.

## TDD evidence

A new regression explicitly models the Android failure sequence:

1. REF01/Finance enhancement mounts the initial shell.
2. Canonical Report Foundation performs a later final report render.
3. No manual REF01 `enhance()` is called after that render.
4. The final canonical HTML must itself contain **Penjualan | Keuangan** and the Finance workspace slot.
5. After DOM replacement, Finance must paint the newly-created workspace node rather than a detached stale node.

The new test was observed **RED** against RC2 and **GREEN** after RC3.

## Fresh verification after RC3

- Finance UI targeted regression: **9/9 PASS**.
- Related Report + Finance + Inventory regression: **61/61 PASS**.
- Full automated suite: **329/329 PASS**.
- `verify:v33:finance`: **9/9 PASS**.
- SC02: **PASS** — mutations restricted to the two approved dedicated P4 writers.
- SC03: **PASS** — no unauthorized direct modular mutations.
- SC04: **PASS** — exact writer allowlist and destructive-remove prohibition intact.
- REF01: **PASS**.
- B01–B05 icon authority: **61/61 exact**; B06 excluded.
- P2/P3 visual `!important` budget: **252/252**.
- Frozen compatibility baseline remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- P3 LOCKED rollback ZIP remains `810e4001a002f868f8799f5713e2d529277aff7090e73bd5207953471268d35b`.

## Remaining gate

Repeat Android LOCAL QA. Opening bottom navigation **Laporan** must now show **Penjualan | Keuangan** after the canonical report has fully finished loading. Selecting **Keuangan** must expose the five locked Finance tabs:

`Ringkasan | Arus Kas | Pengeluaran | Modal & Prive | Tutup Bulan`

LOCAL QA remains READ ONLY. P4 remains **not LOCKED** and production deployment remains blocked pending final hardening, explicit P4 lock approval, and separate deployment approval.
