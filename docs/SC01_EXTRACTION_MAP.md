# SC-01 Extraction Map

**Rule:** extract, isolate, verify — never rewrite semantics during consolidation.

| Target boundary | Legacy authority to map/extract | SC-01 status | Extraction stage |
|---|---|---|---|
| `app/` | bootstrap, render entry, bottom-nav route parent, view lifecycle | inventoried only | SC-03 |
| `core/` | login/logout helpers, role guard, busy/error helpers, legacy bridge | inventoried only | SC-02/04 |
| `data/` | Firebase bootstrap, `DB_PATH`, all `db.ref` reads/writes, QRIS root adapter | inventoried only | SC-02 |
| `domain/transaction` | pricing totals, stock reservation, `processTransaction`, idempotency verification | inventoried only | SC-02 |
| `domain/inventory` | inventory transaction/update, product stock, restock, purchase/WAC | inventoried only | SC-02 |
| `domain/debt` | customer debt/kasbon mutation and settlement semantics | inventoried only | SC-02 |
| `domain/shift` | active shift/day state, cash opening/closing, handover | inventoried only | SC-02 |
| `domain/report` | read-only calculations, HPP missing safety, evidence resolution | inventoried only | SC-02 |
| `modules/dashboard` | Owner/Kasir visible renderers | no migration in SC-01 | SC-03/REF-01 |
| `modules/sales` | product list, cart, checkout, barcode | no migration in SC-01 | SC-03 |
| `modules/payments` | cash + existing QRIS engine + transfer + kasbon | no migration in SC-01 | SC-03 |
| `modules/operational` | operational home, stock, restock, expense, shift/closing/refund | no migration in SC-01 | SC-03 |
| `modules/reports` | REP0 landing/detail/evidence | no migration in SC-01 | SC-03 |
| `modules/settings` | store/product/category/users/device/system settings | no migration in SC-01 | SC-03 |
| `ui/` | design tokens, icons, components, nav, states | intentionally deferred | REF-01 |

## Immutable data contracts

- POS RTDB root: `/toko_segeranjiwa_v58`
- QRIS root: `segeranjiwa_qris_beta_v1`
- No schema/Rules change in SC-01.
- No new write path in SC-01.
- `dist/index.html` must remain byte-identical to approved v1.0.40 during SC-01.

## Extraction sequencing rule

A legacy function is not removed until its replacement has: (1) an explicit boundary, (2) parity test, (3) caller map, (4) no duplicate write, and (5) rollback still available.
