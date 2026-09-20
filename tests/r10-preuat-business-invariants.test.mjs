import test from 'node:test';
import assert from 'node:assert/strict';

import { POS_ROOT } from '../src/data/firebase-client.js';
import { createStockComponentWriter } from '../src/data/writers/stock-component-writer.js';
import { installLegacyStockComponentsRuntime, correctionFromVerifiedUpdate } from '../src/compat/legacy-stock-components-runtime.js';
import { installProductStockComponentsUi } from '../src/ui/product-stock-components-ui.js';

const clone=value=>value==null?value:structuredClone(value);
const ipath=(...parts)=>[POS_ROOT,'global','inventoryV2',...parts].join('/');

function splitPath(path){return String(path||'').split('/').filter(Boolean)}
function getAt(root,path){
  let cur=root;
  for(const part of splitPath(path)){if(cur==null)return null;cur=cur[part]}
  return cur===undefined?null:clone(cur);
}
function setAt(root,path,value){
  const parts=splitPath(path);let cur=root;
  for(let i=0;i<parts.length-1;i++)cur=cur[parts[i]]??={};
  cur[parts.at(-1)]=clone(value);
}
function patchAt(root,path,patch){
  for(const [key,value] of Object.entries(patch||{}))setAt(root,[...splitPath(path),...splitPath(key)].join('/'),value);
}
function fakeDb(seed={}){
  const data=clone(seed),traces=[];
  return {
    data,traces,
    ref(path){
      const refPath=String(path||'');
      return {
        once:async()=>({val:()=>getAt(data,refPath)}),
        transaction:async fn=>{
          traces.push({method:'transaction',path:refPath});
          const current=getAt(data,refPath),next=fn(clone(current));
          if(next===undefined)return {committed:false,snapshot:{val:()=>clone(current)}};
          setAt(data,refPath,next);
          return {committed:true,snapshot:{val:()=>clone(next)}};
        },
        update:async patch=>{traces.push({method:'update',path:refPath,patch:clone(patch)});patchAt(data,refPath,patch)}
      };
    }
  };
}
function seedBalances(rows){
  const ingredients={};
  for(const [id,outlet] of Object.entries(rows))ingredients[id]={outlet,warehouse:0};
  return {[POS_ROOT]:{global:{inventoryV2:{balances:{ingredients}}}}};
}
function saleInput(overrides={}){
  return {
    shiftKey:'2026-09-20-S1',
    txId:'TX-INV',
    transaction:{status:'COMPLETED',cartData:[{id:'P1',q:3,p:5000}]},
    mapping:{P1:{STRAW:{stockItemId:'STRAW',qtyPerUnit:1,active:true}}},
    stockItems:{STRAW:{name:'Sedotan',unit:'pcs'}},
    actor:{id:'cashier-1',name:'Kasir',role:'transaksi'},
    ...overrides
  };
}
function memoryStorage(){let value=null;return{read:()=>clone(value),write:v=>(value=clone(v)),dump:()=>clone(value)}}

test('PU-07 same stock application identity cannot silently accept a different transaction line fingerprint',async()=>{
  const db=fakeDb(seedBalances({STRAW:20}));
  const writer=createStockComponentWriter({db,now:()=>1000});
  await writer.applyCompletedSale(saleInput());
  await assert.rejects(
    writer.applyCompletedSale(saleInput({transaction:{status:'COMPLETED',cartData:[{id:'P1',q:2,p:5000}]}})),
    error=>error?.code==='STOCK_COMPONENT_APPLICATION_IDENTITY_CONFLICT'
  );
  assert.equal(getAt(db.data,ipath('balances','ingredients','STRAW','outlet')),17);
});

test('PU-07 a reused refund id with a conflicting payload fails closed instead of reusing old restore evidence',async()=>{
  const db=fakeDb(seedBalances({STRAW:20}));
  const writer=createStockComponentWriter({db,now:()=>2000});
  const input=saleInput({txId:'TX-RF-CONFLICT'});
  await writer.applyCompletedSale(input);
  const base={shiftKey:input.shiftKey,txId:input.txId,refundId:'RF-SAME',transaction:{status:'REFUND'},actor:{id:'owner',name:'Owner',role:'manajemen'}};
  await writer.restoreRefund({...base,refundLines:[{lineIndex:0,id:'P1',q:1}]});
  await assert.rejects(
    writer.restoreRefund({...base,refundLines:[{lineIndex:0,id:'P1',q:2}]}),
    error=>error?.code==='STOCK_RESTORE_IDENTITY_CONFLICT'
  );
  assert.equal(getAt(db.data,ipath('balances','ingredients','STRAW','outlet')),18);
});

test('PU-07 refund parser preserves missing original lineIndex so unique product matching can resolve safely',()=>{
  const updates={
    '2026-09-20-S1/tx/TX1/lastRefundId':'RF1',
    'global/refunds/RF1':{id:'RF1',returnStock:true,items:[{id:'P2',q:1}]},
    'global/auditLogs/A1':{action:'REFUND',userId:'owner',user:'Owner',role:'manajemen'}
  };
  const correction=correctionFromVerifiedUpdate(updates,'REFUND_ATOMIC_TIMEOUT');
  assert.deepEqual(correction.refundLines,[{productId:'P2',q:1}]);
});

test('PU-07 a physical-stock refund with no refund lines cannot be recorded as a successful no-op restore',async()=>{
  const db=fakeDb(seedBalances({STRAW:10}));
  const writer=createStockComponentWriter({db,now:()=>3000});
  const input=saleInput({txId:'TX-RF-EMPTY',transaction:{status:'COMPLETED',cartData:[{id:'P1',q:1}]}});
  await writer.applyCompletedSale(input);
  await assert.rejects(
    writer.restoreRefund({shiftKey:input.shiftKey,txId:input.txId,refundId:'RF-EMPTY',refundLines:[],actor:{id:'owner',role:'manajemen'}}),
    error=>error?.code==='STOCK_REFUND_LINES_REQUIRED'
  );
  assert.equal(getAt(db.data,ipath('balances','ingredients','STRAW','outlet')),9);
});

test('PU-07 inactive mapped Stock Item is rejected before the financial sale owner is invoked',async()=>{
  let baseCalls=0,applyCalls=0;
  const storage=memoryStorage();
  const runtime={
    console:{warn(){}},showToast(){},setTimeout(){return 0},
    async processTransaction(){baseCalls++;return 'TX-INACTIVE'}
  };
  const repository={
    async readProductStockComponents(){return {STRAW:{stockItemId:'STRAW',qtyPerUnit:1,active:true}}},
    async readStockItem(){return {name:'Sedotan',unit:'pcs',active:false}}
  };
  const writer={async applyCompletedSale(){applyCalls++;return{status:'COMPLETED'}}};
  const context={snapshotSale:()=>({shiftKey:'2026-09-20-S1',cart:[{id:'P1',q:1,p:5000}],actor:{id:'cashier',role:'transaksi'},preTxKeys:[],capturedAt:1000})};
  const reader={async readById(){return null},async readRecent(){return{}}};
  installLegacyStockComponentsRuntime(runtime,{inventoryRepository:repository,stockComponentWriter:writer,legacyContext:context,transactionReader:reader,storage,now:()=>1500,autoRecover:false});
  assert.equal(await runtime.processTransaction(),false);
  assert.equal(baseCalls,0);
  assert.equal(applyCalls,0);
});

test('PU-07 shortage is terminal for the sale application even if stock is replenished later',async()=>{
  const db=fakeDb(seedBalances({STRAW:0}));
  const writer=createStockComponentWriter({db,now:()=>4000});
  const input=saleInput({txId:'TX-SHORT-TERMINAL',transaction:{status:'COMPLETED',cartData:[{id:'P1',q:1}]}});
  const first=await writer.applyCompletedSale(input);
  assert.equal(first.status,'SHORTAGE');
  setAt(db.data,ipath('balances','ingredients','STRAW','outlet'),5);
  const retry=await writer.applyCompletedSale(input);
  assert.equal(retry.status,'SHORTAGE');
  assert.equal(getAt(db.data,ipath('balances','ingredients','STRAW','outlet')),5);
  assert.equal(getAt(db.data,ipath('movements')),null);
});

test('PU-07 full void after a partial refund restores only the remaining historical allocation',async()=>{
  const db=fakeDb(seedBalances({STRAW:10}));
  const writer=createStockComponentWriter({db,now:()=>5000});
  const input=saleInput({txId:'TX-RF-VOID'});
  await writer.applyCompletedSale(input);
  await writer.restoreRefund({shiftKey:input.shiftKey,txId:input.txId,refundId:'RF-1',refundLines:[{lineIndex:0,id:'P1',q:1}],actor:{id:'owner',role:'manajemen'}});
  assert.equal(getAt(db.data,ipath('balances','ingredients','STRAW','outlet')),8);
  await writer.restoreVoid({shiftKey:input.shiftKey,txId:input.txId,voidId:'VOID-1',actor:{id:'owner',role:'manajemen'}});
  assert.equal(getAt(db.data,ipath('balances','ingredients','STRAW','outlet')),10);
  const app=await writer.readApplication({shiftKey:input.shiftKey,txId:input.txId});
  assert.equal(app.restoredLines['0'],3);
});

test('PU-07 stale Product Stock Components editor data cannot save an item archived after load',async()=>{
  let writes=0,readCount=0;
  const ui=installProductStockComponentsUi({currentUserRole:'manajemen',currentLoginId:'owner',currentUserName:'Owner'},{
    document:null,
    inventoryRepository:{
      async readProductStockComponents(){return {STRAW:{stockItemId:'STRAW',qtyPerUnit:1,active:true}}},
      async readStockItems(){readCount++;return readCount===1?{STRAW:{name:'Sedotan',unit:'pcs',active:true}}:{STRAW:{name:'Sedotan',unit:'pcs',active:false}}}
    },
    stockComponentWriter:{async saveProductComponents(){writes++}}
  });
  await ui.openProduct('P1');
  await assert.rejects(ui.saveProduct('P1',[{stockItemId:'STRAW',qtyPerUnit:1}]),error=>error?.code==='STOCK_ITEM_INACTIVE');
  assert.equal(writes,0);
});
