# R10 Legacy Completion — Checkpoint Batch Implementation Plan

**Date:** 2026-09-19  
**Project:** Segeran Jiwa POS Legacy  
**Worktree:** `~/WORKSTATION/worktrees/legacy-cup-reconciliation`  
**Branch:** `work/r10-inventory-read-hardening`  
**Target:** `main`  
**Open PR:** `#5`  
**Expected plan-install baseline HEAD:** `59873be580dc`  
**Status at plan creation:** Task 1–6 complete; Checkpoint Batch Execution Design approved; production untouched.

## 1. Authority Order

When older planning language conflicts with newer verified architecture, use this order:

1. `docs/superpowers/specs/2026-09-19-r10-legacy-checkpoint-batch-execution-design.md`
2. Task 6 REF01 remediation design/plan that froze `src/ref01-entry.js`
3. `docs/superpowers/plans/2026-09-16-product-stock-components-implementation-plan.md`, only where not superseded
4. Runtime facts proven from the current repository immediately before each checkpoint

The Task 6 remediation is binding for later work:

- `src/ref01-entry.js` is frozen and must remain byte-identical.
- Runtime integration goes through `src/app/ref01-bootstrap.js`, not through `src/ref01-entry.js`.
- `src/app/rc01-runtime-loading-hardening.js` is frozen.
- Legacy cup runtime/UI remains until the dedicated cutover/cleanup tasks.

## 2. Frozen Safety Anchors

Required hashes:

```text
src/ref01-entry.js
22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b

src/app/rc01-runtime-loading-hardening.js
a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44
```

Current R10 authority:

```text
Inventory V2 Item/Master
  -> Item Stok master

global/inventoryV2/balances/ingredients/<stockItemId>
  -> canonical physical balance

global/inventoryV2/productStockComponents/<productId>/<stockItemId>
  -> Owner/manajemen configuration

global/inventoryV2/stockApplications/<applicationId>
  -> exactly-once application/restore evidence

global/inventoryV2/movements/<movementId>
  -> canonical movement/audit evidence
```

No new `global/stockBalances`, `global/stockMovements`, `global/stockApplications`, or parallel Item Stok authority may be introduced.

## 3. Batch Execution Contract

One checkpoint is one user-facing run. Internally, each task remains TDD + atomic Git:

```text
PRECHECK
  -> TASK N RED
  -> CONFIRM INTENDED RED
  -> MINIMAL IMPLEMENTATION
  -> FOCUSED GREEN
  -> TASK-SCOPE VERIFY
  -> ATOMIC COMMIT
  -> RE-VERIFY CLEAN/FROZEN
  -> NEXT TASK RED
  -> ...
  -> CHECKPOINT CROSS VERIFY
  -> PUSH
  -> CHECKPOINT RESULT
```

A later task must not start unless the preceding task has:

- intended RED evidence;
- focused GREEN;
- an atomic commit;
- clean worktree;
- exact allowed-path compliance;
- frozen hashes intact;
- expected ancestry;
- no unexplained local/remote divergence.

Git is the recovery authority. Cache markers are advisory only.

Checkpoint state/evidence lives under:

```text
$HOME/.cache/segeran-jiwa/r10-checkpoints/<checkpoint>/
```

Do not use `/tmp` for resume authority.

Every batch script must use:

```bash
set -Eeuo pipefail
export GIT_PAGER=cat
export PAGER=cat
export GIT_TERMINAL_PROMPT=0
```

No force-push, `git reset --hard`, force worktree removal, destructive database cleanup, or silent deletion of unknown files.

## 4. Common PRECHECK for Checkpoints A–C

Before any edit:

1. Verify exact worktree and branch.
2. Verify expected HEAD from the preceding committed plan/checkpoint.
3. `git fetch` and prove local == `origin/work/r10-inventory-read-hardening`.
4. Require clean tree.
5. Verify both frozen SHA-256 hashes.
6. Verify `src/app/ref01-bootstrap.js` remains the mutable runtime integration owner.
7. Verify `baseline/legacy-v1.0.40.html` still owns legacy `processTransaction` and refund/void anchors before relying on it.
8. Read exact current call sites and imports.
9. Freeze the task allowed-path set before mutation.
10. Create checkpoint evidence directory.
11. Reject any production-capable command in Checkpoints A–C.

If any item fails: **BLOCKED**, no continue-anyway mode.

---

# Checkpoint A — Runtime Cutover

Contains Task 7 + Task 8.

## A0. Checkpoint A Preflight

Fresh read-only proof must establish:

- Task 6 Product Stock Components UI and targeted repository are present.
- `src/ref01-entry.js` is frozen.
- `src/app/ref01-bootstrap.js` owns REF01 runtime installation.
- current final sale function is still the expected `processTransaction` chain.
- refund/void owner still resolves to the verified legacy correction path.
- no permanent transaction listener/polling exists for this new feature.

Run the existing focused/frozen baseline before RED. Any regression blocks A.

## A1. Task 7 — Legacy Sale Cutover Without Permanent Listener

### Intended files

Create:

```text
src/compat/legacy-stock-components-runtime.js
tests/r10-stock-component-runtime.test.mjs
```

Modify:

```text
src/app/ref01-bootstrap.js
```

Conditionally allow only if fresh read-only source proof requires it:

```text
src/domain/transaction-service.js
```

Never modify:

```text
src/ref01-entry.js
src/app/rc01-runtime-loading-hardening.js
```

### RED coverage

Require tests for:

1. no mapping -> base sale only;
2. mapping -> base sale completes, then one Product Stock Component application;
3. total Rp0 / 100% discount -> physical component still applies;
4. Owner and Cashier consume identically;
5. reinstall/refresh does not reapply;
6. two concurrent identical-value sales attach to their own transaction IDs;
7. ambiguous matching fails `STOCK_TX_MATCH_AMBIGUOUS`;
8. genuine Recipe-only product remains Recipe-only;
9. Recipe + distinct Product Stock Component may coexist;
10. Recipe/component physical-item overlap fails `STOCK_COMPONENT_RECIPE_OVERLAP`;
11. wrapper install order remains stable;
12. no polling or permanent transaction listener is introduced.

RED command:

```bash
node --test --test-concurrency=1 tests/r10-stock-component-runtime.test.mjs
```

The RED must fail for the intended missing/incorrect runtime behavior, not syntax or fixture damage.

### Minimal implementation behavior

The runtime adapter must:

```text
A. snapshot cart and pre-sale transaction keys;
B. read only Product Stock Component mappings for product IDs in the cart;
C. call the current final processTransaction exactly once;
D. identify the new COMPLETED transaction using:
   - new-key exclusion,
   - normalized cart fingerprint,
   - bounded timestamp,
   - COMPLETED status;
E. read only mapped Stock Item masters;
F. reject Recipe/component physical-item overlap;
G. call applyCompletedSale with proven shiftKey/txId;
H. retain recoverable evidence for transient/ambiguous failures;
I. never alter price/payment semantics.
```

Install through `src/app/ref01-bootstrap.js` as the final outer sale wrapper. Do not edit frozen `src/ref01-entry.js`.

### GREEN / task gate

```bash
node --test --test-concurrency=1 tests/r10-stock-component-runtime.test.mjs
npm run build:ref01

node --test --test-concurrency=1 \
  tests/legacy-cup-01b-product-cup-ui.test.mjs \
  tests/r10-cup-reconciliation-release-gate.test.mjs

node --test --test-concurrency=1 tests/rc01-build-integrity.test.mjs
```

Then verify frozen hashes, allowed paths, clean generated debris, and commit Task 7 atomically.

Suggested commit subject:

```text
feat: cut legacy sales over to stock components
```

## A2. Task 8 — Refund/Void Runtime Integration

### Pre-mutation discovery

Before RED, freeze the exact existing refund/void test list using repository search. Do not add unknown paths after editing begins.

Expected owner remains:

```text
baseline/legacy-v1.0.40.html
```

Allowed set may contain only:

```text
baseline/legacy-v1.0.40.html
src/compat/legacy-stock-components-runtime.js
tests/r10-stock-component-runtime.test.mjs
<exact pre-existing refund/void test files frozen during precheck>
```

### RED coverage

Assert:

- existing financial/cash/refund/void semantics remain authoritative;
- stock restore occurs exactly once after financial correction is committed;
- retry does not double-restore;
- current mapping changes do not affect restore;
- restore uses immutable historical application snapshot;
- historical transaction with no stock-component application invents no restore;
- stock restore failure does not reverse valid financial correction;
- stock restore failure surfaces recoverable **Perlu perhatian** state.

### Implementation

After the existing financial correction commit is proven complete:

```text
derive deterministic original application ID from shift/txId
-> call restoreRefund or restoreVoid
-> preserve recoverable application evidence on stock failure
-> never undo committed financial correction merely because stock restore needs recovery
```

### GREEN / task gate

```bash
node --test --test-concurrency=1 \
  tests/r10-stock-component-runtime.test.mjs \
  <EXACT_REFUND_VOID_TESTS>
```

Then run relevant build/frozen/SC02/SC04 checks, verify scope, and commit Task 8 atomically.

Suggested commit subject:

```text
feat: restore stock components on legacy corrections
```

## A3. Checkpoint A Cross Verification

After both task commits:

```bash
node --test --test-concurrency=1 tests/r10-stock-component-runtime.test.mjs

node --test --test-concurrency=1 \
  tests/emg-d1-p1-contract.test.mjs \
  tests/p0-bw01-manual-bridge-off.test.mjs

node scripts/verify-sc02.mjs
node scripts/verify-sc04.mjs
npm run build:ref01

node --test --test-concurrency=1 \
  tests/legacy-cup-01b-product-cup-ui.test.mjs \
  tests/r10-cup-reconciliation-release-gate.test.mjs \
  tests/rc01-build-integrity.test.mjs

node --test --test-concurrency=1 tests/*.test.mjs
```

Require zero failures, both frozen hashes unchanged, exact source-scope audit, clean tree, push success, remote sync.

Production remains untouched.

---

# Checkpoint B — Authority Cutover

Contains Task 9 + Task 10.

## B0. Checkpoint B Preflight

Expected HEAD must be the verified Checkpoint A result.

Re-run branch/remote/clean/frozen checks. Verify current Product Stock Component runtime is present and Checkpoint A tests are green before Task 9 RED.

## B1. Task 9 — Firebase Rules Candidate + Emulator Gate

### Intended files

Create only:

```text
firebase/r10/stock-components-rules.mjs
firebase/r10/build-stock-components-rules.mjs
firebase/r10/stock-components-emulator.mjs
tests/r10-stock-components-rules-contract.test.mjs
```

### Fresh read-only live rules source

Capture to the checkpoint cache, not as production mutation:

```bash
npx --yes firebase-tools@latest database:get /.settings/rules \
  --project segeranjiwa-id \
  > "$HOME/.cache/segeran-jiwa/r10-checkpoints/B/database.rules.live.json"
```

This is input evidence only. No rules publish occurs in Checkpoint B.

### RED/emulator contract

Require:

1. Owner mapping create/update PASS;
2. Cashier mapping edit DENY;
3. legitimate sale claim/apply PASS;
4. duplicate application yields one decrement;
5. shortage cannot go negative;
6. legitimate refund/void restore PASS once;
7. arbitrary Cashier warehouse increment DENY;
8. arbitrary ingredient edit DENY;
9. unauthenticated write DENY;
10. malformed write DENY;
11. unrelated existing access preserved;
12. existing authorized purchase/transfer/opname flows remain permitted.

Run RED first:

```bash
node --test --test-concurrency=1 tests/r10-stock-components-rules-contract.test.mjs
```

Then implement the candidate builder/transformer and emulator scenarios.

GREEN:

```bash
node --test --test-concurrency=1 tests/r10-stock-components-rules-contract.test.mjs
node firebase/r10/stock-components-emulator.mjs
```

Commit Task 9 atomically. Do not publish rules.

Suggested subject:

```text
test: define Inventory V2 stock component authorization
```

## B2. Task 10 — Reconciliation Authority Cutover

### Allowed-path discovery

Before RED, read `docs/project-control/R10_STOCK_COMP_RUNTIME_MAP.md` and fresh repository call sites, then freeze:

```text
src/domain/packaging-cup-v34.js
<exact reconciliation consumer files>
<exact existing reconciliation tests>
```

No unrelated cup/UI writer cleanup is allowed in Task 10.

### RED coverage

For post-cutover physical stock:

```text
opening
+ transfer in
- completed SALE_COMPONENT movement
+ completed REFUND_COMPONENT/VOID_COMPONENT movement
= theoretical closing
```

Variance remains:

```text
physical closing - theoretical closing
```

Also prove:

- pre-cutover historical `cp` remains readable;
- historical reads create no new stock write;
- genuine Recipe Inventory V2 remains valid;
- Product Stock Components is the post-cutover physical authority;
- authority overlap fails closed rather than double-counting.

### Implementation

Switch only post-cutover reconciliation authority.

Keep cup catalog/name helpers required for historical UI. Stop using `decorateRecipeWithCupV34()` for new simple cup consumption. Do not delete historical cup evidence.

Run focused reconciliation GREEN, then serial full regression, frozen/SC02/SC04/build gates, exact scope audit, and atomic commit.

Suggested subject:

```text
refactor: cut reconciliation over to stock components
```

## B3. Checkpoint B Cross Verification

Require:

- Task 9 rules contract PASS;
- emulator PASS;
- Task 10 focused reconciliation PASS;
- frozen-authority tests PASS;
- SC02/SC04 PASS;
- `npm run build:ref01` PASS;
- build-sensitive tests PASS sequentially;
- full serial `tests/*.test.mjs` zero failures;
- both frozen hashes unchanged;
- clean tree;
- push success and remote sync;
- no rules publish;
- no live database write;
- no migration apply;
- no production deploy.

---

# Checkpoint C — Legacy Finalization

Contains Task 11 + Task 12.

## C0. Checkpoint C Preflight

Expected HEAD must be the verified Checkpoint B result.

Re-run all common prechecks and confirm PR #5 is still open against `main`.

## C1. Task 11 — Legacy Cup Runtime Cleanup

### Planned files

Create:

```text
docs/project-control/R10_STOCK_COMP_CLEANUP_AUDIT.md
tests/r10-stock-components-cleanup-contract.test.mjs
```

Potential modify/delete candidates only after caller classification:

```text
src/ui/cup-product-costing-v34.js
src/compat/legacy-cup-01b-product-cup-ui.js
cup-only functions in src/domain/packaging-cup-v34.js
other cup-only helpers proven to have no active caller
```

### Mandatory caller audit first

Inventory matches for:

```text
__CUP_ONLY__
decorateRecipeWithCupV34
__SJ_V34_CUP_SALE_READY
__SJ_V34_CUP_SALE_USAGE
legacy-cup-01b-product-cup-ui
cup-only reservation/writer call sites
```

Every match must be classified:

```text
ACTIVE_NEW_RUNTIME
GENUINE_RECIPE
HISTORICAL_READER
DEAD_CUP_WRITER
TEST_ONLY
```

Only `DEAD_CUP_WRITER` code may be removed. No production history is deleted.

### RED cleanup contract

Assert:

- new runtime no longer creates synthetic `__CUP_ONLY__`;
- a new sale never enters Recipe solely because `product.cp` exists;
- migrated/cut-over Product Master no longer depends on legacy cup picker for new behavior;
- historical readers remain;
- genuine Recipe APIs remain;
- no permanent dual-write remains.

Run RED, remove only audited-dead writer code, run GREEN and full regression, then commit cleanup separately.

Suggested subject:

```text
refactor: remove superseded cup stock runtime
```

## C2. Task 12 — Final Release Gate

Task 12 makes no production mutation.

Required evidence:

1. expected branch/head chain;
2. clean tree;
3. local/remote sync;
4. frozen REF01 hash unchanged;
5. frozen R6B hash unchanged;
6. Product Stock Components focused suites PASS;
7. frozen-authority suites PASS;
8. SC02/SC04 PASS;
9. `npm run build:ref01` PASS;
10. built Product Stock Components module present;
11. legacy historical UI/read contract preserved where still required;
12. build-sensitive tests PASS sequentially;
13. full serial `tests/*.test.mjs` zero failures;
14. generated-file cleanup;
15. final source-scope audit;
16. PR #5 still targets `main`, is open, and is mergeable;
17. PR title/body updated to complete R10 Product Stock Components + Legacy cutover;
18. production safety statement attached to PR evidence.

Checkpoint C stops after PR readiness verification.

`main` remains untouched.

## C3. Final Checkpoint C Result

Green output must end with:

```text
===== R10 CHECKPOINT C RESULT =====
CHECKPOINT          : PASS
TASKS               : PASS
FOCUSED TESTS       : PASS
CROSS VERIFICATION  : PASS
FROZEN AUTHORITY    : PASS
SC02 / SC04         : PASS
STATUS              : CLEAN
REMOTE              : SYNCED
PRODUCTION          : UNTOUCHED
NEXT                : Checkpoint D requires explicit approval
```

---

# Checkpoint D — Production Release

Checkpoint D is deliberately **not executable from the A–C development runners**.

It begins only after a new explicit human approval.

Approved order is:

1. verify current `main`, PR head, production baseline, and backups;
2. verify fresh live rules state;
3. publish only the approved compatible rules;
4. migration dry-run;
5. mapping-only migration;
6. verify mappings and unchanged balances;
7. merge/release approved app;
8. one controlled sale;
9. prove exactly-once retry/idempotency;
10. controlled refund/void restore;
11. observe production;
12. separately approved cleanup only after observation is clear.

Any failure stops the sequence.

## 5. Explicit Production Isolation for Checkpoints A–C

The following must not be executed by A, B, or C:

```text
Firebase rules publish
live database migration/apply
production database write
production deploy
merge PR #5 into main
destructive historical cleanup
```

Read-only production inspection is permitted only when the command is demonstrably read-only, such as the Task 9 rules export.

## 6. Failure / Resume Contract

On failure after editing but before commit:

1. capture status, diff, test logs, hashes, and exact failure;
2. compare every dirty path with the frozen task allowlist;
3. if every dirty path belongs to that task, restore only those task paths to the last safe commit;
4. if any unexpected dirty path exists, preserve it and stop;
5. do not guess a resume point from cache;
6. rerun from Git-proven safe state.

On rerun:

- inspect branch/HEAD/ancestry/remote/tree first;
- re-verify any already-committed task boundary;
- resume from the first incomplete task stage.

## 7. Acceptance Criteria

R10 development completion is clear only when:

- Tasks 7–12 exist as traceable atomic commits;
- A/B/C each have one checkpoint PASS/BLOCKED result;
- TDD was retained for behavior changes;
- `src/ref01-entry.js` remained frozen;
- frozen R6B remained byte-identical;
- no new polling/permanent transaction listener was added;
- Recipe/component overlap fails closed;
- restore uses historical application evidence;
- post-cutover reconciliation uses Product Stock Components/Inventory V2 evidence;
- rules candidate and emulator pass without publishing;
- only audited-dead legacy writers are removed;
- full serial regression passes;
- PR #5 remains open through Checkpoint C and is ready for review;
- production was untouched by Checkpoints A–C;
- Checkpoint D remains a separate explicit approval gate.
