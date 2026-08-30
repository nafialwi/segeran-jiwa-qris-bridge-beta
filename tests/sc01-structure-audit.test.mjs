import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const req = rel => assert.ok(existsSync(join(ROOT, rel)), `missing ${rel}`);

test('SC-01 scaffold mirrors the approved target architecture', () => {
  const required = [
    'src/app/bootstrap.js','src/app/router.js','src/app/route-contract.js','src/app/app-state.js',
    'src/core/session-manager.js','src/core/role-guard.js','src/core/connectivity.js','src/core/error-journal.js','src/core/idempotency.js','src/core/legacy-bridge.js',
    'src/data/firebase-client.js','src/data/qris-adapter.js','src/data/local-store.js',
    'src/data/repositories/user-repository.js','src/data/repositories/transaction-repository.js','src/data/repositories/inventory-repository.js','src/data/repositories/purchase-repository.js','src/data/repositories/shift-repository.js','src/data/repositories/debt-repository.js','src/data/repositories/settings-repository.js','src/data/repositories/report-repository.js',
    'src/domain/pricing-service.js','src/domain/transaction-service.js','src/domain/inventory-service.js','src/domain/purchase-wac-service.js','src/domain/debt-service.js','src/domain/shift-service.js','src/domain/refund-void-service.js','src/domain/costing-service.js','src/domain/report-service.js',
    'src/modules/dashboard/owner-dashboard.js','src/modules/dashboard/cashier-dashboard.js',
    'src/modules/sales/product-list.js','src/modules/sales/cart.js','src/modules/sales/checkout.js','src/modules/sales/barcode.js',
    'src/modules/payments/cash.js','src/modules/payments/qris.js','src/modules/payments/transfer.js','src/modules/payments/credit.js',
    'src/modules/operational/operational-home.js','src/modules/operational/stock.js','src/modules/operational/restock.js','src/modules/operational/expense.js','src/modules/operational/shift.js','src/modules/operational/closing.js','src/modules/operational/shift-note.js','src/modules/operational/refund-void.js','src/modules/operational/employee-advance.js',
    'src/modules/reports/report-home.js','src/modules/reports/sales-report.js','src/modules/reports/product-report.js','src/modules/reports/customer-report.js','src/modules/reports/finance-report.js','src/modules/reports/evidence-detail.js',
    'src/modules/settings/settings-home.js','src/modules/settings/products.js','src/modules/settings/categories.js','src/modules/settings/materials-warehouse.js','src/modules/settings/customers.js','src/modules/settings/employees.js','src/modules/settings/account.js','src/modules/settings/users.js','src/modules/settings/devices.js','src/modules/settings/appearance.js','src/modules/settings/store-identity.js','src/modules/settings/printer.js','src/modules/settings/notifications.js','src/modules/settings/security-sync.js','src/modules/settings/activity.js','src/modules/settings/diagnostics.js','src/modules/settings/backup-restore.js',
    'src/ui/tokens.css','src/ui/typography.css','src/ui/layout.css','src/ui/components.css','src/ui/states.css','src/ui/icons.js','src/ui/bottom-nav.js','src/ui/screen-shell.js'
  ];
  required.forEach(req);
});

test('audit inventories routes, renderer/style layers, auth/session, QRIS, shift, reports, and firebase paths', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'audit-monolith.mjs')], { cwd: ROOT, stdio: 'pipe' });
  const a = JSON.parse(readFileSync(join(ROOT, 'audit', 'monolith-audit.json'), 'utf8'));
  assert.ok(Array.isArray(a.structure.styles) && a.structure.styles.length === a.structure.styleBlocks);
  assert.ok(Array.isArray(a.structure.scripts) && a.structure.scripts.length === a.structure.scriptBlocks);
  assert.deepEqual(a.routes.bottomNavLabels, ['Beranda','Jual','Operasional','Laporan','Pengaturan']);
  assert.ok(a.routes.routeFunctions.length > 10);
  assert.ok(a.functions.groups.shift.length > 5);
  assert.ok(a.functions.groups.report.length > 5);
  assert.ok(a.authSession.localStorage.length > 0 || a.authSession.sessionStorage.length > 0 || a.authSession.firebaseAuth.length > 0);
  assert.ok(a.qris.engineOccurrences > 0 && a.qris.rootOccurrences > 0);
  assert.ok(a.firebase.writeSites.length > 100);
  assert.ok(Array.isArray(a.firebase.pathFamilies) && a.firebase.pathFamilies.length > 10);
});

test('SC-01 produces the audit artifacts needed by SC-02', () => {
  const required = [
    'docs/SC01_AUDIT_SUMMARY.md',
    'docs/SC01_FIREBASE_WRITE_MAP.md',
    'docs/SC01_ROUTE_MENU_MAP.md',
    'docs/SC01_SESSION_AUTH_MAP.md',
    'docs/SC01_QRIS_CONTRACT_MAP.md',
    'baseline/SHA256.txt'
  ];
  required.forEach(req);
});
