# Segeran Jiwa POS v2.9 — P0 Browser Runtime Implementation Report

Date: 2026-09-01
Baseline: v2.8 integrated final candidate
Status: P0 implemented in isolated v2.9 working copy; not deployed

## Safety boundaries

- Frozen baseline `baseline/legacy-v1.0.40.html` was not edited.
- Firebase root/schema was not changed.
- No transaction, QRIS, inventory, shift, refund, debt, or session writer was added or replaced.
- Profile-avatar P0 persistence is device/browser-local and user-scoped; it does not add RTDB or Storage writes.
- GitHub, Codespaces, and Cloudflare were not touched during v2.9 development.

## P0 changes

### 1. Single payment-success receipt presentation

Root cause: the legacy receipt footer had CSS `display:grid!important`, which overrode JavaScript inline hiding and produced a second Print/WhatsApp/Close action set.

Change: `reconcileTransactionSurfaces()` now sets an explicit `sjr05-receipt-success` state on the receipt root. CSS hard-hides legacy receipt content/actions while the v2.8/v2.9 success presentation is active.

Files:
- `src/ui/transaction-detail-refinement.js`
- `src/ui/ref01.css`

### 2. Stable cart deletion model

Root cause: the per-line trash handler repeatedly decremented quantity while each decrement could rebuild the cart DOM, creating a stale/re-entrant handler path.

Change: the active mobile cart presentation removes the per-line trash control. `- / +`, item discount, and the single top-right `Kosongkan` authority remain.

File:
- `src/ui/production-sales-stability.js`

### 3. Focus-preserving transaction-history search

Root cause: each query keystroke called the full `openHistory()` renderer, replacing the focused input element and closing the Android keyboard.

Change: query typing now updates only Top Product and Transaction result regions. The query input and filter controls remain mounted in the DOM.

File:
- `src/ui/report-sales-history-refinement.js`

### 4. Zero-cost profile avatar persistence

Root cause: v2.8 profile media tried Firebase Storage + Auth `photoURL`, but the production architecture intentionally runs with Cloud Storage OFF.

Change: avatar images are compressed and stored in a user-scoped browser-local JSON store on the same origin/device. `Gunakan Inisial` is also persistent. Existing Auth photo URL is only a read fallback when no local preference exists.

Cross-device avatar sync remains deferred because it requires a separately approved server persistence path.

Files:
- `src/ui/media-lifecycle.js`
- `src/app/ref01-bootstrap.js`
- `tests/ref01-media-lifecycle.test.mjs`

### 5. Remove `Siap dijual`

Change: non-stock-tracked product cards no longer show `Siap dijual`. Real tracked stock context such as `Stok 70`, low-stock, and out-of-stock states remains.

File:
- `src/ui/production-sales-stability.js`

### 6. Stable Refresh header action placement

Root cause: manual Refresh was appended directly as another header child. On narrow mobile headers containing Help, this could force Refresh into an orphan second row.

Change: Operational and Settings top headers now group Help + Refresh in a stable right-side action container.

Files:
- `src/ui/production-sales-stability.js`
- `src/ui/ref01.css`

### 7. Correct Operational summary scope label

Root cause: the Operational summary renderer reads `cloudData[activeDate]`, which is the active shift scope, but labelled the data `Ringkasan Aktivitas Hari Ini`.

Change: presentation now reports the actual selected shift, e.g. `Ringkasan Shift Malam`. No financial calculation or writer was changed. Full day aggregation belongs to Canonical Reporting v2.

Files:
- `src/ui/critical-operational-refinement.js`
- `src/app/ref01-bootstrap.js`

## New regression coverage

`tests/v29-p0-browser-runtime.test.mjs` locks:

1. receipt success state hard-hides legacy action surface;
2. active cart has no per-line delete authority;
3. history query does not full-rerender the focused input;
4. `Siap dijual` is removed without breaking product add authority;
5. header Refresh belongs to the shared header action group;
6. Operational summary identifies active shift scope.

## Deferred by design

The following are NOT P0 patches and remain in later v2.9 phases:

- Canonical Shift/Day/Week/Month/Custom Reporting v2.
- Finished Goods Gudang/Gerai total UX rebuild.
- Cross-device profile avatar persistence.
- Historical stock closing snapshots.
- Final package/deployment.
