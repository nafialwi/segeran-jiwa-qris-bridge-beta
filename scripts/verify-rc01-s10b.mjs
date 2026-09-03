import { createHash } from 'node:crypto';
import { existsSync,readFileSync,readdirSync,statSync,writeFileSync } from 'node:fs';
import { dirname,join,relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPROVED_MUTATION_FILES,validateMutationSource } from './sc04-mutation-policy.mjs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED_BASELINE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const EXPECTED_WRITERS=[
  'src/data/writers/finance-writer.js','src/data/writers/purchase-reconciliation-writer.js',
  'src/data/writers/qris-cash-out-coordinator.js','src/data/writers/qris-deferred-settlement-writer.js'
].sort();
const TRACE='src/compat/rc01-firebase-pending-write-trace.js';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const text=rel=>readFileSync(join(ROOT,rel),'utf8');
const violations=[];const add=(code,detail)=>violations.push({code,detail});
function walk(dir){if(!existsSync(dir))return[];const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else out.push(p)}return out}

const baseline=join(ROOT,'baseline','legacy-v1.0.40.html');
if(!existsSync(baseline)||sha(baseline)!==EXPECTED_BASELINE)add('BASELINE_HASH_DRIFT',existsSync(baseline)?sha(baseline):'missing');
if(!existsSync(join(ROOT,TRACE)))add('S10B_TRACE_MISSING',TRACE);
else{
  const src=text(TRACE);
  for(const token of ['RC01-S10B','SYNC_WRITE_STUCK','activeWrites','snapshot','scanStuck','FIREBASE WRITE TRACE','P3 Pending','Untraced'])if(!src.includes(token))add('S10B_TRACE_CONTRACT_MISSING',token);
  if(/\bdb\.ref\([^\n]*\)\.(?:set|update|remove|transaction)\s*\(/.test(src))add('S10B_DIRECT_FIREBASE_MUTATION',TRACE);
}
const build=text('scripts/build-ref01.mjs');
for(const token of ['rc01-firebase-pending-write-trace.js','data-sj-rc01-s10b-pending-write-trace','P3_MARKER','injectBeforeP3'])if(!build.includes(token))add('S10B_BUILD_CONTRACT_MISSING',token);

const out=join(ROOT,'dist-ref01','index.html');
if(!existsSync(out))add('S10B_BUILD_OUTPUT_MISSING','dist-ref01/index.html');
else{
  const html=readFileSync(out,'utf8'),tracePos=html.indexOf('data-sj-rc01-s10b-pending-write-trace="true"'),p3Pos=html.indexOf('const SJProductionArchitectureP3={');
  if(tracePos<0)add('S10B_BUILD_MARKER_MISSING','trace marker');
  if(p3Pos<0)add('S10B_P3_MARKER_MISSING','P3 marker');
  if(tracePos>=0&&p3Pos>=0&&tracePos>p3Pos)add('S10B_TRACE_LOAD_ORDER_INVALID',`${tracePos}>${p3Pos}`);
}

const mutationPattern=/\.(?:set|update|transaction|remove)\s*\(/;
const writerFiles=walk(join(ROOT,'src')).filter(p=>p.endsWith('.js')&&mutationPattern.test(readFileSync(p,'utf8'))).map(p=>relative(ROOT,p).replaceAll('\\','/')).sort();
if(JSON.stringify(writerFiles)!==JSON.stringify(EXPECTED_WRITERS)||JSON.stringify([...APPROVED_MUTATION_FILES].sort())!==JSON.stringify(EXPECTED_WRITERS))add('MUTATION_ALLOWLIST_DRIFT',writerFiles.join(', '));
for(const rel of writerFiles){for(const item of validateMutationSource(rel,text(rel)))add(item.code,`${rel}:${item.detail}`)}

const pkg=JSON.parse(text('package.json'));
if(pkg.scripts?.['verify:rc01:s10b']!=='npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10b.mjs')add('S10B_VERIFY_SCRIPT_DRIFT',String(pkg.scripts?.['verify:rc01:s10b']));

const result={generatedAt:new Date().toISOString(),phase:'RC01-S10B',baselineSha256:existsSync(baseline)?sha(baseline):null,traceSha256:existsSync(join(ROOT,TRACE))?sha(join(ROOT,TRACE)):null,mutationAllowlist:writerFiles,contracts:{observationalOnly:true,p3PreloadTrace:true,diagnosticsSurface:true,stuckWarningLocalOnly:true,writeOutcomeUnchanged:true},violations};
writeFileSync(join(ROOT,'audit','rc01-s10b-verification.json'),JSON.stringify(result,null,2)+'\n');
if(violations.length){console.error(`RC01-S10B verification FAILED: ${violations.length} violation(s)`);for(const v of violations)console.error(`- ${v.code}: ${v.detail}`);process.exit(1)}
console.log(`RC01-S10B verification PASS: pending-write traceability active before P3 monitor; diagnostics surface present; mutation allowlist ${writerFiles.length}/${EXPECTED_WRITERS.length}.`);
