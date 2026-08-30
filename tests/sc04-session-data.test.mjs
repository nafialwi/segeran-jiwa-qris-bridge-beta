import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirebaseAuthSession } from '../src/data/firebase-auth-session.js';
import { createUserRepository } from '../src/data/repositories/user-repository.js';

function snapshot(value){return {val:()=>value}}

test('SC-04 user repository reads only fixed POS session-validation paths',async()=>{
  const seen=[];
  const values=new Map([
    ['toko_segeranjiwa_v58/global/users/kasir-a',{role:'transaksi'}],
    ['toko_segeranjiwa_v58/global/authUsers/UID-1',{active:true}],
    ['toko_segeranjiwa_v58/global/deviceSessions/DEV-1',{revoked:false}],
    ['toko_segeranjiwa_v58/global/security/authMode','SECURE']
  ]);
  const db={ref(path){seen.push(path);return {once:async(type)=>{assert.equal(type,'value');return snapshot(values.get(path))}}}};
  const repo=createUserRepository({db});
  assert.deepEqual(await repo.readUser('kasir-a'),{role:'transaksi'});
  assert.deepEqual(await repo.readAuthUser('UID-1'),{active:true});
  assert.deepEqual(await repo.readDevice('DEV-1'),{revoked:false});
  assert.equal(await repo.readAuthMode(),'SECURE');
  assert.deepEqual(seen,[
    'toko_segeranjiwa_v58/global/users/kasir-a',
    'toko_segeranjiwa_v58/global/authUsers/UID-1',
    'toko_segeranjiwa_v58/global/deviceSessions/DEV-1',
    'toko_segeranjiwa_v58/global/security/authMode'
  ]);
});

test('SC-04 Firebase Auth adapter explicitly requests LOCAL persistence and exposes current persisted user',async()=>{
  const calls=[];
  const client={
    currentUser:{uid:'UID-1'},
    async setPersistence(value){calls.push(['persist',value])},
    async signOut(){calls.push(['signOut'])}
  };
  const authFn=()=>client;
  authFn.Auth={Persistence:{LOCAL:'LOCAL-PERSISTENCE'}};
  const runtime={firebase:{auth:authFn}};
  const session=createFirebaseAuthSession({runtime});
  await session.ensureLocalPersistence();
  assert.deepEqual(calls,[['persist','LOCAL-PERSISTENCE']]);
  assert.deepEqual(session.currentUser(),{uid:'UID-1'});
  assert.deepEqual(await session.waitForInitialUser(),{uid:'UID-1'});
  await session.signOut();
  assert.deepEqual(calls.at(-1),['signOut']);
});

test('SC-04 Firebase Auth adapter waits for initial auth state when currentUser is not ready yet',async()=>{
  const expected={uid:'UID-LATE'};
  const client={
    currentUser:null,
    async setPersistence(){},
    onAuthStateChanged(cb){queueMicrotask(()=>cb(expected));return ()=>{}},
    async signOut(){}
  };
  const authFn=()=>client;
  authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
  const session=createFirebaseAuthSession({runtime:{firebase:{auth:authFn}},authInitTimeoutMs:100});
  assert.deepEqual(await session.waitForInitialUser(),expected);
});

test('SC-04 Firebase Auth adapter degrades safely when Auth SDK is unavailable',async()=>{
  const session=createFirebaseAuthSession({runtime:{firebase:{}},authInitTimeoutMs:5});
  assert.equal(await session.ensureLocalPersistence(),false);
  assert.equal(await session.waitForInitialUser(),null);
  assert.equal(session.currentUser(),null);
  assert.equal(await session.signOut(),false);
});

test('SC-04 user repository exposes read-only live user/device watchers with explicit unsubscribe',()=>{
  const calls=[];
  const refs=new Map();
  const db={ref(path){
    const ref={
      on(event,cb,err){calls.push(['on',path,event]);ref.cb=cb;ref.err=err},
      off(event,cb){calls.push(['off',path,event,cb===ref.cb])}
    };
    refs.set(path,ref);return ref;
  }};
  const repo=createUserRepository({db});
  const seen=[];
  const stopUser=repo.watchUser('kasir-a',value=>seen.push(['user',value]));
  const stopDevice=repo.watchDevice('DEV-1',value=>seen.push(['device',value]));
  refs.get('toko_segeranjiwa_v58/global/users/kasir-a').cb(snapshot({active:false}));
  refs.get('toko_segeranjiwa_v58/global/deviceSessions/DEV-1').cb(snapshot({revoked:true}));
  assert.deepEqual(seen,[['user',{active:false}],['device',{revoked:true}]]);
  stopUser();stopDevice();
  assert.deepEqual(calls.filter(x=>x[0]==='off').map(x=>x.slice(0,3)),[
    ['off','toko_segeranjiwa_v58/global/users/kasir-a','value'],
    ['off','toko_segeranjiwa_v58/global/deviceSessions/DEV-1','value']
  ]);
});
