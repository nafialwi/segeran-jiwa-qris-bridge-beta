import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, discountAmount, quote, authorize, fingerprint, fromSnapshot, fromTx, hasBreakdown, refundAllocation } from '../src/domain/pricing-service.js';

const items=[
  {id:'A',p:10000,q:2,discountType:'PERCENT',discountValue:10},
  {id:'B',p:5000,q:1}
];
const settings={taxEnabled:true,taxRate:11,serviceEnabled:true,serviceRate:5,cashierMaxDiscountPercent:15};
const cartDiscount={type:'PERCENT',value:10};

test('pricing quote preserves v1.0.40 subtotal-discount-service-tax order and rounding',()=>{
  const q=quote(items,{settings,cartDiscount});
  assert.deepEqual({
    subtotal:q.subtotal,itemDiscountTotal:q.itemDiscountTotal,transactionDiscountTotal:q.transactionDiscountTotal,
    discountTotal:q.discountTotal,netSubtotal:q.netSubtotal,serviceCharge:q.serviceCharge,taxBase:q.taxBase,tax:q.tax,total:q.total
  },{subtotal:25000,itemDiscountTotal:2000,transactionDiscountTotal:2300,discountTotal:4300,netSubtotal:20700,serviceCharge:1035,taxBase:21735,tax:2391,total:24126});
  assert.equal(q.lines[0].gross,20000);
  assert.equal(q.lines[0].itemDiscount,2000);
  assert.equal(q.lines[0].net,18000);
});

test('settings and discount helpers clamp the same way as legacy SJPrice',()=>{
  assert.deepEqual(normalizeSettings({taxEnabled:1,taxRate:150,serviceEnabled:true,serviceRate:-2,cashierMaxDiscountPercent:101}),{
    taxEnabled:true,taxRate:100,serviceEnabled:true,serviceRate:0,cashierMaxDiscountPercent:100
  });
  assert.equal(discountAmount(10000,'PERCENT',150),10000);
  assert.equal(discountAmount(10000,'NOMINAL',12000),10000);
});

test('cashier authorization preserves legacy total-discount limit semantics',()=>{
  const q=quote(items,{settings,cartDiscount});
  const denied=authorize(q,'transaksi');
  assert.equal(denied.ok,false);
  assert.equal(denied.code,'DISCOUNT_LIMIT');
  assert.match(denied.message,/17\.2%/);
  assert.equal(authorize(q,'manajemen').ok,true);
});

test('pricing snapshots, transaction fallback and breakdown detection preserve legacy semantics',()=>{
  const q=quote(items,{settings,cartDiscount});
  assert.equal(fromSnapshot(q).total,24126);
  assert.equal(fromTx({pricing:q,total:999}).total,24126);
  assert.equal(fromTx({total:7000}).netSubtotal,7000);
  assert.equal(hasBreakdown(q),true);
  assert.equal(hasBreakdown({discountTotal:0,serviceCharge:0,tax:0}),false);
});

test('refund allocation preserves proportional pricing rules from v1.0.40',()=>{
  const p=quote(items,{settings,cartDiscount});
  const tx={total:p.total,pricing:p,cartData:items};
  const partial=refundAllocation(tx,[{index:0,q:1}]);
  assert.deepEqual(partial,{subtotal:10000,itemDiscountTotal:1000,transactionDiscountTotal:900,discountTotal:1900,netSubtotal:8100,serviceCharge:405,tax:936,total:9441});
  const full=refundAllocation(tx,[{index:0,q:2},{index:1,q:1}]);
  assert.deepEqual(full,{subtotal:p.subtotal,itemDiscountTotal:p.itemDiscountTotal,transactionDiscountTotal:p.transactionDiscountTotal,discountTotal:p.discountTotal,netSubtotal:p.netSubtotal,serviceCharge:p.serviceCharge,tax:p.tax,total:p.total});
});

test('pricing fingerprint is deterministic and changes when economic terms change',()=>{
  const a=fingerprint(items,{settings,cartDiscount});
  const b=fingerprint(items,{settings,cartDiscount});
  const c=fingerprint(items,{settings,cartDiscount:{type:'PERCENT',value:0}});
  assert.equal(a,b);
  assert.notEqual(a,c);
  assert.match(a,/^[0-9a-f]{8}$/);
});
