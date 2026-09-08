# R7 Unified Non-Blocking Read & Historical UX Hardening — Design

## Status
Approved design baseline for implementation review.

## Base
- Repository: `nafialwi/segeran-jiwa-qris-bridge-beta`
- Base branch: `emg-d1-p1-r4-sc04-safe`
- Base commit: `b8a909f`
- Existing P1 D1 emergency backend remains intact.
- Existing QRIS manual-only R6 authority remains intact.

## Problem Statement
The legacy POS currently has inconsistent read/loading behavior. Some surfaces render local data first, while historical Reports, Shift history, and Finance can blank or replace their content while waiting for Firebase or local aggregation. This makes the application feel frozen even when navigation itself is responsive. The same code paths also trigger redundant full report opens and duplicate cache layers.

R7 standardizes all read-heavy owner surfaces around one rule:

> Render the shell or the latest matching cached data immediately, refresh in the background, and never let an older request overwrite a newer user selection.

## Goals
1. Beranda remains immediately visible and retains the complete owner model contract.
2. Historical Reports show their structure immediately for every date/scope, not only `today`.
3. Historical Shift date changes are latest-wins and cannot be ignored while a previous request is running.
4. Finance preserves the previous/cached month while the requested month loads.
5. Local Report filters do not trigger unnecessary remote `report.open()` calls.
6. Duplicate Beranda cache layers are removed/converged.
7. Unknown values render as `—` / `Belum tersedia`, never as false business zeroes.
8. No new Firebase listener, polling loop, writer, schema, rule, or D1 authority change.
9. Emergency D1 launcher stops covering normal report content and remains manually accessible from management/settings.
10. In-memory timing diagnostics expose read duration and completion state without adding network traffic.

## Non-Goals
- No Firebase schema migration.
- No new daily-summary writer.
- No localStorage persistence in R7.
- No automatic D1 failover.
- No QRIS changes.
- No transaction, inventory, shift-closing, HPP, auth, SC03, or SC04 writer changes.
- Frozen R6B loading authority `src/app/rc01-runtime-loading-hardening.js` remains byte-identical to `b8a909f`; R7 composes above it rather than modifying its R6D-locked hash.

## Architecture

### 1. One in-memory read coordinator
`src/app/r7-read-coordinator.js` is the canonical R7 in-memory read coordinator and exposes `runtime.__SJ_R7_READ_COORDINATOR`. The frozen R6B authority `src/app/rc01-runtime-loading-hardening.js` remains byte-for-byte unchanged from base commit `b8a909f`.

The coordinator uses plain objects rather than `Map.set()` so SC04 does not confuse local cache mutation with database mutation.

Per logical key (for example `report:day:2026-09-07:ALL` or `shift-history:2026-09-07`) it stores:
- `value`
- `loadedAt`
- `loading`
- `error`
- `requestToken`
- `startedAt`
- `lastDurationMs`

Required API:
- `peek(key)` — returns current cached record or null.
- `begin(key)` — increments and returns a request token.
- `isCurrent(key, token)` — latest-wins guard.
- `finish(key, token, value, timing)` — commits only if token is current.
- `fail(key, token, error, timing)` — records error but preserves previous value.
- `snapshot()` — read-only diagnostics for tests/diagnostics UI.

No background intervals are allowed.

### 2. Beranda: preserve the full model contract
`src/ui/owner-dashboard-hybrid.js` keeps the complete owner model (`sales`, `txCount`, `qty`, `expense`, selected shift, finance, etc.) but changes its expensive enrichment to stale-while-revalidate.

- `SJX.dayModel()` remains local-first through existing runtime hardening.
- Day cache becomes keyed by date, not a single `lastDay` variable.
- Finance enrichment becomes cache-per-month and background refresh; owner rendering does not wait for `loadMonth()`.
- When finance is not yet known, render `Belum tersedia` rather than a false zero.

`src/compat/emg-d1-p1-dashboard-fast.js` is reduced to presentation/freshness decoration only. It must not override `ownerModel()` or maintain a second 5-minute dashboard cache.

### 3. Reports: historical shell first, data later
Historical render-first behavior is implemented above the frozen R6B authority in `src/ui/report-refinement.js`. The existing `src/app/rc01-runtime-loading-hardening.js` remains unchanged.

For any day/scope:
- If exact matching local/cache data exists, render it immediately and mark the view `Memperbarui…`.
- If no matching data exists, render the Report shell immediately with unknown placeholders (`—`) and `Mengambil data <scope>…`.
- Keep the shell/tabs/date controls interactive while data refreshes.
- On timeout/error, preserve the last matching data and show `Belum dapat memperbarui • menampilkan data terakhir`.

The coordinator key must include scope/date/shift so data from another date can never appear as the selected date.

### 4. Reports: eliminate duplicate remote opens
`src/ui/report-refinement.js` separates remote scope changes from local visual filters.

- `applyScope()` performs exactly one `report.open()` for a remote period change.
- Add `rerenderLocal()` that only re-renders from `report.state.model`.
- `metric`, `topSort`, and filters that can be derived from the already loaded model use `rerenderLocal()`.

`src/ui/owner-dashboard-hybrid.js` removes the second `controller.rerender()` after `applyScope()`.

### 5. Historical Shift: cache per date + latest-wins
`src/ui/sales-shift-ux-refinement.js` removes the global `loading` early-return behavior.

For each selected date:
- Show cached rows immediately if present.
- Otherwise show the complete sheet context plus skeleton/unknown state.
- Start/reuse one in-flight read for that date.
- Every user selection receives a new token.
- A response only paints if its token is still current and its date still matches the input.

Rapid A → B → C selection must always end on C, even if A returns last.

### 6. Finance: stale-while-revalidate by month
`src/ui/finance-v33-workspace.js` maintains `cacheByPeriod` and does not set `loaded:null` simply because the period changes.

- Switching month immediately paints cached month data if known.
- If the new month is unknown, keep the workspace shell and show unknown placeholders.
- While refreshing, display a small `Memperbarui <bulan>…` status.
- Error retains the cached value and adds a non-destructive warning.
- Filters/search remain purely local.

### 7. Emergency D1 launcher placement
`src/compat/emg-d1-p1-emergency.js` keeps the management/settings card but removes the permanent floating red button from `document.body`.

No new Firebase health listener is added. Emergency mode remains explicit/manual through the existing management/settings card and existing overlay.

### 8. Status language
Canonical status strings:
- `Sedang memperbarui data…`
- `Mengambil data <tanggal/periode>…`
- `Data terakhir ditampilkan • sedang memperbarui…`
- `Belum dapat memperbarui • menampilkan data terakhir`
- `Diperbarui <HH.MM>`

Unknown numeric business values use `—` / `Belum tersedia`; zero is reserved for confirmed zero.

### 9. Timing diagnostics
The read coordinator records in-memory timing only:
- start time
- end time
- total duration
- success/error
- logical key

No telemetry network call is added. Tests can assert the timing state through `__SJ_R7_READ_COORDINATOR.snapshot()`.

## Safety / Authority Constraints
- No `firebase.database()` addition outside existing readers.
- No `.set(`, `.update(`, `.transaction(`, or destructive `.remove(` added outside authorized writers.
- No new `setInterval()` or permanent listener.
- `src/compat/rc01-qris-deferred-settlement-compat.js` unchanged.
- `src/compat/rc01-qris-manual-bypass.js` unchanged.
- `src/compat/rc01-sync-authority.js` unchanged.
- `src/ref01-entry.js` unchanged.
- D1 Worker/schema/core unchanged.
- `scripts/build-ref01.mjs` only changes if a test proves it is required; R7 is designed to work through files already copied/loaded by REF01.

## Acceptance Criteria
1. Beranda renders immediately and still exposes complete qty/expense/finance/selectedShift behavior.
2. Historical Report shell appears immediately for a date that has never been opened.
3. Cached historical Report appears immediately on revisit.
4. Date A → B → C rapid switching finishes on C; A/B cannot overwrite it.
5. Metric/top-product filter changes produce zero new `report.open()` calls.
6. Owner Dashboard → Report navigation performs one remote `report.open()` for the selected scope.
7. Shift history rapid date switching is latest-wins.
8. Finance month switching never blanks the whole workspace.
9. Unknown values are not rendered as confirmed zero.
10. D1 floating launcher no longer covers normal content; settings/management access remains.
11. No new polling/listener/database writer.
12. Existing 585 tests remain green, plus new R7 tests.
13. SC03, SC04, REF01, R6D, and D1 authenticated drill remain PASS.

## Preview UAT
- Open Beranda from Penjualan, Operasional, and Laporan: shell/data appears immediately.
- Select yesterday in Reports: controls and shell remain visible while updating.
- Switch dates quickly three times: final date always wins.
- Re-open a previously loaded historical date: cached view appears immediately.
- Switch report metric/top sort: no loading blank state.
- Switch Finance month: previous/cached content stays visible with update status.
- Open Shift date picker and switch dates quickly: final date wins.
- Confirm D1 access remains available from management/settings and no floating button covers the report.
