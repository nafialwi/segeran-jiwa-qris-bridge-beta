/**
 * SC-02 domain boundary exports.
 *
 * Pure calculations are extracted; live mutating actions still delegate to
 * the single proven v1.0.40 authority until an explicit later cutover.
 */
export * as pricing from './pricing-service.js';
export * as costing from './costing-service.js';
export { createPurchaseWacService } from './purchase-wac-service.js';
export { createTransactionService } from './transaction-service.js';
export { createInventoryService } from './inventory-service.js';
export { createDebtService, remainingDebt, outstandingFor } from './debt-service.js';
export { createShiftService } from './shift-service.js';
export { createRefundVoidService } from './refund-void-service.js';
export { createReportService } from './report-service.js';

export { createFinanceV33Service } from './finance-v33-service.js';
export { buildFinanceReadModel, buildCashFlowRows, classifyExpense, qrisCashOutSemantics } from './finance-v33-analytics.js';
