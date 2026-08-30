# SC-01 Legacy Debt Register

This register records structural debt; it is **not** permission to fix it during SC-01.

| ID | Debt | Why risky | Planned handling |
|---|---|---|---|
| LD-01 | One ~1.9 MB HTML is source + runtime + release artifact | unrelated CSS/JS can affect each other | modular source + generated `dist/index.html` |
| LD-02 | 20+ style blocks and many late refinement layers | cascade/`!important` conflicts and visual bleed | consolidate only in REF-01 after structural parity |
| LD-03 | Multiple renderer generations retained | legacy renderer can reappear after a newer route | one visible renderer path per family in SC-03 |
| LD-04 | Direct Firebase writes occur across UI/business functions | hard to prove idempotency and guard correctness | repository/data adapter extraction in SC-02 |
| LD-05 | Transaction/inventory/UI concerns coexist in global functions | change blast radius is high | domain services + feature modules |
| LD-06 | QRIS engine and renderer corrections coexist in same monolith | accidental duplicate pending/finalization risk | wrap existing `SJQrisSignalBeta`; do not rewrite |
| LD-07 | Login/session behavior is coupled to global runtime state | closing app can require relogin | single Session Manager in SC-04 |
| LD-08 | Dashboard/report responsibilities have drifted visually | duplicate information and unclear IA | fix only in REF-01 using refinement authority |
| LD-09 | Icon semantics/families are inconsistent | inconsistent visual language | one icon registry in REF-01 |
| LD-10 | Diagnostics/build labels include historical layers | confusing support/debug evidence | normalize after structural migration, not SC-01 |
| LD-11 | Historical HPP can be incomplete | false Rp0 would corrupt profit semantics | preserve missing-HPP safety in report/costing extraction |
| LD-12 | Known permission-denied diagnostics exist outside purchase recovery | tempting unsafe Rules changes | separate hardening checkpoint; no Rules changes now |
