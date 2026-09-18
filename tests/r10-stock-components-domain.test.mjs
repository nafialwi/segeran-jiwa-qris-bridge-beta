import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  normalizeStockComponents,
  componentsForProduct,
  aggregateSaleComponents,
  stockApplicationId,
  stockRestoreId,
  buildApplicationSnapshot,
  restoreAllocation,
  stockComponentFingerprint
} from '../src/domain/product-stock-components.js';

const sourcePath=new URL('../src/domain/product-stock-components.js',import.meta.url);

test('Product Stock Components domain stays outside generic RTDB mutation token gates',()=>{
  const source=fs.readFileSync(sourcePath,'utf8');
  assert.doesNotMatch(source,/\.(?:set|update|transaction|remove)\s*\(/);
  assert.doesNotMatch(source,/\b(?:db|database|firebase)\s*\.\s*ref\s*\(/i);
});

test('normalizeStockComponents normalizes object mappings in deterministic order',()=>{
  const result=normalizeStockComponents({
    STK_STRAW:{qtyPerUnit:1,active:true},
    STK_CUP22D:{qtyPerUnit:1,active:true}
  });
  assert.deepEqual(result,[
    {stockItemId:'STK_CUP22D',qtyPerUnit:1,active:true},
    {stockItemId:'STK_STRAW',qtyPerUnit:1,active:true}
  ]);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(Object.isFrozen(result[0]),true);
});

test('normalizeStockComponents collapses identical duplicate rows instead of double-counting them',()=>{
  const result=normalizeStockComponents([
    {stockItemId:'STK_CUP22D',qtyPerUnit:1,active:true},
    {stockItemId:'STK_CUP22D',qtyPerUnit:1,active:true}
  ]);
  assert.deepEqual(result,[
    {stockItemId:'STK_CUP22D',qtyPerUnit:1,active:true}
  ]);
});

test('normalizeStockComponents rejects zero, negative and non-finite usage',()=>{
  for(const qty of [0,-1,NaN,Infinity]){
    assert.throws(
      ()=>normalizeStockComponents([{stockItemId:'STK_X',qtyPerUnit:qty}]),
      error=>error?.code==='STOCK_COMPONENT_QTY_INVALID'
    );
  }
});

test('normalizeStockComponents rejects conflicting duplicate quantities',()=>{
  assert.throws(
    ()=>normalizeStockComponents([
      {stockItemId:'STK_X',qtyPerUnit:1},
      {stockItemId:'STK_X',qtyPerUnit:2}
    ]),
    error=>error?.code==='STOCK_COMPONENT_DUPLICATE_CONFLICT'
  );
});

test('componentsForProduct returns only active components for one product',()=>{
  const mapping={
    P1:{
      STK_A:{qtyPerUnit:1,active:true},
      STK_B:{qtyPerUnit:2,active:false}
    }
  };
  assert.deepEqual(componentsForProduct('P1',mapping),[
    {stockItemId:'STK_A',qtyPerUnit:1,active:true}
  ]);
  assert.deepEqual(componentsForProduct('P2',mapping),[]);
});

test('aggregateSaleComponents supports multiple components on one product',()=>{
  const result=aggregateSaleComponents(
    [{id:'P1',q:2}],
    {P1:{
      STK_CUP:{qtyPerUnit:1,active:true},
      STK_LID:{qtyPerUnit:1,active:true},
      STK_STRAW:{qtyPerUnit:1,active:true}
    }},
    {
      STK_CUP:{name:'Cup 22 oz Datar',unit:'pcs'},
      STK_LID:{name:'Tutup Datar',unit:'pcs'},
      STK_STRAW:{name:'Sedotan',unit:'pcs'}
    }
  );
  assert.deepEqual(
    result.map(x=>({
      stockItemId:x.stockItemId,
      stockItemName:x.stockItemName,
      unit:x.unit,
      soldQty:x.soldQty,
      appliedQty:x.appliedQty
    })),
    [
      {stockItemId:'STK_CUP',stockItemName:'Cup 22 oz Datar',unit:'pcs',soldQty:2,appliedQty:2},
      {stockItemId:'STK_LID',stockItemName:'Tutup Datar',unit:'pcs',soldQty:2,appliedQty:2},
      {stockItemId:'STK_STRAW',stockItemName:'Sedotan',unit:'pcs',soldQty:2,appliedQty:2}
    ]
  );
});

test('aggregateSaleComponents aggregates a shared component across multiple products',()=>{
  const result=aggregateSaleComponents(
    [
      {id:'P1',q:2},
      {id:'P2',q:3}
    ],
    {
      P1:{STK_BOX:{qtyPerUnit:1,active:true}},
      P2:{STK_BOX:{qtyPerUnit:2,active:true}}
    },
    {STK_BOX:{name:'Kardus Snack',unit:'pcs'}}
  );
  assert.equal(result.length,1);
  assert.equal(result[0].stockItemId,'STK_BOX');
  assert.equal(result[0].appliedQty,8);
  assert.equal(result[0].allocations.length,2);
  assert.deepEqual(
    result[0].allocations.map(x=>[x.productId,x.soldQty,x.qtyPerUnit,x.appliedQty]),
    [
      ['P1',2,1,2],
      ['P2',3,2,6]
    ]
  );
});

test('aggregateSaleComponents rejects a mapping to a missing Stock Item master',()=>{
  assert.throws(
    ()=>aggregateSaleComponents(
      [{id:'P1',q:1}],
      {P1:{STK_MISSING:{qtyPerUnit:1,active:true}}},
      {}
    ),
    error=>error?.code==='STOCK_ITEM_NOT_FOUND'
  );
});

test('stock application and restore ids are deterministic and escape RTDB-forbidden token characters',()=>{
  const app=stockApplicationId('2026/09/16','TX#1');
  const appAgain=stockApplicationId('2026/09/16','TX#1');
  const restore=stockRestoreId('refund','2026/09/16','TX#1','RF.1');
  assert.equal(app,appAgain);
  assert.match(app,/^STOCK_APPLY\|/);
  assert.match(restore,/^STOCK_REFUND\|/);
  for(const id of [app,restore]){
    for(const forbidden of ['.','#','$','/','[',']']){
      assert.equal(id.includes(forbidden),false,`${forbidden} must be escaped`);
    }
  }
});

test('buildApplicationSnapshot consumes physical quantity even when monetary total is zero',()=>{
  const mapping={P1:{STK_CUP:{qtyPerUnit:1,active:true}}};
  const stockItems={STK_CUP:{name:'Cup 22 oz',unit:'pcs'}};
  const snapshot=buildApplicationSnapshot({
    shiftKey:'SHIFT-A',
    txId:'TX-ZERO',
    lines:[{id:'P1',q:2,p:0,total:0}],
    mapping,
    stockItems,
    actor:{id:'admin',name:'OWNER UTAMA'}
  });
  assert.equal(snapshot.components[0].appliedQty,2);
  assert.equal(snapshot.txId,'TX-ZERO');
  assert.equal(snapshot.actorId,'admin');
  assert.equal('total' in snapshot,false);
});

test('buildApplicationSnapshot is immutable from later mapping changes',()=>{
  const mapping={P1:{STK_CUP:{qtyPerUnit:1,active:true}}};
  const stockItems={STK_CUP:{name:'Cup 22 oz',unit:'pcs'}};
  const snapshot=buildApplicationSnapshot({
    shiftKey:'S1',
    txId:'T1',
    lines:[{id:'P1',q:3}],
    mapping,
    stockItems,
    actor:{id:'u1',name:'Owner'}
  });
  mapping.P1.STK_CUP.qtyPerUnit=9;
  stockItems.STK_CUP.name='Changed';
  assert.equal(snapshot.components[0].appliedQty,3);
  assert.equal(snapshot.components[0].stockItemName,'Cup 22 oz');
  assert.equal(Object.isFrozen(snapshot),true);
});

test('stockComponentFingerprint is stable across object key order',()=>{
  const a=stockComponentFingerprint({b:2,a:{y:2,x:1}});
  const b=stockComponentFingerprint({a:{x:1,y:2},b:2});
  assert.equal(a,b);
  assert.match(a,/^sc1:[0-9a-f]{8}$/);
});

test('restoreAllocation restores historical component quantities from the immutable application snapshot',()=>{
  const application=buildApplicationSnapshot({
    shiftKey:'S1',
    txId:'T1',
    lines:[{id:'P1',q:3}],
    mapping:{P1:{
      STK_CUP:{qtyPerUnit:1,active:true},
      STK_STRAW:{qtyPerUnit:2,active:true}
    }},
    stockItems:{
      STK_CUP:{name:'Cup',unit:'pcs'},
      STK_STRAW:{name:'Sedotan',unit:'pcs'}
    }
  });

  const result=restoreAllocation(
    application,
    [{lineIndex:0,id:'P1',q:1}],
    {}
  );

  assert.deepEqual(
    result.map(row=>[row.stockItemId,row.restoredQty]),
    [['STK_CUP',1],['STK_STRAW',2]]
  );
  assert.deepEqual(
    result[0].allocations.map(row=>[row.lineIndex,row.productId,row.restoredSoldQty,row.qtyPerUnit,row.restoredQty]),
    [[0,'P1',1,1,1]]
  );
});

test('restoreAllocation honors cumulative restored quantities and rejects over-restore',()=>{
  const application=buildApplicationSnapshot({
    shiftKey:'S1',
    txId:'T2',
    lines:[{id:'P1',q:3}],
    mapping:{P1:{STK_CUP:{qtyPerUnit:1,active:true}}},
    stockItems:{STK_CUP:{name:'Cup',unit:'pcs'}}
  });

  const remaining=restoreAllocation(
    application,
    [{lineIndex:0,id:'P1',q:2}],
    {'0':1}
  );
  assert.equal(remaining[0].restoredQty,2);

  assert.throws(
    ()=>restoreAllocation(application,[{lineIndex:0,id:'P1',q:3}],{'0':1}),
    error=>error?.code==='STOCK_RESTORE_EXCEEDS_APPLIED'
  );
});

test('restoreAllocation fails closed when a product-only refund is ambiguous across duplicate sale lines',()=>{
  const application=buildApplicationSnapshot({
    shiftKey:'S1',
    txId:'T3',
    lines:[{id:'P1',q:1},{id:'P1',q:1}],
    mapping:{P1:{STK_CUP:{qtyPerUnit:1,active:true}}},
    stockItems:{STK_CUP:{name:'Cup',unit:'pcs'}}
  });

  assert.throws(
    ()=>restoreAllocation(application,[{id:'P1',q:1}],{}),
    error=>error?.code==='STOCK_RESTORE_LINE_AMBIGUOUS'
  );
});
