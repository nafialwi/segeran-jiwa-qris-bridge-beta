# R7 Unified Non-Blocking Read & Historical UX Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate blank/blocking historical data screens across Beranda, Reports, Shift history, and Finance while reducing redundant remote loads and preserving all existing database/write authorities.

**Architecture:** Add a dedicated R7 in-memory read coordinator above the existing frozen R6B runtime loading authority. Existing UI modules consume that coordinator for cache, latest-wins request tokens, and non-destructive loading/error states while `src/app/rc01-runtime-loading-hardening.js` remains byte-identical to `b8a909f`. The P1 fast-dashboard compat is reduced to presentation-only so there is one dashboard cache authority.

**Tech Stack:** JavaScript ES modules + existing classic compat scripts, Node 24 test runner, Firebase RTDB existing readers, Cloudflare Pages existing build, D1 P1 unchanged.

**Spec:** `docs/superpowers/specs/2026-09-08-r7-unified-loading-hardening-design.md`

## Global Constraints
- Base branch: `emg-d1-p1-r4-sc04-safe` at commit `b8a909f`.
- No Firebase schema/rules/writer changes.
- No new Firebase listeners or polling intervals.
- No localStorage in R7.
- QRIS R6 authority files unchanged.
- D1 Worker/schema/core unchanged.
- `src/ref01-entry.js` unchanged.
- Frozen R6B `src/app/rc01-runtime-loading-hardening.js` unchanged byte-for-byte from `b8a909f`.
- Unknown business values must not be represented as confirmed zero.
- Termux verification must use `node --test --test-concurrency=1 tests/*.test.mjs` to avoid Android filesystem races.

---

### Task 1: Canonical R7 read coordinator

**Files:**
- Create: `src/app/r7-read-coordinator.js`
- Create: `tests/r7-read-coordinator.test.mjs`

**Interfaces:**
- Produces runtime API `runtime.__SJ_R7_READ_COORDINATOR` with `peek`, `begin`, `isCurrent`, `finish`, `fail`, `snapshot`.
- Consumers: Reports, Shift history, Finance, Owner Dashboard.

- [ ] **Step 1: Write failing coordinator tests**

Tests must cover:
```js
// same key deduplicates in-flight work
// begin() increments token
// older token cannot finish over newer token
// fail() preserves previous cached value
// snapshot() exposes duration/error/loading without mutating data
// implementation contains no Map.set / setInterval / Firebase API
```

Run:
```bash
node --test --test-concurrency=1 tests/r7-read-coordinator.test.mjs
```
Expected: FAIL because the dedicated R7 coordinator module/API does not exist.

- [ ] **Step 2: Implement dedicated coordinator without modifying frozen R6B runtime hardening**

Use plain-object stores:
```js
const records=Object.create(null);
const tokens=Object.create(null);
function peek(key){return records[key]||null}
function begin(key){tokens[key]=Number(tokens[key]||0)+1;return tokens[key]}
function isCurrent(key,token){return Number(tokens[key]||0)===Number(token)}
```

`finish` and `fail` must ignore stale tokens. `fail` updates error/timing only and preserves `value`.

Expose:
```js
runtime.__SJ_R7_READ_COORDINATOR=Object.freeze({peek,begin,isCurrent,finish,fail,snapshot});
```

- [ ] **Step 3: Verify GREEN and security tokens**

```bash
node --test --test-concurrency=1 tests/r7-read-coordinator.test.mjs
node scripts/verify-sc03.mjs
node scripts/verify-sc04.mjs
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/r7-read-coordinator.js tests/r7-read-coordinator.test.mjs
git commit -m "refactor: add unified nonblocking read coordinator"
```

---

### Task 2: Beranda complete-model non-blocking behavior

**Files:**
- Modify: `src/ui/owner-dashboard-hybrid.js`
- Modify: `src/compat/emg-d1-p1-dashboard-fast.js`
- Create: `tests/r7-owner-dashboard-contract.test.mjs`

**Interfaces:**
- Consumes: `runtime.__SJ_R7_READ_COORDINATOR`.
- Preserves: `SJRefinementRoleDashboardV100.ownerModel/ownerHTML/renderOwner` public contract.

- [ ] **Step 1: Write failing contract tests**

Assert:
```js
// first owner render resolves before mocked finance.loadMonth
// model retains qty, expense, selectedShift, finance semantics
// day cache is keyed by date, not one global lastDay
// second date cannot reuse first date day model
// emg-d1-p1-dashboard-fast does not replace ownerModel
// no second 5-minute dashboard model cache remains
```

Run:
```bash
node --test --test-concurrency=1 tests/r7-owner-dashboard-contract.test.mjs
```
Expected: FAIL on current fast override/blocking finance behavior.

- [ ] **Step 2: Refactor `owner-dashboard-hybrid.js`**

Replace single `lastDay` with plain-object `lastDayByDate`. When `SJX.dayModel()` resolves, store against active date.

Create finance cache keyed by month and schedule `finance.loadMonth(period)` through coordinator after the immediate model is returned. Until fresh finance exists, preserve prior matching month data or mark finance unavailable/unknown; do not fabricate zero.

When background finance finishes and current owner date/month still matches, call existing owner render once.

- [ ] **Step 3: Reduce fast compat to presentation-only**

`src/compat/emg-d1-p1-dashboard-fast.js` may decorate the sync/freshness copy, but must not assign to:
```js
dashboard.ownerModel
dashboard.renderOwner
```
It must not create `modelCache`, `prevCache`, 5-minute TTL, or schedule its own exact reads.

- [ ] **Step 4: Verify**

```bash
node --test --test-concurrency=1 tests/r7-owner-dashboard-contract.test.mjs tests/emg-d1-p1-dashboard-fast.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/owner-dashboard-hybrid.js src/compat/emg-d1-p1-dashboard-fast.js tests/r7-owner-dashboard-contract.test.mjs
git commit -m "fix: preserve full owner model during background refresh"
```

---

### Task 3: Historical Reports render-first and local-filter hardening

**Files:**
- Keep unchanged: `src/app/rc01-runtime-loading-hardening.js` (frozen R6B)
- Consume: `src/app/r7-read-coordinator.js`
- Modify: `src/ui/report-refinement.js`
- Modify: `src/ui/owner-dashboard-hybrid.js`
- Create: `tests/r7-report-nonblocking.test.mjs`
- Create: `tests/r7-report-remote-read-count.test.mjs`

**Interfaces:**
- Report remote key format: `report:<scope>:<anchor>:<shift>:<from>:<to>`.
- `createCanonicalReportController` adds `rerenderLocal()` and keeps `applyScope()` as the only remote-period loader.

- [ ] **Step 1: Write failing historical report tests**

Cover:
```js
// non-today historical date gets immediate shell/preview
// unknown historical date renders em dash / loading status, not Rp0
// error preserves cached matching-date model
// cached historical date is painted before remote promise resolves
```

- [ ] **Step 2: Write failing remote-call-count tests**

Cover:
```js
// applyScope() => exactly one report.open()
// Owner Dashboard sales-report navigation => exactly one report.open()
// metric toggle => zero report.open()
// topSort toggle => zero report.open()
```

- [ ] **Step 3: Implement historical report coordinator**

Do not modify the frozen R6B `today` preview. Implement historical render-first behavior in `report-refinement.js` above that authority: derive a logical key from report period/scope and use coordinator records. Only render cached data when its key matches the selected scope/date. Wrap legacy loading/error rendering so it cannot blank the report surface while a historical read is in flight.

When no matching data exists, keep tabs/controls visible and render unknown placeholders plus status copy. Do not blank `lap-menu-view`.

- [ ] **Step 4: Split local vs remote rerender**

In `report-refinement.js`:
```js
function rerenderLocal(){ /* render from report.state.model + local filters only */ }
```
Return it from the controller.

Change local metric/top-product/filter handlers to call `rerenderLocal()`, not `report.open()`.

In owner navigator remove the extra:
```js
await controller.rerender?.()
```
after `applyScope()`.

- [ ] **Step 5: Verify**

```bash
node --test --test-concurrency=1 tests/r7-report-nonblocking.test.mjs tests/r7-report-remote-read-count.test.mjs
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/r7-read-coordinator.js src/ui/report-refinement.js src/ui/owner-dashboard-hybrid.js tests/r7-report-nonblocking.test.mjs tests/r7-report-remote-read-count.test.mjs
git commit -m "fix: make historical reports nonblocking and deduplicate loads"
```

---

### Task 4: Historical Shift latest-wins behavior

**Files:**
- Modify: `src/ui/sales-shift-ux-refinement.js`
- Create: `tests/r7-shift-history-latest-wins.test.mjs`

**Interfaces:**
- Consumes coordinator with key `shift-history:<YYYY-MM-DD>`.

- [ ] **Step 1: Write failing race test**

Use deferred promises for A, B, C dates. Trigger A → B → C. Resolve C first, then A/B. Assert final DOM and `selectedDate` remain C.

Also assert a repeat visit to C paints cache before a new read resolves.

- [ ] **Step 2: Implement**

Remove `loading` from the render guard. Keep `selectedDate`, cache per date, and request token. The input updates immediately. Paint cached rows or a non-empty skeleton immediately, then start/reuse the date read.

Only current token/date may paint returned rows or error state.

- [ ] **Step 3: Verify**

```bash
node --test --test-concurrency=1 tests/r7-shift-history-latest-wins.test.mjs
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ui/sales-shift-ux-refinement.js tests/r7-shift-history-latest-wins.test.mjs
git commit -m "fix: make historical shift reads latest-wins"
```

---

### Task 5: Finance stale-while-revalidate

**Files:**
- Modify: `src/ui/finance-v33-workspace.js`
- Create: `tests/r7-finance-nonblocking.test.mjs`

**Interfaces:**
- Cache key: `finance:<YYYY-MM>`.

- [ ] **Step 1: Write failing tests**

Assert:
```js
// period switch does not set the whole workspace to blank loading markup
// cached target period paints immediately
// unknown target period keeps shell and uses unknown values
// failed refresh preserves previous matching-period cache and warning
// search/source/day/category filters remain local and trigger no loadMonth
```

- [ ] **Step 2: Implement cache-by-period**

Add `cacheByPeriod=Object.create(null)`. `reload()` marks loading but does not destroy current `loaded`. If matching target-period cache exists, paint it immediately. Commit fresh data only if target period is still current.

Change period event handler so it no longer forces `loaded:null`.

- [ ] **Step 3: Verify**

```bash
node --test --test-concurrency=1 tests/r7-finance-nonblocking.test.mjs
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ui/finance-v33-workspace.js tests/r7-finance-nonblocking.test.mjs
git commit -m "fix: keep finance workspace visible while refreshing"
```

---

### Task 6: Emergency launcher placement

**Files:**
- Modify: `src/compat/emg-d1-p1-emergency.js`
- Create: `tests/r7-emergency-launcher-placement.test.mjs`

**Interfaces:**
- Existing `openEmergency()` flow remains unchanged.
- Existing management card `data-sj-emg-d1-card` remains the entry point.

- [ ] **Step 1: Write failing test**

Assert install does not append `#sj-emg-launch` floating button to `document.body`, while the management/settings card still contains a working button bound to emergency opening.

- [ ] **Step 2: Remove floating launcher only**

Delete fixed-button CSS and body-button creation. Keep styles required by overlay and management card. Do not add a Firebase health listener.

- [ ] **Step 3: Verify**

```bash
node --test --test-concurrency=1 tests/r7-emergency-launcher-placement.test.mjs tests/emg-d1-p1-contract.test.mjs tests/emg-d1-p1-core.test.mjs
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/compat/emg-d1-p1-emergency.js tests/r7-emergency-launcher-placement.test.mjs
git commit -m "fix: move emergency access out of floating content area"
```

---

### Task 7: Full safety gate, timing evidence, and Preview handoff

**Files:**
- Modify only if generated source copy requires no semantic change: `scripts/build-ref01.mjs`
- Create: `tests/r7-no-new-background-read.test.mjs`
- Create: `docs/superpowers/reports/2026-09-08-r7-verification.md`

**Interfaces:**
- Final runtime timing evidence from `__SJ_R7_READ_COORDINATOR.snapshot()`.

- [ ] **Step 1: Add no-background-read regression**

Static/dynamic assertions:
```js
// no new setInterval
// no new firebase.database listener in R7-touched files
// no new .on('value')
// no new writer tokens outside authorities
```

- [ ] **Step 2: Fresh serial full suite on exact tree**

```bash
rm -rf dist-sc03 dist-sc04
npm run build:sc03
npm run build:sc04
node scripts/verify-sc03.mjs
node scripts/verify-sc04.mjs
node --test --test-concurrency=1 tests/*.test.mjs
rm -f dist-ref01/.ref01-build-fingerprint
npm run build:ref01
npm run verify:ref01
npm run verify:rc01:s10c-r6d
git diff --check
```
Expected: all tests PASS, zero failures.

- [ ] **Step 3: Frozen authority checks**

```bash
git diff --exit-code b8a909f -- \
  src/compat/rc01-qris-deferred-settlement-compat.js \
  src/compat/rc01-qris-manual-bypass.js \
  src/compat/rc01-sync-authority.js \
  src/ref01-entry.js \
  emergency-d1/schema.sql \
  emergency-d1/src/core.js \
  emergency-d1/src/worker.js
```
Expected: no diff.

- [ ] **Step 4: D1 drill remains green**

Use existing Owner Key/token procedure without printing secrets and assert:
```text
HTTP 200
ok true
drill PASS
```

- [ ] **Step 5: Record timing evidence**

In Preview UAT record coordinator timing for:
- Beranda current date
- Report previous day
- Shift history previous day
- Finance current/previous month

Document fetch/total duration and whether cache was used. No network telemetry is added.

- [ ] **Step 6: Preview acceptance**

Manually verify:
```text
Beranda immediate
Historical report shell immediate
A→B→C date latest-wins
Historical revisit cache immediate
Metric/top sort no blank/reload
Finance period no blank
Shift history latest-wins
D1 floating launcher gone; management card available
```

- [ ] **Step 7: Final commit/push**

```bash
git add -A
git diff --cached --check
git commit -m "fix: unify nonblocking historical data loading"
git push -u origin r7-unified-loading-hardening
```

Do not merge to `main` until Preview UAT passes.
