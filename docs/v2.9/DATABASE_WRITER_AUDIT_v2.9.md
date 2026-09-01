# Segeran Jiwa POS v2.9 — Database / Writer Audit

Date: 2026-09-02

## Frozen baseline

`baseline/legacy-v1.0.40.html`
SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`

Compatibility `dist/index.html` produces the same SHA256.

## Database/root safety

- Firebase POS root remains `toko_segeranjiwa_v58`.
- No Firebase root/schema migration was introduced by v2.9.
- No modular `.set(` direct mutation: **0**.
- No modular `.update(` direct mutation: **0**.
- No modular `.transaction(` direct mutation: **0**.
- No modular `.remove(` direct mutation: **0**.
- SC-02 / SC-03 / SC-04 writer ownership verifiers remain active and were not weakened.

## Frozen writer authorities preserved

v2.9 does not replace or duplicate:
- transaction/payment writer;
- inventory decrement/reservation writer;
- QRIS authority;
- shift open/close writer;
- refund/VOID writer;
- debt/kasbon writer;
- persistent session/auth authority.

## v2.9 inventory behavior

- Finished Goods reads Gudang/Gerai balances through compatibility/read authorities.
- `Set Stok Gudang` delegates to existing Inventory V2 Stock Opname.
- `Transfer ke Gerai` delegates to existing Inventory V2 transfer.
- Exception draft has no stock mutation; reconciliation delegates to existing Stock Opname.
- No historical stock snapshot writer is added (approved Option A policy).

## Avatar behavior

Profile avatar is user-scoped browser-local persistence. It intentionally adds neither Firebase Storage nor RTDB writes.
