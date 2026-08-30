import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createQrisAdapter } from '../src/data/qris-adapter.js';

function fakeEngine(){
  const calls=[];
  return {calls,
    status(){calls.push(['status']);return {activePendingId:'P1'}},
    async ensureWaitingPending(){calls.push(['ensure']);return {pendingId:'P1'}},
    async cancelWaiting(safe){calls.push(['cancel',safe]);return true},
    async resolveAmbiguous(id){calls.push(['resolve',id]);return {matched:id}},
    renderCommercialQrisState(){calls.push(['render']);return 'rendered'}
  };
}

test('QRIS adapter delegates to existing SJQrisSignalBeta exactly once per action', async()=>{
  const engine=fakeEngine();
  const qris=createQrisAdapter({engine});
  assert.deepEqual(qris.status(),{activePendingId:'P1'});
  assert.deepEqual(await qris.ensureWaitingPending(),{pendingId:'P1'});
  assert.equal(await qris.cancelWaiting(true),true);
  assert.deepEqual(await qris.resolveAmbiguous('E1'),{matched:'E1'});
  assert.equal(qris.renderCommercialState(),'rendered');
  assert.deepEqual(engine.calls,[['status'],['ensure'],['cancel',true],['resolve','E1'],['render']]);
});

test('QRIS adapter fails closed when required legacy method is missing', async()=>{
  const qris=createQrisAdapter({engine:{status(){return {}}}});
  await assert.rejects(()=>qris.ensureWaitingPending(),/QRIS_ENGINE_METHOD_MISSING:ensureWaitingPending/);
});

test('QRIS adapter contains no direct Firebase mutation implementation',()=>{
  const src=readFileSync(new URL('../src/data/qris-adapter.js',import.meta.url),'utf8');
  for(const token of ['.set(','.update(','.transaction(','.remove(']) assert.equal(src.includes(token),false,token);
});
