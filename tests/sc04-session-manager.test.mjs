import test from 'node:test';
import assert from 'node:assert/strict';
import { createJsonStore } from '../src/data/local-store.js';
import { createSessionManager } from '../src/core/session-manager.js';

class MemoryStorage{
  constructor(){this.map=new Map()}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.map.set(k,String(v))}
  removeItem(k){this.map.delete(k)}
}

function validRepo({mode='SECURE',user,device,authUser}={}){
  const profile=user??{nama:'Kasir A',role:'transaksi',active:true,authUid:'UID-1'};
  const dev=device??{userId:'kasir-a',role:'transaksi',revoked:false,lastSeenTs:990_000};
  const map=authUser??{active:true,username:'kasir-a',role:'transaksi'};
  return {
    async readAuthMode(){return mode},
    async readUser(){return profile},
    async readDevice(){return dev},
    async readAuthUser(){return map}
  };
}

function authStub(user={uid:'UID-1'}){
  const calls={persist:0,signOut:0,wait:0};
  return {
    calls,
    async ensureLocalPersistence(){calls.persist++},
    async waitForInitialUser(){calls.wait++;return user},
    currentUser(){return user},
    async signOut(){calls.signOut++}
  };
}

function makeManager({storage=new MemoryStorage(),repo=validRepo(),auth=authStub(),online=true,now=1_000_000,legacyCalls=[]}={}){
  const store=createJsonStore({storage,key:'sj_session_envelope_v1'});
  const legacy={async completeLogin(...args){legacyCalls.push(args);return 'OK'}};
  const manager=createSessionManager({
    store,auth,repository:repo,legacy,
    readDeviceId:()=> 'DEV-1',
    readOnline:()=>online,
    readShiftHint:()=>({shiftKey:'2026-08-30-S1',sessionId:'SID-1'}),
    now:()=>now,
    maxAgeMs:10_000,
    legacyMaxAgeMs:10_000
  });
  return {manager,store,storage,auth,legacyCalls};
}

function seed(store,overrides={}){
  store.write({
    version:1,
    username:'kasir-a',
    deviceId:'DEV-1',
    authMode:'SECURE',
    firebaseUid:'UID-1',
    savedAt:995_000,
    validatedAt:995_000,
    shiftKey:'2026-08-30-S1',
    shiftSessionId:'SID-1',
    ...overrides
  });
}

test('SC-04 safe local envelope contains restoration hints only and never credentials/role authority',async()=>{
  const {manager,store,storage}=makeManager();
  await manager.saveAfterLogin({username:'kasir-a',authMode:'SECURE'});
  const row=store.read();
  assert.equal(row.username,'kasir-a');
  assert.equal(row.deviceId,'DEV-1');
  assert.equal(row.firebaseUid,'UID-1');
  assert.equal(row.shiftKey,'2026-08-30-S1');
  assert.equal(row.shiftSessionId,'SID-1');
  const raw=storage.getItem('sj_session_envelope_v1');
  assert.ok(raw);
  assert.equal(/pin|password|pass|credential|role|displayName/i.test(raw),false,raw);
});

test('SC-04 SECURE restore revalidates server identity/device/auth mapping then delegates completeLogin once with no PIN',async()=>{
  const legacyCalls=[];
  const fixture=makeManager({legacyCalls});
  seed(fixture.store);
  const result=await fixture.manager.restore();
  assert.equal(result.restored,true);
  assert.equal(result.mode,'SECURE');
  assert.equal(legacyCalls.length,1);
  assert.equal(legacyCalls[0][0],'kasir-a');
  assert.equal(legacyCalls[0][1],'');
  assert.equal(legacyCalls[0][2].role,'transaksi');
  assert.equal(fixture.auth.calls.signOut,0);
  assert.equal(fixture.store.read().validatedAt,1_000_000);
});

test('SC-04 HYBRID restore requires the persisted Firebase UID and active auth mapping',async()=>{
  const repo=validRepo({mode:'HYBRID'}),legacyCalls=[];
  const fixture=makeManager({repo,legacyCalls});
  seed(fixture.store,{authMode:'HYBRID'});
  const result=await fixture.manager.restore();
  assert.equal(result.restored,true);
  assert.equal(result.mode,'HYBRID');
  assert.equal(legacyCalls.length,1);
});

test('SC-04 LEGACY restore is allowed only after online server user/device validation and uses no stored credential',async()=>{
  const repo=validRepo({mode:'LEGACY',user:{nama:'Kasir A',role:'transaksi',active:true,authUid:''},authUser:null});
  const auth=authStub(null),legacyCalls=[];
  const fixture=makeManager({repo,auth,legacyCalls});
  seed(fixture.store,{authMode:'LEGACY',firebaseUid:''});
  const result=await fixture.manager.restore();
  assert.equal(result.restored,true);
  assert.equal(result.mode,'LEGACY');
  assert.equal(legacyCalls.length,1);
  assert.equal(legacyCalls[0][1],'');
});

test('SC-04 cold-start offline policy refuses auto-login without deleting a still-valid envelope',async()=>{
  const fixture=makeManager({online:false});
  seed(fixture.store);
  const result=await fixture.manager.restore();
  assert.deepEqual(result,{restored:false,reason:'OFFLINE_REVALIDATION_REQUIRED'});
  assert.ok(fixture.store.read());
  assert.equal(fixture.auth.calls.signOut,0);
});

test('SC-04 revoked device invalidates envelope, signs out Firebase Auth, and never completes login',async()=>{
  const repo=validRepo({device:{userId:'kasir-a',role:'transaksi',revoked:true,lastSeenTs:999_000}}),legacyCalls=[];
  const fixture=makeManager({repo,legacyCalls});
  seed(fixture.store);
  const result=await fixture.manager.restore();
  assert.equal(result.restored,false);
  assert.equal(result.reason,'DEVICE_REVOKED');
  assert.equal(fixture.store.read(),null);
  assert.equal(fixture.auth.calls.signOut,1);
  assert.equal(legacyCalls.length,0);
});

test('SC-04 disabled/missing user or invalid database role fails closed before legacy completion',async()=>{
  for(const [user,reason] of [
    [{nama:'Kasir A',role:'transaksi',active:false,authUid:'UID-1'},'USER_DISABLED'],
    [null,'USER_MISSING'],
    [{nama:'X',role:'admin',active:true,authUid:'UID-1'},'ROLE_INVALID']
  ]){
    const repo=validRepo({user}),legacyCalls=[];
    if(user===null) repo.readUser=async()=>null;
    const fixture=makeManager({repo,legacyCalls});
    seed(fixture.store);
    const result=await fixture.manager.restore();
    assert.equal(result.reason,reason);
    assert.equal(fixture.store.read(),null);
    assert.equal(legacyCalls.length,0);
  }
});

test('SC-04 expired envelope is cleared without attempting session restoration',async()=>{
  const legacyCalls=[];
  const fixture=makeManager({now:1_000_000,legacyCalls});
  seed(fixture.store,{savedAt:900_000,validatedAt:900_000});
  const result=await fixture.manager.restore();
  assert.equal(result.reason,'SESSION_EXPIRED');
  assert.equal(fixture.store.read(),null);
  assert.equal(legacyCalls.length,0);
});

test('SC-04 restore API has no shift creation/start dependency; shift remains legacy completeLogin responsibility',async()=>{
  const legacyCalls=[];
  const fixture=makeManager({legacyCalls});
  seed(fixture.store);
  await fixture.manager.restore();
  assert.deepEqual(Object.keys({completeLogin:true}),['completeLogin']);
  assert.equal(legacyCalls.length,1);
});

test('SC-04 live guard forces logout when user is disabled or device is revoked after login',async()=>{
  const watchers={};
  const repo=validRepo();
  repo.watchUser=(username,cb)=>{watchers.user=cb;return()=>{watchers.user=null}};
  repo.watchDevice=(deviceId,cb)=>{watchers.device=cb;return()=>{watchers.device=null}};
  const forced=[];
  const storage=new MemoryStorage(),store=createJsonStore({storage,key:'sj_session_envelope_v1'}),auth=authStub();
  const manager=createSessionManager({
    store,auth,repository:repo,legacy:{async completeLogin(){}},
    readDeviceId:()=> 'DEV-1',readOnline:()=>true,readShiftHint:()=>({}),now:()=>1_000_000,
    onForcedLogout:async reason=>{forced.push(reason)}
  });
  await manager.saveAfterLogin({username:'kasir-a',authMode:'SECURE'});
  assert.equal(typeof watchers.user,'function');
  assert.equal(typeof watchers.device,'function');
  await watchers.device({userId:'kasir-a',role:'transaksi',revoked:true,lastSeenTs:1_000_000});
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(forced,['DEVICE_REVOKED']);
  assert.equal(store.read(),null);
});
