# SC-03 Legacy Caller / Renderer Map

## Purpose

SC-03 changes **caller ownership**, not the rendering or business semantics proven in v1.0.40. The module entry is loaded after the complete legacy inline patch chain. `installSc03Runtime()` captures the final installed function/method references first, then replaces approved public entry points exactly once with App Router wrappers.

## Active modular caller ownership

| Visible family / entry | SC-03 owner | Captured compatibility authority | Status |
|---|---|---|---|
| Primary navigation | `src/app/router.js` | final `showView` | modular caller active |
| Dashboard | `src/app/router.js` | final `SJX.openDashboard` | modular caller active |
| Operational child open/close | `src/app/router.js` | final `openOpr` / `closeOpr` | modular caller active |
| Reports child open/close | `src/app/router.js` | final `openLap` / `closeLap` | modular caller active |
| Settings child open/close | `src/app/router.js` | final `openMst` / `closeMst` | modular caller active |
| Cart | `src/app/router.js` | final `openCartModal` | modular caller active |
| Checkout | `src/app/router.js` | final `SJRefinementCheckoutV100.openCheckout` | modular caller active |
| Payment chooser | `src/app/router.js` | final `SJCommercialFinalV5961.openPayment` | modular caller active |

The owner string for every installed wrapper is exactly `sc03-app-router`. `legacy-command-registry.js` rejects a second owner for the same public entry.

## Intentionally retained legacy renderer layer

SC-03 deliberately retains the **final** v1.0.40 renderer bodies and the existing refinement patch chain underneath the registry. They are compatibility authorities, not parallel visible caller authorities. No UI redesign, CSS consolidation, or renderer rewrite is performed in this work package. Visual de-layering/refinement belongs to later prompts.

Examples intentionally retained include the final dashboard renderer, sales renderer/cart presentation, checkout/payment sheets, operational child renderers, report renderers, settings/master-data renderers, bottom-nav visual behavior, and the refinement layers that produced the approved current appearance.

## Business writer ownership remains unchanged

SC-03 does not replace any high-risk writer. The following remain authoritative:

- transaction commit: `processTransaction()`;
- QRIS: `SJQrisSignalBeta`, accessed through the existing payment path / SC-02 QRIS adapter;
- inventory/recipe: `SJInventoryV2`;
- purchase/WAC: `SJCostingV1` plus the proven recovery chain;
- shift/closing/handover: `SJShift`;
- refund/VOID: `SJOperationalHardening` with the existing fallback contract;
- customer debt creation: transaction authority; repayment: `lunasiHutang`;
- employee advance creation: `simpanKasbonKaryawan`; repayment: `lunasiKasbonKaryawan`;
- reports: read-only evidence/report authorities already mapped in SC-02.

## Removal / disable statement

No legacy renderer body is deleted in SC-03 because the frozen monolith remains the compatibility implementation. What is disabled as a **public navigation authority** is the direct legacy caller path for the entries listed above: after bootstrap, UI calls reach the SC-03 App Router first, which invokes the captured final legacy reference exactly once.
