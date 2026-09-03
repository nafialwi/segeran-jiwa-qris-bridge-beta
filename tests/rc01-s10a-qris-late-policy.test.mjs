import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSaleSnapshot,
  snapshotIdentity,
  classifyLateSignalConflict,
  isUnresolvedParkedPending,
  isLateQuarantineStatus
} from '../src/domain/qris-deferred-settlement-policy.js';

function rawSnapshot(overrides={}){
  return {
    capturedAt:1000,
    amount:5000,
    cartFingerprint:'cart-base-fp',
    pricingFingerprint:'price-fp',
    items:[{
      id:'P1',n:'Es Teh',q:1,p:5000,note:'',cp:2000,c:'MINUMAN',discountType:'PERCENT',discountValue:0,
      savedImg:'data:image/png;base64,FORBIDDEN',img:'data:image/png;base64,FORBIDDEN',
      inventoryMode:'RECIPE',baseProductId:'P1',recipeVariantId:'REG',virtualCartId:'P1::REG'
    }],
    pricing:{version:'0.1.0',subtotal:5000,itemDiscountTotal:0,transactionDiscountTotal:0,discountTotal:0,netSubtotal:5000,serviceCharge:0,taxBase:5000,tax:0,total:5000,settings:{taxEnabled:false,taxRate:0,serviceEnabled:false,serviceRate:0,cashierMaxDiscountPercent:10},cartDiscount:{type:'PERCENT',value:0},lines:[{index:0,id:'P1',gross:5000,itemDiscount:0,net:5000,discountType:'PERCENT',discountValue:0}]},
    ...overrides
  };
}

test('S10A normalizes immutable sale snapshot without image/base64 payload while preserving transaction identity metadata',()=>{
  const out=normalizeSaleSnapshot(rawSnapshot());
  assert.equal(out.amount,5000);
  assert.equal(out.items.length,1);
  assert.equal(out.items[0].savedImg,undefined);
  assert.equal(out.items[0].img,undefined);
  assert.equal(JSON.stringify(out).includes('base64'),false);
  assert.equal(out.items[0].inventoryMode,'RECIPE');
  assert.equal(out.items[0].baseProductId,'P1');
  assert.equal(out.pricing.total,5000);
  assert.equal(Object.isFrozen(out),true);
  assert.equal(Object.isFrozen(out.items),true);
});

test('S10A snapshot identity is stable for equivalent normalized evidence and changes on payment/cart evidence drift',()=>{
  const a=normalizeSaleSnapshot(rawSnapshot()),b=normalizeSaleSnapshot(rawSnapshot());
  assert.equal(snapshotIdentity(a),snapshotIdentity(b));
  const changed=normalizeSaleSnapshot(rawSnapshot({amount:6000,pricing:{...rawSnapshot().pricing,total:6000}}));
  assert.notEqual(snapshotIdentity(a),snapshotIdentity(changed));
});

test('S10A classifies a provider signal after true cancel as LATE_AFTER_CANCEL and never as a normal match',()=>{
  const signal={providerTransactionId:'BRI-1',amount:5000,firstSeenAt:2000,status:'UNMATCHED'};
  const rows=[{pendingId:'A',amount:5000,status:'CANCELLED',createdAt:1000,expiresAt:999999,cancelledAt:1500}];
  const out=classifyLateSignalConflict(signal,rows,2000);
  assert.equal(out.status,'LATE_AFTER_CANCEL');
  assert.deepEqual(out.lateCandidatePendingIds,['A']);
  assert.deepEqual(out.liveCandidatePendingIds,[]);
});

test('S10A same-amount cancelled-vs-new pending conflict fails closed as LATE_OR_NEW_AMBIGUOUS',()=>{
  const signal={providerTransactionId:'BRI-2',amount:5000,firstSeenAt:2200,status:'DETECTED'};
  const rows=[
    {pendingId:'A',amount:5000,status:'CANCELLED',createdAt:1000,expiresAt:999999,cancelledAt:1600},
    {pendingId:'B',amount:5000,status:'WAITING_QRIS',createdAt:1800,expiresAt:999999,providerTransactionId:null}
  ];
  const out=classifyLateSignalConflict(signal,rows,2200);
  assert.equal(out.status,'LATE_OR_NEW_AMBIGUOUS');
  assert.deepEqual(out.lateCandidatePendingIds,['A']);
  assert.deepEqual(out.liveCandidatePendingIds,['B']);
});

test('S10A ignores cancelled rows outside the legacy plausibility window and recognizes quarantined/parked terminal semantics',()=>{
  const signal={providerTransactionId:'BRI-3',amount:5000,firstSeenAt:30*60*1000,status:'UNMATCHED'};
  const rows=[{pendingId:'OLD',amount:5000,status:'CANCELLED',createdAt:1000,expiresAt:999999,cancelledAt:2000}];
  assert.equal(classifyLateSignalConflict(signal,rows,30*60*1000),null);
  assert.equal(isLateQuarantineStatus('LATE_AFTER_CANCEL'),true);
  assert.equal(isLateQuarantineStatus('LATE_OR_NEW_AMBIGUOUS'),true);
  assert.equal(isLateQuarantineStatus('UNMATCHED'),false);
  assert.equal(isUnresolvedParkedPending({status:'WAITING_QRIS',parkedAt:123}),true);
  assert.equal(isUnresolvedParkedPending({status:'MATCHED',parkedAt:123}),true);
  assert.equal(isUnresolvedParkedPending({status:'FINALIZED',parkedAt:123}),false);
  assert.equal(isUnresolvedParkedPending({status:'CANCELLED',parkedAt:123}),false);
});
