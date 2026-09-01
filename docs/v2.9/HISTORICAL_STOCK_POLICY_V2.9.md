# Segeran Jiwa POS v2.9 — Historical Stock Policy

Decision: **Option A — database-safe v2.9**
Approved: 2026-09-02

## Locked policy

- v2.9 does **not** add a historical stock snapshot writer.
- Frozen shift-close/database authorities remain unchanged.
- Reports may show period-specific sold quantity/revenue from historical transactions.
- Inventory balance is labelled **`Stok Gerai Saat Ini`** and must not be presented as historical period-ending stock.
- Historical `Stok Akhir` requires a separately approved architecture phase with an immutable closing snapshot design.

## Reason

The current production closing snapshot does not persist a product-by-product inventory balance at each shift close. Reusing today's outlet balance as a past period-ending balance would create false historical evidence.

## Safety effect

This decision preserves SC-04's zero direct modular RTDB mutation contract and avoids modifying the frozen shift writer.
