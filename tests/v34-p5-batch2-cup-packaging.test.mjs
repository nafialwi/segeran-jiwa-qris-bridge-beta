import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUP_CATALOG_V34,
  cupSpecByCodeV34,
  buildCupInventoryRowsV34,
  theoreticalCupUsageV34,
  cupInboundFromMovementsV34,
  reconcileCupShiftV34,
  decorateRecipeWithCupV34,
  buildCupOutletOpnameDraftsV34
} from '../src/domain/packaging-cup-v34.js';

test('P5 Batch-2 defines exactly five Segeran Jiwa cup types using existing product cp codes',()=>{
  assert.deepEqual(CUP_CATALOG_V34.map(x=>x.code),['c10','c16','c22p','c22d','c22o']);
  assert.equal(cupSpecByCodeV34('c22p').name,'Cup 22 Oz Datar Polos');
  assert.equal(cupSpecByCodeV34('c22o').name,'Cup 22 Oz Oval');
  assert.ok(CUP_CATALOG_V34.every(x=>x.unit==='pcs'));
});

test('P5 Batch-2 maps registered Inventory V2 cup ingredients and keeps missing cup masters visible',()=>{
  const raw={
    ingredients:{I10:{name:'Cup 10 Oz',unit:'pcs',category:'KEMASAN CUP'},I16:{name:'Gelas 16 Oz',unit:'pcs',category:'KEMASAN'}},
    balances:{ingredients:{I10:{outlet:20,warehouse:80},I16:{outlet:5,warehouse:10}}},
    costs:{ingredients:{I10:{wac:350,source:'PURCHASE'},I16:{wac:400,source:'PURCHASE'}}}
  };
  const rows=buildCupInventoryRowsV34(raw);
  assert.equal(rows.length,5);
  assert.equal(rows.find(x=>x.code==='c10').registered,true);
  assert.equal(rows.find(x=>x.code==='c10').totalQty,100);
  assert.equal(rows.find(x=>x.code==='c10').wac,350);
  assert.equal(rows.find(x=>x.code==='c16').ingredientId,'I16');
  assert.equal(rows.find(x=>x.code==='c22d').registered,false);
});

test('P5 Batch-2 derives theoretical cup usage from immutable transaction item cp snapshots and excludes VOID',()=>{
  const txs=[
    {status:'DONE',items:[{id:'P1',q:2,cp:'c16'},{id:'P2',q:1,cp:'c22d'}]},
    {status:'VOIDED',items:[{id:'P1',q:9,cp:'c16'}]},
    {status:'DONE',cartData:[{id:'P3',q:3,cp:'c22o'}]}
  ];
  const out=theoreticalCupUsageV34(txs,[]);
  assert.equal(out.c16,2);assert.equal(out.c22d,1);assert.equal(out.c22o,3);assert.equal(out.c10,0);
});

test('P5 Batch-2 can fall back to current product cp only when transaction line lacks cp snapshot',()=>{
  const txs=[{status:'DONE',items:[{id:'P1',q:2}]}],menu=[{id:'P1',cp:'c10'}];
  const out=theoreticalCupUsageV34(txs,menu);
  assert.equal(out.c10,2);
});

test('P5 Batch-2 counts only physical transfer-in to outlet as cup inbound during shift',()=>{
  const cupRows=buildCupInventoryRowsV34({ingredients:{I10:{name:'Cup 10 Oz',unit:'pcs',category:'KEMASAN'}},balances:{ingredients:{I10:{}}}});
  const raw={movements:{
    A:{itemType:'ingredient',itemId:'I10',type:'TRANSFER_IN',location:'outlet',delta:50,shift:'2026-09-03-S1',ts:20},
    B:{itemType:'ingredient',itemId:'I10',type:'PURCHASE',location:'warehouse',delta:100,shift:'2026-09-03-S1',ts:21},
    C:{itemType:'ingredient',itemId:'I10',type:'OPNAME',location:'outlet',delta:4,shift:'2026-09-03-S1',ts:22},
    D:{itemType:'ingredient',itemId:'I10',type:'TRANSFER_IN',location:'outlet',delta:30,shift:'2026-09-03-S2',ts:23}
  }};
  const inbound=cupInboundFromMovementsV34(raw,cupRows,'2026-09-03-S1');
  assert.equal(inbound.c10,50);
});

test('P5 Batch-2 reconciles manual opening + inbound - closing against theoretical sales usage',()=>{
  const r=reconcileCupShiftV34({opening:{c10:100},inbound:{c10:50},closing:{c10:70},theoretical:{c10:77}});
  const c=r.rows.find(x=>x.code==='c10');
  assert.equal(c.physicalUsed,80);assert.equal(c.theoreticalUsed,77);assert.equal(c.variance,3);assert.equal(r.totalVariance,3);
});

test('P5 Batch-2 decorates every active recipe variant with exactly one mapped registered cup ingredient',()=>{
  const recipe={variants:{V1:{active:true,components:{TEH:10}},V2:{active:true,components:{TEH:15}},OLD:{active:false,components:{TEH:5}}}};
  const cupRows=buildCupInventoryRowsV34({ingredients:{ICUP:{name:'Cup 16 Oz',unit:'pcs',category:'KEMASAN'}},balances:{ingredients:{ICUP:{}}}});
  const out=decorateRecipeWithCupV34(recipe,{id:'P1',cp:'c16'},cupRows);
  assert.equal(out.variants.V1.components.ICUP,1);assert.equal(out.variants.V2.components.ICUP,1);
  assert.equal(out.variants.OLD.components.ICUP,undefined);
  assert.equal(out._packagingV34.code,'c16');
});

test('P5 Batch-2 infers legacy transfer-in without shift key from the active session time window',()=>{
  const cupRows=buildCupInventoryRowsV34({ingredients:{I10:{name:'Cup 10 Oz',unit:'pcs'}},balances:{ingredients:{I10:{}}}});
  const raw={movements:{
    A:{itemType:'ingredient',itemId:'I10',type:'TRANSFER_IN',location:'outlet',delta:25,ts:1500},
    B:{itemType:'ingredient',itemId:'I10',type:'TRANSFER_IN',location:'outlet',delta:30,ts:900},
    C:{itemType:'ingredient',itemId:'I10',type:'TRANSFER_IN',location:'outlet',delta:40,ts:2500}
  }};
  const inbound=cupInboundFromMovementsV34(raw,cupRows,'2026-09-03-S1',{startTs:1000,endTs:2000});
  assert.equal(inbound.c10,25);
});

test('P5 Batch-2 builds Inventory V2 opname drafts from closing physical counts without mutating stock',()=>{
  const cupRows=buildCupInventoryRowsV34({
    ingredients:{I10:{name:'Cup 10 Oz',unit:'pcs'},I16:{name:'Cup 16 Oz',unit:'pcs'}},
    balances:{ingredients:{I10:{outlet:50,warehouse:100},I16:{outlet:25,warehouse:40}}}
  });
  const drafts=buildCupOutletOpnameDraftsV34(cupRows,{c10:47,c16:25,c22p:0,c22d:0,c22o:0});
  assert.equal(drafts.length,1);
  assert.deepEqual(drafts[0],{code:'c10',name:'Cup 10 Oz',ingredientId:'I10',location:'outlet',systemQty:50,physicalQty:47,delta:-3,note:'Rekonsiliasi Cup Tutup Shift'});
});
