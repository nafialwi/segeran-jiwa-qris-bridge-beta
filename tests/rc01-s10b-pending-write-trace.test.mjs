import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync,readFileSync } from 'node:fs';

const TRACE='src/compat/rc01-firebase-pending-write-trace.js';

function deferred(){let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}}
function fakeDom(){
  const byId={};
  const parent={insertBefore(node){if(node.id)byId[node.id]=node;node.parentNode=parent;return node}};
  const errorList={id:'sj-error-list',innerHTML:'',parentNode:parent};byId[errorList.id]=errorList;
  return {
    byId,
    document:{
      getElementById:id=>byId[id]||null,
      createElement:()=>({id:'',innerHTML:'',style:{},parentNode:null})
    }
  };
}
function harness(){
  const hangs=new Map(),baseCalls=[],savedErrors=[],dom=fakeDom();
  class Ref{
    constructor(path){this.path=String(path||'')}
    toString(){return `https://example-default-rtdb.firebaseio.com/${this.path}`}
    _call(method,value){
      baseCalls.push({method,path:this.path,value});
      if(this.path.includes('/hang')){const d=deferred();hangs.set(`${method}:${this.path}`,d);return d.promise}
      if(this.path.includes('/reject')){const e=new Error('PERMISSION_DENIED');e.code='PERMISSION_DENIED';return Promise.reject(e)}
      if(this.path.includes('/sync'))return {ok:true};
      return Promise.resolve({ok:true});
    }
    set(v){return this._call('set',v)}
    update(v){return this._call('update',v)}
    remove(){return this._call('remove')}
    transaction(fn){return this._call('transaction',fn)}
  }
  const db={ref:path=>new Ref(path)};
  const localStorage={getItem(){return null},setItem(){},removeItem(){}};
  let baseDiagCalls=0;
  const context={
    window:null,globalThis:null,console,Date,Promise,Map,Set,Object,String,Number,RegExp,JSON,Math,
    db,navigator:{onLine:true},localStorage,document:dom.document,activeDate:'2026-09-04-S1',
    sjNowIso:()=> '2026-09-04T00:00:00.000+07:00',
    sjEsc:v=>String(v),
    sjSaveError:(action,err)=>savedErrors.push({action,code:err?.code||'',message:err?.message||String(err)}),
    sjRenderDiagnostics:()=>{baseDiagCalls++},
    setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){}
  };
  context.window=context;context.globalThis=context;
  assert.equal(existsSync(TRACE),true,'S10B trace file must exist');
  vm.runInNewContext(readFileSync(TRACE,'utf8'),context,{filename:TRACE});
  return {context,db,hangs,baseCalls,savedErrors,dom,get baseDiagCalls(){return baseDiagCalls}};
}

test('S10B traces a hanging Firebase write with method path and age without settling it',async()=>{
  const h=harness();
  const p=h.db.ref('toko_segeranjiwa_v58/global/schema/hang').update({x:1});
  const rows=h.context.SJRC01S10BPendingWriteTrace.activeWrites(Date.now()+2000);
  assert.equal(rows.length,1);
  assert.equal(rows[0].method,'update');
  assert.equal(rows[0].path,'/toko_segeranjiwa_v58/global/schema/hang');
  assert.ok(rows[0].ageMs>=1900);
  h.hangs.get('update:toko_segeranjiwa_v58/global/schema/hang').resolve({ok:true});
  await p;
  assert.equal(h.context.SJRC01S10BPendingWriteTrace.activeWrites().length,0);
});

test('S10B removes rejected trace and preserves original Firebase error',async()=>{
  const h=harness();
  await assert.rejects(()=>h.db.ref('toko_segeranjiwa_v58/global/schema/reject').update({x:1}),e=>e.code==='PERMISSION_DENIED');
  assert.equal(h.context.SJRC01S10BPendingWriteTrace.activeWrites().length,0);
});

test('S10B removes synchronous non-Promise write trace immediately',()=>{
  const h=harness();
  const out=h.db.ref('toko_segeranjiwa_v58/global/schema/sync').remove();
  assert.deepEqual(out,{ok:true});
  assert.equal(h.context.SJRC01S10BPendingWriteTrace.activeWrites().length,0);
});

test('S10B emits one local SYNC_WRITE_STUCK warning per trace after 15 seconds',()=>{
  const h=harness();
  h.db.ref('toko_segeranjiwa_v58/global/systemMeta/hang').set({x:1});
  const row=h.context.SJRC01S10BPendingWriteTrace.activeWrites()[0];
  h.context.SJRC01S10BPendingWriteTrace.scanStuck(row.startedTs+14999);
  assert.equal(h.savedErrors.length,0);
  h.context.SJRC01S10BPendingWriteTrace.scanStuck(row.startedTs+15000);
  h.context.SJRC01S10BPendingWriteTrace.scanStuck(row.startedTs+30000);
  assert.equal(h.savedErrors.length,1);
  assert.equal(h.savedErrors[0].action,'SYNC_WRITE_STUCK');
  assert.equal(h.savedErrors[0].code,'SYNC_WRITE_STUCK');
  assert.match(h.savedErrors[0].message,/set .*systemMeta\/hang/);
});

test('S10B Diagnostics shows P3 pending count active traced write and mismatch',()=>{
  const h=harness();
  h.db.ref('toko_segeranjiwa_v58/global/schema/hang').update({x:1});
  h.context.SJProductionArchitectureP3={pendingWrites:2,serverConnected:true};
  h.context.sjRenderDiagnostics();
  const box=h.dom.byId['sj-s10b-sync-trace'];
  assert.ok(box,'diagnostics trace box must be inserted');
  assert.match(box.innerHTML,/FIREBASE WRITE TRACE/);
  assert.match(box.innerHTML,/Pending <b>2<\/b>/);
  assert.match(box.innerHTML,/Traced <b>1<\/b>/);
  assert.match(box.innerHTML,/Untraced <b>1<\/b>/);
  assert.match(box.innerHTML,/UPDATE/);
  assert.match(box.innerHTML,/global\/schema\/hang/);
  assert.equal(h.baseDiagCalls,1);
});
