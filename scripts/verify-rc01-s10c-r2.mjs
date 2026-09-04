import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,readFileSync} from 'node:fs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const BUILD=join(ROOT,'scripts','build-ref01.mjs');
const RUNTIME=join(ROOT,'src','compat','rc01-qris-evaluation-convergence.js');
const SHIELD=join(ROOT,'src','compat','rc01-qris-event-sync-shield.js');
const SYNC=join(ROOT,'src','compat','rc01-sync-authority.js');
const REF=join(ROOT,'dist-ref01','index.html');
const RC=join(ROOT,'dist-rc01','index.html');
const EXPECTED_BASE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const EXPECTED_R1_SHIELD='c2787bb2cc7878a1d7348a66c0b1682c3ebfa4470a90cccc9188953c4e122064';
const EXPECTED_R1_SYNC='132dfc7a823e4836a4e24c940f59f9c3fc5d2d051bc1c19b1a1085b5373d9710';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const violations=[];
const need=(body,token,code)=>{if(!body.includes(token))violations.push(`${code}: ${token}`)};
for(const p of [BASE,BUILD,RUNTIME,SHIELD,SYNC,REF,RC])if(!existsSync(p))violations.push(`MISSING: ${p}`);
if(!violations.length){
  const base=readFileSync(BASE,'utf8'),build=readFileSync(BUILD,'utf8'),runtime=readFileSync(RUNTIME,'utf8'),ref=readFileSync(REF,'utf8');
  if(sha(BASE)!==EXPECTED_BASE)violations.push('FROZEN_BASELINE_DRIFT');
  if(sha(SHIELD)!==EXPECTED_R1_SHIELD)violations.push('S10C_R1_SHIELD_DRIFT');
  if(sha(SYNC)!==EXPECTED_R1_SYNC)violations.push('S10C_R1_SYNC_AUTHORITY_DRIFT');
  if(sha(REF)!==sha(RC))violations.push('REF_RC_RUNTIME_MISMATCH');
  need(runtime,"VERSION='RC01-S10C-R2'",'R2_VERSION_MISSING');
  need(runtime,'function schedule(providerId,fn,delay)','R2_COALESCER_MISSING');
  need(runtime,'function shouldSkipSignalState(signal,targetStatus)','R2_STATE_GUARD_MISSING');
  for(const token of ['.set(','.update(','.remove(','.transaction('])if(runtime.includes(token))violations.push(`R2_RUNTIME_NEW_WRITER: ${token}`);
  need(build,'patchQrisEvaluationConvergence','R2_BUILD_PATCH_MISSING');
  need(build,'REF01-BUILD-V3-S10C-R2','R2_BUILD_FINGERPRINT_MISSING');
  const entry='data-sj-rc01-s10c-r2-qris-convergence="true"';
  need(ref,entry,'R2_GENERATED_ENTRY_MISSING');
  need(ref,'gate.schedule(id,function(){return evaluateSignal(s)},100)','R2_GENERATED_COALESCER_MISSING');
  need(ref,"shouldSkipSignalState(s,'AMBIGUOUS')",'R2_AMBIGUOUS_PREFLIGHT_MISSING');
  need(ref,"shouldSkipSignalState(s,'UNMATCHED')",'R2_UNMATCHED_PREFLIGHT_MISSING');
  const r2=ref.indexOf(entry),beta=ref.indexOf('if(window.SJQrisSignalBeta)return;');
  if(r2<0||beta<0||r2>beta)violations.push(`R2_ORDER_INVALID r2=${r2} beta=${beta}`);
  if((ref.match(/data-sj-rc01-s10c-r2-qris-convergence="true"/g)||[]).length!==1)violations.push('R2_ENTRY_COUNT_NOT_ONE');
  if((ref.match(/function evaluateAllSignals\(\)/g)||[]).length!==1)violations.push('R2_EVALUATE_ALL_COUNT_NOT_ONE');
  if(base.includes('SJRC01S10CR2QrisConvergence'))violations.push('R2_FROZEN_BASELINE_MUTATED');
}
if(violations.length){console.error(`RC01-S10C-R2 verification FAIL: ${violations.length}`);for(const v of violations)console.error('-',v);process.exit(1)}
console.log(`RC01-S10C-R2 verification PASS: QRIS evaluation coalescing + local same-state preflight active; frozen baseline/R1 authorities preserved; runtime ${sha(RC)}.`);
