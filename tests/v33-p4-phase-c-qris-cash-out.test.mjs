import test from 'node:test';
import assert from 'node:assert/strict';
import { POS_ROOT, QRIS_ROOT } from '../src/data/firebase-client.js';

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function split(path){return String(path||'').split('/').filter(Boolean)}
function getAt(root,path){let cur=root;for(const key of split(path)){if(cur==null)return null;cur=cur[key]}return cur??null}
function setAt(root,path,value){const seg=split(path);if(!seg.length){for(const k of Object.keys(root))delete root[k];Object.assign(root,clone(value)||{});return}let cur=root;for(let i=0;i<seg.length-1;i++){cur[seg[i]]??={};cur=cur[seg[i]]}const key=seg.at(-1);if(value===null)delete cur[key];else cur[key]=clone(value)}
function mergeAt(root,path,patch){const cur=getAt(root,path);setAt(root,path,{...(cur&&typeof cur==='object'?cur:{}),...clone(patch)})}
function fakeDb(initial={}){
  const data=clone(initial)||{},mutations=[];
  return {
    data,mutations,
    ref(path=''){
      return {
        once:async type=>{assert.equal(type,'value');return {val:()=>clone(getAt(data,path))}},
        transaction:async fn=>{
          mutations.push(['transaction',path]);
          const current=clone(getAt(data,path)),next=fn(current);
          if(next===undefined)return {committed:false,snapshot:{val:()=>clone(current)}};
          setAt(data,path,next);return {committed:true,snapshot:{val:()=>clone(next)}};
        },
        update:async patch=>{
          mutations.push(['update',path,clone(patch)]);
          if(path){for(const [key,value] of Object.entries(patch||{}))mergeAt(data,`${path}/${key}`,value)}
          else{for(const [key,value] of Object.entries(patch||{}))setAt(data,key,value)}
        }
      };
    }
  };
}
function baseData({signalAmount=20000,pendingAmount=4000,drawer=30000}={}){
  return {
    [POS_ROOT]:{
      '2026-09-02-S2':{tx:{OLD:{id:'OLD',method:'QRIS',total:1000,cashierId:'kasir-a',ts:100}},cashMovements:{},uangLaci:drawer},
      global:{financeV1:{qrisCashOut:{}}}
    },
    [QRIS_ROOT]:{
      signals:{'PROV-1':{providerTransactionId:'PROV-1',amount:signalAmount,status:'UNMATCHED',firstSeenAt:900}},
      pending:{'PEND-1':{pendingId:'PEND-1',amount:pendingAmount,cashierId:'kasir-a',cashierName:'Kasir A',sessionId:'SES-1',activeDate:'2026-09-02-S2',createdAt:800,expiresAt:5000,status:'WAITING_QRIS',providerTransactionId:null,cartFingerprint:'FP-1'}}
    }
  };
}
function requester(role='cashier',id='kasir-a'){return ()=>({role,id,name:role==='owner'?'Owner A':'Kasir A',shiftKey:'2026-09-02-S2',sessionId:'SES-1'})}
function proof({requesterId='kasir-a',requesterRole='cashier',ownerId='owner-a',ts=1000}={}){return {ok:true,role:'owner',ownerId,ownerName:'Owner A',requesterId,requesterRole,reauthenticatedAt:ts}}
async function load(){return (await import('../src/data/writers/qris-cash-out-coordinator.js')).createQrisCashOutCoordinator}

function transactionServiceThatWrites(db,{calls=[],throwAfterWrite=false,write=true}={}){
  return {
    calls,
    async commitLegacy(){
      calls.push('commitLegacy');
      if(write)setAt(db.data,`${POS_ROOT}/2026-09-02-S2/tx/TX-NEW`,{id:'TX-NEW',method:'QRIS',total:4000,netRevenue:4000,cashierId:'kasir-a',cashierName:'Kasir A',ts:1200});
      if(throwAfterWrite)throw new Error('LEGACY_UNKNOWN');
      return true;
    }
  };
}

test('P4 QRIS cash-out discovery returns only active overpay candidates and rejects exact/underpay signals',async()=>{
  const create=await load(),db=fakeDb(baseData());
  setAt(db.data,`${QRIS_ROOT}/signals/EXACT`,{providerTransactionId:'EXACT',amount:4000,status:'UNMATCHED'});
  setAt(db.data,`${QRIS_ROOT}/signals/UNDER`,{providerTransactionId:'UNDER',amount:3000,status:'DETECTED'});
  setAt(db.data,`${QRIS_ROOT}/signals/LOCKED`,{providerTransactionId:'LOCKED',amount:25000,status:'CONFIRMED'});
  const c=create({db,transactionService:{commitLegacy:async()=>{}},readRequester:requester(),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  const found=await c.findEligibleOverpay('PEND-1');
  assert.deepEqual(found.candidates.map(x=>x.providerTransactionId),['PROV-1']);
  assert.equal(found.candidates[0].cashOutAmount,16000);
});

test('P4 QRIS cash-out fails before claim when drawer cash is insufficient or Owner approval proof is missing',async()=>{
  const create=await load(),db=fakeDb(baseData()),service=transactionServiceThatWrites(db);
  const low=create({db,transactionService:service,readRequester:requester(),readDrawerCash:()=>15000,now:()=>1000,random:()=>0.1});
  await assert.rejects(()=>low.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof()}),/QRIS_CASH_OUT_DRAWER_INSUFFICIENT/);
  assert.equal(service.calls.length,0);
  const noAuth=create({db,transactionService:service,readRequester:requester(),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  await assert.rejects(()=>noAuth.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:null}),/OWNER_REAUTH_REQUIRED/);
  assert.equal(service.calls.length,0);
});

test('P4 QRIS cash-out uses Owner direct proof or Cashier-bound Owner proof and rejects mismatched requester proof',async()=>{
  const create=await load();
  const db1=fakeDb(baseData()),service1=transactionServiceThatWrites(db1);
  const cashier=create({db:db1,transactionService:service1,readRequester:requester('cashier','kasir-a'),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  await assert.rejects(()=>cashier.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof({requesterId:'other'})}),/OWNER_REAUTH_REQUESTER_MISMATCH/);

  const ownerData=baseData();ownerData[QRIS_ROOT].pending['PEND-1'].cashierId='owner-a';ownerData[QRIS_ROOT].pending['PEND-1'].cashierName='Owner A';ownerData[POS_ROOT]['2026-09-02-S2'].tx.OLD.cashierId='owner-a';
  const db2=fakeDb(ownerData),service2={calls:[],async commitLegacy(){this.calls.push('commitLegacy');setAt(db2.data,`${POS_ROOT}/2026-09-02-S2/tx/TX-OWNER`,{id:'TX-OWNER',method:'QRIS',total:4000,cashierId:'owner-a',ts:1200})}};
  const owner=create({db:db2,transactionService:service2,readRequester:requester('owner','owner-a'),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  const result=await owner.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof({requesterId:'owner-a',requesterRole:'owner',ownerId:'owner-a'})});
  assert.equal(result.status,'CONFIRMED');
  assert.equal(service2.calls.length,1);
});

test('P4 successful 4k sale / 20k QRIS cash-out delegates sale once and atomically finalizes 16k drawer out plus QRIS evidence',async()=>{
  const create=await load(),db=fakeDb(baseData()),calls=[],service=transactionServiceThatWrites(db,{calls});
  const c=create({db,transactionService:service,readRequester:requester(),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  const result=await c.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof()});
  assert.equal(result.status,'CONFIRMED');
  assert.equal(result.saleAmount,4000);
  assert.equal(result.qrisReceived,20000);
  assert.equal(result.cashOutAmount,16000);
  assert.equal(result.transactionId,'TX-NEW');
  assert.deepEqual(calls,['commitLegacy']);
  const journal=getAt(db.data,`${POS_ROOT}/global/financeV1/qrisCashOut/PROV-1`);
  assert.equal(journal.status,'CONFIRMED');
  assert.equal(journal.transactionId,'TX-NEW');
  const movement=getAt(db.data,`${POS_ROOT}/2026-09-02-S2/cashMovements/${journal.cashMovementId}`);
  assert.deepEqual({direction:movement.direction,amount:movement.amount,type:movement.type,transactionId:movement.transactionId},{direction:'OUT',amount:16000,type:'QRIS_CASH_OUT',transactionId:'TX-NEW'});
  const signal=getAt(db.data,`${QRIS_ROOT}/signals/PROV-1`),pending=getAt(db.data,`${QRIS_ROOT}/pending/PEND-1`);
  assert.equal(signal.status,'CONFIRMED');assert.equal(signal.resolutionState,'CASH_OUT_CONFIRMED');assert.equal(signal.matchedTransactionId,'TX-NEW');
  assert.equal(pending.status,'FINALIZED');assert.equal(pending.finalizedTransactionId,'TX-NEW');assert.equal(pending.cashOutAmount,16000);
  assert.ok(db.mutations.some(x=>x[0]==='update'&&x[1]===''));
});

test('P4 duplicate execute is idempotent after confirmation and never calls sale authority twice',async()=>{
  const create=await load(),db=fakeDb(baseData()),calls=[],service=transactionServiceThatWrites(db,{calls});
  const c=create({db,transactionService:service,readRequester:requester(),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  const a=await c.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof()});
  const b=await c.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof()});
  assert.equal(a.operationId,b.operationId);
  assert.deepEqual(calls,['commitLegacy']);
});

test('P4 partial pending-claim conflict rolls back only the same signal claim and never starts sale',async()=>{
  const create=await load(),data=baseData();data[QRIS_ROOT].pending['PEND-1'].cashierId='kasir-lain';const db=fakeDb(data),calls=[],service=transactionServiceThatWrites(db,{calls});
  const c=create({db,transactionService:service,readRequester:requester(),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  await assert.rejects(()=>c.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof()}),/QRIS_PENDING_CONTEXT_INVALID/);
  assert.equal(getAt(db.data,`${QRIS_ROOT}/signals/PROV-1`).status,'UNMATCHED');
  assert.equal(getAt(db.data,`${QRIS_ROOT}/signals/PROV-1`).cashOutOperationId??null,null);
  assert.equal(calls.length,0);
});

test('P4 unknown sale outcome fails closed, then recovery identifies the already-written sale without re-running sale authority',async()=>{
  const create=await load(),db=fakeDb(baseData()),calls=[],service=transactionServiceThatWrites(db,{calls,throwAfterWrite:true});
  const c=create({db,transactionService:service,readRequester:requester(),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  const first=await c.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof()});
  assert.equal(first.status,'CONFIRMED');
  assert.deepEqual(calls,['commitLegacy']);

  // Simulate a crash window after sale attempt: restore journal/signal/pending to pre-final recovery state while keeping TX-NEW.
  const operationId=first.operationId;
  setAt(db.data,`${POS_ROOT}/global/financeV1/qrisCashOut/PROV-1`,{...first,status:'SALE_ATTEMPTING',operationId,beforeTxKeys:['OLD'],saleAttemptedAt:1100,transactionId:null});
  mergeAt(db.data,`${QRIS_ROOT}/signals/PROV-1`,{status:'CASH_OUT_CLAIMED',resolutionState:'CASH_OUT_CLAIMED',cashOutOperationId:operationId});
  mergeAt(db.data,`${QRIS_ROOT}/pending/PEND-1`,{status:'CASH_OUT_CLAIMED',cashOutOperationId:operationId,finalizedTransactionId:null});
  const recovered=await c.recover({providerTransactionId:'PROV-1',authorization:proof()});
  assert.equal(recovered.status,'CONFIRMED');
  assert.equal(recovered.transactionId,'TX-NEW');
  assert.deepEqual(calls,['commitLegacy']);
});

test('P4 recovery refuses to re-run sale when a prior attempt exists but transaction outcome cannot be proven',async()=>{
  const create=await load(),db=fakeDb(baseData()),calls=[],service=transactionServiceThatWrites(db,{calls,write:false});
  const c=create({db,transactionService:service,readRequester:requester(),readDrawerCash:()=>30000,now:()=>1000,random:()=>0.1});
  await assert.rejects(()=>c.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',authorization:proof()}),/QRIS_CASH_OUT_RECOVERY_REQUIRED/);
  assert.deepEqual(calls,['commitLegacy']);
  await assert.rejects(()=>c.recover({providerTransactionId:'PROV-1',authorization:proof()}),/QRIS_CASH_OUT_RECOVERY_REQUIRED/);
  assert.deepEqual(calls,['commitLegacy']);
});
