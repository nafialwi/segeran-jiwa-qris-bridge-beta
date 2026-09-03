import test from 'node:test';
import assert from 'node:assert/strict';
import { QRIS_ROOT, POS_ROOT } from '../src/data/firebase-client.js';
import { installQrisDeferredSettlementRuntime } from '../src/app/qris-deferred-settlement-bootstrap.js';

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function fakeDb(rows={},signals={}){return{ref(path){return{once:async()=>({val:()=>clone(path===`${QRIS_ROOT}/pending`?rows:path===`${QRIS_ROOT}/signals`?signals:path.startsWith(`${QRIS_ROOT}/pending/`)?rows[path.split('/').at(-1)]??null:path.startsWith(`${QRIS_ROOT}/signals/`)?signals[path.split('/').at(-1)]??null:null)})}}}}

test('S10A runtime installs once and reuses the already-installed P4 Firebase DB authority',()=>{
  const db=fakeDb(),runtime={},p4={db,roots:{pos:POS_ROOT,qris:QRIS_ROOT}};
  const first=installQrisDeferredSettlementRuntime(runtime,{p4,writer:{attachSnapshotAndPark(){},quarantineLateSignal(){}}});
  const second=installQrisDeferredSettlementRuntime(runtime,{p4:{db:{bad:true}},writer:{bad:true}});
  assert.equal(first,second);
  assert.equal(runtime.__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME,first);
  assert.equal(first.db,db);
  assert.deepEqual(first.roots,{pos:POS_ROOT,qris:QRIS_ROOT});
  assert.equal(Object.isFrozen(first),true);
});

test('S10A runtime reads exact pending evidence and filters only unresolved parked rows owned by cashier',async()=>{
  const rows={
    A:{pendingId:'A',cashierId:'kasir-a',status:'WAITING_QRIS',parkedAt:100,amount:5000},
    B:{pendingId:'B',cashierId:'kasir-a',status:'MATCHED',parkedAt:110,amount:6000},
    C:{pendingId:'C',cashierId:'kasir-a',status:'FINALIZED',parkedAt:120,amount:7000},
    D:{pendingId:'D',cashierId:'kasir-b',status:'WAITING_QRIS',parkedAt:130,amount:8000},
    E:{pendingId:'E',cashierId:'kasir-a',status:'WAITING_QRIS',amount:9000}
  };
  const db=fakeDb(rows),runtime={},p4={db};
  const api=installQrisDeferredSettlementRuntime(runtime,{p4,writer:{attachSnapshotAndPark(){},quarantineLateSignal(){}}});
  assert.equal((await api.readPending('A')).pendingId,'A');
  assert.deepEqual((await api.findOwnedUnresolvedParked('kasir-a')).map(x=>x.pendingId),['A','B']);
  assert.deepEqual(Object.keys(await api.readPendingRows()).sort(),Object.keys(rows).sort());
});

test('S10A runtime refuses installation without P4/existing DB authority',()=>{
  assert.throws(()=>installQrisDeferredSettlementRuntime({},{}),/QRIS_S10A_DB_REQUIRED/);
});


test('S10A runtime surfaces late-quarantine signals as durable review-required evidence',async()=>{
  const signals={
    LATE1:{providerTransactionId:'LATE1',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,amount:5000,lateDetectedAt:200},
    AMB1:{providerTransactionId:'AMB1',status:'LATE_OR_NEW_AMBIGUOUS',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,amount:5000,lateDetectedAt:300},
    NORMAL:{providerTransactionId:'NORMAL',status:'UNMATCHED',amount:7000,firstSeenAt:400},
    DONE:{providerTransactionId:'DONE',status:'CONFIRMED',amount:8000,confirmedAt:500}
  };
  const db=fakeDb({},signals),runtime={},p4={db};
  const api=installQrisDeferredSettlementRuntime(runtime,{p4,writer:{attachSnapshotAndPark(){},quarantineLateSignal(){}}});
  assert.deepEqual(Object.keys(await api.readSignalRows()).sort(),Object.keys(signals).sort());
  assert.deepEqual((await api.findLateReviewSignals()).map(x=>x.providerTransactionId),['AMB1','LATE1']);
});


test('S10A runtime can scope late-review evidence to the cashier owning the cancelled candidate pending',async()=>{
  const pending={A:{pendingId:'A',cashierId:'kasir-a',status:'CANCELLED'},B:{pendingId:'B',cashierId:'kasir-b',status:'CANCELLED'}};
  const signals={
    SA:{providerTransactionId:'SA',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateCandidatePendingIds:['A'],lateDetectedAt:200},
    SB:{providerTransactionId:'SB',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateCandidatePendingIds:['B'],lateDetectedAt:300}
  };
  const api=installQrisDeferredSettlementRuntime({}, {p4:{db:fakeDb(pending,signals)},writer:{attachSnapshotAndPark(){},quarantineLateSignal(){}}});
  assert.deepEqual((await api.findLateReviewSignals('kasir-a')).map(x=>x.providerTransactionId),['SA']);
  assert.deepEqual((await api.findLateReviewSignals('kasir-b')).map(x=>x.providerTransactionId),['SB']);
});
