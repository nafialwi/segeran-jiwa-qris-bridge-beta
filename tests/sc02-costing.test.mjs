import test from 'node:test';
import assert from 'node:assert/strict';
import { landedCost, movingWac, stockLineCost, recipeLineCost, profit, aggregateTransactions, safeProfit } from '../src/domain/costing-service.js';
import { createPurchaseWacService } from '../src/domain/purchase-wac-service.js';

test('costing core preserves v1.0.40 landed cost and WAC formulas',()=>{
  assert.equal(landedCost(24000,2000,1000),25000);
  assert.deepEqual(movingWac(1000,20,1000,24000),{stockBefore:1000,stockAfter:2000,oldWac:20,purchaseUnitCost:24,newWac:22});
  assert.equal(stockLineCost(3,22.5),67.5);
  assert.equal(recipeLineCost(.25,40000,2),20000);
  assert.throws(()=>landedCost(100,0,101),e=>e.code==='SUPPLIER_DISCOUNT_EXCEEDS_COST');
  assert.throws(()=>movingWac(1,10,0,100),e=>e.code==='INVALID_PURCHASE_QTY');
});

test('costing profit and aggregation preserve known-cost semantics',()=>{
  assert.deepEqual(profit(100000,60000),{netRevenue:100000,cogs:60000,grossProfit:40000,grossMargin:40});
  const out=aggregateTransactions([
    {status:'DONE',costing:{netRevenue:100000,cogsTotal:60000,costingKnown:true}},
    {status:'DONE',costing:{netRevenue:50000,cogsTotal:30000,costingKnown:true},refundCostingTotals:{netRevenue:10000,cogs:6000}},
    {status:'DONE',costing:{netRevenue:70000,cogsTotal:null,costingKnown:false}},
    {status:'VOIDED',costing:{netRevenue:999,cogsTotal:1,costingKnown:true}}
  ]);
  assert.deepEqual(out,{netRevenue:140000,cogs:84000,grossProfit:56000,grossMargin:40,knownTransactions:2,unknownCostTransactions:1});
});

test('unknown HPP is unavailable and never synthesized as Rp0',()=>{
  assert.deepEqual(safeProfit(50000,null),{netRevenue:50000,hpp:null,grossProfit:null,grossMargin:null,costKnown:false});
  assert.deepEqual(safeProfit(50000,30000),{netRevenue:50000,hpp:30000,grossProfit:20000,grossMargin:40,costKnown:true});
});

test('purchase/WAC service previews with pure core and delegates recovery to existing costing authority',async()=>{
  const calls=[];
  const engine={async resumePurchase(id){calls.push(['resume',id]);return {id,status:'COMMITTED'}}};
  const bridge={engine(kind){assert.equal(kind,'costing');return engine}};
  const svc=createPurchaseWacService({bridge});
  assert.deepEqual(svc.preview({stockBefore:1000,oldWac:20,qtyReceived:1000,goodsCost:23000,fees:2000,supplierDiscount:1000}),{
    landedCost:24000,stockBefore:1000,stockAfter:2000,oldWac:20,purchaseUnitCost:24,newWac:22
  });
  assert.deepEqual(await svc.resumePurchase('PUR-1'),{id:'PUR-1',status:'COMMITTED'});
  assert.deepEqual(calls,[['resume','PUR-1']]);
});
