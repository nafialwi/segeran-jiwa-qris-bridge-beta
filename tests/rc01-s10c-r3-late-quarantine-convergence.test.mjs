import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import vm from 'node:vm';
import {QRIS_ROOT} from '../src/data/firebase-client.js';
import {installQrisDeferredSettlementRuntime} from '../src/app/qris-deferred-settlement-bootstrap.js';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const COMPAT=join(ROOT,'src','compat','rc01-qris-deferred-settlement-compat.js');

function deferred(){
  let resolve,reject;
  const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
  return {promise,resolve,reject};
}

function normalizeIds(value){return [...new Set((value||[]).map(x=>String(x)))].sort()}

function makeHarness({readSignal=async()=>null,quarantineLateSignal=async()=>({status:'LATE_AFTER_CANCEL'})}={}){
  const timeouts=[];
  const intervals=[];
  let timerSeq=0;
  const runtime={
    policy:{
      classifyLateSignalConflict(signal){
        return {status:'LATE_AFTER_CANCEL',providerTransactionId:String(signal?.providerTransactionId||signal?._key||''),lateCandidatePendingIds:['P-CANCELLED']};
      }
    },
    writer:{quarantineLateSignal},
    readSignal,
    findOwnedUnresolvedParked:async()=>[],
    findLateReviewSignals:async()=>[],
    readPending:async()=>null
  };
  const core={
    matchSignal(){return {status:'UNMATCHED',candidateIds:[]}},
    cartFingerprint(){return 'CF'}
  };
  const beta={status:()=>({activePendingId:''})};
  const fakeNode={style:{},innerHTML:'',appendChild(){},querySelector(){return null}};
  const context={
    console,
    Promise,
    Date,
    JSON,
    Object,
    Array,
    Number,
    String,
    Math,
    Set,
    Map,
    window:null,
    globalThis:null,
    document:{
      body:{appendChild(){}},
      getElementById(){return null},
      querySelector(){return null},
      createElement(){return {...fakeNode,setAttribute(){},addEventListener(){}}}
    },
    alert(){},confirm(){return false},
    setTimeout(fn,ms){timeouts.push({id:++timerSeq,fn,ms:Number(ms)||0});return timerSeq},
    clearTimeout(){},
    setInterval(fn,ms){intervals.push({id:++timerSeq,fn,ms:Number(ms)||0});return timerSeq},
    clearInterval(){},
    addEventListener(){},
    __SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME:runtime,
    SJQrisSignalCore:core,
    SJQrisSignalBeta:beta,
    SJCommercialFinalV5961:{openPayment(){return true}},
  };
  context.window=context;
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(readFileSync(COMPAT,'utf8'),context,{filename:COMPAT});
  // The compat schedules one immediate install. Run exactly that timer.
  const installIndex=timeouts.findIndex(x=>x.ms===0);
  assert.notEqual(installIndex,-1,'compat must schedule immediate install');
  const [installTimer]=timeouts.splice(installIndex,1);
  installTimer.fn();
  assert.equal(typeof context.SJQrisSignalCore.matchSignal,'function');
  return {context,runtime,timeouts,intervals,core:context.SJQrisSignalCore};
}

async function flush(){for(let i=0;i<12;i++)await Promise.resolve()}

function fireTimers(h,{ms=null,limit=Infinity}={}){
  const selected=[];
  for(let i=0;i<h.timeouts.length&&selected.length<limit;){
    const t=h.timeouts[i];
    if(ms==null||t.ms===ms){selected.push(...h.timeouts.splice(i,1));}
    else i++;
  }
  for(const timer of selected)timer.fn();
  return selected.length;
}

function lateSignal(){return {providerTransactionId:'SIG-LATE-1',_key:'SIG-LATE-1',amount:5000,status:'UNMATCHED'}}


test('R3 repeated late classification for one provider schedules one quarantine writer instead of parallel drain fanout',async()=>{
  const hold=deferred();
  let writes=0;
  const h=makeHarness({quarantineLateSignal:async()=>{writes++;return hold.promise}});
  for(let i=0;i<40;i++)h.core.matchSignal(lateSignal(),[],Date.now(),900000);
  const immediate=h.timeouts.filter(x=>x.ms===0).length;
  assert.equal(immediate,1,'late provider burst must schedule one drain timer');
  fireTimers(h,{ms:0});
  await flush();
  assert.equal(writes,1,'only one quarantine write may be active for a provider');
  for(let i=0;i<30;i++)h.core.matchSignal(lateSignal(),[],Date.now(),900000);
  fireTimers(h,{ms:0});
  await flush();
  assert.equal(writes,1,'repeated classification while quarantine is in-flight must not create parallel writes');
  hold.resolve({status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateCandidatePendingIds:['P-CANCELLED']});
  await flush();
});


test('R3 preflight skips Firebase quarantine transaction when durable signal already equals the requested late quarantine state',async()=>{
  let writes=0,reads=0;
  const durable={providerTransactionId:'SIG-LATE-1',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateCandidatePendingIds:['P-CANCELLED']};
  const h=makeHarness({
    readSignal:async()=>{reads++;return durable},
    quarantineLateSignal:async()=>{writes++;return durable}
  });
  h.core.matchSignal(lateSignal(),[],Date.now(),900000);
  fireTimers(h,{ms:0});
  await flush();
  assert.equal(reads,1,'preflight must read current signal once');
  assert.equal(writes,0,'identical durable quarantine must stop before Firebase transaction writer');
});


test('R3 retry remains bounded: one failed quarantine schedules one retry, not one retry per duplicate classification',async()=>{
  let writes=0;
  const h=makeHarness({
    quarantineLateSignal:async()=>{writes++;if(writes===1)throw new Error('transient');return {status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateCandidatePendingIds:['P-CANCELLED']}}
  });
  for(let i=0;i<25;i++)h.core.matchSignal(lateSignal(),[],Date.now(),900000);
  fireTimers(h,{ms:0});
  await flush();
  assert.equal(writes,1);
  assert.equal(h.timeouts.filter(x=>x.ms===500).length,1,'failed provider gets one bounded retry timer');
  fireTimers(h,{ms:500,limit:1});
  await flush();
  assert.equal(writes,2,'retry performs one quarantine write');
});


test('R3 runtime exposes exact single-signal read for quarantine preflight without creating writer authority',async()=>{
  const signal={providerTransactionId:'SIG-LATE-1',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateCandidatePendingIds:['P-CANCELLED']};
  const db={ref(path){return{once:async()=>({val:()=>path===`${QRIS_ROOT}/signals/SIG-LATE-1`?signal:null})}}};
  const api=installQrisDeferredSettlementRuntime({}, {p4:{db},writer:{attachSnapshotAndPark(){},quarantineLateSignal(){}}});
  assert.equal(typeof api.readSignal,'function');
  assert.deepEqual(await api.readSignal('SIG-LATE-1'),signal);
});


test('R3 exposes a dedicated verifier after the R2 gate',()=>{
  const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
  assert.equal(pkg.scripts?.['verify:rc01:s10c-r3'],'npm run verify:rc01:s10c-r2 && node scripts/verify-rc01-s10c-r3.mjs');
});
