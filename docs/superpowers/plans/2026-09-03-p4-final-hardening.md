# P4 Final Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Close the two Android QA UI defects without changing P4 finance semantics, persistence, P1-P3 authority, or production data.

**Architecture:** Keep REF01 bottom navigation as the sole visible active-state authority by reconciling both `ref01-active` and legacy `active`. Keep reconciliation actions present in LOCAL QA but mark them explicitly locked/read-only in markup and CSS.

**Tech Stack:** Browser ES modules, Node `node:test`, CSS, existing REF01 verifier chain.

**Spec:** User-approved final hardening in chat after RC5-D Android QA.

## Global Constraints
- Production deployment remains forbidden.
- LOCAL QA remains read-only.
- Exact SC04 mutation allowlist remains three dedicated writers.
- `.remove()` remains forbidden.
- `!important` budget must remain <=252.
- P3 rollback anchor remains unchanged.

### Task 1: Canonical single-active bottom navigation
- [ ] Write failing regression where Operasional has stale legacy `active`, then reconcile route `reports`.
- [ ] Verify RED.
- [ ] Make `enhanceBottomNav()` reconcile legacy `active` to the same canonical route.
- [ ] Verify targeted tests GREEN.

### Task 2: Explicit LOCAL QA locked mutation presentation
- [ ] Write failing regression requiring locked labels and `data-v33-readonly-action` on link repair and historical acknowledgement.
- [ ] Verify RED.
- [ ] Render explicit locked labels only in read-only mode and add restrained disabled CSS without `!important`.
- [ ] Verify targeted tests GREEN and CSS budget unchanged.

### Task 3: Final verification and Android QA package
- [ ] Run related regression.
- [ ] Run full `npm test`.
- [ ] Run SC04 and REF01 full chains.
- [ ] Run LOCAL QA HTTP/header/badge smoke and verify INV3/Finance modules are served.
- [ ] Package clean candidate with manifests, rollback anchor, and final hardening handoff.
