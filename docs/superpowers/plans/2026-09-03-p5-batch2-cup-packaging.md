# P5 Batch-2 Cup & Packaging Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add Segeran Jiwa cup/packaging inventory visibility, manual shift opening/closing counts, variance reconciliation, category/product cup mapping, and recipe-cost integration without adding a duplicate transaction/inventory/shift writer.

**Architecture:** The existing product `cp` field remains the cup mapping authority. The five cup types are first-class Inventory V2 ingredients with `pcs` units and are managed through the existing Inventory V2 ingredient writer surface. Shift cup counts are appended to the existing `SJOperationalHardening.verifiedShiftWrite` START/CLOSE payload. Recipe costing is decorated read-time so the existing sale-costing reservation snapshots cup WAC as a recipe component; physical cup stock remains reconciled from manual shift counts rather than a new per-sale stock writer.

**Tech Stack:** Existing HTML/JS POS, Firebase RTDB legacy authorities, modular REF01/P5 JavaScript, Node test runner.

**Spec:** P5 Batch-2 design approved in chat on 2026-09-03.

## Global Constraints

- P4 v3.3 LOCKED remains rollback authority.
- Production v2.9 remains untouched.
- Firebase root stays `toko_segeranjiwa_v58`.
- No new direct RTDB writer file for cup/packaging.
- Reuse Inventory V2 ingredient writer and existing Shift `verifiedShiftWrite` authority.
- Existing product `cp` codes remain compatible: `c10`, `c16`, `c22p`, `c22d`, `c22o`.
- Manual closing physical count is reconciliation authority for cup variance.
- Unknown/non-snapshotted historical cup HPP is never fabricated.
- LOCAL QA stays READ ONLY.

---

### Task 1: Cup domain & inventory classification
- [x] RED tests for five fixed cup types, Inventory V2 matching, theoretical usage, inbound transfer, and variance math.
- [x] Implement pure `packaging-cup-v34` domain.
- [x] Verify tests GREEN.

### Task 2: Inventory V3 cup presentation & setup through existing writer
- [x] RED tests for `Kemasan & Cup` section, missing-master state, and READ ONLY setup control.
- [x] Integrate cup rows into Inventory V3 and expose setup using existing hidden Inventory V2 ingredient writer.
- [x] Verify inventory/P3 regressions.

### Task 3: Shift opening/closing cup control
- [x] RED tests for manual opening counts, closing counts, theoretical/physical variance and required reason.
- [x] Decorate `SJShift` UI and augment existing `verifiedShiftWrite` START/CLOSE payload only.
- [x] Ensure no direct RTDB mutation exists in new modular source.

### Task 4: Product mapping & costing integration
- [x] RED tests that existing `cp` mapping is canonical and category bulk assignment uses existing menu transaction authority.
- [x] Decorate active recipe variants with registered cup ingredient qty=1 so existing sale costing snapshots cup WAC.
- [x] Preserve historical no-fabrication semantics.

### Task 5: Full verification & Android LOCAL QA package
- [x] Run related regressions.
- [x] Run full `npm test`, SC04 and REF01.
- [x] Verify B01-B05 and CSS budget.
- [x] Smoke `qa:local` from clean candidate.
- [x] Package continuity-ready ZIP + SHA256 and Android checklist.
