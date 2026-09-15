# Inventory V2 Read Architecture Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove broad Inventory V2 reads from normal Bahan & Gudang loading while preserving writer authority and establishing the foundation for shared/cached reads.

**Architecture:** Keep Inventory V2/Firebase as source of truth, but separate small current-state reads from growing ledgers. INV01-1 introduces targeted repository readers, bounded recent movements, and in-memory diagnostics; later blocks add coordination/cache and migrate remaining consumers.

**Tech Stack:** JavaScript ES modules, Node test runner, Firebase RTDB compatibility API, existing Segeran Jiwa build/verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-15-inventory-v2-read-hardening-design.md`

## Global Constraints

- Production main remains `8018c40ae74f`; no merge or deploy in INV01-1.
- Start exactly from R10 checkpoint `d3d6725b5ce4`.
- Inventory V2 writers are immutable in INV01-1.
- Frozen R6B file SHA-256 remains `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`.
- Normal Inventory Workspace must perform zero `readInventoryV2()` calls.
- Activity movement query is server bounded to 120 rows.
- Reconciliation may retain a lazy full movements read until INV01-3 to preserve historical resolution correctness.

---

### Task 1: RED contract for read boundaries

**Files:**
- Create: `tests/r10-inv01-read-foundation.test.mjs`

**Interfaces:**
- Consumes: existing `createInventoryRepository()` and Inventory Workspace source.
- Produces: failing contract for `readWorkspaceState()`, `readRecentMovements()`, diagnostics, and zero normal-workspace root reads.

- [ ] Write tests requiring child-path workspace reads and a bounded `ts` movement query.
- [ ] Require compatibility `readInventoryV2()` to remain callable.
- [ ] Require in-memory diagnostics and Inventory Workspace to stop calling `repository.readInventoryV2()`.
- [ ] Run the new test and confirm RED because the new read APIs do not exist yet.

### Task 2: Targeted repository read foundation

**Files:**
- Create: `src/data/inventory-read-diagnostics.js`
- Modify: `src/data/repositories/inventory-repository.js`
- Modify: `src/ui/inventory-workspace-v32.js`
- Modify: `tests/r10-cup-reconciliation-inventory-integration.test.mjs`

**Interfaces:**
- Produces: `readWorkspaceState()`, `readRecentMovements({limit})`, child readers, `createInventoryReadDiagnostics()`, and runtime diagnostic exposure.
- Preserves: `readInventoryV2()` and `readMovements()` compatibility APIs.

- [ ] Implement read-only diagnostics with bounded in-memory history.
- [ ] Implement child-path readers and compose workspace state from four parallel reads.
- [ ] Implement `orderByChild('ts').limitToLast(limit)` recent movement reader.
- [ ] Change normal workspace load and cup refresh to targeted state reads.
- [ ] Keep full movements lazy for reconciliation correctness and refresh it after reconciliation writers once loaded.
- [ ] Update the R10 static integration assertion from `inv.movements` to the explicit Inventory V2 movements reader.
- [ ] Run focused tests and confirm GREEN.

### Task 3: Full safety verification

**Files:** no additional production files.

- [ ] Build REF01 before the full suite so generated compatibility artifacts are current.
- [ ] Run all Node tests serially.
- [ ] Run SC02, SC03, SC04, V3.2, REF01, and RC01-S10C-R6D verification gates.
- [ ] Compare all dedicated writer hashes with the pre-change snapshot.
- [ ] Verify the frozen R6B SHA-256 and `git diff --check`.
- [ ] Restore generated artifacts and require only the allowlisted source/test/doc delta.

### Task 4: Historical control checkpoint

**Files:**
- Create/update: `docs/project-control/PROJECT_STATE.md`
- Create/update: `docs/project-control/ROADMAP.md`
- Create/update: `docs/project-control/DECISIONS.md`

- [ ] Commit the validated source/test change.
- [ ] Record INV01-1 as DONE, INV01-2 as NEXT, and the lazy reconciliation movement read as deferred work.
- [ ] Commit project-control documents and the approved spec/plan.
- [ ] Push the feature branch and pre-INV01 tag to GitHub when credentials/network permit; never touch `main`.
