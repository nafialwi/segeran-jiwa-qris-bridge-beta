# SC-01 CSS & Renderer Layer Map

> Audit only. SC-01 does not remove or redesign these layers.

## Structural evidence

- Style blocks: **23**
- Script blocks: **40**
- Declared functions: **698**
- Refinement/work-package markers: **59**

## Style blocks

| # | Line | Attributes / ID |
|---:|---:|---|
| 1 | 12 | `(anonymous)` |
| 2 | 591 | `id="sjx-rolefix-style"` |
| 3 | 594 | `id="sj-cashclose-css"` |
| 4 | 598 | `id="sjpro-design-system"` |
| 5 | 746 | `id="sjhard-v591-style"` |
| 6 | 752 | `id="sjmobile-v592-style"` |
| 7 | 806 | `id="sjrel-v593-style"` |
| 8 | 6736 | `(anonymous)` |
| 9 | 6936 | `(anonymous)` |
| 10 | 7782 | `id="sj-wp-rep0-style-v012"` |
| 11 | 8132 | `id="sj-rep0-ui02-style"` |
| 12 | 8195 | `id="sj-refinement-ds01-v100"` |
| 13 | 8355 | `id="sj-refinement-ui01-v100"` |
| 14 | 8534 | `id="sj-refinement-ui02-v100"` |
| 15 | 8625 | `id="sj-refinement-ui02-tail-cleanup-v101"` |
| 16 | 8660 | `id="sj-refinement-ui03a-v100"` |
| 17 | 8770 | `id="sj-refinement-ui03b-v100"` |
| 18 | 8827 | `id="sj-final-vc01a-v100"` |
| 19 | 8897 | `id="sj-final-vc01a1-v100"` |
| 20 | 8944 | `id="sj-final-vc01a2-v100"` |
| 21 | 9082 | `id="sj-vc01b-style"` |
| 22 | 9182 | `id="sj-vc01b1-style"` |
| 23 | 9313 | `id="sjvc02a-style"` |

## Script blocks

| # | Line | Attributes | Nearest marker |
|---:|---:|---|---|
| 1 | 8 | `src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js"` | `-` |
| 2 | 9 | `src="https://www.gstatic.com/firebasejs/10.8.1/firebase-database-compat.js"` | `-` |
| 3 | 10 | `src="https://www.gstatic.com/firebasejs/10.8.1/firebase-auth-compat.js"` | `-` |
| 4 | 11 | `src="https://www.gstatic.com/firebasejs/10.8.1/firebase-storage-compat.js"` | `-` |
| 5 | 1328 | `(inline)` | `-` |
| 6 | 5954 | `(inline)` | `SJ-INVENTORY-V2-0.5.0-BEGIN` |
| 7 | 5984 | `(inline)` | `-` |
| 8 | 6100 | `(inline)` | `SJ-QRIS-SIGNAL-BETA-0.3.0-BEGIN` |
| 9 | 6222 | `(inline)` | `-` |
| 10 | 6692 | `(inline)` | `SJ-WP-F01-BARCODE-0.1.0-BEGIN` |
| 11 | 6760 | `(inline)` | `sj-discount` |
| 12 | 6807 | `(inline)` | `SJ-WP-F02-MGMT-HOTFIX-0.1.1-BEGIN` |
| 13 | 6955 | `(inline)` | `sj-f02-qris-breakdown` |
| 14 | 7135 | `(inline)` | `SJ-WP-F02-VOID-MODAL-HOTFIX-0.1.4-BEGIN` |
| 15 | 7155 | `(inline)` | `SJ-WP-F03-COSTING-0.1.0-BEGIN` |
| 16 | 7190 | `(inline)` | `SJ-WP-F03-RUNTIME-0.1.0-BEGIN` |
| 17 | 7265 | `(inline)` | `SJ-WP-F03-PURCHASE-UI-0.1.0-BEGIN` |
| 18 | 7311 | `(inline)` | `SJ-WP-F03-PURCHASE-COMMIT-0.1.0-BEGIN` |
| 19 | 7380 | `(inline)` | `SJ-CP-F03-01-PURCHASE-COMMIT-RECOVERY-0.1.0-BEGIN` |
| 20 | 7427 | `(inline)` | `SJ-CP-F03-02-PURCHASE-IDENTITY-RECOVERY-0.1.0-BEGIN` |
| 21 | 7451 | `(inline)` | `SJ-CP-F03-03-INVENTORY-ROOT-PREFLIGHT-0.1.0-BEGIN` |
| 22 | 7475 | `(inline)` | `SJ-WP-F03-SALE-COSTING-0.1.0-BEGIN` |
| 23 | 7539 | `(inline)` | `SJ-WP-F03-REPORT-0.1.0-BEGIN` |
| 24 | 7576 | `(inline)` | `SJ-WP-F03-REFUND-COSTING-0.1.0-BEGIN` |
| 25 | 7656 | `(inline)` | `-` |
| 26 | 7739 | `(inline)` | `SJ-WP-F03-PURCHASE-HISTORY-0.1.0-BEGIN` |
| 27 | 7793 | `id="sj-wp-rep0-v012"` | `sj-rep0` |
| 28 | 8158 | `(inline)` | `sj-rep0-evidence` |
| 29 | 8309 | `(inline)` | `-` |
| 30 | 8438 | `(inline)` | `-` |
| 31 | 8567 | `(inline)` | `-` |
| 32 | 8629 | `(inline)` | `sj-refinement-ui02-tail-cleanup-v101` |
| 33 | 8685 | `(inline)` | `-` |
| 34 | 8786 | `(inline)` | `-` |
| 35 | 8853 | `(inline)` | `-` |
| 36 | 8911 | `(inline)` | `-` |
| 37 | 8993 | `(inline)` | `-` |
| 38 | 9121 | `(inline)` | `-` |
| 39 | 9200 | `(inline)` | `-` |
| 40 | 9331 | `id="sjvc02a-script"` | `-` |

## Why this matters

- Core UI + Professional Retail UI + hardening + mobile layers coexist before later refinement layers.
- REP0, WP-F03, and Final Refinement layers are all retained in the same artifact.
- Late renderer overrides can supersede earlier function/DOM behavior; this is the root structural reason a legacy sheet can reappear after a newer renderer.
- SC-03 will establish one visible renderer path per screen family. REF-01 will then consolidate styles/tokens/icons.

## Cleanup rule

A legacy style/script block can only be removed after its caller and visible behavior are mapped, its replacement is active, regression is green, and the v1.0.40 rollback remains intact.