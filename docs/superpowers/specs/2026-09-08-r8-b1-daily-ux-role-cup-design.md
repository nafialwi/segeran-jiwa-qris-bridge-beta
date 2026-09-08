# Segeran Jiwa Legacy R8-B1 Daily UX, Role & Cup Design

**Status:** APPROVED in chat on 2026-09-08

## Goal
Refine daily cashier UX without reopening R7 data/sync authorities: remove duplicate payment-success feedback, let cashier see Gerai cup stock, and remove Owner-only actions from cashier Stock UI.

## Baseline / rollback authority
- Reconstructed R7 final source = `SEGERAN_JIWA_R7_BASE_b8a909f.zip` + finalized R7 unified loading payload.
- Frozen R7 authority files remain byte-identical.
- `baseline/legacy-v1.0.40.html` remains byte-identical.

## Required behavior
1. A completed sale must show one success surface. The existing receipt/success screen remains authoritative. The redundant top `Transaksi <id> berhasil.` toast is suppressed only while the receipt overlay is already open.
2. Other success, warning, info, and error toasts remain unchanged.
3. Cashier Stock must show a read-only `Cup & Kemasan · Stok Gerai` section sourced from the existing P5 cup-shift cache, which already refreshes Inventory V2 under the pre-existing P5 authority. B1 adds no additional Firebase read/listener.
4. Cup rows are catalog-driven through `buildCupInventoryRowsV34()`, so current Paper Cup 10 Oz and all other current catalog cup types are included without a literal `5 jenis`/`6 jenis` UI rule.
5. Cashier must not see Stock action buttons that can only end in Owner rejection: `Penyesuaian` and `Gudang` are hidden from the cashier Stock surface. `Restock` and `Riwayat` remain available.
6. Owner behavior is not reduced by B1.
7. Missing/unregistered cup masters are shown as not configured rather than fabricated as stock `0` authority.

## Architecture
Create `src/ui/r8-daily-ux-refinement.js`, a presentation-only module installed by `src/app/ref01-bootstrap.js`. It wraps `runtime.showToast` narrowly, decorates the existing Stock screen after each presentation reconciliation, and reads `p5Packaging.shiftControl.cupRows()` without creating network activity.

## Non-goals
- No purchase reversal changes (R8-B2).
- No restock receive writer changes (R8-B2).
- No blind closing changes (R8-B3).
- No Firebase/Supabase migration.
- No QRIS authority changes.
- No changes to frozen R7 modules.
