import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { createSessionManager } from '../src/core/session-manager.js';

const bootstrapSource=fs.readFileSync(
  new URL('../src/app/sc04-bootstrap.js',import.meta.url),
  'utf8'
);

function memoryStore(){
  let value=null;
  return {
    read(){return value},
    write(next){value=next;return next},
    clear(){value=null}
  };
}

function authStub(){
  return {
    async ensureLocalPersistence(){return true},
    async waitForInitialUser(){return null},
    currentUser(){return null},
    async signOut(){return true}
  };
}

test('LOCAL QA can suppress SC04 live revocation watchers without losing the local session envelope',async()=>{
  const calls={userWatch:0,deviceWatch:0,forced:0};
  const repository={
    async readAuthMode(){return 'LEGACY'},
    async readUser(){return {active:true,role:'manajemen'}},
    async readDevice(){return {userId:'admin',role:'manajemen',revoked:false,lastSeenTs:Date.now()}},
    async readAuthUser(){return null},
    watchUser(){calls.userWatch++;return()=>{}},
    watchDevice(){calls.deviceWatch++;return()=>{}}
  };
  const store=memoryStore();

  const manager=createSessionManager({
    store,
    auth:authStub(),
    repository,
    legacy:{async completeLogin(){return true}},
    readDeviceId:()=> 'DEV-LOCAL-QA',
    readOnline:()=>true,
    readShiftHint:()=>({}),
    readLiveGuardEnabled:()=>false,
    onForcedLogout:async()=>{calls.forced++}
  });

  await manager.saveAfterLogin({
    username:'admin',
    authMode:'LEGACY',
    role:'manajemen'
  });

  assert.equal(calls.userWatch,0);
  assert.equal(calls.deviceWatch,0);
  assert.equal(calls.forced,0);
  assert.equal(store.read()?.username,'admin');
});

test('production default still enables SC04 live revocation watchers',async()=>{
  const calls={userWatch:0,deviceWatch:0};
  const repository={
    async readAuthMode(){return 'LEGACY'},
    async readUser(){return {active:true,role:'manajemen'}},
    async readDevice(){return {userId:'admin',role:'manajemen',revoked:false,lastSeenTs:Date.now()}},
    async readAuthUser(){return null},
    watchUser(){calls.userWatch++;return()=>{}},
    watchDevice(){calls.deviceWatch++;return()=>{}}
  };

  const manager=createSessionManager({
    store:memoryStore(),
    auth:authStub(),
    repository,
    legacy:{async completeLogin(){return true}},
    readDeviceId:()=> 'DEV-PRODUCTION',
    readOnline:()=>true,
    readShiftHint:()=>({})
  });

  await manager.saveAfterLogin({
    username:'admin',
    authMode:'LEGACY',
    role:'manajemen'
  });

  assert.equal(calls.userWatch,1);
  assert.equal(calls.deviceWatch,1);
});

test('SC04 bootstrap disables only live guard when LOCAL QA read-only flag is active',()=>{
  assert.match(
    bootstrapSource,
    /readLiveGuardEnabled:\(\)=>runtime\?\.__SJ_LOCAL_QA_READ_ONLY!==true/
  );

  assert.match(
    bootstrapSource,
    /onForcedLogout:async\(\)=>commands\.invoke\('sc04\.legacy\.logout'\)/
  );
});
