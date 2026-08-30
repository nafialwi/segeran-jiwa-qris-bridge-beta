import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POS_ROOT, QRIS_ROOT } from '../src/data/firebase-client.js';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const COMPAT=join(ROOT,'dist','index.html');
const CANDIDATE=join(ROOT,'dist-sc04','index.html');
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
function walk(dir){const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else if(p.endsWith('.js'))out.push(p)}return out}
function add(list,code,detail){list.push({code,detail})}

const violations=[];
const baselineSha256=existsSync(BASE)?sha(BASE):null;
const compatibilityDistSha256=existsSync(COMPAT)?sha(COMPAT):null;
const candidateSha256=existsSync(CANDIDATE)?sha(CANDIDATE):null;
if(baselineSha256!==EXPECTED) add(violations,'BASELINE_HASH_DRIFT',String(baselineSha256));
if(compatibilityDistSha256!==EXPECTED) add(violations,'COMPATIBILITY_DIST_HASH_DRIFT',String(compatibilityDistSha256));
if(POS_ROOT!=='toko_segeranjiwa_v58') add(violations,'POS_ROOT_DRIFT',POS_ROOT);
if(QRIS_ROOT!=='segeranjiwa_qris_beta_v1') add(violations,'QRIS_ROOT_DRIFT',QRIS_ROOT);

const candidateText=existsSync(CANDIDATE)?readFileSync(CANDIDATE,'utf8'):'';
const entryCount=(candidateText.match(/data-sj-sc04-entry="true"/g)||[]).length;
if(entryCount!==1) add(violations,'SC04_ENTRY_COUNT',String(entryCount));
if((candidateText.match(/data-sj-sc03-entry="true"/g)||[]).length!==0) add(violations,'SC03_ENTRY_LEAK','dist-sc04/index.html');
if(!candidateText.includes('src/sc04-entry.js')) add(violations,'SC04_ENTRY_MISSING','src/sc04-entry.js');

const sourceFiles=walk(join(ROOT,'src'));
const mutation=/\.(?:set|update|transaction|remove)\s*\(/;
const directMutationFiles=[];
const storageFiles=[];
for(const file of sourceFiles){
  const text=readFileSync(file,'utf8');
  if(mutation.test(text)) directMutationFiles.push(relative(ROOT,file));
  if(/firebase\.initializeApp\s*\(/.test(text)) add(violations,'SECOND_FIREBASE_INIT',relative(ROOT,file));
  if(/localStorage/i.test(text)) storageFiles.push(relative(ROOT,file));
}
if(directMutationFiles.length) add(violations,'DIRECT_RTDB_MUTATION_IN_MODULAR_SOURCE',directMutationFiles.join(', '));
const singleStorageBoundary=JSON.stringify(storageFiles)===JSON.stringify(['src/data/local-store.js']);
if(!singleStorageBoundary) add(violations,'SESSION_STORAGE_BOUNDARY_DRIFT',storageFiles.join(', '));

const sessionText=readFileSync(join(ROOT,'src','core','session-manager.js'),'utf8');
const authText=readFileSync(join(ROOT,'src','data','firebase-auth-session.js'),'utf8');
const bootstrapText=readFileSync(join(ROOT,'src','app','sc04-bootstrap.js'),'utf8');
const envelopeMatch=sessionText.match(/function buildEnvelope[\s\S]*?return Object\.freeze\(\{([\s\S]*?)\}\);/);
const envelopeBlock=envelopeMatch?.[1]||'';
const forbiddenEnvelope=/\b(?:pin|password|pass|credential|role|displayName|pinHash|authPassword)\b/i;
const noStoredCredentials=!!envelopeBlock && !forbiddenEnvelope.test(envelopeBlock);
if(!noStoredCredentials) add(violations,'SESSION_ENVELOPE_SECRET_FIELD','buildEnvelope');
const firebaseLocalPersistence=/setPersistence\s*\(/.test(authText)&&/Persistence\?\.LOCAL|Persistence\.LOCAL/.test(authText);
if(!firebaseLocalPersistence) add(violations,'FIREBASE_LOCAL_PERSISTENCE_MISSING','src/data/firebase-auth-session.js');
const noShiftCreation=!/(?:startShift|createShift|SJShift\s*\.\s*(?:start|create))\s*\(/.test(sessionText);
if(!noShiftCreation) add(violations,'SESSION_SHIFT_CREATION_FOUND','src/core/session-manager.js');
const liveRevocationGuard=/watchDevice/.test(sessionText)&&/DEVICE_REVOKED/.test(sessionText)&&/onForcedLogout/.test(sessionText)&&/watchUser/.test(sessionText);
if(!liveRevocationGuard) add(violations,'LIVE_REVOCATION_GUARD_MISSING','src/core/session-manager.js');
const offlineFailClosed=/OFFLINE_REVALIDATION_REQUIRED/.test(sessionText);
if(!offlineFailClosed) add(violations,'OFFLINE_RESTORE_POLICY_MISSING','src/core/session-manager.js');

const authWrapperOwnership={};
for(const method of ['login','completeLogin','logout']){
  const count=(bootstrapText.match(new RegExp(`installMethod\\('SJSecureRulesCompat','${method}'`,'g'))||[]).length;
  authWrapperOwnership[method]=count;
  if(count!==1) add(violations,'AUTH_WRAPPER_OWNERSHIP_COUNT',`${method}:${count}`);
}
for(const alias of ['sc04.legacy.login','sc04.legacy.completeLogin','sc04.legacy.logout']){
  if(!bootstrapText.includes(alias)) add(violations,'AUTH_CAPTURE_ALIAS_MISSING',alias);
}

const requiredDocs=['docs/SC04_SESSION_POLICY.md','docs/SC04_UAT_CHECKLIST.md','docs/SC04_IMPLEMENTATION_REPORT.md','docs/SC04_HANDOFF_TO_REF01.md','docs/SC04_SOURCE_WORKFLOW.md'];
for(const rel of requiredDocs) if(!existsSync(join(ROOT,rel))) add(violations,'SC04_DOC_MISSING',rel);

const result={
  generatedAt:new Date().toISOString(),phase:'SC-04',baselineSha256,compatibilityDistSha256,candidateSha256,
  expectedBaselineSha256:EXPECTED,posRoot:POS_ROOT,qrisRoot:QRIS_ROOT,entryCount,
  session:{singleStorageBoundary,storageFiles,firebaseLocalPersistence,noStoredCredentials,noShiftCreation,liveRevocationGuard,offlineFailClosed},
  authWrapperOwnership,directMutationFiles,violations
};
writeFileSync(join(ROOT,'audit','sc04-verification.json'),JSON.stringify(result,null,2)+'\n');
if(violations.length){
  console.error(`SC-04 verification FAILED: ${violations.length} violation(s)`);
  for(const item of violations) console.error(`- ${item.code}: ${item.detail}`);
  process.exit(1);
}
console.log(`SC-04 verification PASS: session storage isolated; Firebase Auth LOCAL persistence present; auth wrappers 3/3 single-owner; 0 modular RTDB mutations; roots/hash fixed.`);
