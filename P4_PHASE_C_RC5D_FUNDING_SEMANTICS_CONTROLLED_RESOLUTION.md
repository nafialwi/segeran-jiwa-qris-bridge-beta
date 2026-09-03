# P4 Phase C RC5-D — Funding Semantics & Controlled Resolution

Status: **LOCAL/ANDROID READ-ONLY UAT CANDIDATE — NOT P4 LOCKED — NOT DEPLOYED**
Date: 2026-09-03

## Why RC5-D exists

RC5-C Android evidence proved that `Pembelian TEH` Rp25.000 is a COMMITTED Inventory Purchase funded by `OWNER`, while Finance still treated every Inventory Purchase as confirmed business cash-out. That is semantically wrong for direct Owner funding.

RC5-D separates **inventory acquisition evidence** from **business-cash funding evidence**.

## Funding semantics

- `CASH` / Kas Usaha: confirmed business cash outflow.
- `OWNER`: direct Owner funding. Purchase stays visible and auditable, but confirmed business cash impact is **Rp0**. It is **not** silently converted into Tambahan Modal; an equity event remains explicit.
- `BANK`: only confirmed as business-bank cash-flow when bank authority exists. Until then it remains visible as unverified funding and is excluded from confirmed business-cash totals.
- `OTHER` or missing source: visible but unresolved; excluded from confirmed business-cash totals until evidence exists.
- Purchase reversal compensation mirrors the original funding source; an Owner-funded reversal never creates fake business cash inflow.

## Controlled resolution retained

RC5-D does not add a writer. Existing RC5-B/C resolution paths remain:

- `LINK_REPAIR` — append-only repair of missing system-linked expense evidence when dry-run proves the target is empty.
- `HISTORICAL_SHIFT_ACK` — append-only acknowledgement for historical purchase association to a canonical shift that was never started; original shift is not rewritten or fake-closed.
- `PURCHASE_REVERSAL` — remains blocked when downstream consumption/opname makes automatic reversal unsafe.

## WAC cost review

RC5-D adds a read-only WAC cost-review result. For TEH-style evidence (WAC changed by purchase, downstream consumption/opname present), status is `REVIEW_REQUIRED` and automatic WAC rewrite is explicitly forbidden. No WAC mutation is performed.

## Safety retained

- Production v2.9 untouched.
- P1/P2/P3 locks untouched; P3 remains rollback anchor.
- Firebase root remains `toko_segeranjiwa_v58`.
- Original Purchase remains COMMITTED.
- No shift close is fabricated.
- Exact SC04 mutation allowlist remains **3 dedicated writer files**.
- `.remove()` remains forbidden.
- No new writer/schema/path is introduced by RC5-D.
- LOCAL QA remains READ ONLY and all mutation controls remain disabled.
- Production deployment is not authorized by this candidate.

## Expected Android evidence

For **Laporan -> Keuangan -> Arus Kas -> Agustus 2026 -> Pembelian TEH**:

1. `Uang Keluar` must not include the Rp25.000 OWNER-funded purchase.
2. Purchase TEH remains visible in chronology/audit.
3. Row/audit identifies **Dana Owner Rp25.000** and **Dampak Arus Kas Usaha Rp0**.
4. Dry-run LINK_REPAIR remains `MISSING / Eligible` if production data is unchanged.
5. WAC Cost Review shows `REVIEW_REQUIRED` and automatic rewrite forbidden.
6. Controlled Resolution shows LINK_REPAIR / HISTORICAL_SHIFT_ACK as safe candidates when eligible and PURCHASE_REVERSAL blocked by downstream evidence.
7. LOCAL QA mutation controls remain disabled.
