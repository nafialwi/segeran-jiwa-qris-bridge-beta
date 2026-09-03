# P5 / v3.4 Costing & HPP Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use TDD RED→GREEN for each behavior. No persistence is authorized in this batch.

**Goal:** Build a read-only costing evidence resolver that safely increases HPP coverage and exposes valid gross profit/margin without fabricating historical cost.

**Architecture:** Resolve each transaction against immutable tx costing, exact COMMITTED costing reservations, and original-snapshot refund evidence. Enrich transactions before P4 finance analytics. Keep all historical writes and current-WAC reconstruction forbidden.

**Tech Stack:** ES modules, Node `node:test`, existing Firebase read repository, REF01 Finance UI.

**Spec:** `docs/superpowers/specs/2026-09-03-p5-v34-costing-hpp-hardening-design.md`

## Global Constraints
- P4 v3.3 LOCKED source is immutable authority and rollback point.
- Unknown HPP never becomes Rp0 by assumption.
- No current WAC/current recipe historical reconstruction.
- No new writer or SC04 allowlist expansion.
- Production deployment remains blocked.

### Task 1 — Pure costing evidence resolver
**Files:**
- Create `src/domain/costing-v34-evidence.js`
- Create `tests/v34-p5-costing-evidence.test.mjs`

RED→GREEN behaviors: attached STOCK/RECIPE snapshots; exact reservation reconstruction; partial/unsafe classification; refund snapshot reconstruction; refund partial; void exclusion.

### Task 2 — Repository/service integration
**Files:**
- Modify `src/data/repositories/finance-repository.js`
- Modify `src/domain/finance-v33-service.js`
- Modify `src/domain/finance-v33-analytics.js`
- Extend `tests/v34-p5-costing-evidence.test.mjs`

Add read-only `readCostingReservations()`. Enrich month transactions using only period-relevant reservations/refunds. Expose coverage counts and gross profit/margin only when complete.

### Task 3 — Finance UI evidence coverage
**Files:**
- Modify `src/ui/finance-v33-workspace.js`
- Modify `src/ui/ref01.css` only if needed without increasing `!important` budget.
- Extend `tests/v34-p5-costing-evidence.test.mjs`

Render `Coverage HPP v3.4`: snapshot verified, reconstructed verified, partial evidence, not safe to reconstruct. Add Laba Kotor/Gross Margin only when complete. Explain no-fabrication policy.

### Task 4 — Verification and candidate packaging
Run related costing/finance/refund/inventory tests, full `npm test`, `verify:sc04`, `verify:ref01`, then clean LOCAL QA build. Build a continuity-ready P5 v3.4 Batch-1 Android QA ZIP. Do not lock P5 yet.
