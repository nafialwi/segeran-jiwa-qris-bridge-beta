import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import vm from 'node:vm';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const SYNC=join(ROOT,'src','compat','rc01-sync-authority.js');
const SHIELD=join(ROOT,'src','compat','rc01-qris-event-sync-shield.js');
const COMPAT=join(ROOT,'src','compat','rc01-qris-deferred-settlement-compat.js');
const QRIS_ROOT='segeranjiwa_qris_beta_v1';

function deferred(){
  let resolve,reject;
  const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
  return {promise,resolve,reject};
}

function flush(){return Promise.resolve().then(()=>Promise.resolve()).then(()=>Promise.resolve()).then(()=>Promise.resolve())}

function makeLifecycleHarness(){
  const timers=[];
  const hold=deferred();
  let physicalTransactions=0;
  class Ref{
    constructor(path=''){this.path=String(path)}
    toString(){return `https://example.firebaseio.com/${this.path}`}
    set(v){return Promise.resolve(v)}
    update(v){return Promise.resolve(v)}
    remove(){return Promise.resolve(true)}
    once(){return Promise.resolve({val:()=>null})}
    transaction(){physicalTransactions++;return hold.promise}
  }
  const db={ref:path=>new Ref(path)};
  const firebase={database:()=>db};
  const p3={
    pendingWrites:0,serverConnected:true,updateSyncUI(){},schemaMeta(){return Promise.resolve(true)},
    patchWrites(){
      if(this._writePatch)return;this._writePatch=true;
      const proto=Object.getPrototypeOf(db.ref('toko_segeranjiwa_v58'));
      ['set','update','remove','transaction'].forEach(name=>{
        const orig=proto[name];if(typeof orig!=='function'||orig.__sjp3)return;
        const self=this;
        function wrapped(){
          self.pendingWrites++;
          let result;
          try{result=orig.apply(this,arguments)}catch(e){self.pendingWrites--;throw e}
          if(result&&typeof result.then==='function')return result.then(v=>{self.pendingWrites--;return v},e=>{self.pendingWrites--;throw e});
          self.pendingWrites--;return result;
        }
        wrapped.__sjp3=true;
        proto[name]=wrapped;
      });
    }
  };
  const schema=()=>({schemaMeta:async()=>true});
  const context={console,Promise,Date,Object,Array,String,Number,Boolean,Math,JSON,RegExp,Error,TypeError,Map,Set,WeakMap,
    db,firebase,document:{getElementById(){return null}},navigator:{onLine:true},
    SJMobileUX:schema(),SJMobileProfessionalP1:schema(),SJOwnerProfessionalP2:schema(),SJProductionArchitectureP3:p3,
    sjRenderDiagnostics(){},sjSaveError(){},showToast(){return true},
    setInterval(fn,ms){timers.push({fn,ms});return timers.length},clearInterval(){},setTimeout(fn){fn();return 1},clearTimeout(){},
  };
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  // Real generated order: S10C loads before P3 install, then S10A.2 shield loads later.
  vm.runInContext(readFileSync(SYNC,'utf8'),context,{filename:SYNC});
  p3.patchWrites();
  vm.runInContext(readFileSync(SHIELD,'utf8'),context,{filename:SHIELD});
  return {context,db,p3,timers,hold,getPhysicalTransactions:()=>physicalTransactions};
}

test('R4 real generated lifecycle keeps one S10C trace after late shield wraps the already-traced P3 transaction',async()=>{
  const h=makeLifecycleHarness();
  // Simulate the next 1s S10C retryInstall tick after the shield has wrapped transaction().
  h.context.SJRC01S10CSyncAuthority.retryInstall();
  const updater=()=>({status:'LATE_AFTER_CANCEL'});
  Object.defineProperty(updater,'__sjS10AQuarantine',{value:true});
  const pending=h.db.ref(`${QRIS_ROOT}/signals/SIG-R4`).transaction(updater);
  assert.equal(h.getPhysicalTransactions(),1,'authoritative quarantine must reach exactly one physical Firebase transaction');
  assert.equal(h.context.SJRC01S10CSyncAuthority.snapshot().criticalPending,1,'one physical transaction must create exactly one diagnostics row');
  assert.equal(h.context.SJRC01S10CSyncAuthority.snapshot().tracedActive,1);
  h.hold.resolve({committed:true});
  await pending;
  assert.equal(h.context.SJRC01S10CSyncAuthority.snapshot().tracedActive,0);
});

function makeCompatHarness({quarantineLateSignal,readSignal=async()=>null}={}){
  const timeouts=[];
  const errors=[];
  let timerSeq=0;
  const runtime={
    policy:{classifyLateSignalConflict(signal){return {status:'LATE_AFTER_CANCEL',providerTransactionId:String(signal?.providerTransactionId||''),lateCandidatePendingIds:['P-CANCELLED']}}},
    writer:{quarantineLateSignal},readSignal,
    findOwnedUnresolvedParked:async()=>[],findLateReviewSignals:async()=>[],readPending:async()=>null
  };
  const core={matchSignal(){return {status:'UNMATCHED',candidateIds:[]}},cartFingerprint(){return 'CF'}};
  const context={console,Promise,Date,JSON,Object,Array,Number,String,Math,Set,Map,Error,
    window:null,globalThis:null,
    document:{body:{appendChild(){}},getElementById(){return null},querySelector(){return null},createElement(){return{style:{},setAttribute(){},querySelector(){return null}}}},
    alert(){},confirm(){return false},showToast(){return true},sjSaveError(action,error){errors.push([action,error])},
    setTimeout(fn,ms){timeouts.push({id:++timerSeq,fn,ms:Number(ms)||0});return timerSeq},clearTimeout(){},
    setInterval(){return ++timerSeq},clearInterval(){},addEventListener(){},
    __SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME:runtime,SJQrisSignalCore:core,SJQrisSignalBeta:{status:()=>({activePendingId:''})},SJCommercialFinalV5961:{openPayment(){return true}},
    SJRC01S10A1QrisEventShield:{markBlocked(){return true}}
  };
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(readFileSync(COMPAT,'utf8'),context,{filename:COMPAT});
  const installIndex=timeouts.findIndex(x=>x.ms===0);
  const [install]=timeouts.splice(installIndex,1);install.fn();
  return {context,timeouts,errors,core:context.SJQrisSignalCore};
}

function runTimer(h,ms){
  const i=h.timeouts.findIndex(x=>x.ms===ms);if(i<0)return false;
  const [t]=h.timeouts.splice(i,1);t.fn();return true;
}

function lateSignal(){return {providerTransactionId:'SIG-LATE-R4',amount:5000,status:'UNMATCHED'}}

test('R4 persistent quarantine failure performs initial attempt plus one retry then enters terminal hold with original error evidence',async()=>{
  let writes=0;
  const rootError=Object.assign(new Error('Permission denied at signals/SIG-LATE-R4'),{code:'PERMISSION_DENIED'});
  const h=makeCompatHarness({quarantineLateSignal:async()=>{writes++;throw rootError}});
  h.core.matchSignal(lateSignal(),[],Date.now(),900000);
  assert.equal(runTimer(h,0),true,'initial late queue must drain');
  await flush();
  assert.equal(writes,1);
  assert.equal(h.timeouts.filter(x=>x.ms===500).length,1,'first failure schedules exactly one retry');
  assert.equal(runTimer(h,500),true);
  await flush();
  assert.equal(writes,2,'second attempt is the only retry');
  assert.equal(h.timeouts.filter(x=>x.ms===500).length,0,'second failure must not schedule a third autonomous retry');

  for(let i=0;i<20;i++)h.core.matchSignal(lateSignal(),[],Date.now(),900000);
  await flush();
  assert.equal(h.timeouts.filter(x=>x.ms===0||x.ms===500).length,0,'duplicate evaluations after terminal hold must not restart quarantine writes');
  assert.equal(writes,2);

  const held=h.errors.filter(([action])=>action==='QRIS_LATE_QUARANTINE_FAILED_HELD');
  assert.equal(held.length,1,'terminal failure must be logged once');
  assert.equal(held[0][1].code,'QRIS_LATE_QUARANTINE_FAILED_HELD');
  assert.match(String(held[0][1].message),/PERMISSION_DENIED/);
  assert.match(String(held[0][1].message),/Permission denied at signals\/SIG-LATE-R4/);
});

test('R4 exposes a dedicated verification gate without replaying historical R2/R3 hash locks',()=>{
  const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
  assert.equal(pkg.scripts?.['verify:rc01:s10c-r4'],'npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10c.mjs && node scripts/verify-rc01-s10c-r1.mjs && node scripts/verify-rc01-s10c-r4.mjs');
});
