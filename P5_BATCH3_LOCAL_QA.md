# P5 v3.4 Batch-3 — Android LOCAL QA

## Safety

LOCAL QA remains `READ ONLY`. Batch-3 has no persistence/backfill action.

## Primary QA path

1. Open `Laporan`.
2. Select `Keuangan`.
3. Open `Ringkasan`.
4. Select the same month previously used for HPP review.
5. Inspect `Coverage HPP v3.4` and `Profit Terukur`.

## Expected behavior for a legacy-only period

If no transaction has verified historical HPP evidence:

- HPP: `Belum tersedia`;
- Laba Kotor / Gross Margin / Laba Bersih total: `Belum tersedia`;
- Coverage Transaksi: `0%`;
- Coverage Revenue: `0%`;
- Profit Terukur: `BELUM ADA EVIDENCE`;
- Legacy tanpa evidence biaya: shows the legacy transaction count;
- no cost is synthesized from current WAC/current recipe.

## Expected behavior after verified costing transactions exist

- Coverage percentages increase only for verified/reconstructed evidence.
- `Laba Kotor Terukur` and `Gross Margin Terukur` appear for the covered subset.
- Full-period profit remains withheld until effective coverage reaches 100%.
- If a later transaction loses costing after verified evidence already exists, `Gap costing setelah evidence aktif` becomes non-zero and Finance emits an Owner warning.

## Screenshots requested

Capture:

1. top Finance summary showing HPP / Laba Kotor / Gross Margin;
2. full `Coverage HPP v3.4` card;
3. full `Profit Terukur` card;
4. `Alasan gap HPP` and any `Gap costing setelah evidence aktif` warning.
