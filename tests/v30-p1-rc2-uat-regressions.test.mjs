import test from 'node:test';
import assert from 'node:assert/strict';
import * as stateModule from '../src/app/app-state.js';
import * as refBootstrap from '../src/app/ref01-bootstrap.js';
import { installNotificationRefinement } from '../src/ui/notification-refinement.js';
import { renderV29OwnerReport } from '../src/ui/report-refinement.js';

test('RC2 app state exposes deterministic subscription so SC03 captured navigation still triggers presentation reconciliation',()=>{
  const state=stateModule.createAppState({primary:'home'});
  assert.equal(typeof state.subscribe,'function');
  const seen=[];
  const off=state.subscribe(snapshot=>seen.push(snapshot.primary));
  state.setPrimary('settings');
  assert.deepEqual(seen,['settings']);
  off();
  state.setPrimary('sales');
  assert.deepEqual(seen,['settings']);
});

test('RC2 effective role layout is reconciled to document attributes independently of stale renderer state',()=>{
  assert.equal(typeof refBootstrap.reconcileLayoutPreferences,'function');
  const document={documentElement:{dataset:{}}};
  const runtime={SJMobileUX:{settings(){return {productColumns:4,operationColumns:2,reportColumns:3,managementColumns:2,productMasterColumns:3,compactCards:false}}}};
  const result=refBootstrap.reconcileLayoutPreferences(document,runtime);
  assert.equal(result.productColumns,4);
  assert.equal(document.documentElement.dataset.sjProductCols,'4');
  assert.equal(document.documentElement.dataset.sjReportCols,'3');
  assert.equal(document.documentElement.dataset.sjMasterCols,'3');
});

test('RC2 notification refinement can reclaim unread-only bell authority after a late legacy owner patch overwrites updateBell',()=>{
  let synced=0;
  const runtime={
    SJX:{renderNotifications(){return 'legacy-render'},updateBell(){return 9}},
    SJRef01ProductionSalesCompat:{syncUnreadBadge(){synced++;return 0}},
    document:{getElementById(){return null}}
  };
  const api=installNotificationRefinement(runtime,{decorate(){}});
  assert.equal(runtime.SJX.updateBell(),0);
  runtime.SJX.updateBell=()=>2; // late legacy patch: smart/unresolved conditions mixed back into the badge
  assert.equal(runtime.SJX.updateBell(),2);
  assert.equal(typeof api.reconcileAuthority,'function');
  api.reconcileAuthority();
  assert.equal(runtime.SJX.updateBell(),0,'badge must return to persistent unread-only count');
  assert.ok(synced>=2);
});

test('RC2 Top Produk CTA and Barang Terjual use compact structured mobile markup',()=>{
  const transactions=[{id:'T1',status:'PAID',total:21000,items:[{id:'cilok',name:'CILOK',qty:42,price:500}]}];
  const html=renderV29OwnerReport({}, {transactions,expenses:[],shifts:[],period:{label:'Hari ini'}}, {
    state:{scope:'day',anchorDate:'2026-09-02',shift:'ALL',day:'ALL',week:'ALL',metric:'revenue',topSort:'qty',customFrom:'2026-08-04',customTo:'2026-09-02'},
    compat:{outletStock(){return 41}}
  });
  assert.doesNotMatch(html,/Lihat Semua &amp; Detail Item/);
  assert.match(html,/sjv30-report-link/);
  assert.match(html,/Lihat semua produk terjual/);
  assert.match(html,/sjv30-sold-row/);
  assert.match(html,/sjv30-sold-metrics/);
  assert.match(html,/Stok Gerai Saat Ini/);
});
