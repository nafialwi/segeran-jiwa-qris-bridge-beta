import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createR7ReadCoordinator, ensureR7ReadCoordinator } from '../src/app/r7-read-coordinator.js';

const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const FROZEN_R6B='a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44';

function setup(){
  let clock=1000;
  const runtime={};
  const coordinator=ensureR7ReadCoordinator(runtime,{now:()=>clock});
  return {runtime,coordinator,setClock:v=>{clock=v}};
}

test('R7 coordinator lives outside frozen R6B authority',()=>{
  assert.equal(sha('src/app/rc01-runtime-loading-hardening.js'),FROZEN_R6B);
  const source=fs.readFileSync('src/app/r7-read-coordinator.js','utf8');
  assert.match(source,/createR7ReadCoordinator/);
  assert.doesNotMatch(source,/firebase\.database|\.ref\s*\(/i);
});

test('R7 coordinator exposes required API and begin tokens are latest-wins',()=>{
  const {runtime,coordinator}=setup();
  assert.equal(runtime.__SJ_R7_READ_COORDINATOR,coordinator);
  for(const name of ['peek','begin','isCurrent','finish','fail','snapshot'])assert.equal(typeof coordinator[name],'function',name);
  const a=coordinator.begin('report:day:2026-09-07');
  const b=coordinator.begin('report:day:2026-09-07');
  assert.equal(b,a+1);
  assert.equal(coordinator.isCurrent('report:day:2026-09-07',a),false);
  assert.equal(coordinator.isCurrent('report:day:2026-09-07',b),true);
});

test('R7 coordinator stale finish cannot overwrite newer value',()=>{
  const {coordinator,setClock}=setup();
  const oldToken=coordinator.begin('finance:2026-08');
  const newToken=coordinator.begin('finance:2026-08');
  setClock(1200);
  assert.equal(coordinator.finish('finance:2026-08',newToken,{period:'2026-08',value:2},{startedAt:1000}),true);
  assert.equal(coordinator.finish('finance:2026-08',oldToken,{period:'2026-08',value:1},{startedAt:900}),false);
  assert.equal(coordinator.peek('finance:2026-08').value.value,2);
});

test('R7 coordinator fail preserves cached value and records timing/error',()=>{
  const {coordinator,setClock}=setup();
  const first=coordinator.begin('report:day:2026-09-06');
  setClock(1100);
  coordinator.finish('report:day:2026-09-06',first,{sales:123},{startedAt:1000});
  const second=coordinator.begin('report:day:2026-09-06');
  setClock(1500);
  assert.equal(coordinator.fail('report:day:2026-09-06',second,new Error('offline'),{startedAt:1200}),true);
  const record=coordinator.peek('report:day:2026-09-06');
  assert.deepEqual(record.value,{sales:123});
  assert.equal(record.loading,false);
  assert.match(record.error,/offline/);
  assert.equal(record.lastDurationMs,300);
});

test('R7 coordinator snapshot is detached diagnostics and implementation adds no polling',()=>{
  let clock=1000;const coordinator=createR7ReadCoordinator({now:()=>clock});
  const token=coordinator.begin('shift-history:2026-09-05');
  assert.equal(coordinator.snapshot()['shift-history:2026-09-05'].loading,true);
  clock=1350;coordinator.finish('shift-history:2026-09-05',token,{rows:[1]},{startedAt:1000});
  const snap=coordinator.snapshot();
  assert.equal(snap['shift-history:2026-09-05'].lastDurationMs,350);
  snap['shift-history:2026-09-05'].value.rows.push(2);
  assert.deepEqual(coordinator.peek('shift-history:2026-09-05').value,{rows:[1]});
  const source=fs.readFileSync('src/app/r7-read-coordinator.js','utf8');
  assert.doesNotMatch(source,/\.set\s*\(/);
  assert.doesNotMatch(source,/setInterval\s*\(/);
  assert.doesNotMatch(source,/firebase\.database|\.ref\s*\(/i);
});
