import test from 'node:test';
import assert from 'node:assert/strict';

import { createLegacyCommandRegistry } from '../src/core/legacy-command-registry.js';
import { createRoleGuard, normalizeRole } from '../src/core/role-guard.js';
import {
  PRIMARY_ROUTES, OPERATIONAL_CHILDREN, REPORT_CHILDREN, SETTINGS_CHILDREN,
  legacyViewToRoute, transactionParentRoute
} from '../src/app/route-contract.js';
import { createAppState } from '../src/app/app-state.js';

test('SC-03 command registry captures final legacy authorities and installs each public caller only once', async () => {
  const calls=[];
  const runtime={
    showView(n){calls.push(['legacy-showView',n]);return `view:${n}`;},
    SJX:{openDashboard(){calls.push(['legacy-dashboard']);return 'dashboard';}}
  };
  const registry=createLegacyCommandRegistry(runtime);
  registry.captureFunction('showView');
  registry.captureMethod('SJX','openDashboard','dashboard.open');

  assert.equal(await registry.invoke('showView',2),'view:2');
  assert.equal(await registry.invoke('dashboard.open'),'dashboard');

  const wrapper=n=>`wrapped:${n}`;
  assert.equal(registry.installGlobal('showView',wrapper,'app-router'),true);
  assert.equal(runtime.showView(3),'wrapped:3');
  assert.equal(registry.installGlobal('showView',wrapper,'app-router'),false,'same owner install is idempotent');
  assert.throws(()=>registry.installGlobal('showView',()=>{},'another-owner'),/CALLER_ALREADY_OWNED/);

  const snap=registry.snapshot();
  assert.deepEqual(snap.captured.sort(),['dashboard.open','showView']);
  assert.equal(snap.installed.showView,'app-router');
  assert.deepEqual(calls,[['legacy-showView',2],['legacy-dashboard']]);
});

test('SC-03 role guard preserves v1.0.40 owner/cashier access semantics', () => {
  assert.equal(normalizeRole('manajemen'),'owner');
  assert.equal(normalizeRole('owner'),'owner');
  assert.equal(normalizeRole('transaksi'),'cashier');
  assert.equal(normalizeRole('kasir'),'cashier');

  let role='transaksi';
  const denied=[];
  const guard=createRoleGuard({readRole:()=>role,notify:(message,kind)=>denied.push([message,kind])});
  assert.equal(guard.canAccessPrimary('home'),true);
  assert.equal(guard.canAccessPrimary('sales'),true);
  assert.equal(guard.canAccessPrimary('operational'),true);
  assert.equal(guard.canAccessPrimary('reports'),true);
  assert.equal(guard.canAccessPrimary('settings'),false);
  assert.equal(guard.canAccessOperational(1),true);
  assert.equal(guard.canAccessOperational(3),true);
  assert.equal(guard.canAccessOperational(5),true);
  assert.equal(guard.canAccessOperational(6),false);
  assert.equal(guard.canAccessOperational(7),true);
  assert.equal(guard.canAccessOperational(9),true);
  assert.equal(guard.canAccessOperational(10),true);
  assert.equal(guard.canAccessOperational(11),false);
  assert.equal(guard.canAccessOperational(12),false);
  assert.equal(guard.canAccessReport(3),true);
  assert.equal(guard.canAccessReport(1),false);
  assert.equal(guard.canAccessSettings(1),false);
  assert.equal(guard.deny('Owner only'),false);
  assert.deepEqual(denied,[['Owner only','error']]);

  role='manajemen';
  for(const route of Object.keys(PRIMARY_ROUTES)) assert.equal(guard.canAccessPrimary(route),true,route);
  for(const id of [1,3,5,6,7,9,10,11,12]) assert.equal(guard.canAccessOperational(id),true,String(id));
  for(const id of Object.keys(REPORT_CHILDREN)) assert.equal(guard.canAccessReport(Number(id)),true,String(id));
  for(const id of Object.keys(SETTINGS_CHILDREN)) assert.equal(guard.canAccessSettings(Number(id)),true,String(id));
});

test('SC-03 route contract maps complete primary and live child capability families without reviving hidden legacy OPR 4', () => {
  assert.deepEqual(Object.keys(PRIMARY_ROUTES),['home','sales','operational','reports','settings']);
  assert.equal(legacyViewToRoute(1),'sales');
  assert.equal(legacyViewToRoute(2),'operational');
  assert.equal(legacyViewToRoute(3),'reports');
  assert.equal(legacyViewToRoute(4),'settings');
  assert.equal(legacyViewToRoute(5),'home');
  assert.equal(OPERATIONAL_CHILDREN[4].status,'legacy-hidden');
  assert.equal(OPERATIONAL_CHILDREN[9].key,'restock');
  assert.equal(OPERATIONAL_CHILDREN[12].key,'refund-void');
  assert.equal(REPORT_CHILDREN[5].key,'analysis');
  assert.equal(SETTINGS_CHILDREN[10].key,'employees');
  assert.equal(transactionParentRoute('cart'),'sales');
  assert.equal(transactionParentRoute('checkout'),'sales');
  assert.equal(transactionParentRoute('payment:qris'),'sales');
});

test('SC-03 app state keeps transaction children under Jual and clears stale child state when primary route changes', () => {
  const state=createAppState();
  state.setPrimary('home');
  state.setTransactionChild('cart');
  assert.equal(state.snapshot().primary,'sales');
  assert.equal(state.snapshot().child.family,'transaction');
  assert.equal(state.snapshot().child.key,'cart');
  state.setTransactionChild('checkout');
  assert.equal(state.snapshot().primary,'sales');
  assert.equal(state.snapshot().child.key,'checkout');
  state.setPrimary('reports');
  assert.equal(state.snapshot().primary,'reports');
  assert.equal(state.snapshot().child,null);
  state.setChild('operational','stock');
  assert.equal(state.snapshot().primary,'operational');
  assert.equal(state.snapshot().child.key,'stock');
});
