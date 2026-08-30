import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POS_ROOT, QRIS_ROOT } from '../src/data/firebase-client.js';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const baseline=join(ROOT,'baseline','legacy-v1.0.40.html');
const dist=join(ROOT,'dist','index.html');
const qrisAdapter=join(ROOT,'src','data','qris-adapter.js');
const bridge=join(ROOT,'src','core','legacy-bridge.js');
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const mutationRe=/\.(?:set|update|transaction|remove)\s*\(/;

function walk(dir){
  const out=[];
  for(const name of readdirSync(dir)){
    const p=join(dir,name);
    if(statSync(p).isDirectory()) out.push(...walk(p));
    else if(p.endsWith('.js')) out.push(p);
  }
  return out;
}
function addViolation(list,code,detail){list.push({code,detail});}

const violations=[];
const directMutationFiles=[];
const scannedFiles=[...walk(join(ROOT,'src','data')),...walk(join(ROOT,'src','domain'))];
for(const file of scannedFiles){
  const text=readFileSync(file,'utf8');
  if(mutationRe.test(text)) directMutationFiles.push(relative(ROOT,file));
  if(/firebase\.initializeApp\s*\(/.test(text)) addViolation(violations,'EXTRACTED_FIREBASE_INIT',relative(ROOT,file));
}
if(directMutationFiles.length) addViolation(violations,'DIRECT_MUTATION_IN_EXTRACTED_BOUNDARY',directMutationFiles.join(', '));

const baselineHash=existsSync(baseline)?sha(baseline):null;
const distHash=existsSync(dist)?sha(dist):null;
if(baselineHash!==EXPECTED) addViolation(violations,'BASELINE_HASH_DRIFT',String(baselineHash));
if(distHash!==EXPECTED) addViolation(violations,'DIST_HASH_DRIFT',String(distHash));
if(POS_ROOT!=='toko_segeranjiwa_v58') addViolation(violations,'POS_ROOT_DRIFT',POS_ROOT);
if(QRIS_ROOT!=='segeranjiwa_qris_beta_v1') addViolation(violations,'QRIS_ROOT_DRIFT',QRIS_ROOT);

const baselineText=existsSync(baseline)?readFileSync(baseline,'utf8'):'';
const requiredLegacyTokens=[
  'processTransaction','SJQrisSignalBeta','SJInventoryV2','SJCostingV1',
  'SJShift','SJOperationalHardening','SJReportFoundationV010'
];
const legacyTokenPresence={};
for(const token of requiredLegacyTokens){
  const present=baselineText.includes(token);
  legacyTokenPresence[token]=present;
  if(!present) addViolation(violations,'LEGACY_AUTHORITY_MISSING',token);
}

const qrisText=existsSync(qrisAdapter)?readFileSync(qrisAdapter,'utf8'):'';
const qrisDelegationChecks={
  referencesEnsureWaitingPending:qrisText.includes('ensureWaitingPending'),
  referencesCancelWaiting:qrisText.includes('cancelWaiting'),
  referencesResolveAmbiguous:qrisText.includes('resolveAmbiguous'),
  noDatabaseRef:!/(?:db|qrisRef)\s*\.\s*ref\s*\(/.test(qrisText),
  noMutationCall:!mutationRe.test(qrisText)
};
for(const [name,ok] of Object.entries(qrisDelegationChecks)) if(!ok) addViolation(violations,'QRIS_ADAPTER_CONTRACT',name);

const bridgeText=existsSync(bridge)?readFileSync(bridge,'utf8'):'';
for(const token of requiredLegacyTokens){
  if(token==='processTransaction') continue;
  if(!bridgeText.includes(token)) addViolation(violations,'BRIDGE_AUTHORITY_MAP_MISSING',token);
}
if(!bridgeText.includes('processTransaction')) addViolation(violations,'BRIDGE_TRANSACTION_AUTHORITY_MISSING','processTransaction');

const result={
  generatedAt:new Date().toISOString(),
  phase:'SC-02',
  baselineSha256:baselineHash,
  distSha256:distHash,
  expectedBaselineSha256:EXPECTED,
  posRoot:POS_ROOT,
  qrisRoot:QRIS_ROOT,
  scannedFiles:scannedFiles.map(f=>relative(ROOT,f)),
  directMutationFiles,
  legacyTokenPresence,
  qrisDelegationChecks,
  violations
};
writeFileSync(join(ROOT,'audit','sc02-verification.json'),JSON.stringify(result,null,2)+'\n');
if(violations.length){
  console.error(`SC-02 verification FAILED: ${violations.length} violation(s)`);
  for(const v of violations) console.error(`- ${v.code}: ${v.detail}`);
  process.exit(1);
}
console.log(`SC-02 verification PASS: ${scannedFiles.length} extracted JS files scanned; 0 direct Firebase mutations; roots and compatibility hash fixed.`);
