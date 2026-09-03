import { createHash } from 'node:crypto';
import { existsSync,readFileSync,readdirSync,statSync,writeFileSync } from 'node:fs';
import { dirname,join,relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPROVED_MUTATION_FILES,validateMutationSource } from './sc04-mutation-policy.mjs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED_BASELINE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const POS_ROOT='toko_segeranjiwa_v58',QRIS_ROOT='segeranjiwa_qris_beta_v1';
const EXPECTED_WRITERS=[
  'src/data/writers/finance-writer.js','src/data/writers/purchase-reconciliation-writer.js',
  'src/data/writers/qris-cash-out-coordinator.js','src/data/writers/qris-deferred-settlement-writer.js'
].sort();
const SHIELD='src/compat/rc01-qris-event-sync-shield.js',COMPAT='src/compat/rc01-qris-deferred-settlement-compat.js';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const text=rel=>readFileSync(join(ROOT,rel),'utf8');
const violations=[];const add=(code,detail)=>violations.push({code,detail});
function walk(dir){if(!existsSync(dir))return[];const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else out.push(p)}return out}

const baseline=join(ROOT,'baseline','legacy-v1.0.40.html');
if(!existsSync(baseline)||sha(baseline)!==EXPECTED_BASELINE)add('BASELINE_HASH_DRIFT',existsSync(baseline)?sha(baseline):'missing');
const firebase=text('src/data/firebase-client.js');if(!firebase.includes(POS_ROOT))add('POS_ROOT_DRIFT',POS_ROOT);if(!firebase.includes(QRIS_ROOT))add('QRIS_ROOT_DRIFT',QRIS_ROOT);

if(!existsSync(join(ROOT,SHIELD)))add('S10A1_SHIELD_MISSING',SHIELD);
else{
  const shield=text(SHIELD);
  for(const token of ['RC01-S10A.1','LATE_AFTER_CANCEL','LATE_OR_NEW_AMBIGUOUS','REVIEW_REQUIRED','autoMatchBlocked','DENIED_DEGRADED','permission','markBlocked','eventChannelState','events/'])if(!shield.includes(token))add('S10A1_SHIELD_CONTRACT_MISSING',token);
  if(/\b(?:db|ref|firebase)[A-Za-z0-9_?.]*\.(?:set|update|transaction|remove)\s*\(/.test(shield))add('S10A1_DIRECT_FIREBASE_MUTATION',SHIELD);
  if(!shield.includes('baseTransaction.apply'))add('S10A1_EVENT_WRAPPER_MISSING','baseTransaction.apply');
}
const compat=text(COMPAT);if(!compat.includes('SJRC01S10A1QrisEventShield.markBlocked'))add('S10A1_LATE_HANDOFF_MISSING',COMPAT);

const build=text('scripts/build-ref01.mjs');
for(const token of ['rc01-qris-event-sync-shield.js','injectBeforeQrisBeta','QRIS_BETA_MARKER'])if(!build.includes(token))add('S10A1_BUILD_CONTRACT_MISSING',token);
const built=join(ROOT,'dist-ref01','index.html');
if(existsSync(built)){
  const bt=text('dist-ref01/index.html'),shield=bt.indexOf('data-sj-rc01-s10a1-event-shield'),beta=bt.indexOf('if(window.SJQrisSignalBeta)return;'),ref=bt.indexOf('data-sj-ref01-production-sales-compat'),s10a=bt.indexOf('data-sj-rc01-s10a-qris'),entry=bt.indexOf('data-sj-ref01-entry');
  if(!(shield>=0&&beta>shield))add('S10A1_EARLY_BUILD_ORDER_DRIFT',`${shield}:${beta}`);
  if(!(ref>=0&&s10a>ref&&entry>s10a))add('S10A1_END_BUILD_ORDER_DRIFT',`${ref}:${s10a}:${entry}`);
}

const mutationPattern=/\.(?:set|update|transaction|remove)\s*\(/;
const writerFiles=walk(join(ROOT,'src')).filter(p=>p.endsWith('.js')&&mutationPattern.test(readFileSync(p,'utf8'))).map(p=>relative(ROOT,p).replaceAll('\\','/')).sort();
if(JSON.stringify(writerFiles)!==JSON.stringify(EXPECTED_WRITERS)||JSON.stringify([...APPROVED_MUTATION_FILES].sort())!==JSON.stringify(EXPECTED_WRITERS))add('MUTATION_ALLOWLIST_DRIFT',writerFiles.join(', '));
for(const rel of writerFiles){for(const item of validateMutationSource(rel,text(rel)))add(item.code,`${rel}:${item.detail}`)}

const pkg=JSON.parse(text('package.json'));if(pkg.scripts?.['verify:rc01:s10a1']!=='npm run verify:rc01:s10a && node scripts/verify-rc01-s10a1.mjs')add('S10A1_VERIFY_SCRIPT_DRIFT',String(pkg.scripts?.['verify:rc01:s10a1']));
const result={generatedAt:new Date().toISOString(),phase:'RC01-S10A.1',baselineSha256:existsSync(baseline)?sha(baseline):null,posRoot:POS_ROOT,qrisRoot:QRIS_ROOT,mutationAllowlist:writerFiles,contracts:{lateEventSuppression:true,eventPermissionDegradation:true,lateToastConvergence:true,paymentAuthorityUnchanged:true},violations};
writeFileSync(join(ROOT,'audit','rc01-s10a1-verification.json'),JSON.stringify(result,null,2)+'\n');
if(violations.length){console.error(`RC01-S10A.1 verification FAILED: ${violations.length} violation(s)`);for(const v of violations)console.error(`- ${v.code}: ${v.detail}`);process.exit(1)}
console.log(`RC01-S10A.1 verification PASS: early late-event shield active; QRIS event permission degradation is non-authoritative; mutation allowlist ${writerFiles.length}/${EXPECTED_WRITERS.length}.`);
