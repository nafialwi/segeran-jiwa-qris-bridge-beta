import test from 'node:test';
import assert from 'node:assert/strict';

import { createLegacyCommandRegistry } from '../src/core/legacy-command-registry.js';
import { createRoleGuard } from '../src/core/role-guard.js';
import { createAppState } from '../src/app/app-state.js';
import { createAppRouter } from '../src/app/router.js';
import { installSc03Runtime } from '../src/app/bootstrap.js';

function makeCommands(log){
  const handlers={
    showView:n=>log.push(['legacy-showView',n]),
    'dashboard.open':()=>log.push(['legacy-dashboard']),
    openOpr:id=>log.push(['legacy-openOpr',id]),
    closeOpr:()=>log.push(['legacy-closeOpr']),
    openLap:id=>log.push(['legacy-openLap',id]),
    closeLap:()=>log.push(['legacy-closeLap']),
    openMst:id=>log.push(['legacy-openMst',id]),
    closeMst:()=>log.push(['legacy-closeMst']),
    openCartModal:()=>log.push(['legacy-cart']),
    'checkout.open':()=>log.push(['legacy-checkout']),
    'payment.open':method=>log.push(['legacy-payment',method])
  };
  return {
    has:alias=>alias in handlers,
    invoke:(alias,...args)=>{
      if(!(alias in handlers)) throw new Error(`missing:${alias}`);
      return handlers[alias](...args);
    }
  };
}

test('SC-03 app router owns primary/child state while invoking captured legacy renderer callers exactly once', async () => {
  const log=[];
  const state=createAppState({primary:'home'});
  const guard=createRoleGuard({readRole:()=> 'manajemen'});
  const router=createAppRouter({commands:makeCommands(log),guard,state});

  await router.openSales();
  await router.openOperational(3);
  await router.closeOperational();
  await router.openReport(5);
  await router.openSettings(9);
  await router.openCart();
  await router.openCheckout();
  await router.openPayment('QRIS');

  assert.deepEqual(log,[
    ['legacy-showView',1],
    ['legacy-showView',2],['legacy-openOpr',3],['legacy-closeOpr'],
    ['legacy-showView',3],['legacy-openLap',5],
    ['legacy-showView',4],['legacy-openMst',9],
    ['legacy-showView',1],['legacy-cart'],
    ['legacy-checkout'],
    ['legacy-payment','QRIS']
  ]);
  assert.deepEqual(state.snapshot(),{
    primary:'sales',
    child:{family:'transaction',key:'payment:qris',method:'QRIS'}
  });
});

test('SC-03 router preserves cashier role guard and never invokes denied legacy child caller', () => {
  const log=[];
  const denied=[];
  const router=createAppRouter({
    commands:makeCommands(log),
    guard:createRoleGuard({readRole:()=> 'transaksi',notify:(m,k)=>denied.push([m,k])}),
    state:createAppState({primary:'operational'})
  });
  assert.equal(router.openOperational(6),false);
  assert.equal(router.openReport(1),false);
  assert.equal(router.openSettings(1),false);
  assert.deepEqual(log,[]);
  assert.equal(denied.length,3);
});

test('SC-03 runtime bootstrap captures final legacy callers before replacing public entries and installs only once', () => {
  const log=[];
  const runtime={
    __SC03_READ_ROLE:()=> 'manajemen',
    showView:n=>log.push(['legacy-showView',n]),
    openOpr:id=>log.push(['legacy-openOpr',id]),
    closeOpr:()=>log.push(['legacy-closeOpr']),
    openLap:id=>log.push(['legacy-openLap',id]),
    closeLap:()=>log.push(['legacy-closeLap']),
    openMst:id=>log.push(['legacy-openMst',id]),
    closeMst:()=>log.push(['legacy-closeMst']),
    openCartModal:()=>log.push(['legacy-cart']),
    showToast:(m,k)=>log.push(['toast',m,k]),
    openCameraScanner:()=>log.push(['scanner']),
    showReportFullscreen:(...args)=>log.push(['report-fullscreen',...args]),
    SJX:{
      openDashboard:()=>log.push(['legacy-dashboard']),
      openNotifications:()=>log.push(['notifications'])
    },
    SJShift:{render:()=>log.push(['shift-render'])},
    SJCommercialFinalV5961:{openPayment:method=>log.push(['legacy-payment',method])},
    SJRefinementCheckoutV100:{openCheckout:()=>log.push(['legacy-checkout'])},
    SJAccountV5964:{open:()=>log.push(['account'])},
    SJInventoryV2:{open:mode=>log.push(['inventory',mode])},
    SJReportFoundationV010:{}
  };
  const oldShow=runtime.showView;
  const first=installSc03Runtime(runtime);
  const second=installSc03Runtime(runtime);
  assert.equal(first,second,'bootstrap must be idempotent');
  assert.notEqual(runtime.showView,oldShow,'public caller is cut over');

  runtime.showView(1);
  runtime.openOpr(3);
  runtime.openCartModal();
  runtime.SJX.openDashboard();
  first.router.openPayment('QRIS');
  first.router.invokeCommand('notifications.open');

  assert.deepEqual(log,[
    ['legacy-showView',1],
    ['legacy-showView',2],['legacy-openOpr',3],
    ['legacy-showView',1],['legacy-cart'],
    ['legacy-dashboard'],
    ['legacy-showView',1],['legacy-payment','QRIS'],
    ['notifications']
  ]);
  assert.equal(first.features.snapshot().featureCount,42);
  assert.equal(first.features.get('payments.qris').domain,first.services.qris);
  assert.equal(first.features.get('sales.checkout').domain,first.services.transaction);
  const snapshot=first.commands.snapshot();
  assert.equal(snapshot.installed.showView,'sc03-app-router');
  assert.equal(snapshot.installed.openOpr,'sc03-app-router');
  assert.equal(snapshot.installed['SJX.openDashboard'],'sc03-app-router');
  assert.ok(snapshot.captured.includes('payment.open'));
  assert.ok(snapshot.captured.includes('checkout.open'));
});
