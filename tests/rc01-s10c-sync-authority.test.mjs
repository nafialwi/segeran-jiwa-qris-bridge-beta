import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ROOT='toko_segeranjiwa_v58';
const SOURCE=new URL('../src/compat/rc01-sync-authority.js',import.meta.url);

function deferred(){let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}}

function harness(){
  const calls=[],errors=[],timers=[],txControl={current:null};
  class Ref{
    constructor(path=''){this.path=String(path||'').replace(/^\/+|\/+$/g,'')}
    toString(){return `https://example.firebaseio.com/${this.path}`}
    set(value){calls.push(['set',this.path,value]);return Promise.resolve({method:'set',value})}
    update(value){calls.push(['update',this.path,value]);return Promise.resolve({method:'update',value})}
    remove(){calls.push(['remove',this.path]);return Promise.resolve('removed')}
    transaction(fn){calls.push(['transaction',this.path,fn]);if(txControl.current)return txControl.current.promise;return Promise.resolve({committed:true,snapshot:{val:()=>fn(null)}})}
    once(){return Promise.resolve({val:()=>({})})}
  }
  const db={ref:path=>new Ref(path)};
  const firebase={database:()=>db};
  firebase.database.ServerValue={TIMESTAMP:{'.sv':'timestamp'}};
  const p3={pendingWrites:0,serverConnected:true,lastConfirmedAt:'',lastWriteError:'',updateSyncUI(){this.uiUpdates=(this.uiUpdates||0)+1},patchWrites(){},schemaMeta(){calls.push(['p3-schema']);return Promise.resolve('p3-schema')}};
  const mkSchema=(id)=>({schemaMeta(){calls.push([id+'-schema']);return Promise.resolve(id)}});
  const elements=new Map();
  const document={
    getElementById(id){return elements.get(id)||null},
    createElement(){return{innerHTML:'',className:'',id:'',style:{},setAttribute(){},appendChild(){}}}
  };
  const context={console,Promise,Date,Object,Array,String,Number,Boolean,Math,JSON,RegExp,Error,TypeError,Map,Set,WeakMap,
    firebase,document,navigator:{onLine:true},location:{},
    SJMobileUX:mkSchema('5940'),SJMobileProfessionalP1:mkSchema('5941'),SJOwnerProfessionalP2:mkSchema('5942'),SJProductionArchitectureP3:p3,
    sjRenderDiagnostics(){},sjSaveError(action,error){errors.push([action,error])},
    setInterval(fn,ms){timers.push([fn,ms]);return timers.length},clearInterval(){},setTimeout(fn){fn();return 1},clearTimeout(){},
  };
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(readFileSync(SOURCE,'utf8'),context,{filename:'rc01-sync-authority.js'});
  return{context,db,Ref,calls,errors,timers,txControl,p3,api:context.SJRC01S10CSyncAuthority};
}

test('S10C registry tracks set/update/remove/transaction and preserves promise outcomes',async()=>{
  const h=harness();
  const d=deferred();h.Ref.prototype.set=function(value){h.calls.push(['set',this.path,value]);return d.promise};
  h.api.retryInstall();
  const p=h.db.ref(`${ROOT}/global/transactions/T1`).set({total:5000});
  let snap=h.api.snapshot();
  assert.equal(snap.criticalPending,1);assert.equal(snap.advisoryPending,0);assert.equal(snap.active[0].method,'set');assert.match(snap.active[0].path,/transactions\/T1$/);
  d.resolve('OK');assert.equal(await p,'OK');assert.equal(h.api.snapshot().active.length,0);
  for(const method of ['update','remove','transaction']){
    const ref=h.db.ref(`${ROOT}/global/test/${method}`);await ref[method](method==='transaction'?(()=>({ok:true})):method==='remove'?undefined:{ok:true});
  }
});

test('S10C preserves rejected write error and removes it from registry',async()=>{
  const h=harness(),d=deferred(),err=Object.assign(new Error('denied'),{code:'PERMISSION_DENIED'});
  h.Ref.prototype.update=function(){return d.promise};h.api.retryInstall();
  const p=h.db.ref(`${ROOT}/global/transactions/T2`).update({x:1});
  assert.equal(h.api.snapshot().criticalPending,1);d.reject(err);await assert.rejects(p,e=>e===err);assert.equal(h.api.snapshot().active.length,0);
});

test('S10C defaults unknown writes to CRITICAL',()=>{
  const h=harness();
  const row=h.api.classify('update',`${ROOT}/global/anything/newRoot`,{x:1});
  assert.equal(row.classification,'CRITICAL');assert.equal(row.reason,'DEFAULT_CRITICAL');
});

test('S10C classifies only exact notification read acknowledgements ADVISORY',()=>{
  const h=harness();
  assert.equal(h.api.classify('set',`${ROOT}/global/notifications/N1/readBy/owner`,true).classification,'ADVISORY');
  assert.equal(h.api.classify('set',`${ROOT}/global/notifications/N1/readBy/owner`,false).classification,'CRITICAL');
  assert.equal(h.api.classify('update',ROOT,{'global/notifications/N1/readBy/owner':true,'global/notifications/N2/readBy/owner':true}).classification,'ADVISORY');
  assert.equal(h.api.classify('update',ROOT,{'global/notifications/N1/readBy/owner':true,'global/transactions/T1/status':'PAID'}).classification,'CRITICAL');
});

test('S10C distinguishes device heartbeat from revoke/security mutations on same root',()=>{
  const h=harness();
  const path=`${ROOT}/global/deviceSessions/D1`;
  assert.equal(h.api.classify('update',path,{online:true,lastSeenAt:'x',lastSeenTs:1,shift:'2026-09-04',sessionId:'S1',build:'59.4.3.6',authUid:'U1'}).classification,'ADVISORY');
  assert.equal(h.api.classify('update',path,{online:false,lastSeenAt:'x',lastSeenTs:1}).classification,'ADVISORY');
  assert.equal(h.api.classify('update',path,{revoked:true,revokedBy:'OWNER',online:false}).classification,'CRITICAL');
  assert.equal(h.api.classify('update',`${ROOT}/global/deviceSessions`,{D1:{online:true,lastSeenTs:1}}).classification,'CRITICAL');
});

test('S10C P3 compatibility pendingWrites exposes CRITICAL count only',async()=>{
  const h=harness(),adv=deferred(),crit=deferred();
  h.Ref.prototype.update=function(payload){if(this.path.endsWith('/deviceSessions/D1'))return adv.promise;if(this.path.endsWith('/transactions/T1'))return crit.promise;return Promise.resolve()};h.api.retryInstall();
  const a=h.db.ref(`${ROOT}/global/deviceSessions/D1`).update({online:true,lastSeenAt:'x',lastSeenTs:1});
  assert.equal(h.p3.pendingWrites,0);assert.equal(h.api.snapshot().advisoryPending,1);
  const c=h.db.ref(`${ROOT}/global/transactions/T1`).update({status:'PAID'});
  assert.equal(h.p3.pendingWrites,1);assert.equal(h.api.snapshot().criticalPending,1);
  crit.resolve();await c;assert.equal(h.p3.pendingWrites,0);assert.equal(h.api.snapshot().advisoryPending,1);adv.resolve();await a;
});

test('S10C emits local stuck evidence once per write and never creates a Firebase diagnostics write',async()=>{
  const h=harness(),d=deferred();h.Ref.prototype.set=function(){return d.promise};h.api.retryInstall();
  const before=h.calls.length,p=h.db.ref(`${ROOT}/global/transactions/T3`).set({x:1});
  const started=h.api.snapshot().active[0].startedAt;
  h.api.scanStuck(started+15001);h.api.scanStuck(started+30000);
  assert.equal(h.errors.filter(x=>x[0]==='SYNC_WRITE_STUCK').length,1);assert.equal(h.calls.length,before);
  d.resolve();await p;
});

test('S10C suppresses ordinary 59.4.0/59.4.1/59.4.2/P3 schema announcements but preserves explicit migration path',async()=>{
  const h=harness();
  await h.context.SJMobileUX.schemaMeta();await h.context.SJMobileProfessionalP1.schemaMeta();await h.context.SJOwnerProfessionalP2.schemaMeta();await h.context.SJProductionArchitectureP3.schemaMeta();
  assert.equal(h.calls.filter(x=>String(x[0]).endsWith('-schema')||x[0]==='p3-schema').length,0);
  await h.api.runExplicitSchemaMigration('5940');
  assert.equal(h.calls.filter(x=>x[0]==='5940-schema').length,1);
});

test('S10C diagnostics snapshot exposes method/path/age/classification without mutation',async()=>{
  const h=harness(),d=deferred();h.Ref.prototype.transaction=function(){return d.promise};h.api.retryInstall();
  const p=h.db.ref(`${ROOT}/global/transactions/T4`).transaction(()=>({x:1}));
  const snap=h.api.snapshot(Date.now()+20);assert.equal(snap.active.length,1);assert.equal(snap.active[0].method,'transaction');assert.equal(snap.active[0].classification,'CRITICAL');assert.ok(snap.active[0].ageMs>=0);
  d.resolve({committed:true});await p;
});


test('S10C does not double-trace when legacy P3 wraps an already traced Firebase transaction method',async()=>{
  const h=harness(),d=deferred();
  h.txControl.current=d;
  const traced=h.Ref.prototype.transaction;
  function p3Wrapped(){return traced.apply(this,arguments)}
  p3Wrapped.__sjp3=true;
  h.Ref.prototype.transaction=p3Wrapped;
  h.api.retryInstall();
  const pending=h.db.ref(`${ROOT}/global/transactions/P3-INTEROP`).transaction(()=>({ok:true}));
  const snap=h.api.snapshot();
  assert.equal(snap.criticalPending,1,'one underlying write must create exactly one S10C registry row');
  assert.equal(snap.active.length,1);
  d.resolve({committed:true});await pending;
  assert.equal(h.api.snapshot().active.length,0);
});
