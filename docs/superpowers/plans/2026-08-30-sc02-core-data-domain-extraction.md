# SC-02 Core/Data/Domain Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract stable Core/Data/Domain boundaries from v1.0.40 without changing live business behavior or creating duplicate Firebase/QRIS write paths.

**Architecture:** Use a strangler boundary. Pure calculations that are already explicitly defined in the monolith (pricing and costing) are extracted byte-semantically into ES modules. High-risk mutating flows remain owned by their legacy runtime authority and are accessed only through typed/injected adapters until SC-03 removes legacy callers. The compatibility `dist/index.html` remains byte-identical to v1.0.40 in SC-02.

**Tech Stack:** JavaScript ES modules, Node.js 20 built-in test runner, Firebase RTDB legacy runtime (not initialized by SC-02 modules), zero external dependencies.

**Spec:** `blueprint_authority/docs/05_STRUCTURAL_CONSOLIDATION_MIGRATION_PLAN.md`, `docs/SC01_HANDOFF_TO_SC02.md`, and `blueprint_authority/docs/07_EXACT_PROMPTS_COPY_PASTE.md` PROMPT 2.

## Global Constraints

- v1.0.40 SHA256 stays `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- POS root stays `toko_segeranjiwa_v58`.
- QRIS root stays `segeranjiwa_qris_beta_v1`.
- Existing `processTransaction()` remains mutation authority until a later parity cutover.
- Existing `SJQrisSignalBeta` remains QRIS authority; SC-02 only wraps it.
- No Firebase Rules/schema change.
- No visual refinement.
- No duplicate direct `.set()`, `.update()`, `.transaction()`, or `.remove()` write implementation in extracted Data/Domain modules.
- Unknown HPP remains unavailable (`null`), never synthetic `0`.
- SC-02 does not activate modular runtime inside `dist/index.html`; compatibility dist remains byte-identical.

---

### Task 1: Data constants and legacy runtime bridge

**Files:**
- Modify: `src/data/firebase-client.js`
- Modify: `src/core/legacy-bridge.js`
- Test: `tests/sc02-boundaries.test.mjs`

**Interfaces:**
- Produces `POS_ROOT`, `QRIS_ROOT`, `posPath(...segments)`, `qrisPath(...segments)`.
- Produces `createLegacyBridge(runtime)` with `get`, `require`, `call`, `engine`, `snapshot`.

- [ ] Write tests asserting fixed roots/path normalization and a bridge that invokes the active global authority exactly once.
- [ ] Run focused tests and verify RED because SC-01 placeholders expose none of these APIs.
- [ ] Implement constants/path builders and bridge with no Firebase side effects.
- [ ] Run focused tests and verify GREEN.

### Task 2: QRIS adapter with zero duplicate engine

**Files:**
- Modify: `src/data/qris-adapter.js`
- Test: `tests/sc02-qris-adapter.test.mjs`

**Interfaces:**
- Consumes injected `SJQrisSignalBeta` engine or legacy bridge.
- Produces `createQrisAdapter({engine, bridge})` methods: `status`, `ensureWaitingPending`, `cancelWaiting`, `resolveAmbiguous`, `renderCommercialState`.

- [ ] Write fake-engine tests proving each adapter call delegates once and returns the engine result unchanged.
- [ ] Verify RED.
- [ ] Implement only delegation; do not access RTDB directly.
- [ ] Verify GREEN and statically assert no direct Firebase write tokens in adapter.

### Task 3: Pricing extraction parity

**Files:**
- Modify: `src/domain/pricing-service.js`
- Test: `tests/sc02-pricing.test.mjs`

**Interfaces:**
- Produces pure `normalizeSettings`, `discountAmount`, `quote`, `authorize`, `fingerprint`, `fromSnapshot`, `fromTx`, `hasBreakdown`, `refundAllocation`.

- [ ] Add fixed vectors reproducing v1.0.40 `SJPrice` rounding/order: subtotal → item discount → transaction discount → service → tax.
- [ ] Verify RED.
- [ ] Extract pure logic with the same formulas and rounding.
- [ ] Verify GREEN.

### Task 4: Costing and purchase/WAC extraction parity

**Files:**
- Modify: `src/domain/costing-service.js`
- Modify: `src/domain/purchase-wac-service.js`
- Test: `tests/sc02-costing.test.mjs`

**Interfaces:**
- Produces exact `SJCostingCore` pure functions: `num`, `money`, `landedCost`, `movingWac`, `stockLineCost`, `recipeLineCost`, `profit`, `aggregateTransactions`.
- Adds safety `safeProfit(netRevenue, hpp)` that returns null HPP/profit/margin when cost is unavailable.
- `createPurchaseWacService({bridge})` delegates live purchase recovery/commit authority to existing engine methods only.

- [ ] Add WAC/landed-cost/unknown-HPP tests.
- [ ] Verify RED.
- [ ] Extract exact pure formulas and add null-safe reporting helper.
- [ ] Verify GREEN.

### Task 5: Transaction, inventory, debt, shift and refund/VOID service boundaries

**Files:**
- Modify: `src/domain/transaction-service.js`
- Modify: `src/domain/inventory-service.js`
- Modify: `src/domain/debt-service.js`
- Modify: `src/domain/shift-service.js`
- Modify: `src/domain/refund-void-service.js`
- Test: `tests/sc02-domain-delegates.test.mjs`

**Interfaces:**
- `createTransactionService({bridge})` delegates commit to active `processTransaction` exactly once.
- `createInventoryService({bridge})` delegates recipe reservations/recovery to `SJInventoryV2`.
- `remainingDebt(row)` and `outstandingFor(rows,name)` are pure legacy-equivalent debt helpers; mutations delegate to legacy globals.
- `createShiftService({bridge})` delegates start/handover/close and guards to `SJShift`.
- `createRefundVoidService({bridge})` delegates final active refund/VOID authority to `SJOperationalHardening`/`SJX`/`voidTx` without new RTDB writes.

- [ ] Write delegate-call-count tests and debt semantics tests.
- [ ] Verify RED.
- [ ] Implement injected delegating boundaries only.
- [ ] Verify GREEN.

### Task 6: Read-only repository and report boundary

**Files:**
- Modify: `src/data/repositories/transaction-repository.js`
- Modify: `src/data/repositories/inventory-repository.js`
- Modify: `src/data/repositories/purchase-repository.js`
- Modify: `src/data/repositories/debt-repository.js`
- Modify: `src/data/repositories/shift-repository.js`
- Modify: `src/data/repositories/report-repository.js`
- Modify: `src/domain/report-service.js`
- Test: `tests/sc02-repositories-report.test.mjs`

**Interfaces:**
- Repository reads use injected RTDB-style `db.ref(path).once('value')` only.
- No repository mutation method performs a direct Firebase write in SC-02.
- `createReportService({legacyCore})` can call existing read-only report Core for model/detail calculations while preserving null/missing HPP semantics.

- [ ] Write fake-DB read tests and static no-write test.
- [ ] Verify RED.
- [ ] Implement read-only repositories and report adapter.
- [ ] Verify GREEN.

### Task 7: Ownership/write-map and full regression gate

**Files:**
- Create: `docs/SC02_WRITE_OWNERSHIP_MAP.md`
- Create: `docs/SC02_EXTRACTION_STATUS.md`
- Create: `docs/SC02_NO_REGRESSION_CONTRACT.md`
- Create: `docs/SC02_HANDOFF_TO_SC03.md`
- Create: `scripts/verify-sc02.mjs`
- Modify: `package.json`
- Test: `tests/sc02-integrity.test.mjs`

**Interfaces:**
- `npm run verify:sc02` proves fixed roots, compatibility hash, 40 legacy script parse, no direct write tokens in extracted Data/Domain files, QRIS adapter delegation, pricing/costing tests and legacy token presence.

- [ ] Add integrity tests first and verify RED until SC-02 artifacts exist.
- [ ] Generate ownership map assigning each high-risk family to a single legacy authority during migration.
- [ ] Add verifier and package script.
- [ ] Run `npm run verify:sc02` and full `npm test` fresh.
- [ ] Build deliverable ZIP, extract it into a new directory, and rerun `npm run verify:sc02` from the packaged copy.

## Self-review

- Spec coverage: all PROMPT 2 targets are mapped to Tasks 1–7.
- No visual renderer/module migration is included.
- No live mutation cutover is included, preventing duplicate write paths.
- Persistent session is intentionally excluded for SC-04.
- GitHub is requested only if SC-02 parity gate is strong enough after packaged verification.
