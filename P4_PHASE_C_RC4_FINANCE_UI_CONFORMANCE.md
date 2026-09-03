# P4 Phase C RC4 — Finance UI Conformance Correction

Date: 2026-09-03  
Status: **ANDROID LOCAL QA CANDIDATE — NOT LOCKED — NOT DEPLOYED**

## Why RC4 exists

RC3 solved the canonical Report lifecycle bug and Android QA confirmed Finance routing appeared. The user then correctly identified that the internal Finance workspace remained a minimum implementation and did not conform to the previously locked Finance Grand Design.

RC4 corrects presentation/read-model conformance only. It does not reopen the approved persistence architecture.

## Scope

RC4 adds/conforms:

- complete Finance Ringkasan headline;
- cash position separated from calculated ending capital;
- Arus Kas four-KPI header, day/source filters, search, date grouping, category/source, and running balance;
- Pengeluaran monthly/category summary using the existing expense authority;
- Modal & Prive totals/history/reversal semantics and visible-disabled LOCAL QA form;
- Tutup Bulan recap, observed monthly obligation evidence, outstanding issues, automatic evidence + manual Owner confirmations;
- Owner dashboard monthly Finance summary and direct Keuangan/Tutup Bulan shortcuts.

## Safety conditions preserved

- no new database path;
- no duplicate sale/expense/inventory/shift writer;
- exact QRIS normal matcher unchanged;
- exact two-writer mutation allowlist unchanged;
- `.remove()` forbidden;
- HPP unknown never coerced to Rp0;
- LOCAL QA remains mutation-blocked;
- production v2.9 remains untouched.

## Regression evidence

- RC4 conformance tests were RED against RC3 and GREEN after implementation.
- Month-close automatic evidence no longer relies on disabled `FormData` fields.
- A verifier lexical collision from read-only `Map.set()` was resolved by removing the token from analytics, not by widening the writer allowlist.
- Related suite: **43/43 PASS**.
- Full suite: **339/339 PASS**.
- Finance verifier: **9/9 PASS**.
- SC02 / SC03 / SC04: PASS.
- REF01: PASS.
- B01–B05: **61/61**.
- `!important`: **252/252**.

RC4 requires Android visual/interaction UAT before any P4 LOCK decision.
