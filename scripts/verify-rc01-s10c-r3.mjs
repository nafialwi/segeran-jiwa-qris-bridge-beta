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
  sync:'132dfc7a823e4836a4e24c940f59f9c3fc5d2d051bc1c19b1a1085b5373d9710'
};
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const violations=[];
for(const p of [BASE,COMPAT,BOOT,WRITER,R2,SHIELD,SYNC,REF,RC])if(!existsSync(p))violations.push(`MISSING: ${p}`);
const need=(body,token,code)=>{if(!body.includes(token))violations.push(`${code}: ${token}`)};
if(!violations.length){
  const compat=readFileSync(COMPAT,'utf8'),boot=readFileSync(BOOT,'utf8'),ref=readFileSync(REF,'utf8');
  if(sha(BASE)!==EXPECTED.base)violations.push('FROZEN_BASELINE_DRIFT');
  if(sha(WRITER)!==EXPECTED.writer)violations.push('S10A_WRITER_AUTHORITY_DRIFT');
  if(sha(R2)!==EXPECTED.r2)violations.push('S10C_R2_RUNTIME_DRIFT');
  if(sha(SHIELD)!==EXPECTED.shield)violations.push('S10C_R1_SHIELD_DRIFT');
  if(sha(SYNC)!==EXPECTED.sync)violations.push('S10C_R1_SYNC_AUTHORITY_DRIFT');
  if(sha(REF)!==sha(RC))violations.push('REF_RC_RUNTIME_MISMATCH');
  for(const [token,code] of [
    ['lateInFlight={}','R3_INFLIGHT_MAP_MISSING'],
    ['lateDrainRunning=false','R3_SINGLE_FLIGHT_FLAG_MISSING'],
    ['function scheduleLateDrain(delay)','R3_DRAIN_SCHEDULER_MISSING'],
    ['function sameLateRequest(a,b)','R3_QUEUE_IDEMPOTENCY_MISSING'],
    ['function sameDurableLate(signal,request)','R3_DURABLE_PREFLIGHT_MISSING'],
    ["if(sameLateRequest(lateQueue[id],conflict)||sameLateRequest(lateInFlight[id],conflict))return false",'R3_DUPLICATE_SUPPRESSION_MISSING'],
    ["if(typeof runtime.readSignal==='function')existing=await runtime.readSignal(id)",'R3_PREFLIGHT_READ_MISSING'],
    ['if(!sameDurableLate(existing,c))','R3_PREFLIGHT_GUARD_MISSING']
  ])need(compat,token,code);
  need(boot,'async function readSignal(providerTransactionId)','R3_SINGLE_SIGNAL_READ_MISSING');
  need(boot,"resolvedDb.ref(qrisPath('signals',id)).once('value')",'R3_SINGLE_SIGNAL_PATH_INVALID');
  need(boot,'readPending,readPendingRows,readSignal,readSignalRows','R3_RUNTIME_READSIGNAL_NOT_EXPOSED');
  for(const body of [compat,boot])for(const token of ['.set(','.update(','.remove(','.transaction('])if(body.includes(token))violations.push(`R3_NEW_MUTATION_TOKEN: ${token}`);
  const generatedCompat=join(ROOT,'dist-ref01','src','compat','rc01-qris-deferred-settlement-compat.js');
  const generatedBoot=join(ROOT,'dist-ref01','src','app','qris-deferred-settlement-bootstrap.js');
  if(!existsSync(generatedCompat)||!existsSync(generatedBoot))violations.push('R3_GENERATED_SOURCE_MISSING');
  else{
    if(sha(generatedCompat)!==sha(COMPAT))violations.push('R3_GENERATED_COMPAT_DRIFT');
    if(sha(generatedBoot)!==sha(BOOT))violations.push('R3_GENERATED_BOOTSTRAP_DRIFT');
  }
  need(ref,'data-sj-rc01-s10a-qris="true"','R3_S10A_ENTRY_MISSING');
  need(ref,'data-sj-rc01-s10c-r2-qris-convergence="true"','R3_R2_ENTRY_MISSING');
}
if(violations.length){
  console.error(`RC01-S10C-R3 verification FAIL: ${violations.length}`);
  for(const v of violations)console.error('-',v);
  process.exit(1);
}
console.log(`RC01-S10C-R3 verification PASS: late-quarantine queue is per-provider idempotent + single-flight with durable preflight; S10A writer/R2/R1/frozen baseline preserved; runtime ${sha(RC)}.`);
