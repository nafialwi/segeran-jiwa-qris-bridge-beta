# R10 Legacy Completion — Checkpoint Batch Execution Design

Date: 2026-09-19
Branch: `work/r10-inventory-read-hardening`
Target base: `main`
Open PR: `#5`
Design start state: Task 1–6 complete; Task 6 verified with full serial regression 729/729.

## 1. Purpose

Complete the remaining Segeran Jiwa Legacy/R10 work faster by changing the execution unit from one interactive task at a time into one resumable batch per checkpoint.

The technical scope of Tasks 7–12 does not change. Only orchestration, verification, recovery, and human-interaction boundaries change.

Success means:
- no manual chat round-trip between individual Tasks 7–12;
- every checkpoint remains fail-closed and auditable;
- each task keeps its own TDD and atomic Git boundary;
- frozen authorities stay protected;
- production is untouched by development checkpoints;
- PR #5 stays open until the whole R10 legacy cutover is clear;
- a stopped Termux session can resume from the last independently verified safe Git state.

## 2. Non-goals

This design does not change the Product Stock Components domain model or approved stock authority. It does not merge PR #5 now, publish Firebase rules, run a live migration, deploy production, modify production Firebase data, introduce permanent dual-write, weaken TDD/frozen-authority/SC02/SC04/full-regression gates, or replace task-level commits with one giant commit.

## 3. Current Safety Anchors

At design start:
- feature branch: `work/r10-inventory-read-hardening`;
- Task 6 verified head before this documentation commit: `bde824f5cb2d`;
- PR #5 targets `main`;
- frozen `src/ref01-entry.js` SHA-256: `22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b`;
- frozen R6B `src/app/rc01-runtime-loading-hardening.js` SHA-256: `a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44`;
- Task 6 evidence: focused 8/8, frozen authority 11/11, build-sensitive 15/15, full regression 729/729, SC02/SC04 PASS, clean tree, remote synced.

Later checkpoint scripts must derive their expected head from the committed checkpoint plan and immediately preceding verified checkpoint result. They must never silently accept an unknown head.

## 4. New Roadmap

### Checkpoint A — Runtime Cutover

Contains Task 7 and Task 8.

Task 7 connects successful legacy sales to Product Stock Components exactly once without permanent listeners/polling and without changing price/payment semantics.

Task 8 restores stock on refund/void from the historical applied snapshot with idempotent recovery behavior.

The checkpoint ends with cross-runtime verification, frozen-authority checks, SC02/SC04, clean-tree verification, push, and a single checkpoint result.

### Checkpoint B — Authority Cutover

Contains Task 9 and Task 10.

Task 9 starts from a fresh read-only live rules export, builds a rules candidate, and proves it in emulator tests. It does not publish rules.

Task 10 cuts reconciliation authority in code to Product Stock Components while preserving genuine Recipe Inventory V2 and historical readable cup data.

The checkpoint ends with authority-wide verification and no production write.

### Checkpoint C — Legacy Finalization

Contains Task 11 and Task 12.

Task 11 removes only legacy writers proven dead by caller/reference audit.

Task 12 runs the final build, focused and build-sensitive suites, frozen-authority checks, SC02/SC04, full serial regression, generated-file cleanup, source-scope audit, remote-sync verification, and PR readiness verification.

PR #5 becomes the final R10 legacy-cutover PR and stays open until this checkpoint is green.

### Checkpoint D — Production Release

This is not an unattended development batch. It starts only after explicit human approval.

Order:
1. verify current `main`, PR head, production baseline, and backups;
2. verify fresh live rules state;
3. publish approved compatible rules;
4. run migration dry-run;
5. run mapping-only migration;
6. verify mappings and unchanged balances;
7. merge/release the approved app;
8. run one controlled sale;
9. verify exactly-once retry/idempotency;
10. run controlled refund/void restore;
11. observe production;
12. perform any separately approved cleanup only after observation is clear.

Any failed production stage stops the sequence.

## 5. Internal Checkpoint State Machine

One checkpoint is one user-facing run, but not one giant code change.

`PRECHECK -> RED -> IMPLEMENT -> GREEN -> ATOMIC COMMIT -> NEXT TASK RED -> IMPLEMENT -> GREEN -> ATOMIC COMMIT -> CROSS VERIFY -> PUSH -> CHECKPOINT RESULT`

A later task cannot start unless the previous task has intended RED evidence, focused GREEN verification, an atomic commit, a clean tree, frozen hashes intact, and no unexpected changed paths.

## 6. Fail-Closed Rules

A checkpoint stops immediately on:
- wrong branch;
- unknown/unexpected HEAD;
- unexplained local/remote divergence;
- pre-existing dirty source;
- missing or changed implementation anchor;
- intended RED not failing for the expected reason;
- focused GREEN failure;
- relevant regression;
- SC02/SC04 failure;
- frozen hash change;
- unexpected dirty path;
- build failure;
- any full-regression failure;
- rules/emulator behavior outside the approved contract;
- rejected Git push;
- any production-capable command encountered in Checkpoints A–C.

There is no continue-anyway mode.

## 7. Error-Minimization Design

### 7.1 Read before edit
Every checkpoint performs a read-only preflight of exact source anchors, imports, call sites, tests, Git state, and frozen hashes before editing.

### 7.2 Exact task ownership
Each task declares an allowed path set before mutation. Unexpected changed paths stop the checkpoint.

### 7.3 TDD remains mandatory
Behavior changes follow RED -> minimum implementation -> GREEN -> relevant authority/regression gates -> atomic commit.

### 7.4 Git is the recovery authority
Resume markers are advisory only. Branch, ancestry, commit scope, clean tree, remote state, and fresh verification decide whether a stage is complete.

### 7.5 Safe resume after Termux interruption
Logs/state summaries live under `$HOME/.cache/segeran-jiwa/r10-checkpoints/<checkpoint>/`. Rerun checks Git first, re-verifies an already committed boundary, and resumes from the next incomplete stage. `/tmp` is not used.

### 7.6 Deterministic shell behavior
Batch scripts use `set -Eeuo pipefail`, `GIT_PAGER=cat`, `PAGER=cat`, and `GIT_TERMINAL_PROMPT=0`. Long commands use bounded timeouts where available.

### 7.7 Generated-file hygiene
Known generated paths use an explicit allowlist. SC02/SC04 tracked evidence may refresh during verification and is restored afterward when not intentionally updated. Unexpected files are never silently deleted.

### 7.8 Failure recovery for uncommitted edits
On failure after editing but before commit:
1. capture diff/status/logs into an evidence bundle;
2. compare dirty paths with the task allowlist;
3. if every dirty path belongs to that task, restore only those paths to the last safe commit;
4. if any unexpected path is dirty, preserve it and stop for diagnosis.

### 7.9 No force operations
Automation does not force-push, `git reset --hard`, force-remove worktrees, delete branches, overwrite production rules, or perform destructive database cleanup.

### 7.10 Push strategy
Each successfully completed internal task may be pushed to the same feature branch after its atomic commit and verification. This gives remote recovery without merging `main`.

## 8. Checkpoint A Contract

### Task 7 — Sale Cutover

Approved behavior:
1. snapshot cart and pre-sale transaction keys/mappings;
2. call current final `processTransaction` exactly once;
3. identify the new `COMPLETED` transaction using new-key exclusion, normalized cart fingerprint, and bounded timestamp;
4. apply Product Stock Components;
5. retain recoverable state for transient/ambiguous failure;
6. never change price/payment semantics;
7. never introduce permanent listener or polling.

Required coverage includes mapped/no-mapping products, relevant Rp0 edges, roles, reinstall/idempotent wrapper behavior, concurrent identical sales, ambiguous-match fail-closed behavior, genuine Recipe Inventory V2 coexistence, overlap failure, and wrapper-order preservation.

### Task 8 — Refund/Void Restore

Financial correction remains authoritative and is committed first. Stock restore uses the historical completed stock-application snapshot. Retry is idempotent. Historical transactions with no stock application do not invent a restore. Stock-recovery failure must not undo a valid financial correction and must surface as recoverable attention.

## 9. Checkpoint B Contract

### Task 9 — Rules Candidate

Start from a fresh exact read-only live rules export.

Required emulator coverage:
- Owner mapping edit allowed;
- cashier mapping edit denied;
- legitimate apply allowed;
- legitimate restore allowed;
- arbitrary write denied;
- malformed write denied;
- negative-stock write denied;
- unrelated existing access preserved.

No rules publish occurs here.

### Task 10 — Reconciliation Authority

Use Product Stock Components as physical-stock authority after code cutover. Preserve genuine Recipe Inventory V2, avoid a parallel cup authority, preserve historical cup mappings/reservations/movements/audit for reads, and fail on authority overlap rather than double-count.

## 10. Checkpoint C Contract

### Task 11 — Legacy Cleanup

Perform caller/reference audit first. Remove only writers proven dead after cutover. Do not delete historical data merely because a writer is retired. Cleanup is its own atomic commit.

### Task 12 — Final Release Gate

Required evidence:
- expected branch/head chain;
- clean tree;
- local/remote sync;
- frozen REF01 entry hash unchanged;
- frozen R6B hash unchanged;
- focused Product Stock Components suites;
- frozen-authority suites;
- SC02/SC04;
- `npm run build:ref01`;
- built Product Stock Components module present;
- legacy cup UI contract preserved where still required;
- build-sensitive tests;
- full serial `tests/*.test.mjs` with zero failures;
- generated-file cleanup;
- final source-scope audit;
- PR #5 still targets `main`, is open, and is mergeable before production approval.

## 11. PR #5 Strategy

PR #5 remains open through Checkpoints A–C. Do not merge Task 6 alone.

After Checkpoint C:
- update title/body to the complete R10 Product Stock Components and Legacy cutover;
- include checkpoint evidence and production-safety statement;
- verify GitHub mergeability/checks;
- stop for explicit production-release approval.

`main` stays untouched until then.

## 12. Human Interaction Model

Normal interaction is reduced to checkpoint boundaries:
- run Checkpoint A and report only PASS/BLOCKED;
- run Checkpoint B and report only PASS/BLOCKED;
- run Checkpoint C and report only PASS/BLOCKED;
- explicitly approve/reject Checkpoint D.

Internal Task 7–12 logs remain available for debugging but require no chat round-trip when green.

## 13. Result Format

Green:
```text
===== R10 CHECKPOINT <X> RESULT =====
CHECKPOINT          : PASS
TASKS               : PASS
FOCUSED TESTS       : PASS
CROSS VERIFICATION  : PASS
FROZEN AUTHORITY    : PASS
SC02 / SC04         : PASS
STATUS              : CLEAN
REMOTE              : SYNCED
PRODUCTION          : UNTOUCHED
NEXT                : <next checkpoint>
```

Blocked:
```text
===== R10 CHECKPOINT <X> BLOCKED =====
STAGE               : <exact stage>
REASON              : <exact failure>
LAST SAFE COMMIT    : <sha>
DIRTY PATHS         : <none or exact paths>
SOURCE RECOVERY     : <restored / preserved for inspection>
PRODUCTION          : UNTOUCHED
BUNDLE              : <evidence bundle>
NEXT                : diagnose before retry
```

## 14. Production Isolation

Checkpoints A–C must not contain commands that can mutate production.

Prohibited before Checkpoint D approval:
- Firebase rules publish;
- live database migration/write;
- production deployment;
- merge PR #5 into `main` when `main` is the production release path;
- destructive historical cleanup.

Read-only production inspection is allowed only when required to construct a candidate and the command is demonstrably read-only.

## 15. Acceptance Criteria

The batching redesign is accepted when:
- Tasks 7–12 remain traceable as individual atomic commits;
- user interaction happens at checkpoint boundaries;
- each checkpoint resumes safely after interruption;
- resume decisions are proven from Git, not cache alone;
- unexpected state always stops execution;
- no production mutation can occur from A–C;
- frozen authorities remain protected;
- full regression remains mandatory before R10 is called clear;
- PR #5 stays open until Checkpoint C is fully green;
- Production Release remains a separate explicit approval gate.

## 16. Final Decision

Use three resumable development batches plus one separately approved production release:

- Checkpoint A — Runtime Cutover
- Checkpoint B — Authority Cutover
- Checkpoint C — Legacy Finalization
- Checkpoint D — Production Release

This replaces task-by-task human orchestration while preserving task-level engineering boundaries and safety gates.
