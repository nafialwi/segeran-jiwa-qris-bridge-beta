import test from 'node:test';
import assert from 'node:assert/strict';
import * as idem from '../src/core/idempotency.js';
import { POS_ROOT } from '../src/data/firebase-client.js';

function snapshot(value){return {val:()=>value}}
function userDb(users={}){
  const seen=[];
  return {
    seen,
    ref(path){
      seen.push(path);
      return {once:async type=>{assert.equal(type,'value');const id=String(path).split('/').at(-1);return snapshot(users[id]??null)}};
    }
  };
}

function requester(role='owner',id='owner-a',name='Owner A'){
  return ()=>({role,id,name});
}

test('P4 operation ids are Firebase-safe, deterministic under injected clock/random, and reject unsafe keys',()=>{
  assert.equal(typeof idem.createOperationId,'function');
  assert.equal(typeof idem.assertOperationId,'function');
  const id=idem.createOperationId('FIN',{now:()=>1700000000000,random:()=>0.25});
  assert.match(id,/^[A-Za-z0-9_-]{1,120}$/);
  assert.equal(id,idem.createOperationId('FIN',{now:()=>1700000000000,random:()=>0.25}));
  assert.equal(idem.assertOperationId(id),id);
  for(const bad of ['', 'has.dot', 'slash/key', 'hash#key', 'x'.repeat(121)]){
    assert.throws(()=>idem.assertOperationId(bad),/INVALID_OPERATION_ID/);
  }
});

test('P4 sensitive authorizer validates Owner direct PIN and returns proof without secret fields',async()=>{
  const {createLegacySensitiveAuthorizer}=await import('../src/core/sensitive-authorizer.js');
  const db=userDb({'owner-a':{nama:'Owner A',role:'manajemen',active:true,pinHash:'HASH'}});
  const calls=[];
  const runtime={async sjVerifyPin(id,pin,row){calls.push([id,pin,row.role]);return id==='owner-a'&&pin==='4321'}};
  const auth=createLegacySensitiveAuthorizer({runtime,db,readRequester:requester(),now:()=>1700000000123});
  const proof=await auth.authorize({pin:'4321'});
  assert.deepEqual(proof,{ok:true,role:'owner',ownerId:'owner-a',ownerName:'Owner A',requesterId:'owner-a',requesterRole:'owner',reauthenticatedAt:1700000000123});
  assert.equal('pin' in proof,false);
  assert.equal('password' in proof,false);
  assert.deepEqual(calls,[['owner-a','4321','manajemen']]);
  assert.deepEqual(db.seen,[`${POS_ROOT}/global/users/owner-a`]);
});

test('P4 Cashier authorization requires explicit active Owner identity plus correct Owner PIN',async()=>{
  const {createLegacySensitiveAuthorizer}=await import('../src/core/sensitive-authorizer.js');
  const db=userDb({
    'owner-a':{nama:'Owner A',role:'manajemen',active:true,pinHash:'HASH'},
    'kasir-a':{nama:'Kasir A',role:'transaksi',active:true,pinHash:'KHASH'}
  });
  const runtime={async sjVerifyPin(id,pin){return id==='owner-a'&&pin==='9999'}};
  const auth=createLegacySensitiveAuthorizer({runtime,db,readRequester:requester('cashier','kasir-a','Kasir A'),now:()=>2000});
  await assert.rejects(()=>auth.authorize({pin:'9999'}),/OWNER_APPROVER_REQUIRED/);
  const proof=await auth.authorize({ownerId:'owner-a',pin:'9999'});
  assert.equal(proof.ownerId,'owner-a');
  assert.equal(proof.requesterId,'kasir-a');
  assert.equal(proof.requesterRole,'cashier');
});

test('P4 sensitive authorizer fails closed for wrong PIN, inactive owner, and non-owner approver',async()=>{
  const {createLegacySensitiveAuthorizer}=await import('../src/core/sensitive-authorizer.js');
  const runtime={async sjVerifyPin(){return false}};
  const wrong=createLegacySensitiveAuthorizer({runtime,db:userDb({'owner-a':{role:'manajemen',active:true}}),readRequester:requester()});
  await assert.rejects(()=>wrong.authorize({pin:'bad'}),/OWNER_REAUTH_FAILED/);

  const inactive=createLegacySensitiveAuthorizer({runtime:{async sjVerifyPin(){return true}},db:userDb({'owner-a':{role:'manajemen',active:false}}),readRequester:requester()});
  await assert.rejects(()=>inactive.authorize({pin:'4321'}),/OWNER_APPROVER_INACTIVE/);

  const cashierApprover=createLegacySensitiveAuthorizer({runtime:{async sjVerifyPin(){return true}},db:userDb({'kasir-b':{role:'transaksi',active:true}}),readRequester:requester('cashier','kasir-a','Kasir A')});
  await assert.rejects(()=>cashierApprover.authorize({ownerId:'kasir-b',pin:'4321'}),/OWNER_APPROVER_ROLE_REQUIRED/);
});
