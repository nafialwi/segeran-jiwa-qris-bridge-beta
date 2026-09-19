# Segeran Jiwa Legacy — Decision Log

## D-INV01-001 — Read hardening only

Inventory V2 remains the stock source of truth. INV01 does not replace or rewrite the existing production writer authority.

## D-INV01-002 — Normal workspace cannot use the full Inventory V2 root

Bahan & Gudang current-state presentation must use targeted child reads rather than `global/inventoryV2` as one payload.

## D-INV01-003 — Activity history is bounded at the server query

Initial Activity data uses `orderByChild('ts').limitToLast(120)` instead of downloading every movement and slicing on the client.

## D-INV01-004 — Historical reconciliation correctness beats premature optimization

INV01-1 keeps the reconciliation full movements read lazy and only after Rekonsiliasi is opened. Replacing that historical evidence read is deferred to INV01-3 so old OPNAME markers are not silently missed.

## D-INV01-005 — Diagnostics are memory-only

Read telemetry records path, duration, estimated bytes, consumer, and bounded-query metadata in memory only. No diagnostic data is written to Firebase.

## D-INV01-006 — No database migration in INV01

No Firebase-to-D1 cutover, schema rewrite, dual-write, or authentication migration is part of this milestone.

## D-INV01-007 — Human-light Superpowers workflow

Roadmap exposes four large blocks only. TDD, regression, commits, and project-control updates happen inside each block; the human operator primarily runs one package and performs required visual UAT.
