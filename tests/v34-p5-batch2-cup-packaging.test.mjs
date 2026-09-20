import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUP_CATALOG_V34,cupSpecByCodeV34,buildCupInventoryRowsV34,theoreticalCupUsageV34,
  cupInboundFromMovementsV34,reconcileCupShiftV34,decorateRecipeWithCupV34,buildCupOutletOpnameDraftsV34
} from '../src/domain/packaging-cup-v34.js';

test('CUP-CONTROL-V1 defines six sale packaging Cup types including Paper 10 Oz',()=>{
  assert.deepEqual(CUP_CATALOG_V34.map(x=>x.code),['c10','c10p','c16','c22p','c22d','c22o']);
  assert.equal(cupSpecByCodeV34('c10p').name,'Cup Paper 10 Oz');assert.notEqual(cupSpecByCodeV34('c10p').saleMapping,false);assert.ok(CUP_CATALOG_V34.every(x=>x.unit==='pcs'));
});

test('CUP-CONTROL-V1 can read legacy Cup master/cost metadata without making it quantity authority',()=>{
  const raw={ingredients:{I10:{name:'Cup 10 Oz',unit:'pcs'}},balances:{ingredients:{I10:{outlet:20,warehouse:80}}},costs:{ingredients:{I10:{wac:350,source:'PURCHASE'}}}};
  const rows=buildCupInventoryRowsV34(raw),cup=rows.find(x=>x.code==='c10');
  assert.equal(rows.length,6);assert.equal(cup.registered,true);assert.equal(cup.totalQty,100);assert.equal(cup.wac,350);
});

test('CUP-CONTROL-V1 derives expected usage from transaction cup snapshots, excludes VOID, and keeps refunded Cup consumed',()=>{
  const txs=[{status:'DONE',items:[{id:'P1',q:3,cp:'c16'},{id:'P2',q:1,cp:'c22d'}],refundedQty:{0:1}},{status:'VOIDED',items:[{id:'P1',q:9,cp:'c16'}]},{status:'DONE',cartData:[{id:'P3',q:3,cp:'c22o'}]}];
  const out=theoreticalCupUsageV34(txs,[]);assert.equal(out.c16,3);assert.equal(out.c22d,1);assert.equal(out.c22o,3);assert.equal(out.c10,0);
});

test('CUP-CONTROL-V1 falls back to current product mapping only when historical line lacks cup snapshot',()=>{
  const out=theoreticalCupUsageV34([{status:'DONE',items:[{id:'P1',q:2}]}],[{id:'P1',cp:'c10'}]);assert.equal(out.c10,2);
});

test('CUP-CONTROL-V1 ignores Inventory V2 transfer movements as Cup restock authority',()=>{
  const inbound=cupInboundFromMovementsV34({movements:{A:{type:'TRANSFER_IN',delta:50}}},[],'2026-09-03-S1');
  assert.deepEqual({...inbound},{c10:0,c10p:0,c16:0,c22p:0,c22d:0,c22o:0});
});

test('CUP-CONTROL-V1 reconciliation uses physical-minus-expected variance',()=>{
  const r=reconcileCupShiftV34({opening:{c10:100},inbound:{c10:50},closing:{c10:70},theoretical:{c10:77}}),c=r.rows.find(x=>x.code==='c10');
  assert.equal(c.available,150);assert.equal(c.expectedClosing,73);assert.equal(c.physicalClosing,70);assert.equal(c.variance,-3);assert.equal(c.status,'SHORTAGE');
});

test('CUP-CONTROL-V1 negative raw expected becomes uncovered usage, never negative stock',()=>{
  const r=reconcileCupShiftV34({opening:{c22d:7},closing:{c22d:25},theoretical:{c22d:72}}),c=r.rows.find(x=>x.code==='c22d');
  assert.equal(c.rawExpected,-65);assert.equal(c.expectedClosing,0);assert.equal(c.uncoveredUsage,65);assert.equal(c.variance,25);assert.equal(c.status,'NEEDS_ATTENTION');
});

test('CUP-CONTROL-V1 recipe compatibility attaches cost metadata only and does not inject Inventory ingredient',()=>{
  const recipe={variants:{V1:{active:true,components:{TEH:10}},V2:{active:true,components:{TEH:15}}},components:{GULA:2}};
  const cupRows=buildCupInventoryRowsV34({ingredients:{ICUP:{name:'Cup 16 Oz'}},costs:{ingredients:{ICUP:{wac:450,source:'PURCHASE'}}}});
  const out=decorateRecipeWithCupV34(recipe,{id:'P1',cp:'c16'},cupRows);
  assert.deepEqual(out.variants.V1.components,{TEH:10});assert.deepEqual(out.components,{GULA:2});assert.equal(out._packagingV34.code,'c16');assert.equal(out._packagingV34.inventoryTracked,false);assert.equal(out._packagingV34.unitCost,450);
});

test('CUP-CONTROL-V1 never generates Inventory V2 Opname drafts from physical closing',()=>{
  assert.deepEqual(buildCupOutletOpnameDraftsV34([],{}),[]);
});
