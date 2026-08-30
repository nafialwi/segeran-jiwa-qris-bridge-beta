import { createLegacyBridge } from '../core/legacy-bridge.js';
import { createLegacyCommandRegistry } from '../core/legacy-command-registry.js';
import { createLegacyRoleReader, createRoleGuard } from '../core/role-guard.js';
import { createQrisAdapter } from '../data/qris-adapter.js';
import { createTransactionService } from '../domain/transaction-service.js';
import { createInventoryService } from '../domain/inventory-service.js';
import { createDebtService } from '../domain/debt-service.js';
import { createShiftService } from '../domain/shift-service.js';
import { createRefundVoidService } from '../domain/refund-void-service.js';
import { createReportService } from '../domain/report-service.js';
import { createFeatureRuntime } from '../modules/runtime-registry.js';
import { createAppState } from './app-state.js';
import { createAppRouter } from './router.js';

const OWNER='sc03-app-router';

function captureOptionalFunction(commands,name,alias=name){
  commands.captureFunction(name,alias,{required:false});
}
function captureOptionalMethod(commands,objectName,methodName,alias){
  commands.captureMethod(objectName,methodName,alias,{required:false});
}

function createSc03Services(runtime){
  const bridge=createLegacyBridge(runtime);
  return Object.freeze({
    bridge,
    qris:createQrisAdapter({bridge}),
    transaction:createTransactionService({bridge}),
    inventory:createInventoryService({bridge}),
    debt:createDebtService({bridge}),
    shift:createShiftService({bridge}),
    refundVoid:createRefundVoidService({bridge}),
    report:createReportService({legacyCore:bridge.engine('reports')})
  });
}

export function installSc03Runtime(runtime=globalThis){
  if(runtime?.__SJ_SC03_RUNTIME) return runtime.__SJ_SC03_RUNTIME;

  const commands=createLegacyCommandRegistry(runtime);
  for(const name of ['showView','openOpr','closeOpr','openLap','closeLap','openMst','closeMst','openCartModal']){
    commands.captureFunction(name);
  }
  commands.captureMethod('SJX','openDashboard','dashboard.open');
  commands.captureMethod('SJCommercialFinalV5961','openPayment','payment.open');
  commands.captureMethod('SJRefinementCheckoutV100','openCheckout','checkout.open');

  captureOptionalFunction(commands,'showToast');
  captureOptionalFunction(commands,'openCameraScanner','scanner.open');
  captureOptionalFunction(commands,'showReportFullscreen','report.fullscreen');
  captureOptionalFunction(commands,'backupDatabase','backup.database');
  captureOptionalMethod(commands,'SJX','openNotifications','notifications.open');
  captureOptionalMethod(commands,'SJX','renderRestockPage','restock.render');
  captureOptionalMethod(commands,'SJX','renderShiftNotes','shift-notes.render');
  captureOptionalMethod(commands,'SJX','renderPeople','people.render');
  captureOptionalMethod(commands,'SJShift','render','shift.render');
  captureOptionalMethod(commands,'SJAccountV5964','open','account.open');
  captureOptionalMethod(commands,'SJInventoryV2','open','inventory.open');

  const readRole=createLegacyRoleReader(runtime);
  const notify=(message,kind='error')=>commands.has('showToast')?commands.invoke('showToast',message,kind):undefined;
  const guard=createRoleGuard({readRole,notify});
  const state=createAppState({primary:'sales',child:null});
  const router=createAppRouter({commands,guard,state});
  const services=createSc03Services(runtime);
  const features=createFeatureRuntime({router,guard,services});

  commands.installGlobal('showView',view=>features.navigateLegacyView(view),OWNER);
  commands.installGlobal('openOpr',id=>features.openOperational(id),OWNER);
  commands.installGlobal('closeOpr',()=>features.closeOperational(),OWNER);
  commands.installGlobal('openLap',id=>features.openReport(id),OWNER);
  commands.installGlobal('closeLap',()=>features.closeReport(),OWNER);
  commands.installGlobal('openMst',id=>features.openSettings(id),OWNER);
  commands.installGlobal('closeMst',()=>features.closeSettings(),OWNER);
  commands.installGlobal('openCartModal',()=>features.openCart(),OWNER);
  commands.installMethod('SJX','openDashboard',()=>features.openDashboard(),OWNER);
  commands.installMethod('SJCommercialFinalV5961','openPayment',method=>features.openPayment(method),OWNER);
  commands.installMethod('SJRefinementCheckoutV100','openCheckout',()=>features.openCheckout(),OWNER);

  const api=Object.freeze({phase:'SC-03',commands,guard,state,router,services,features});
  Object.defineProperty(runtime,'__SJ_SC03_RUNTIME',{value:api,writable:false,configurable:false,enumerable:false});
  return api;
}
