/**
 * SC-02 data boundary exports.
 *
 * These modules are not activated by the compatibility runtime yet.
 * Direct mutations remain owned by the frozen v1.0.40 legacy authorities.
 */
export { POS_ROOT, QRIS_ROOT, posPath, qrisPath, databaseContract } from './firebase-client.js';
export { createQrisAdapter } from './qris-adapter.js';
export { createTransactionRepository } from './repositories/transaction-repository.js';
export { createInventoryRepository } from './repositories/inventory-repository.js';
export { createPurchaseRepository } from './repositories/purchase-repository.js';
export { createDebtRepository } from './repositories/debt-repository.js';
export { createShiftRepository } from './repositories/shift-repository.js';
export { createReportRepository } from './repositories/report-repository.js';
