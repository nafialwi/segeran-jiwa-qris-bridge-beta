# SC-03 No-Regression Contract

## Frozen authorities

- v1.0.40 rollback SHA256: `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`.
- POS root: `toko_segeranjiwa_v58`.
- QRIS root: `segeranjiwa_qris_beta_v1`.
- Compatibility `dist/index.html` remains byte-identical to the frozen baseline.
- SC-03 candidate is built separately to `dist-sc03/`.

## Prohibited in SC-03

SC-03 must not introduce a direct Firebase `.set()`, `.update()`, `.transaction()`, or `.remove()` call in `src/app`, `src/core`, or `src/modules`; initialize a second Firebase app; add a second QRIS engine/writer; replace `processTransaction()`; change database roots/schema/rules; synthesize unknown HPP as zero; implement persistent-login/session state with localStorage; redesign the UI; or publish/deploy to GitHub, Cloudflare, or AppMint before the exit gate.

## Required behavior

One App Router owns primary navigation and child route state. Owner/cashier permissions remain equivalent to v1.0.40. Operational legacy ID 4 remains hidden. Transaction children remain under `Jual`. Each approved public navigation caller is installed once by `sc03-app-router`; the captured final legacy renderer remains the compatibility implementation underneath it.

## High-risk writers

Transaction, QRIS, inventory, WAC, debt, shift, refund/VOID, and reporting contracts remain those documented by SC-02. Feature modules route to existing authorities; they do not own persistence.

## Exit gate

SC-03 reaches its exit gate only if the frozen and compatibility hashes match, fixed roots remain exact, candidate has exactly one late SC-03 module entry, target feature placeholders are removed, caller ownership is singular, menu/role contracts pass, no prohibited direct mutations/session workaround exists, required high-risk legacy authority tokens remain present, and the full automated regression suite passes with zero failures.
