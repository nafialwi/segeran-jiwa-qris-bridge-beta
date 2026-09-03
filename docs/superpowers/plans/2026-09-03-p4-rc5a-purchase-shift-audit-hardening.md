# P4 RC5-A Purchase/Shift Audit Hardening Implementation Plan

**Goal:** Eliminate false/ambiguous Finance shift warnings, require a genuinely ACTIVE canonical shift before Inventory Purchase is delegated to the existing writer, and expose read-only purchase evidence from Arus Kas without changing persistence authority.

**Architecture:** Add a pure canonical shift-state helper matching existing SJShift semantics; Finance filters monthly nodes to canonical `YYYY-MM-DD-S1/S2/S3` keys and uses that state helper. Inventory v3 presentation blocks purchase delegation unless existing `SJShift.state(currentData())` is ACTIVE. Finance adds precise read-only repository/service methods for purchase + linked movement + linked expense and an audit detail UI.

**Global constraints:**
- Production v2.9 untouched; P3 v3.2 remains rollback anchor.
- Existing Inventory V2 purchase writer remains the only purchase mutation authority.
- No purchase delete/reversal in RC5-A.
- No new RTDB mutations or SC04 allowlist changes.
- LOCAL QA remains READ ONLY.
- TDD RED -> GREEN for each behavioral change.

### Task 1 — Canonical shift semantics
- Add tests for canonical key filtering and P3-compatible CLOSED/ACTIVE/NOT_STARTED state.
- Implement pure domain helper.
- Integrate Finance `loadMonth()`/`allShiftsClosed` with canonical keys only.

### Task 2 — Purchase ACTIVE-shift guard
- Add failing tests for NOT_STARTED/CLOSED rejection and ACTIVE acceptance.
- Add presentation guard immediately before delegation to existing legacy purchase writer.
- Do not change the legacy purchase writer itself.

### Task 3 — Purchase audit detail
- Add precise read-only repository methods for purchase, movement, linked shift expense.
- Add service method that returns evidence and warnings.
- Add clickable Inventory Purchase rows in Arus Kas and a read-only detail card showing Purchase ID, shift, linked expense, movement, funding, stock/WAC evidence, and immutable/correction guidance.

### Task 4 — Verification and Android LOCAL QA candidate
- Run related tests, full `npm test`, `verify:sc04`, and `verify:ref01`.
- Ensure no mutation allowlist expansion and `!important` budget does not increase.
- Build/smoke LOCAL QA and package RC5-A with fresh manifests/checksum.
