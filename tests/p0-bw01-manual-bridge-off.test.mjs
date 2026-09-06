import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const BUILD='scripts/build-ref01.mjs';
const MANUAL='src/compat/rc01-qris-manual-bypass.js';
const S10A='src/compat/rc01-qris-deferred-settlement-compat.js';
const ENTRY='src/ref01-entry.js';
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

function guardSource(){
  const source=readFileSync(BUILD,'utf8');
  const match=source.match(/const QRIS_MANUAL_ONLY_GUARD=("(?:[^"\\]|\\.)*");/);
  assert.ok(match,'QRIS manual-only build guard must exist');
  return JSON.parse(match[1]);
}

test('P0-BW01 keeps existing manual QRIS and frozen authorities byte-for-byte',()=>{
  assert.equal(sha(MANUAL),'80d867cca96a0f4b5dfdc2012e51f9e53da999ed4df9e09d4c6aeb7f87363156');
  assert.equal(sha(S10A),'d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355');
  assert.equal(sha(ENTRY),'22572c210c5f5c31d570709a023ef36c6983035427aa8a264b88e35098c39f7b');
});

test('P0-BW01 manual-only guard returns before frozen automatic QRIS Beta body can start',()=>{
  const context={window:{},Object,Error,Promise};
  context.window.window=context.window;
  vm.createContext(context);
  vm.runInContext(`(function(){${guardSource()}throw new Error('QRIS_BETA_BODY_EXECUTED')})()`,context);
  assert.equal(context.window.SJQrisSignalBeta?.disabled,true);
  assert.equal(context.window.SJQrisSignalBeta?.status().started,false);
  assert.equal(context.window.SJRC01S10AQrisCompat?.disabled,true);
});

test('P0-BW01 frozen deferred compat script returns immediately and starts no 1.4s polling when build guard is active',()=>{
  const context={window:{},Object,Error,Promise};
  context.window.window=context.window;
  vm.createContext(context);
  vm.runInContext(`(function(){${guardSource()}})()`,context);
  let timers=0;
  const compatContext={window:context.window,Object,Error,Promise,setInterval(){timers++;throw new Error('S10A_POLLING_STARTED')},setTimeout(){timers++;throw new Error('S10A_TIMER_STARTED')}};
  vm.createContext(compatContext);
  vm.runInContext(readFileSync(S10A,'utf8'),compatContext,{filename:S10A});
  assert.equal(timers,0);
});

test('P0-BW01 preserves existing S10A/manual script-tag contract for release verifiers',()=>{
  const source=readFileSync(BUILD,'utf8');
  assert.match(source,/S10A_CLASSIC_ENTRY/);
  assert.match(source,/QRIS_MANUAL_ENTRY/);
  assert.match(source,/S10A_CLASSIC_ENTRY[^\n]*QRIS_MANUAL_ENTRY|S10A_CLASSIC_ENTRY[\s\S]{0,400}QRIS_MANUAL_ENTRY/);
});
