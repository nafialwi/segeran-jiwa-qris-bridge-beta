# R10 Cup Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan Jejak Rekonsiliasi Cup berbasis closing evidence dan Inventory V2 Opname tanpa membuat stock writer baru.

**Architecture:** Rekonsiliasi diturunkan dari evidence `cupControl.reconciliation` milik shift. Domain mapper menghasilkan model tanggal/item/status. Inventory Workspace menampilkan tab baru dan memakai Opname existing sebagai satu-satunya koreksi stok. Movement Opname dengan reconciliation reference menjadi bukti penyelesaian.

**Tech Stack:** JavaScript ES modules, Node test runner, legacy Firebase RTDB runtime, REF-01 UI.

**Spec:** `docs/superpowers/specs/2026-09-15-cup-reconciliation-design.md`

## Global Constraints

- Production baseline: `8018c40ae74f`.
- Inventory V2 tetap single source of truth.
- Tidak ada Firebase stock writer baru.
- Tidak ada dependency baru.
- UI mengikuti visual Bahan & Gudang existing.
- LOCAL QA tidak boleh menulis production.
- Semua perubahan source harus memiliki regression test.

---

### Task 1: Domain reconciliation model

**Files:**
- Create: `src/domain/cup-reconciliation-v1.js`
- Test: `tests/r10-cup-reconciliation-domain.test.mjs`

**Produces:**
- `buildCupReconciliationRef({shiftKey,sessionId,code})`
- `buildCupReconciliationGroups({shifts,movements,cupRows})`
- `findCupReconOpname({reference,movements,ingredientId})`

- [ ] Write failing tests for date grouping, status, ordering, reference identity, variance zero, and Opname resolution.
- [ ] Run domain test and confirm RED.
- [ ] Implement pure domain functions with no Firebase/runtime access.
- [ ] Run domain test and confirm GREEN.
- [ ] Run existing cup domain tests.
- [ ] Commit domain model.

### Task 2: Reconciliation UI renderer

**Files:**
- Create: `src/ui/cup-reconciliation-v1.js`
- Modify: `src/ui/ref01.css`
- Test: `tests/r10-cup-reconciliation-ui.test.mjs`

**Consumes:**
- output from `buildCupReconciliationGroups`.

**Produces:**
- `renderCupReconciliationV1({groups,expandedDates,selectedRef})`
- stable `data-r10-*` hooks for interaction.

- [ ] Write failing render tests for KPI, date accordion, status badges, summary rows, and detail screen.
- [ ] Confirm RED.
- [ ] Implement renderer using existing visual grammar/classes where appropriate.
- [ ] Add minimal R10 CSS scoped under `.sj-r10-cup-recon`.
- [ ] Confirm GREEN.
- [ ] Run REF-01 UI tests.
- [ ] Commit renderer.

### Task 3: Inventory Workspace integration

**Files:**
- Modify: `src/ui/inventory-workspace-v32.js`
- Test: `tests/r10-cup-reconciliation-inventory-integration.test.mjs`

**Produces:**
- new inventory tab `reconciliation`;
- date accordion state;
- detail navigation;
- refresh path for shift reconciliation evidence.

- [ ] Write failing integration tests proving the new tab exists without replacing Stok/Opname/Activity behavior.
- [ ] Confirm RED.
- [ ] Add `reconciliation` to inventory navigation/state routing.
- [ ] Read shift evidence through existing runtime state/read authority; do not create writer.
- [ ] Build groups with Inventory V2 movements and cup master rows.
- [ ] Wire accordion/detail interactions.
- [ ] Confirm GREEN.
- [ ] Run existing inventory tests.
- [ ] Commit integration.

### Task 4: Opname deep-link and resolution

**Files:**
- Modify: `src/ui/inventory-workspace-v32.js`
- Modify: `src/domain/cup-reconciliation-v1.js`
- Test: `tests/r10-cup-reconciliation-opname.test.mjs`

**Produces:**
- Opname prefill via existing `openAction('opname', ...)`;
- note `[CUP_RECON:<reference>]`;
- resolved detection from Inventory V2 movement evidence.

- [ ] Write failing tests proving `Buat Opname` uses the existing Opname path.
- [ ] Assert no persistence primitive exists in the reconciliation module.
- [ ] Confirm RED.
- [ ] Prefill `location:'outlet'`, `actual:physicalClosing`, reconciliation note.
- [ ] Detect matching OPNAME movement as resolution evidence.
- [ ] Confirm GREEN.
- [ ] Run inventory and cup tests.
- [ ] Commit Opname integration.

### Task 5: Build/bootstrap/release gates

**Files:**
- Modify as required: `scripts/build-ref01.mjs`
- Modify as required: `src/app/ref01-bootstrap.js`
- Test: `tests/r10-cup-reconciliation-release-gate.test.mjs`

**Produces:**
- R10 modules included in REF-01 production build;
- release gate preventing invented writers.

- [ ] Write failing release test for generated module presence and no stock writer.
- [ ] Confirm RED.
- [ ] Add module to build/bootstrap only if current build copy mechanism requires it.
- [ ] Confirm GREEN.
- [ ] Run full serial regression.
- [ ] Run `verify:sc03`, `verify:sc04`, `verify:ref01`, `verify:rc01`.
- [ ] Run `git diff --check`.
- [ ] Commit release integration.

### Task 6: LOCAL QA and visual UAT

**Files:**
- Modify only if required by failed QA guard tests.

- [ ] Build LOCAL QA through existing `scripts/local-qa-html.mjs` path.
- [ ] Confirm `window.__SJ_LOCAL_QA_READ_ONLY === true`.
- [ ] Verify Rekonsiliasi Cup renders grouped by date.
- [ ] Verify detail screen.
- [ ] Verify Opname navigation/prefill while writer remains blocked in LOCAL QA.
- [ ] Verify Activity view remains functional.
- [ ] Run full regression again.
- [ ] Create checkpoint commit and handoff; do not deploy until explicit production approval.
