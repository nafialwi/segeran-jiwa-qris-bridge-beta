import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync,readFileSync } from 'node:fs';

const SHIELD='src/compat/rc01-qris-event-sync-shield.js';
const QRIS_ROOT='segeranjiwa_qris_beta_v1';
const snap=value=>({exists:()=>value!=null,val:()=>value});

function harness({signals={},denyEvents=false}={}){
  const txCalls=[],toasts=[];
  class Ref{
    constructor(path){this.path=String(path||'')}
    toString(){return `https://example-default-rtdb.firebaseio.com/${this.path}`}
    once(){
      const prefix=`${QRIS_ROOT}/signals/`;
      const value=this.path.startsWith(prefix)?signals[this.path.slice(prefix.length)]??null:null;
      return Promise.resolve(snap(value));
    }
    transaction(updateFn){
      txCalls.push(this.path);
      if(denyEvents&&this.path.startsWith(`${QRIS_ROOT}/events/`)){
        const error=new Error('PERMISSION_DENIED');error.code='PERMISSION_DENIED';return Promise.reject(error);
      }
      const value=typeof updateFn==='function'?updateFn(null):null;
      return Promise.resolve({committed:true,snapshot:snap(value)});
    }
  }
  const db={ref:path=>new Ref(path)};
  const context={
    db,window:null,globalThis:null,console,Date,Promise,Map,Set,Object,String,Number,RegExp,JSON,
    setTimeout:fn=>{fn();return 1},clearTimeout(){},
    showToast:(message,type)=>{toasts.push({message:String(message),type});return true}
  };
  context.window=context;context.globalThis=context;
  assert.equal(existsSync(SHIELD),true,'S10A.1 shield file must exist');
  vm.runInNewContext(readFileSync(SHIELD,'utf8'),context,{filename:SHIELD});
  return {context,db,Ref,txCalls,toasts};
}

test('S10A.1 suppresses durable late-quarantine QRIS event before underlying transaction',async()=>{
  const {context,db,txCalls}=harness({signals:{P1:{providerTransactionId:'P1',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,amount:5000}}});
  const result=await db.ref(`${QRIS_ROOT}/events/P1__RECEIVED`).transaction(cur=>cur||{eventId:'P1__RECEIVED'});
  assert.equal(result.committed,false);
  assert.deepEqual(txCalls,[]);
  assert.equal(context.SJRC01S10A1QrisEventShield.isBlocked('P1'),true);
});

test('S10A.1 keeps normal QRIS event persistence active when Firebase permits it',async()=>{
  const {db,txCalls}=harness({signals:{N1:{providerTransactionId:'N1',status:'UNMATCHED',amount:7000}}});
  const result=await db.ref(`${QRIS_ROOT}/events/N1__UNMATCHED`).transaction(cur=>cur||{eventId:'N1__UNMATCHED'});
  assert.equal(result.committed,true);
  assert.deepEqual(txCalls,[`${QRIS_ROOT}/events/N1__UNMATCHED`]);
});

test('S10A.1 degrades denied non-authoritative event channel and avoids repeated event writes',async()=>{
  const {context,db,txCalls}=harness({signals:{N1:{providerTransactionId:'N1',status:'UNMATCHED',amount:7000},N2:{providerTransactionId:'N2',status:'UNMATCHED',amount:8000}},denyEvents:true});
  const first=await db.ref(`${QRIS_ROOT}/events/N1__UNMATCHED`).transaction(cur=>cur||{eventId:'N1__UNMATCHED'});
  assert.equal(first.committed,false);
  assert.equal(context.SJRC01S10A1QrisEventShield.eventChannelState(),'DENIED_DEGRADED');
  const second=await db.ref(`${QRIS_ROOT}/events/N2__RECEIVED`).transaction(cur=>cur||{eventId:'N2__RECEIVED'});
  assert.equal(second.committed,false);
  assert.deepEqual(txCalls,[`${QRIS_ROOT}/events/N1__UNMATCHED`]);
});

test('S10A.1 suppresses only the immediate legacy unmatched toast for a synchronously blocked late amount',()=>{
  const {context,toasts}=harness();
  context.SJRC01S10A1QrisEventShield.markBlocked('P1',5000);
  context.showToast('QRIS Rp5.000 masuk dan belum cocok dengan transaksi pending.','warning');
  context.showToast('Transaksi tunai berhasil.','success');
  assert.deepEqual(toasts,[{message:'Transaksi tunai berhasil.',type:'success'}]);
});


test('S10A.2 suppresses legacy match-state transaction for synchronously blocked signal before P3 monitored base transaction',async()=>{
  const {context,db,txCalls}=harness({signals:{P1:{providerTransactionId:'P1',status:'UNMATCHED',amount:5000}}});
  context.SJRC01S10A1QrisEventShield.markBlocked('P1',5000);
  const result=await db.ref(`${QRIS_ROOT}/signals/P1`).transaction(cur=>({...cur,status:'UNMATCHED'}));
  assert.equal(result.committed,false);
  assert.deepEqual(txCalls,[]);
});

test('S10A.2 suppresses legacy match-state transaction for durable late-review signal after refresh',async()=>{
  const {db,txCalls}=harness({signals:{P1:{providerTransactionId:'P1',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,amount:5000}}});
  const result=await db.ref(`${QRIS_ROOT}/signals/P1`).transaction(cur=>({...cur,status:'UNMATCHED'}));
  assert.equal(result.committed,false);
  assert.deepEqual(txCalls,[]);
});

test('S10A.2 allows explicitly marked authoritative quarantine updater through blocked signal isolation',async()=>{
  const {context,db,txCalls}=harness({signals:{P1:{providerTransactionId:'P1',status:'UNMATCHED',amount:5000}}});
  context.SJRC01S10A1QrisEventShield.markBlocked('P1',5000);
  const update=cur=>({...cur,status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true});
  Object.defineProperty(update,'__sjS10AQuarantine',{value:true});
  const result=await db.ref(`${QRIS_ROOT}/signals/P1`).transaction(update);
  assert.equal(result.committed,true);
  assert.deepEqual(txCalls,[`${QRIS_ROOT}/signals/P1`]);
});

test('S10A.2 leaves normal signal transaction path unchanged',async()=>{
  const {db,txCalls}=harness({signals:{N1:{providerTransactionId:'N1',status:'UNMATCHED',amount:7000}}});
  const result=await db.ref(`${QRIS_ROOT}/signals/N1`).transaction(cur=>({...cur,status:'UNMATCHED'}));
  assert.equal(result.committed,true);
  assert.deepEqual(txCalls,[`${QRIS_ROOT}/signals/N1`]);
});
