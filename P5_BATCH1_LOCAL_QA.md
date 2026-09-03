# P5 / v3.4 Batch-1 — Android LOCAL QA

Status: **READ ONLY**

## Start
From the candidate `source` directory:

```bash
npm run qa:local
```

Open:

```text
http://127.0.0.1:4173
```

The page must show `LOCAL QA · READ ONLY`.

## Primary QA route
1. Open **Laporan**.
2. Select **Keuangan**.
3. Open **Ringkasan**.
4. Confirm header identifies **Finance v3.4 · P5 Costing**.
5. Inspect HPP / Laba Kotor / Gross Margin.
6. Inspect **Coverage HPP v3.4**.

## What the coverage means
- **Snapshot terverifikasi**: immutable transaction/P4 explicit cost evidence.
- **Rekonstruksi aman**: contemporaneous committed reservation/refund-snapshot evidence proved the cost read-only.
- **Evidence parsial**: evidence exists but total HPP cannot be proven.
- **Tidak aman direkonstruksi**: no contemporaneous evidence sufficient for historical HPP.

## Expected safety behavior
- `Belum tersedia` is correct whenever period coverage is incomplete.
- Current WAC/current recipe must never be silently substituted for historical missing HPP.
- LOCAL QA must not write or backfill production data.

## Screenshots requested
Capture:
1. Finance Ringkasan from header through HPP/Laba Kotor/Gross Margin.
2. Entire `Coverage HPP v3.4` panel and any warning/notes immediately below it.
3. If available, switch period between August and September and capture how coverage differs.

Do not infer failure merely because HPP stays unavailable. The purpose of Batch-1 is first to distinguish safe vs unsafe historical evidence honestly.
