# Segeran Jiwa Legacy R8 Unified Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development task-by-task.

**Goal:** Deliver B1 UX/role/cup refinement, B2 correction/inventory safety, and B3 shift/closing integrity as one rollback-safe package from R7 FINAL LOCK.

**Architecture:** R8 is a compatibility/refinement layer composed from REF01 bootstrap. It reuses existing R7/P5 authorities and adds presentation/validation logic; it does not introduce a new economic writer family. Restock physical receipt reuses the existing atomic receive claim and verified-update hardening path.

**Tech Stack:** Vanilla JavaScript ES modules, Node test runner, Firebase RTDB legacy runtime, project SC02/SC03/SC04/REF01/RC01 verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-08-r8-unified-refinement-design.md`

## Global Constraints

- R7 FINAL LOCK is the rollback/base authority.
- Frozen baseline SHA256 must remain unchanged.
- Existing four SC04 dedicated mutation writers remain the exact allowlist.
- No direct RTDB mutation in R8 UI modules.
- No new background polling/listener in R8.
- Use TDD for every behavior change.

---

### Task 1: B1 Daily UX, Role, and Cup
- [x] Add failing tests for duplicate success suppression, honest cup status, Paper Cup visibility, cashier action policy, and no Firebase/background primitives.
- [x] Implement `src/ui/r8-daily-ux-refinement.js` and compose it from REF01.
- [x] Verify targeted tests and R7 loading regressions.

### Task 2: B2 Correction and Inventory Safety
- [x] Add failing tests for physical receive variance and purchase-correction routing.
- [x] Reuse existing atomic restock receive authority and existing Finance Purchase Reversal authority.
- [x] Reject direct RTDB mutations from UI and verify SC04/REF01 boundaries.

### Task 3: B3 Shift and Closing Integrity
- [x] Add failing tests for previous-shift carry-forward, explanation-required opening variance, and physical closing gate.
- [x] Implement blind count/reveal behavior without adding a closing writer.
- [x] Preserve P5 cup and existing closing persistence authorities.

### Task 4: Unified Release Gate
- [x] Rebuild compatibility artifacts.
- [x] Verify inline scripts and contracts.
- [x] Verify SC02, SC03, SC04, REF01, and RC01-S10C-R6D.
- [x] Run full serial test suite.
- [x] Define the one-shot installer gate: R7 base hashes, frozen-authority hashes, full regression, verifier gate, and clean source-only commit.
- [x] Require independent fresh-R7 package QA before releasing the installer; exact outcome is recorded in package root `PACKAGE_QA.txt`.
