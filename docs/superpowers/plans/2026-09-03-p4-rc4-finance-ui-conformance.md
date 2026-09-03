# P4 RC4 Finance UI Conformance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring P4 Finance presentation into conformance with the locked Grand Design while preserving the approved persistence authorities and LOCAL QA read-only safety.

**Architecture:** Finance remains a consolidator/read model over existing transaction, expense, inventory, shift, debt, advance, QRIS and approved owner-event/month-close authorities. RC4 enriches derived view-state and presentation only: clearer month scope, cash/liquidity headline, daily inspection, categorized cash flow, obligation/outstanding warnings, complete close checklist, and a restrained Owner dashboard finance entry. No new persistence path or direct RTDB mutation is introduced.

**Tech Stack:** Vanilla ES modules, Firebase RTDB legacy adapter through existing repositories/services, Node `node:test`, REF01 CSS/UI shell.

**Spec:** `/mnt/data/sj_grand_design_check/SEGERAN_JIWA_POS_V3_GRAND_DESIGN_REV2_2026-09-02_CONTINUITY_CHECKPOINT/07_MONTHLY_FINANCE_CAPITAL_PRIVE_ARCHITECTURE.md`

## Global Constraints

- Firebase root remains `toko_segeranjiwa_v58`.
- P3 v3.2 LOCKED remains rollback anchor; do not modify P1–P3 authorities.
- Finance is a consolidator/read model, not a duplicate transaction/inventory/expense writer.
- Approved new persistence remains limited to `global/financeV1/ownerEvents`, `global/financeV1/monthCloseEvents`, `global/financeV1/qrisCashOut`, plus linked existing shift `cashMovements`.
- LOCAL QA remains mutation-forbidden.
- `HPP unknown` renders `Belum tersedia`, never Rp0.
- `Kas Tersedia != Modal Akhir` must remain explicit.
- Prive is not expense; additional capital is not revenue; inventory purchase cash-out is not double-counted as P&L expense when HPP is used.
- B01–B05 remain icon authority; B06 remains non-production.
- SC02/SC03/SC04 exact writer allowlist and destructive `.remove()` prohibition remain unchanged.
- No production deployment in RC4.

---

### Task 1: Finance End-State Read Model + Five Workspace Tabs

**Files:**
- Modify: `src/domain/finance-v33-analytics.js`
- Modify: `src/domain/finance-v33-service.js`
- Modify: `src/ui/finance-v33-workspace.js`
- Modify: `src/ui/ref01.css`
- Test: `tests/v33-p4-phase-c-finance-ui.test.mjs`
- Test: `tests/v33-p4-phase-a-finance-read-model.test.mjs`

**Interfaces:**
- Consumes: existing `loaded.input`, `loaded.model.profit`, `loaded.model.ownerCapital`, `loaded.model.cashFlow.rows`, `loaded.allShiftsClosed`, `loaded.activeClose`.
- Produces: derived `model.cashPosition`, cash-flow running balances/categories, daily summaries, obligation/outstanding status, and RC4 markup selectors `data-v33-fin-period`, `data-v33-fin-day`, `data-v33-fin-search`, `data-v33-fin-source`.

- [ ] **Step 1: Write failing conformance tests**

Add assertions that `renderFinanceWorkspaceV33()` contains: month label/scope controls; summary metrics for Kas Tersedia, Modal Awal, Tambahan Modal, Prive, Penjualan Bersih, HPP, Pengeluaran Bisnis, Laba Bersih, Modal Akhir Terhitung; warning block; Arus Kas four KPI cards, source filter, search, date grouping, category, source, in/out and running balance; Pengeluaran total/category/filter; Modal & Prive monthly totals and disabled LOCAL QA form; Tutup Bulan financial recap, checklist for shifts/pending/HPP/expense/obligations/outstanding issues, and disabled LOCAL QA action.

Add analytics tests proving cash position is derived from cash-flow rows and does not equal calculated ending capital by definition.

- [ ] **Step 2: Run targeted tests and confirm RED**

Run:
```bash
node --test tests/v33-p4-phase-a-finance-read-model.test.mjs tests/v33-p4-phase-c-finance-ui.test.mjs
```
Expected: failures on missing RC4 conformance selectors/content only.

- [ ] **Step 3: Implement minimal derived analytics and service state**

Extend `buildFinanceReadModel(input)` with read-only derived fields:
```js
cashPosition: { totalIn, totalOut, netChange },
daily: [...],
obligations: { items, unresolvedCount },
outstanding: { customerDebt, employeeAdvance, pendingTransactions }
```
Derive only from existing inputs; do not create new persistence.

- [ ] **Step 4: Implement five RC4 workspace tabs**

Update `finance-v33-workspace.js` so:
- Ringkasan answers cash, capital, prive, profit and warnings at a glance.
- Arus Kas shows chronological transactions with source/category, daily grouping, search/filter controls, and running balance.
- Pengeluaran shows total and category breakdown while delegating write action to existing expense authority.
- Modal & Prive shows monthly totals, chronological events/reversals and keeps the form visible-but-disabled in LOCAL QA.
- Tutup Bulan shows recap, checklist/status blockers and Close/Reopen visible-but-disabled in LOCAL QA.
- Period/month scope is visually explicit and daily inspection is available without changing persistence.

- [ ] **Step 5: Add/adjust REF01 CSS without increasing the `!important` budget**

Use existing tokens/classes; keep total `!important` count `<= 252` and do not add direct mutation-related selectors/scripts.

- [ ] **Step 6: Run targeted tests and confirm GREEN**

Run the targeted command from Step 2. Expected: all PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/domain/finance-v33-analytics.js src/domain/finance-v33-service.js src/ui/finance-v33-workspace.js src/ui/ref01.css tests/v33-p4-phase-a-finance-read-model.test.mjs tests/v33-p4-phase-c-finance-ui.test.mjs
git commit -m "feat: conform P4 finance workspace to grand design"
```

### Task 2: Restrained Owner Dashboard Finance Summary + Navigation

**Files:**
- Modify: `src/ui/owner-dashboard-hybrid.js`
- Modify: `src/ui/ref01.css`
- Test: `tests/v31-p2-rc2-cart-dashboard.test.mjs`
- Test: `tests/v33-p4-phase-c-finance-ui.test.mjs`

**Interfaces:**
- Consumes: existing Owner dashboard model plus P4 finance runtime when available.
- Produces: dashboard finance card/shortcut with month label, cash/profit-safe status, `Keuangan` and `Tutup Bulan` navigation actions.

- [ ] **Step 1: Write failing dashboard conformance test**

Assert Owner dashboard markup contains a restrained Finance section and actionable controls routing to `Laporan -> Keuangan` and optional close tab, without replacing the existing four core KPI cards.

- [ ] **Step 2: Run targeted tests and confirm RED**

```bash
node --test tests/v31-p2-rc2-cart-dashboard.test.mjs tests/v33-p4-phase-c-finance-ui.test.mjs
```

- [ ] **Step 3: Implement finance summary enrichment with fail-soft loading**

When P4 runtime is present, load current month finance read model during Owner dashboard model build. On absence/error, keep existing dashboard usable and render `Belum tersedia` rather than inventing zero profit/HPP.

- [ ] **Step 4: Implement navigation actions**

Extend `createOwnerDashboardNavigator()` with `finance` and `finance-close`; open Report, select Finance surface, then select `summary` or `close` after canonical report render. Preserve date/shift scope behavior for existing sales actions.

- [ ] **Step 5: Run targeted tests and confirm GREEN**

Run Step 2 command; expected all PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/ui/owner-dashboard-hybrid.js src/ui/ref01.css tests/v31-p2-rc2-cart-dashboard.test.mjs tests/v33-p4-phase-c-finance-ui.test.mjs
git commit -m "feat: add owner finance summary and shortcuts"
```

### Task 3: RC4 Verification, Documentation, LOCAL QA Candidate

**Files:**
- Modify/Create: `P4_PHASE_C_IMPLEMENTATION_REPORT.md`
- Create: `P4_PHASE_C_RC4_FINANCE_UI_CONFORMANCE.md`
- Modify: `P4_PHASE_C_LOCAL_QA.md`
- Modify: `P4_PHASE_C_UAT_AND_DEPLOYMENT_GATE.md`
- Generate: verification logs, source manifest, RC4 ZIP + SHA256

**Interfaces:**
- Consumes: clean committed RC4 source.
- Produces: continuity-ready Android LOCAL QA package; production remains blocked.

- [ ] **Step 1: Run related regression suite**

```bash
node --test tests/v33-p4-phase-a-finance-read-model.test.mjs tests/v33-p4-phase-c-finance-ui.test.mjs tests/v33-p4-phase-c-runtime.test.mjs tests/v31-p2-rc2-cart-dashboard.test.mjs tests/v32-p3-reporting-inventory.test.mjs
```
Expected: 0 failures.

- [ ] **Step 2: Run full regression**

```bash
npm test
```
Expected: 0 failures and no test threshold weakening.

- [ ] **Step 3: Run safety/final verifier**

```bash
npm run verify:sc04
npm run verify:ref01
```
Expected: SC02/SC03/SC04 PASS, REF01 PASS, B01–B05 authority PASS, `!important <= 252`, destructive `.remove()` forbidden.

- [ ] **Step 4: Update RC4 handoff documentation**

Record RC3 as routing/lifecycle PASS but Finance UI conformance FAIL; record RC4 exact presentation correction and unchanged persistence/safety boundaries.

- [ ] **Step 5: Verify clean commit copy and LOCAL QA smoke**

Create a clean archive/copy from final commit, rerun targeted/full verification, run `npm run qa:local`, require HTTP 200, `x-segeran-jiwa-mode: LOCAL QA`, `LOCAL QA · READ ONLY`, Finance RC4 content selectors, and no direct mutation surface.

- [ ] **Step 6: Build RC4 ZIP and manifests**

Include source, P3 rollback anchor, approval docs, verification logs, source/package SHA256 manifests. Run `unzip -t` and verify every manifest entry.

- [ ] **Step 7: Report Android QA instructions**

User QA sequence: Beranda Finance summary -> Laporan -> Keuangan -> Ringkasan -> Arus Kas -> Pengeluaran -> Modal & Prive -> Tutup Bulan. Keep mutation controls disabled in LOCAL QA.
