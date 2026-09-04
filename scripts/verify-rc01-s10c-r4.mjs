import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,readFileSync} from 'node:fs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const COMPAT=join(ROOT,'src','compat','rc01-qris-deferred-settlement-compat.js');
const BOOT=join(ROOT,'src','app','qris-deferred-settlement-bootstrap.js');
const WRITER=join(ROOT,'src','data','writers','qris-deferred-settlement-writer.js');
const R2=join(ROOT,'src','compat','rc01-qris-evaluation-convergence.js');
const SHIELD=join(ROOT,'src','compat','rc01-qris-event-sync-shield.js');
const SYNC=join(ROOT,'src','compat','rc01-sync-authority.js');
const REF=join(ROOT,'dist-ref01','index.html');
const RC=join(ROOT,'dist-rc01','index.html');
const EXPECTED={
  base:'877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f',
  writer:'cac56daf9cc8495041dcff1a861edeb9a3caf5723e329ef6445653525948b8a8',
  r2:'925f03e19db85327a1faf0b9c7473101ea045dcc85d2080e3afb6ba82b2848db',
  shield:'c2787bb2cc7878a1d7348a66c0b1682c3ebfa4470a90cccc9188953c4e122064',
  boot:'be8380798923df1ce45edbf2bd6c36e08eaa076843db6b13bdacbed117fbead9',
  sync:'a5283642e0a7fcf2679845a60783628d1121340ef8c9bd94d0b10d3200474050',
  compat:'731fca10a891a1f3832b9b4201e77747073f6f3f0796e20994f39b7f84d94933'
};
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const violations=[];
const need=(body,token,code)=>{if(!body.includes(token))violations.push(`${code}: ${token}`)};
for(const p of [BASE,COMPAT,BOOT,WRITER,R2,SHIELD,SYNC,REF,RC])if(!existsSync(p))violations.push(`MISSING: ${p}`);
if(!violations.length){
  const compat=readFileSync(COMPAT,'utf8'),sync=readFileSync(SYNC,'utf8'),ref=readFileSync(REF,'utf8');
  for(const [key,path] of Object.entries({base:BASE,writer:WRITER,r2:R2,shield:SHIELD,boot:BOOT,sync:SYNC,compat:COMPAT})){
    if(sha(path)!==EXPECTED[key])violations.push(`R4_HASH_DRIFT_${key.toUpperCase()}: ${sha(path)}`);
  }
  if(sha(REF)!==sha(RC))violations.push('REF_RC_RUNTIME_MISMATCH');

  // R4-A: one physical Firebase transaction => one S10C trace after late shield lifecycle wrapping.
  need(sync,'wrappedMethods[method]===true&&(current.__sjp3===true||current.__sjS10A1===true)','R4_LATE_SHIELD_DOUBLE_TRACE_GUARD_MISSING');
  need(sync,'wrapped.__sjS10C=true','R4_S10C_TRACE_MARKER_MISSING');

  // R4-B: persistent late-quarantine failure is initial + one retry, then session-local fail-closed hold.
  for(const [token,code] of [
    ['lateAttempts={}','R4_ATTEMPT_MAP_MISSING'],
    ['lateHeld={}','R4_TERMINAL_HOLD_MAP_MISSING'],
    ['if(lateHeld[id])return false','R4_TERMINAL_HOLD_REQUEUE_GUARD_MISSING'],
    ['lateAttempts[id]=(lateAttempts[id]||0)+1','R4_ATTEMPT_INCREMENT_MISSING'],
    ['if(attempt<2)','R4_MAX_TWO_ATTEMPTS_GUARD_MISSING'],
    ["heldError.code='QRIS_LATE_QUARANTINE_FAILED_HELD'",'R4_HELD_ERROR_CODE_MISSING'],
    ["sjSaveError('QRIS_LATE_QUARANTINE_FAILED_HELD',heldError)",'R4_ROOT_ERROR_EVIDENCE_MISSING']
  ])need(compat,token,code);

  // R3 safety remains: duplicate collapse, single-flight and durable preflight.
  for(const [token,code] of [
    ['lateInFlight={}','R4_R3_INFLIGHT_MAP_MISSING'],
    ['lateDrainRunning=false','R4_R3_SINGLE_FLIGHT_MISSING'],
    ['function sameLateRequest(a,b)','R4_R3_QUEUE_IDEMPOTENCY_MISSING'],
    ['function sameDurableLate(signal,request)','R4_R3_DURABLE_PREFLIGHT_MISSING'],
    ["if(typeof runtime.readSignal==='function')existing=await runtime.readSignal(id)",'R4_R3_PREFLIGHT_READ_MISSING'],
    ['if(!sameDurableLate(existing,c))','R4_R3_PREFLIGHT_GUARD_MISSING']
  ])need(compat,token,code);

  // No new writer authority is introduced by R4 compatibility/diagnostic code.
  for(const [label,body] of [['compat',compat],['boot',readFileSync(BOOT,'utf8')],['sync',sync]]){
    for(const token of ['.set(','.update(','.remove(','.transaction('])if(body.includes(token))violations.push(`R4_NEW_MUTATION_TOKEN_${label.toUpperCase()}: ${token}`);
  }

  for(const [rel,source] of [
    ['src/compat/rc01-qris-deferred-settlement-compat.js',COMPAT],
    ['src/compat/rc01-sync-authority.js',SYNC],
    ['src/app/qris-deferred-settlement-bootstrap.js',BOOT]
  ]){
    const generated=join(ROOT,'dist-ref01',rel);
    if(!existsSync(generated))violations.push(`R4_GENERATED_SOURCE_MISSING: ${rel}`);
    else if(sha(generated)!==sha(source))violations.push(`R4_GENERATED_SOURCE_DRIFT: ${rel}`);
  }
  need(ref,'data-sj-rc01-s10c-sync-authority="true"','R4_SYNC_ENTRY_MISSING');
  need(ref,'data-sj-rc01-s10a1-event-shield="true"','R4_SHIELD_ENTRY_MISSING');
  need(ref,'data-sj-rc01-s10c-r2-qris-convergence="true"','R4_R2_ENTRY_MISSING');
  need(ref,'data-sj-rc01-s10a-qris="true"','R4_S10A_ENTRY_MISSING');
}
if(violations.length){
  console.error(`RC01-S10C-R4 verification FAIL: ${violations.length}`);
  for(const v of violations)console.error('-',v);
  process.exit(1);
}
console.log(`RC01-S10C-R4 verification PASS: late-shield double tracing suppressed; quarantine retry capped at 2 attempts with terminal fail-closed hold + root-error evidence; R3/R2/S10A writer safety preserved; runtime ${sha(RC)}.`);
