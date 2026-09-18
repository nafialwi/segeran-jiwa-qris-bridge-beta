import test from 'node:test';
import assert from 'node:assert/strict';
import { POS_ROOT } from '../src/data/firebase-client.js';
import { createStockComponentWriter } from '../src/data/writers/stock-component-writer.js';

const clone=value=>value===undefined?undefined:value===null?null:JSON.parse(JSON.stringify(value));
const parts=path=>String(path??'').split('/').filter(Boolean);

function getAt(root,path){
  let cur=root;
  for(const key of parts(path)){
    if(cur==null||typeof cur!=='object'||!(key in cur))return null;
    cur=cur[key];
  }
  return clone(cur);
}

function setAt(root,path,value){
  const seg=parts(path);
  if(!seg.length)throw new Error('TEST_ROOT_REPLACE_FORBIDDEN');
  let cur=root;
  for(let i=0;i<seg.length-1;i++){
    if(!cur[seg[i]]||typeof cur[seg[i]]!=='object')cur[seg[i]]={};
    cur=cur[seg[i]];
  }
  cur[seg.at(-1)]=clone(value);
}

function patchAt(root,base,patch){
  for(const [rel,value] of Object.entries(patch||{})){
    setAt(root,[...parts(base),...parts(rel)].join('/'),value);
  }
}

function fakeDb(initial={},options={}){
  const data=clone(initial)||{};
  const traces=[];
  let failUpdates=Number(options.failUpdates||0);
  return {
    data,
    traces,
    ref(path=''){
      const refPath=String(path||'');
      return {
        once:async type=>{
          assert.equal(type,'value');
          traces.push({method:'once',path:refPath});
          return {val:()=>getAt(data,refPath)};
        },
        transaction:async fn=>{
          traces.push({method:'transaction',path:refPath});
          const current=getAt(data,refPath);
          const next=fn(clone(current));
          if(next===undefined){
            return {committed:false,snapshot:{val:()=>clone(current)}};
          }
          setAt(data,refPath,next);
          return {committed:true,snapshot:{val:()=>clone(next)}};
        },
        update:async patch=>{
          traces.push({method:'update',path:refPath,patch:clone(patch)});
          if(failUpdates>0){
            failUpdates--;
            const error=new Error('SIMULATED_UPDATE_FAILURE');
            error.code='SIMULATED_UPDATE_FAILURE';
            throw error;
          }
          patchAt(data,refPath,patch);
        }
      };
    }
  };
}

function seedBalances(rows){
  const ingredients={};
  for(const [id,outlet] of Object.entries(rows)){
    ingredients[id]={outlet,warehouse:0};
  }
  return {[POS_ROOT]:{global:{inventoryV2:{balances:{ingredients}}}}};
}

function saleInput(overrides={}){
  return {
    shiftKey:'2026-09-18-A',
    txId:'TX-1',
    transaction:{status:'COMPLETED',cartData:[{id:'P1',q:2}]},
    mapping:{P1:{
      STK_CUP:{qtyPerUnit:1,active:true},
      STK_STRAW:{qtyPerUnit:1,active:true}
    }},
    stockItems:{
      STK_CUP:{name:'Cup 22 oz',unit:'pcs'},
      STK_STRAW:{name:'Sedotan',unit:'pcs'}
    },
    actor:{id:'cashier-1',name:'Kasir Satu',role:'transaksi'},
    ...overrides
  };
}

test('Owner-only configuration writes only Inventory V2 productStockComponents',async()=>{
  const db=fakeDb({[POS_ROOT]:{global:{inventoryV2:{}}}});
  const writer=createStockComponentWriter({db,now:()=>1000,serverTimestamp:()=>1000});

  await assert.rejects(
    writer.saveProductComponents({
      productId:'P1',
      components:{STK_CUP:{qtyPerUnit:1,active:true}},
      actor:{id:'cashier-1',role:'transaksi'}
    }),
    error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED'
  );

  const saved=await writer.saveProductComponents({
    productId:'P1',
    components:{
      STK_CUP:{qtyPerUnit:1,active:true},
      STK_STRAW:{qtyPerUnit:1,active:true}
    },
    actor:{id:'owner-1',name:'Owner',role:'manajemen'}
  });

  assert.equal(saved.productId,'P1');
  assert.deepEqual(
    Object.keys(getAt(db.data,`${POS_ROOT}/global/inventoryV2/productStockComponents/P1`)).sort(),
    ['STK_CUP','STK_STRAW']
  );
  const writePaths=db.traces.filter(x=>x.method!=='once').map(x=>x.path);
  assert.deepEqual(writePaths,[`${POS_ROOT}/global/inventoryV2/productStockComponents/P1`]);
  for(const path of writePaths){
    assert.equal(path.includes('/global/stockBalances'),false);
    assert.equal(path.includes('/global/stockMovements'),false);
    assert.equal(path.includes('/global/stockApplications'),false);
    assert.equal(path.includes('/global/productStockComponents'),false);
  }
});

test('first completed sale consumes multiple canonical outlet components exactly once',async()=>{
  const db=fakeDb(seedBalances({STK_CUP:10,STK_STRAW:20}));
  const writer=createStockComponentWriter({db,now:()=>2000,serverTimestamp:()=>2000});
  const input=saleInput();

  const first=await writer.applyCompletedSale(input);
  assert.equal(first.status,'COMPLETED');
  assert.equal(first.result,'APPLIED');
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),8);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),18);

  const retry=await writer.applyCompletedSale(input);
  assert.equal(retry.status,'COMPLETED');
  assert.equal(retry.result,'ALREADY_APPLIED');
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),8);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),18);

  const movements=getAt(db.data,`${POS_ROOT}/global/inventoryV2/movements`);
  assert.equal(Object.keys(movements).length,2);
  assert.deepEqual(
    Object.values(movements).map(x=>[x.itemId,x.delta,x.type]).sort(),
    [['STK_CUP',-2,'SALE_COMPONENT'],['STK_STRAW',-2,'SALE_COMPONENT']]
  );
});

test('recovery after terminal update failure does not decrement an APPLIED marker twice',async()=>{
  const db=fakeDb(seedBalances({STK_CUP:10,STK_STRAW:20}),{failUpdates:1});
  const writer=createStockComponentWriter({db,now:()=>3000,serverTimestamp:()=>3000});
  const input=saleInput({txId:'TX-RECOVER'});

  await assert.rejects(
    writer.applyCompletedSale(input),
    error=>error?.code==='SIMULATED_UPDATE_FAILURE'
  );

  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),8);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),18);

  const recovered=await writer.recoverApplication({
    shiftKey:input.shiftKey,
    txId:input.txId,
    actor:input.actor
  });

  assert.equal(recovered.status,'COMPLETED');
  assert.equal(recovered.result,'RECOVERED');
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),8);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),18);
  assert.equal(Object.keys(getAt(db.data,`${POS_ROOT}/global/inventoryV2/movements`)).length,2);
});

test('shortage rolls back earlier deductions and cannot commit negative outlet stock',async()=>{
  const db=fakeDb(seedBalances({STK_CUP:5,STK_STRAW:0}));
  const writer=createStockComponentWriter({db,now:()=>4000,serverTimestamp:()=>4000});
  const input=saleInput({txId:'TX-SHORT'});

  const result=await writer.applyCompletedSale(input);
  assert.equal(result.status,'SHORTAGE');
  assert.equal(result.result,'SHORTAGE');
  assert.deepEqual(result.shortageItems,['STK_STRAW']);

  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),5);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),0);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/movements`),null);

  const retry=await writer.applyCompletedSale(input);
  assert.equal(retry.status,'SHORTAGE');
  assert.equal(retry.result,'SHORTAGE');
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),5);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),0);
});

test('sale application rejects non-COMPLETED transaction and unauthorized actor',async()=>{
  const db=fakeDb(seedBalances({STK_CUP:10,STK_STRAW:10}));
  const writer=createStockComponentWriter({db,now:()=>5000,serverTimestamp:()=>5000});

  await assert.rejects(
    writer.applyCompletedSale(saleInput({transaction:{status:'PENDING',cartData:[{id:'P1',q:1}]}})),
    error=>error?.code==='STOCK_COMPONENT_TX_NOT_COMPLETED'
  );

  await assert.rejects(
    writer.applyCompletedSale(saleInput({actor:{id:'guest',role:'guest'}})),
    error=>error?.code==='STOCK_COMPONENT_SALE_ACTOR_REQUIRED'
  );
});

test('zero-value monetary sale still consumes physical stock',async()=>{
  const db=fakeDb(seedBalances({STK_CUP:3,STK_STRAW:3}));
  const writer=createStockComponentWriter({db,now:()=>6000,serverTimestamp:()=>6000});
  const result=await writer.applyCompletedSale(saleInput({
    txId:'TX-ZERO',
    transaction:{status:'COMPLETED',total:0,cartData:[{id:'P1',q:1,p:0,total:0}]}
  }));

  assert.equal(result.status,'COMPLETED');
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),2);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),2);
});

test('application journal keeps the original immutable snapshot when mapping changes on retry',async()=>{
  const db=fakeDb(seedBalances({STK_CUP:10,STK_STRAW:10}),{failUpdates:1});
  const writer=createStockComponentWriter({db,now:()=>7000,serverTimestamp:()=>7000});
  const input=saleInput({txId:'TX-IMMUTABLE'});

  await assert.rejects(writer.applyCompletedSale(input),/SIMULATED_UPDATE_FAILURE/);

  const changed=saleInput({
    txId:'TX-IMMUTABLE',
    mapping:{P1:{STK_CUP:{qtyPerUnit:9,active:true}}},
    stockItems:{STK_CUP:{name:'Changed',unit:'pcs'}}
  });
  const retry=await writer.applyCompletedSale(changed);

  assert.equal(retry.status,'COMPLETED');
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_CUP/outlet`),8);
  assert.equal(getAt(db.data,`${POS_ROOT}/global/inventoryV2/balances/ingredients/STK_STRAW/outlet`),8);
});

test('completed movement timestamp converts the injected numeric clock to ISO evidence',async()=>{
  const fixedNow=8000;
  const db=fakeDb(seedBalances({STK_CUP:4,STK_STRAW:4}));
  const writer=createStockComponentWriter({db,now:()=>fixedNow,serverTimestamp:()=>fixedNow});

  const result=await writer.applyCompletedSale(saleInput({txId:'TX-TIME'}));
  assert.equal(result.status,'COMPLETED');

  const movements=Object.values(getAt(db.data,`${POS_ROOT}/global/inventoryV2/movements`));
  assert.equal(movements.length,2);
  for(const movement of movements){
    assert.equal(movement.ts,fixedNow);
    assert.equal(movement.at,new Date(fixedNow).toISOString());
  }
});
