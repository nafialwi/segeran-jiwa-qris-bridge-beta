import test from 'node:test';
import assert from 'node:assert/strict';
import { POS_ROOT, QRIS_ROOT, posPath, qrisPath } from '../src/data/firebase-client.js';
import { createLegacyBridge } from '../src/core/legacy-bridge.js';

test('SC-02 fixed database roots and path builders preserve legacy contracts', () => {
  assert.equal(POS_ROOT, 'toko_segeranjiwa_v58');
  assert.equal(QRIS_ROOT, 'segeranjiwa_qris_beta_v1');
  assert.equal(posPath(), 'toko_segeranjiwa_v58');
  assert.equal(posPath('global', 'hutang', 'abc'), 'toko_segeranjiwa_v58/global/hutang/abc');
  assert.equal(posPath('/global/', '/inventoryV2/', ''), 'toko_segeranjiwa_v58/global/inventoryV2');
  assert.equal(qrisPath('pending', 'P-1'), 'segeranjiwa_qris_beta_v1/pending/P-1');
});

test('legacy bridge resolves and invokes active runtime authority exactly once', async () => {
  const calls=[];
  const runtime={
    processTransaction: async value => { calls.push(['tx',value]); return {ok:true,value}; },
    SJShift:{ status(){return 'ACTIVE'} }
  };
  const bridge=createLegacyBridge(runtime);
  assert.equal(bridge.get('missing'), undefined);
  assert.equal(bridge.require('SJShift'), runtime.SJShift);
  assert.equal(bridge.engine('shift'), runtime.SJShift);
  const out=await bridge.call('processTransaction', 7);
  assert.deepEqual(out,{ok:true,value:7});
  assert.deepEqual(calls,[['tx',7]]);
  assert.throws(()=>bridge.require('notThere'), /LEGACY_AUTHORITY_MISSING:notThere/);
});

test('legacy bridge snapshot reports authority presence without mutating runtime', () => {
  const runtime={processTransaction(){},SJQrisSignalBeta:{},SJInventoryV2:{},SJCostingV1:{},SJShift:{},SJReportFoundationV010:{}};
  const bridge=createLegacyBridge(runtime);
  assert.deepEqual(bridge.snapshot(),{
    processTransaction:true,qris:true,inventory:true,costing:true,shift:true,reports:true,operationalHardening:false
  });
});
