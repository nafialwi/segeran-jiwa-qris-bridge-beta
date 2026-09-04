import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const POS_ROOT='toko_segeranjiwa_v58',QRIS_ROOT='segeranjiwa_qris_beta_v1';
const snap=value=>({exists:()=>value!=null,val:()=>value});
function deferred(){let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}}
function runtime({signals={}}={}){
  const baseTxCalls=[],errors=[],hangs=new Map();
  class Ref{
    constructor(path){this.path=String(path||'')}
    toString(){return `https://example.firebaseio.com/${this.path}`}
    once(){const prefix=`${QRIS_ROOT}/signals/`;return Promise.resolve(snap(this.path.startsWith(prefix)?signals[this.path.slice(prefix.length)]??null:{}))}
    set(v){return hangs.get(`set:${this.path}`)?.promise??Promise.resolve(v)}
    update(v){return hangs.get(`update:${this.path}`)?.promise??Promise.resolve(v)}
    remove(){return hangs.get(`remove:${this.path}`)?.promise??Promise.resolve(true)}
    transaction(fn){baseTxCalls.push(this.path);const h=hangs.get(`transaction:${this.path}`);if(h)return h.promise;const value=typeof fn==='function'?fn(null):null;return Promise.resolve({committed:true,snapshot:snap(value)})}
  }
  const db={ref:path=>new Ref(path)},firebase={database:()=>db};firebase.database.ServerValue={TIMESTAMP:{'.sv':'timestamp'}};
  const p3={pendingWrites:0,serverConnected:true,updateSyncUI(){},schemaMeta:async()=>true};
  const schema=()=>({schemaMeta:async()=>true});
  const context={console,Promise,Date,Object,Array,String,Number,Boolean,Math,JSON,RegExp,Error,TypeError,Map,Set,WeakMap,
    db,firebase,navigator:{onLine:true},document:{getElementById(){return null}},
    SJMobileUX:schema(),SJMobileProfessionalP1:schema(),SJOwnerProfessionalP2:schema(),SJProductionArchitectureP3:p3,
    sjRenderDiagnostics(){},sjSaveError(action,error){errors.push([action,error])},showToast(){return true},
    setInterval(){return 1},clearInterval(){},setTimeout(fn){fn();return 1},clearTimeout(){}};
  context.window=context;context.globalThis=context;vm.createContext(context);
  vm.runInContext(readFileSync(join(ROOT,'src','compat','rc01-qris-event-sync-shield.js'),'utf8'),context,{filename:'s10a2-shield.js'});
  vm.runInContext(readFileSync(join(ROOT,'src','compat','rc01-sync-authority.js'),'utf8'),context,{filename:'s10c-sync.js'});
  return{context,db,p3,hangs,baseTxCalls,api:context.SJRC01S10CSyncAuthority};
}

test('S10C generated lifecycle order is deterministic around legacy P3 installs',()=>{
  execFileSync(process.execPath,[join(ROOT,'scripts','build-ref01.mjs')],{cwd:ROOT,stdio:'pipe'});
  const html=readFileSync(join(ROOT,'dist-ref01','index.html'),'utf8');
  const p3Expose=html.indexOf('window.SJProductionArchitectureP3=SJProductionArchitectureP3;');
  const s10c=html.indexOf('data-sj-rc01-s10c-sync-authority="true"');
  const mobileInstall=html.indexOf('try{SJMobileUX.install();');
  const p3Install=html.indexOf('SJProductionArchitectureP3.install();');
  assert.ok(p3Expose>=0&&p3Expose<s10c&&s10c<mobileInstall&&mobileInstall<p3Install,{p3Expose,s10c,mobileInstall,p3Install});
});

test('S10C advisory hang stays visible without business lock while critical hang blocks until settled',async()=>{
  const h=runtime(),adv=deferred(),crit=deferred();
  h.hangs.set(`update:${POS_ROOT}/global/deviceSessions/D1`,adv);
  h.hangs.set(`update:${POS_ROOT}/global/transactions/T1`,crit);
  const a=h.db.ref(`${POS_ROOT}/global/deviceSessions/D1`).update({online:true,lastSeenAt:'x',lastSeenTs:1});
  assert.equal(h.api.snapshot().advisoryPending,1);assert.equal(h.api.snapshot().criticalPending,0);assert.equal(h.p3.pendingWrites,0);
  const c=h.db.ref(`${POS_ROOT}/global/transactions/T1`).update({status:'PAID'});
  assert.equal(h.api.snapshot().criticalPending,1);assert.equal(h.p3.pendingWrites,1);
  const closingAllowed=()=>h.p3.pendingWrites===0,restoreAllowed=()=>h.p3.pendingWrites===0;
  assert.equal(closingAllowed(),false);assert.equal(restoreAllowed(),false);
  crit.resolve(true);await c;assert.equal(h.p3.pendingWrites,0);assert.equal(closingAllowed(),true);assert.equal(h.api.snapshot().advisoryPending,1);
  adv.resolve(true);await a;
});

test('S10C preserves S10A.2 late QRIS isolation and normal QRIS transaction path',async()=>{
  const late=runtime({signals:{P1:{providerTransactionId:'P1',status:'LATE_AFTER_CANCEL',resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,amount:5000}}});
  const lateResult=await late.db.ref(`${QRIS_ROOT}/signals/P1`).transaction(cur=>({...cur,status:'UNMATCHED'}));
  assert.equal(lateResult.committed,false);assert.deepEqual(late.baseTxCalls,[]);assert.equal(late.api.snapshot().criticalPending,0);
  const normal=runtime({signals:{N1:{providerTransactionId:'N1',status:'UNMATCHED',amount:7000}}});
  const normalResult=await normal.db.ref(`${QRIS_ROOT}/signals/N1`).transaction(cur=>({...cur,status:'UNMATCHED'}));
  assert.equal(normalResult.committed,true);assert.deepEqual(normal.baseTxCalls,[`${QRIS_ROOT}/signals/N1`]);assert.equal(normal.api.snapshot().criticalPending,0);
});
