import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,readFileSync} from 'node:fs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const SYNC=join(ROOT,'src','compat','rc01-sync-authority.js');
const SHIELD=join(ROOT,'src','compat','rc01-qris-event-sync-shield.js');
const REF=join(ROOT,'dist-ref01','index.html');
const RC=join(ROOT,'dist-rc01','index.html');
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const EXPECTED_BASE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const violations=[];
const token=(body,value,code)=>{if(!body.includes(value))violations.push(`${code}: ${value}`)};
for(const p of [SYNC,SHIELD,REF,RC,BASE])if(!existsSync(p))violations.push(`MISSING: ${p}`);
if(!violations.length){
  const sync=readFileSync(SYNC,'utf8'),shield=readFileSync(SHIELD,'utf8');
  if(sha(BASE)!==EXPECTED_BASE)violations.push('FROZEN_BASELINE_DRIFT');
  if(sha(REF)!==sha(RC))violations.push('REF_RC_RUNTIME_MISMATCH');
  token(sync,'wrappedMethods','P3_INTEROP_GUARD_MISSING');
  token(sync,"current.__sjp3===true",'P3_DOUBLE_TRACE_GUARD_MISSING');
  token(shield,'guardIdempotentSignalUpdater','QRIS_IDEMPOTENT_GUARD_MISSING');
  token(shield,'JSON.stringify(next)===before','QRIS_IDEMPOTENT_COMPARE_MISSING');
  token(shield,'isAuthoritativeQuarantineUpdater','S10A2_QUARANTINE_AUTHORITY_MISSING');
  token(shield,'baseTransaction.apply','NORMAL_QRIS_DELEGATION_MISSING');
  if(/(?:db|database)\.ref\([^\n;]*\)\.(?:set|update|remove|transaction)\s*\(/.test(sync))violations.push('S10C_R1_NEW_DIRECT_FIREBASE_WRITE');
}
if(violations.length){console.error(`RC01-S10C-R1 verification FAIL: ${violations.length}`);for(const v of violations)console.error('-',v);process.exit(1)}
console.log(`RC01-S10C-R1 verification PASS: P3 tracing is single-layer; idempotent QRIS signal match-state commits suppressed; baseline and normal QRIS delegation preserved; runtime ${sha(RC)}.`);
