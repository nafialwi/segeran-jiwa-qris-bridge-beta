import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ROOT='toko_segeranjiwa_v58';
const SOURCE='src/compat/rc01-sync-authority.js';

function loadAuthority(){
  class Ref{
    constructor(path=''){this.path=path}
    toString(){return `https://example.firebaseio.com/${this.path}`}
    set(){return Promise.resolve()}
    update(){return Promise.resolve()}
    remove(){return Promise.resolve()}
    transaction(){return Promise.resolve({committed:true})}
  }
  const db={ref:path=>new Ref(path)};
  const firebase={database:()=>db};
  const context={console,Promise,Date,Object,Array,String,Number,Boolean,Math,JSON,RegExp,Error,TypeError,Map,Set,WeakMap,
    firebase,document:{getElementById(){return null}},navigator:{onLine:true},location:{},
    setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){},
    SJProductionArchitectureP3:{pendingWrites:0,serverConnected:true,updateSyncUI(){},schemaMeta(){return Promise.resolve()}},
    SJMobileUX:{schemaMeta(){return Promise.resolve()}},SJMobileProfessionalP1:{schemaMeta(){return Promise.resolve()}},SJOwnerProfessionalP2:{schemaMeta(){return Promise.resolve()}},
    sjRenderDiagnostics(){},sjSaveError(){}};
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(readFileSync(SOURCE,'utf8'),context,{filename:SOURCE});
  return context.SJRC01S10CSyncAuthority;
}

test('P0-SYNC01 device registration heartbeat is ADVISORY and cannot block shift close',()=>{
  const api=loadAuthority();
  const payload={id:'DEV-1',deviceName:'Android POS',userId:'kasir01',user:'Kasir',role:'kasir',build:'59.4.3.6',online:true,lastSeenAt:'2026-09-06T22:00:00.000Z',lastSeenTs:1,shift:'2026-09-06',sessionId:'SHIFT-1',startedAt:'2026-09-06T21:00:00.000Z',startedTs:1,revoked:false,authUid:'AUTH-1'};
  const row=api.classify('update',`${ROOT}/global/deviceSessions/DEV-1`,payload);
  assert.equal(row.classification,'ADVISORY');
  assert.equal(row.reason,'DEVICE_PRESENCE_HEARTBEAT');
});

test('P0-SYNC01 revoke/security mutations stay CRITICAL',()=>{
  const api=loadAuthority();
  const path=`${ROOT}/global/deviceSessions/DEV-1`;
  assert.equal(api.classify('update',path,{revoked:true,online:false,lastSeenAt:'x',lastSeenTs:1}).classification,'CRITICAL');
  assert.equal(api.classify('update',path,{revoked:false,revokedAt:'',revokedBy:'OWNER',online:true,lastSeenAt:'x',lastSeenTs:1}).classification,'CRITICAL');
  assert.equal(api.classify('update',path,{online:true,lastSeenAt:'x',lastSeenTs:1,permissions:['owner']}).classification,'CRITICAL');
});
