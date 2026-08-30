import { legacyViewToRoute } from '../app/route-contract.js';
import { createRouterFeature } from './legacy-feature.js';

import { createFeature as ownerDashboard } from './dashboard/owner-dashboard.js';
import { createFeature as cashierDashboard } from './dashboard/cashier-dashboard.js';
import { createFeature as productList } from './sales/product-list.js';
import { createFeature as cart } from './sales/cart.js';
import { createFeature as checkout } from './sales/checkout.js';
import { createFeature as barcode } from './sales/barcode.js';
import { createFeature as cash } from './payments/cash.js';
import { createFeature as qris } from './payments/qris.js';
import { createFeature as transfer } from './payments/transfer.js';
import { createFeature as credit } from './payments/credit.js';
import { createFeature as operationalHome } from './operational/operational-home.js';
import { createFeature as shift } from './operational/shift.js';
import { createFeature as closing } from './operational/closing.js';
import { createFeature as stock } from './operational/stock.js';
import { createFeature as employeeAdvance } from './operational/employee-advance.js';
import { createFeature as expense } from './operational/expense.js';
import { createFeature as restock } from './operational/restock.js';
import { createFeature as shiftNote } from './operational/shift-note.js';
import { createFeature as refundVoid } from './operational/refund-void.js';
import { createFeature as reportHome } from './reports/report-home.js';
import { createFeature as salesReport } from './reports/sales-report.js';
import { createFeature as financeReport } from './reports/finance-report.js';
import { createFeature as productReport } from './reports/product-report.js';
import { createFeature as customerReport } from './reports/customer-report.js';
import { createFeature as evidenceDetail } from './reports/evidence-detail.js';
import { createFeature as settingsHome } from './settings/settings-home.js';
import { createFeature as products } from './settings/products.js';
import { createFeature as categories } from './settings/categories.js';
import { createFeature as storeIdentity } from './settings/store-identity.js';
import { createFeature as users } from './settings/users.js';
import { createFeature as devices } from './settings/devices.js';
import { createFeature as printer } from './settings/printer.js';
import { createFeature as diagnostics } from './settings/diagnostics.js';
import { createFeature as activity } from './settings/activity.js';
import { createFeature as customers } from './settings/customers.js';
import { createFeature as employees } from './settings/employees.js';
import { createFeature as account } from './settings/account.js';
import { createFeature as materialsWarehouse } from './settings/materials-warehouse.js';
import { createFeature as notifications } from './settings/notifications.js';
import { createFeature as backupRestore } from './settings/backup-restore.js';
import { createFeature as appearance } from './settings/appearance.js';
import { createFeature as securitySync } from './settings/security-sync.js';

function buildFeature(factory,router,services){return factory({router,services})}

export function createFeatureRuntime({router,guard,services={}}={}){
  if(!router) throw new TypeError('SC03_FEATURE_ROUTER_REQUIRED');
  if(!guard) throw new TypeError('SC03_FEATURE_GUARD_REQUIRED');

  const registry=Object.freeze({
    'dashboard.owner':buildFeature(ownerDashboard,router,services),
    'dashboard.cashier':buildFeature(cashierDashboard,router,services),
    'sales.product-list':buildFeature(productList,router,services),
    'sales.cart':buildFeature(cart,router,services),
    'sales.checkout':buildFeature(checkout,router,services),
    'sales.barcode':buildFeature(barcode,router,services),
    'payments.cash':buildFeature(cash,router,services),
    'payments.qris':buildFeature(qris,router,services),
    'payments.transfer':buildFeature(transfer,router,services),
    'payments.credit':buildFeature(credit,router,services),
    'operational.home':buildFeature(operationalHome,router,services),
    'operational.shift':buildFeature(shift,router,services),
    'operational.closing':buildFeature(closing,router,services),
    'operational.stock':buildFeature(stock,router,services),
    'operational.employee-advance':buildFeature(employeeAdvance,router,services),
    'operational.expense':buildFeature(expense,router,services),
    'operational.restock':buildFeature(restock,router,services),
    'operational.shift-note':buildFeature(shiftNote,router,services),
    'operational.refund-void':buildFeature(refundVoid,router,services),
    'reports.home':buildFeature(reportHome,router,services),
    'reports.sales-report':buildFeature(salesReport,router,services),
    'reports.finance-report':buildFeature(financeReport,router,services),
    'reports.product-report':buildFeature(productReport,router,services),
    'reports.customer-report':buildFeature(customerReport,router,services),
    'reports.evidence-detail':buildFeature(evidenceDetail,router,services),
    'settings.home':buildFeature(settingsHome,router,services),
    'settings.products':buildFeature(products,router,services),
    'settings.categories':buildFeature(categories,router,services),
    'settings.store-identity':buildFeature(storeIdentity,router,services),
    'settings.users':buildFeature(users,router,services),
    'settings.devices':buildFeature(devices,router,services),
    'settings.printer':buildFeature(printer,router,services),
    'settings.diagnostics':buildFeature(diagnostics,router,services),
    'settings.activity':buildFeature(activity,router,services),
    'settings.customers':buildFeature(customers,router,services),
    'settings.employees':buildFeature(employees,router,services),
    'settings.account':buildFeature(account,router,services),
    'settings.materials-warehouse':buildFeature(materialsWarehouse,router,services),
    'settings.notifications':buildFeature(notifications,router,services),
    'settings.backup-restore':buildFeature(backupRestore,router,services),
    'settings.appearance':buildFeature(appearance,router,services),
    'settings.security-sync':buildFeature(securitySync,router,services)
  });

  const compatibility=Object.freeze({
    'operational.4':createRouterFeature(router,{id:'legacy-stock-bakaran',family:'operational',method:'openOperational',args:[4],authority:'legacy-hidden openOpr(4)',note:'Guard keeps this route hidden.'}),
    'operational.5':createRouterFeature(router,{id:'customer-debt',family:'operational',method:'openOperational',args:[5],authority:'openOpr(5)',domain:services.debt??null}),
    'operational.11':createRouterFeature(router,{id:'cash-movement',family:'operational',method:'openOperational',args:[11],authority:'openOpr(11)'}),
    'reports.3':createRouterFeature(router,{id:'shift',family:'reports',method:'openReport',args:[3],authority:'openLap(3)',domain:services.report??null}),
    'reports.4':createRouterFeature(router,{id:'transactions',family:'reports',method:'openReport',args:[4],authority:'openLap(4)',domain:services.report??null})
  });

  const primary=Object.freeze({
    sales:registry['sales.product-list'],
    operational:registry['operational.home'],
    reports:registry['reports.home'],
    settings:registry['settings.home']
  });
  const operational=Object.freeze({
    1:registry['operational.shift'],
    3:registry['operational.stock'],
    4:compatibility['operational.4'],
    5:compatibility['operational.5'],
    6:registry['operational.employee-advance'],
    7:registry['operational.expense'],
    9:registry['operational.restock'],
    10:registry['operational.shift-note'],
    11:compatibility['operational.11'],
    12:registry['operational.refund-void']
  });
  const reports=Object.freeze({
    1:registry['reports.sales-report'],
    2:registry['reports.finance-report'],
    3:compatibility['reports.3'],
    4:compatibility['reports.4'],
    5:registry['reports.product-report']
  });
  const settings=Object.freeze({
    1:registry['settings.products'],
    2:registry['settings.categories'],
    4:registry['settings.store-identity'],
    5:registry['settings.users'],
    6:registry['settings.devices'],
    7:registry['settings.diagnostics'],
    8:registry['settings.activity'],
    9:registry['settings.customers'],
    10:registry['settings.employees']
  });
  const payments=Object.freeze({
    tunai:registry['payments.cash'],
    qris:registry['payments.qris'],
    transfer:registry['payments.transfer'],
    kasbon:registry['payments.credit']
  });

  const openDashboard=()=>guard.currentRole()==='owner'?registry['dashboard.owner'].open():registry['dashboard.cashier'].open();
  function openPrimary(route){
    if(route==='home') return openDashboard();
    const feature=primary[route];
    if(!feature) throw new Error(`FEATURE_PRIMARY_ROUTE_UNKNOWN:${route}`);
    return feature.open();
  }
  function navigateLegacyView(view){
    const route=legacyViewToRoute(view);
    if(!route) throw new Error(`FEATURE_LEGACY_VIEW_UNKNOWN:${view}`);
    return openPrimary(route);
  }
  function openOperational(id){
    const feature=operational[Number(id)];
    if(!feature) return router.openOperational(id);
    return feature.open();
  }
  function openReport(id){
    const feature=reports[Number(id)];
    if(!feature) return router.openReport(id);
    return feature.open();
  }
  function openSettings(id){
    const feature=settings[Number(id)];
    if(!feature) return router.openSettings(id);
    return feature.open();
  }
  const openCart=()=>registry['sales.cart'].open();
  const openCheckout=()=>registry['sales.checkout'].open();
  function openPayment(method){
    const key=String(method??'').trim().toLowerCase();
    const feature=payments[key];
    return feature?feature.open():router.openPayment(method);
  }
  function get(key){return registry[key]??compatibility[key]??null}
  function snapshot(){
    return Object.freeze({
      featureCount:Object.keys(registry).length,
      active:Object.entries(registry).filter(([,f])=>f.status==='active').map(([key])=>key),
      deferred:Object.entries(registry).filter(([,f])=>f.status==='deferred').map(([key])=>key),
      compatibilityRoutes:Object.fromEntries(Object.entries(compatibility).map(([key,f])=>[key,f.id]))
    });
  }

  return Object.freeze({
    get,snapshot,navigateLegacyView,openPrimary,openDashboard,
    openOperational,closeOperational:()=>router.closeOperational(),
    openReport,closeReport:()=>router.closeReport(),
    openSettings,closeSettings:()=>router.closeSettings(),
    openCart,openCheckout,openPayment
  });
}
