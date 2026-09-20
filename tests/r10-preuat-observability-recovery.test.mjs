import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { installLegacyStockComponentsRuntime } from '../src/compat/legacy-stock-components-runtime.js';
import { renderInventoryWorkspaceV32 } from '../src/ui/inventory-workspace-v32.js';

const clone=value=>value==null?value:structuredClone(value);
function memoryStorage(){let value=null;return{read:()=>clone(value),write:v=>(value=clone(v)),dump:()=>clone(value)}}

function fixture({
  role='manajemen',
  baseResult='TX1',
  apply=async()=>({status:'COMPLETED',result:'APPLIED',applicationId:'APP1'}),
  mapping={P1:{STRAW:{stockItemId:'STRAW',qtyPerUnit:1,active:true}}},
  stockItem={name:'Sedotan',unit:'pcs',active:true},
  transactions={TX1:{status:'COMPLETED',ts:1200,cartData:[{id:'P1',q:1,p:5000}]}}
}={}){
  const storage=memoryStorage();
  let baseCalls=0,applyCalls=0,restoreCalls=0,financialCalls=0;
  const production={async verifiedUpdate(){financialCalls++;return 'FINANCIAL_COMMITTED'}};
  const runtime={
    currentUserRole:role,currentLoginId:'owner-1',currentUserName:'Owner',
    localStorage:storage,console:{warn(){}},showToast(){},setTimeout(){return 0},
    SJProductionHardening:production,
    async processTransaction(){baseCalls++;return baseResult}
  };
  const repository={
    async readProductStockComponents(){return clone(mapping)},
    async readStockItem(){return clone(stockItem)}
  };
  const writer={
    async applyCompletedSale(input){applyCalls++;return await apply(input,applyCalls)},
    async restoreRefund(){restoreCalls++;return{status:'COMPLETED',result:'RESTORED'}},
    async restoreVoid(){restoreCalls++;return{status:'COMPLETED',result:'RESTORED'}}
  };
  const context={snapshotSale:()=>({shiftKey:'2026-09-20-S1',cart:[{id:'P1',q:1,p:5000}],actor:{id:'cashier',name:'Kasir',role:'transaksi'},preTxKeys:[],capturedAt:1000})};
  const reader={
    async readById(_shift,id){return clone(transactions[id]||null)},
    async readRecent(){return clone(transactions)}
  };
  const api=installLegacyStockComponentsRuntime(runtime,{inventoryRepository:repository,stockComponentWriter:writer,legacyContext:context,transactionReader:reader,storage,now:()=>1500,autoRecover:false});
  return {api,runtime,production,storage,baseCalls:()=>baseCalls,applyCalls:()=>applyCalls,restoreCalls:()=>restoreCalls,financialCalls:()=>financialCalls};
}

test('PU-08 health snapshot starts healthy with zero pending and zero shortage',()=>{
  const f=fixture();
  assert.deepEqual(f.api.health(),{
    enabled:true,
    state:'HEALTHY',
    pendingCount:0,
    shortageCount:0,
    pendingKinds:{sale:0,refund:0,void:0},
    lastErrorCode:'',
    controlReason:''
  });
});

test('PU-08 failed stock sync becomes visible pending and safe retry never reruns financial sale',async()=>{
  const f=fixture({apply:async(_input,n)=>{if(n===1)throw Object.assign(new Error('network'),{code:'NETWORK'});return{status:'COMPLETED',result:'RECOVERED',applicationId:'APP1'}}});
  assert.equal(await f.runtime.processTransaction(),'TX1');
  assert.equal(f.baseCalls(),1);
  assert.equal(f.api.health().state,'ATTENTION');
  assert.equal(f.api.health().pendingCount,1);
  assert.equal(f.api.health().lastErrorCode,'NETWORK');
  const result=await f.api.retryPending();
  assert.equal(result.length,1);
  assert.equal(result[0].status,'COMPLETED');
  assert.equal(f.baseCalls(),1,'retry must not execute financial sale owner again');
  assert.equal(f.applyCalls(),2);
  assert.equal(f.api.health().pendingCount,0);
});

test('PU-08 failed retry remains pending with explicit attempt/error evidence',async()=>{
  const f=fixture({apply:async()=>{throw Object.assign(new Error('offline'),{code:'OFFLINE'})}});
  await f.runtime.processTransaction();
  await f.api.retryPending();
  const pending=f.api.pendingJobs();
  assert.equal(pending.length,1);
  assert.ok(pending[0].recovery.attempts>=2);
  assert.equal(pending[0].recovery.lastCode,'OFFLINE');
  assert.equal(f.api.health().lastErrorCode,'OFFLINE');
});

test('PU-08 shortage is visible attention but is never converted into retryable pending work',async()=>{
  const f=fixture({apply:async()=>({status:'SHORTAGE',result:'SHORTAGE',applicationId:'APP-SHORT',shortageItems:['STRAW']})});
  await f.runtime.processTransaction();
  const health=f.api.health();
  assert.equal(health.state,'ATTENTION');
  assert.equal(health.pendingCount,0);
  assert.equal(health.shortageCount,1);
  assert.equal(health.lastErrorCode,'STOCK_COMPONENT_SHORTAGE');
  assert.equal((await f.api.retryPending()).length,0);
  assert.equal(f.applyCalls(),1);
});

test('PU-08 persistent kill switch blocks mapped sale before financial commit and owner can explicitly re-enable it',async()=>{
  const f=fixture();
  assert.equal(f.api.setSyncEnabled(false,{reason:'UAT emergency'}).enabled,false);
  assert.equal(await f.runtime.processTransaction(),false);
  assert.equal(f.baseCalls(),0);
  assert.equal(f.applyCalls(),0);
  assert.equal(f.api.health().state,'DISABLED');
  assert.equal(f.api.setSyncEnabled(true,{reason:'review complete'}).enabled,true);
  assert.equal(await f.runtime.processTransaction(),'TX1');
  assert.equal(f.baseCalls(),1);
});

test('PU-08 kill switch control is management-only and persists through the existing local-store boundary',()=>{
  const owner=fixture();
  owner.api.setSyncEnabled(false,{reason:'incident'});
  const envelope=owner.storage.dump();
  assert.equal(envelope.control.enabled,false);
  assert.equal(envelope.control.reason,'incident');

  const cashier=fixture({role:'transaksi'});
  assert.throws(()=>cashier.api.setSyncEnabled(false,{reason:'x'}),error=>error?.code==='STOCK_SYNC_CONTROL_OWNER_REQUIRED');
});

test('PU-08 Inventory summary exposes health, pending/shortage visibility, retry and kill-switch controls without direct DB mutation',()=>{
  const healthy=renderInventoryWorkspaceV32({
    tab:'summary',rows:[],
    stockSyncHealth:{enabled:true,state:'ATTENTION',pendingCount:2,shortageCount:1,pendingKinds:{sale:1,refund:1,void:0},lastErrorCode:'NETWORK',controlReason:''}
  });
  assert.match(healthy,/Sinkronisasi Pemakaian Stok/);
  assert.match(healthy,/2 tertunda/);
  assert.match(healthy,/1 stok kurang/);
  assert.match(healthy,/data-v32-stock-sync-retry/);
  assert.match(healthy,/data-v32-stock-sync-toggle/);

  const disabled=renderInventoryWorkspaceV32({
    tab:'summary',rows:[],
    stockSyncHealth:{enabled:false,state:'DISABLED',pendingCount:2,shortageCount:0,pendingKinds:{sale:2,refund:0,void:0},lastErrorCode:'',controlReason:'incident'}
  });
  assert.match(disabled,/Sinkron stok dihentikan/);
  assert.doesNotMatch(disabled,/data-v32-stock-sync-retry/);

  const source=fs.readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/firebase\s*\.\s*database\s*\(/i);
  assert.doesNotMatch(source,/\.ref\s*\([^)]*\)\s*\.\s*(?:set|update|transaction|remove)\s*\(/);
});


test('PU-08 disabled sync queues refund stock restoration after finance commit and retry never repeats finance',async()=>{
  const f=fixture();
  f.api.setSyncEnabled(false,{reason:'incident'});
  const updates={
    '2026-09-20-S1/tx/TX1/lastRefundId':'RF1',
    'global/refunds/RF1':{id:'RF1',returnStock:true,items:[{lineIndex:0,id:'P1',q:1}]},
    'global/auditLogs/A1':{action:'REFUND',userId:'owner-1',user:'Owner',role:'manajemen'}
  };
  assert.equal(await f.production.verifiedUpdate(updates,'REFUND_ATOMIC_TIMEOUT'),'FINANCIAL_COMMITTED');
  assert.equal(f.financialCalls(),1);
  assert.equal(f.restoreCalls(),0);
  assert.equal(f.api.health().pendingKinds.refund,1);
  f.api.setSyncEnabled(true,{reason:'review complete'});
  const result=await f.api.retryPending();
  assert.equal(result.length,1);
  assert.equal(result[0].status,'COMPLETED');
  assert.equal(f.restoreCalls(),1);
  assert.equal(f.financialCalls(),1,'stock recovery must not replay the finance mutation');
  assert.equal(f.api.health().pendingCount,0);
});

test('PU-08 kill switch does not block products without Product Stock Components mapping',async()=>{
  const f=fixture({mapping:{}});
  f.api.setSyncEnabled(false,{reason:'mapped stock incident'});
  assert.equal(await f.runtime.processTransaction(),'TX1');
  assert.equal(f.baseCalls(),1);
  assert.equal(f.applyCalls(),0);
});
