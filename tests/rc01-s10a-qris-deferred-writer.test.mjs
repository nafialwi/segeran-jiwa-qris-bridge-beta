import test from 'node:test';
import assert from 'node:assert/strict';
import { QRIS_ROOT } from '../src/data/firebase-client.js';
import { createQrisDeferredSettlementWriter } from '../src/data/writers/qris-deferred-settlement-writer.js';
import { combinedQrisFingerprint } from '../src/domain/qris-deferred-settlement-policy.js';

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function split(path){return String(path||'').split('/').filter(Boolean)}
function getAt(root,path){let cur=root;for(const key of split(path)){if(cur==null)return null;cur=cur[key]}return cur??null}
function setAt(root,path,value){const seg=split(path);let cur=root;for(let i=0;i<seg.length-1;i++){cur[seg[i]]??={};cur=cur[seg[i]]}if(!seg.length)throw new Error('ROOT_NOT_USED');cur[seg.at(-1)]=clone(value)}
function fakeDb(initial={}){
  const data=clone(initial),mutations=[];
  return {data,mutations,ref(path){return{
    once:async()=>({val:()=>clone(getAt(data,path))}),
    transaction:async fn=>{mutations.push(['transaction',path,fn?.__sjS10AQuarantine===true]);const current=clone(getAt(data,path)),next=fn(current);if(next===undefined)return{committed:false,snapshot:{val:()=>clone(current)}};setAt(data,path,next);return{committed:true,snapshot:{val:()=>clone(next)}}}
  }}};
}
function snapshot(amount=5000){return {capturedAt:1000,amount,cartFingerprint:'CF',pricingFingerprint:'PF',items:[{id:'P1',n:'Es Teh',q:1,p:amount,note:'',cp:2000,c:'MINUMAN',discountType:'PERCENT',discountValue:0}],pricing:{version:'0.1.0',subtotal:amount,itemDiscountTotal:0,transactionDiscountTotal:0,discountTotal:0,netSubtotal:amount,serviceCharge:0,taxBase:amount,tax:0,total:amount,settings:{},cartDiscount:{type:'PERCENT',value:0},lines:[]}}}
function initial(){const snap=snapshot();return {[QRIS_ROOT]:{pending:{A:{pendingId:'A',amount:5000,cashierId:'kasir-a',status:'WAITING_QRIS',providerTransactionId:null,cartFingerprint:combinedQrisFingerprint(snap.cartFingerprint,snap.pricingFingerprint)}},signals:{S1:{providerTransactionId:'S1',amount:5000,status:'UNMATCHED',matchedTransactionId:null}}}}}

test('S10A writer atomically attaches immutable snapshot and parks without changing WAITING_QRIS',async()=>{
  const db=fakeDb(initial()),writer=createQrisDeferredSettlementWriter({db,serverTimestamp:()=>2000});
  const first=await writer.attachSnapshotAndPark({pendingId:'A',cashierId:'kasir-a',parkedBy:'uid-a',snapshot:snapshot()});
  assert.equal(first.status,'WAITING_QRIS');
  assert.equal(first.saleSnapshotVersion,'S10A-1');
  assert.equal(first.saleSnapshot.amount,5000);
  assert.equal(first.parkedAt,2000);
  assert.equal(first.parkedBy,'uid-a');
  assert.equal(first.parkReason,'SERVE_NEXT_CUSTOMER');
  assert.equal(first.cancelledAt,undefined);
  const second=await writer.attachSnapshotAndPark({pendingId:'A',cashierId:'kasir-a',parkedBy:'uid-a',snapshot:snapshot()});
  assert.deepEqual(second,first);
  assert.equal(db.mutations.every(x=>x[1]===`${QRIS_ROOT}/pending/A`),true);
});

test('S10A writer rejects snapshot replacement, wrong cashier, linked provider, and amount drift',async()=>{
  const db=fakeDb(initial()),writer=createQrisDeferredSettlementWriter({db,serverTimestamp:()=>2000});
  await writer.attachSnapshotAndPark({pendingId:'A',cashierId:'kasir-a',parkedBy:'uid-a',snapshot:snapshot()});
  await assert.rejects(()=>writer.attachSnapshotAndPark({pendingId:'A',cashierId:'kasir-a',parkedBy:'uid-a',snapshot:snapshot(6000)}),/QRIS_S10A_SNAPSHOT_CONFLICT|QRIS_S10A_AMOUNT_MISMATCH/);
  await assert.rejects(()=>writer.attachSnapshotAndPark({pendingId:'A',cashierId:'kasir-b',parkedBy:'uid-b',snapshot:snapshot()}),/QRIS_S10A_CASHIER_MISMATCH/);
  const linked=initial();linked[QRIS_ROOT].pending.A.providerTransactionId='S1';
  const linkedWriter=createQrisDeferredSettlementWriter({db:fakeDb(linked),serverTimestamp:()=>2000});
  await assert.rejects(()=>linkedWriter.attachSnapshotAndPark({pendingId:'A',cashierId:'kasir-a',parkedBy:'uid-a',snapshot:snapshot()}),/QRIS_S10A_PROVIDER_ALREADY_LINKED/);
});

test('S10A writer quarantines late signal idempotently and forbids matched/confirmed evidence mutation',async()=>{
  const db=fakeDb(initial()),writer=createQrisDeferredSettlementWriter({db,serverTimestamp:()=>3000});
  const first=await writer.quarantineLateSignal({providerTransactionId:'S1',status:'LATE_AFTER_CANCEL',lateCandidatePendingIds:['A']});
  assert.equal(first.status,'LATE_AFTER_CANCEL');
  assert.equal(first.resolutionState,'REVIEW_REQUIRED');
  assert.equal(first.autoMatchBlocked,true);
  assert.equal(first.lateDetectedAt,3000);
  assert.deepEqual(first.lateCandidatePendingIds,['A']);
  assert.equal(db.mutations.find(x=>x[1]===`${QRIS_ROOT}/signals/S1`)?.[2],true,'late quarantine updater must carry the in-memory S10A authority marker');
  const second=await writer.quarantineLateSignal({providerTransactionId:'S1',status:'LATE_AFTER_CANCEL',lateCandidatePendingIds:['A']});
  assert.deepEqual(second,first);
  const bad=initial();bad[QRIS_ROOT].signals.S1.status='MATCHED';bad[QRIS_ROOT].signals.S1.matchedTransactionId='A';
  const badWriter=createQrisDeferredSettlementWriter({db:fakeDb(bad),serverTimestamp:()=>3000});
  await assert.rejects(()=>badWriter.quarantineLateSignal({providerTransactionId:'S1',status:'LATE_AFTER_CANCEL',lateCandidatePendingIds:['A']}),/QRIS_S10A_SIGNAL_ALREADY_LINKED/);
});
