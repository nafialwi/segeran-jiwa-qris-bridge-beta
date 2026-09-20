# R10 Final Cup / Stock Authority Map

Status: Checkpoint C authority lock, pre-UAT.

Cup Control and Product Stock Components are intentionally separate.

ACTIVE_NEW_RUNTIME:
- src/compat/legacy-stock-components-runtime.js: explicit Product Stock Components application after completed sale and correction recovery.
- src/data/writers/stock-component-writer.js: sole Product Stock Components Inventory V2 mutation writer.
- src/domain/product-stock-components.js: pure Product Stock Components domain.
- src/ui/product-stock-components-ui.js: Owner configuration UI, no direct RTDB mutation.
- src/domain/cup-control-v1.js: operational Cup Control reconciliation.
- src/ui/cup-shift-control-v34.js: Cup Control shift UI through existing verified shift/root authorities.

HISTORICAL_READER / metadata:
- theoreticalCupUsageV34 reads immutable transaction cp evidence for Cup Control expected usage.
- decorateRecipeWithCupV34 is cost/audit metadata only and must never add a Cup ingredient to Recipe components.
- __SJ_V34_CUP_SALE_USAGE is read-only Cup Control/costing evidence keyed by cup code, not an Inventory writer.

Final formulas:
Expected Closing = Opening + Restock - Transaction Usage - declared manual usage/waste/negative adjustment + positive adjustment.
Variance = Physical Closing - Expected Closing.

Product Stock Components separately answers which Inventory V2 stock items are explicitly consumed by a configured product. A legacy product cp mapping does not automatically enter Inventory Recipe reservation and does not automatically become a Product Stock Component mapping.

Superseded/dead authority removed:
- old Inventory-backed R10 Cup Reconciliation screen/domain and its Inventory Opname follow-up;
- old Recipe-sale cupUsage to reserveRecipeConsumption mutation path.

Fail-closed contracts retained:
- Recipe + Product Stock Components overlap on the same physical item: STOCK_COMPONENT_RECIPE_OVERLAP.
- no mapping means no invented stock mapping.
- shortage never creates negative outlet stock.
- retry/recovery is exactly-once.
- refund/void stock restoration uses historical application evidence.
- historical cp remains readable for Cup Control/costing history but is not a second Inventory authority.

Production boundary:
Checkpoint C does not publish Firebase rules, apply live migration, deploy production, or merge the release PR.
