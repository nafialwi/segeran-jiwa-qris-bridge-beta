export * as legacyFeature from './legacy-feature.js';
export { createFeatureRuntime } from './runtime-registry.js';

export const featureManifest=Object.freeze({
  dashboard:['owner-dashboard','cashier-dashboard'],
  sales:['product-list','cart','checkout','barcode'],
  payments:['cash','qris','transfer','credit'],
  operational:['operational-home','shift','closing','stock','employee-advance','expense','restock','shift-note','refund-void'],
  reports:['report-home','sales-report','finance-report','product-report','customer-report','evidence-detail'],
  settings:['settings-home','products','categories','store-identity','users','devices','printer','diagnostics','activity','customers','employees','account','materials-warehouse','notifications','backup-restore','appearance','security-sync']
});
