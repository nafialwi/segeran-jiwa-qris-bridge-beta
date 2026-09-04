import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import vm from 'node:vm';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const RUNTIME=join(ROOT,'src','compat','rc01-qris-evaluation-convergence.js');
const BUILD=join(ROOT,'scripts','build-ref01.mjs');

function loadRuntime(){
  assert.equal(existsSync(RUNTIME),true,'R2 convergence runtime must exist before QRIS Beta loads');
  const timers=[];
  const context={
    console,
    Promise,
    setTimeout(fn,ms){timers.push({fn,ms});return timers.length},
    clearTimeout(){},
  };
  context.window=context;
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(readFileSync(RUNTIME,'utf8'),context,{filename:RUNTIME});
  return {api:context.SJRC01S10CR2QrisConvergence,timers};
}

async function tick(){await Promise.resolve();await Promise.resolve();}

test('R2 coalesces repeated scheduling for one provider into one active evaluation plus at most one trailing rerun',async()=>{
  const {api,timers}=loadRuntime();
  assert.ok(api&&typeof api.schedule==='function');
  let resolveFirst;
  const calls=[];
  const first=new Promise(resolve=>{resolveFirst=resolve});
  for(let i=0;i<12;i++)api.schedule('SIG-1',()=>{calls.push(`first-${i}`);return first},100);
  assert.equal(timers.length,1,'burst before timer fires must create one timer');
  timers.shift().fn();
  await tick();
  assert.equal(calls.length,1,'only one provider evaluation may be in flight');
  for(let i=0;i<15;i++)api.schedule('SIG-1',()=>{calls.push(`tail-${i}`);return Promise.resolve()},100);
  assert.equal(timers.length,0,'while in flight, repeats must be coalesced instead of scheduling parallel work');
  resolveFirst();
  await tick();
  assert.equal(timers.length,1,'dirty in-flight provider gets exactly one trailing rerun');
  timers.shift().fn();
  await tick();
  assert.equal(calls.length,2,'burst must converge to one active + one trailing evaluation');
  assert.equal(calls[1],'tail-14','trailing rerun must use the freshest provider snapshot callback');
});

test('R2 local state guard suppresses same-state match bookkeeping but preserves meaningful transitions',()=>{
  const {api}=loadRuntime();
  assert.equal(api.shouldSkipSignalState({status:'UNMATCHED'},'UNMATCHED'),true);
  assert.equal(api.shouldSkipSignalState({status:'AMBIGUOUS'},'AMBIGUOUS'),true);
  assert.equal(api.shouldSkipSignalState({status:'DETECTED'},'UNMATCHED'),false);
  assert.equal(api.shouldSkipSignalState({status:'UNMATCHED'},'MATCHED'),false);
  assert.equal(api.shouldSkipSignalState({status:'CONFIRMED'},'UNMATCHED'),false,'terminal state is not silently reclassified by R2');
});

test('R2 build lifecycle injects convergence runtime before QRIS Beta and routes evaluation through the convergence gate',()=>{
  const build=readFileSync(BUILD,'utf8');
  assert.match(build,/rc01-qris-evaluation-convergence\.js/,'build must inject R2 runtime');
  assert.match(build,/data-sj-rc01-s10c-r2-qris-convergence="true"/,'build must expose deterministic R2 marker');
  assert.match(build,/patchQrisEvaluationConvergence/,'build must patch frozen QRIS lifecycle without modifying baseline');
  assert.match(build,/SJRC01S10CR2QrisConvergence/,'patched lifecycle must delegate coalescing/state guard to R2 runtime');
});
