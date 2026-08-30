import test from 'node:test';
import assert from 'node:assert/strict';

import { createFeatureRuntime } from '../src/modules/runtime-registry.js';

function fakeRouter(log){
  return {
    openHome:()=>log.push(['home']),
    openSales:()=>log.push(['sales']),
    openPrimary:route=>log.push(['primary',route]),
    openOperational:id=>log.push(['operational',id]),
    closeOperational:()=>log.push(['operational-close']),
    openReport:id=>log.push(['report',id]),
    closeReport:()=>log.push(['report-close']),
    openSettings:id=>log.push(['settings',id]),
    closeSettings:()=>log.push(['settings-close']),
    openCart:()=>log.push(['cart']),
    openCheckout:()=>log.push(['checkout']),
    openPayment:method=>log.push(['payment',method]),
    invokeCommand:(alias,...args)=>log.push(['command',alias,...args])
  };
}

test('SC-03 feature runtime dispatches migrated public routes through concrete feature boundaries before the router', async()=>{
  const log=[];
  const services={qris:{name:'qris-domain'},transaction:{name:'tx-domain'},inventory:{name:'inventory-domain'},shift:{name:'shift-domain'},refundVoid:{name:'refund-domain'},report:{name:'report-domain'},debt:{name:'debt-domain'}};
  const features=createFeatureRuntime({
    router:fakeRouter(log),
    guard:{currentRole:()=> 'owner'},
    services
  });

  await features.navigateLegacyView(5);
  await features.navigateLegacyView(1);
  await features.openOperational(3);
  await features.openOperational(9);
  await features.openReport(1);
  await features.openSettings(9);
  await features.openCart();
  await features.openCheckout();
  await features.openPayment('QRIS');

  assert.deepEqual(log,[
    ['home'],['sales'],
    ['operational',3],['operational',9],
    ['report',1],['settings',9],
    ['cart'],['checkout'],['payment','QRIS']
  ]);
  assert.equal(features.get('payments.qris').domain,services.qris);
  assert.equal(features.get('sales.checkout').domain,services.transaction);
  assert.equal(features.get('operational.stock').domain,services.inventory);
  assert.equal(features.get('operational.shift').domain,services.shift);
  assert.equal(features.get('operational.refund-void').domain,services.refundVoid);
  assert.equal(features.get('reports.sales-report').domain,services.report);
});

test('SC-03 feature runtime preserves non-extracted live menu children through explicit compatibility route boundaries', async()=>{
  const log=[];
  const features=createFeatureRuntime({router:fakeRouter(log),guard:{currentRole:()=> 'owner'},services:{}});
  await features.openOperational(5);
  await features.openOperational(11);
  await features.openReport(3);
  await features.openReport(4);
  assert.deepEqual(log,[['operational',5],['operational',11],['report',3],['report',4]]);
  const snap=features.snapshot();
  assert.equal(snap.compatibilityRoutes['operational.5'],'customer-debt');
  assert.equal(snap.compatibilityRoutes['operational.11'],'cash-movement');
  assert.equal(snap.compatibilityRoutes['reports.3'],'shift');
  assert.equal(snap.compatibilityRoutes['reports.4'],'transactions');
});
