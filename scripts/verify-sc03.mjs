import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POS_ROOT, QRIS_ROOT } from '../src/data/firebase-client.js';
import { PRIMARY_ROUTES, OPERATIONAL_CHILDREN, REPORT_CHILDREN, SETTINGS_CHILDREN } from '../src/app/route-contract.js';
import { createFeatureRuntime } from '../src/modules/runtime-registry.js';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const COMPAT=join(ROOT,'dist','index.html');
const CANDIDATE=join(ROOT,'dist-sc03','index.html');
const TARGET_FAMILIES=['dashboard','sales','payments','operational','reports','settings'];
const mutation=/\.(?:set|update|transaction|remove)\s*\(/;
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
function walk(dir){const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else if(p.endsWith('.js'))out.push(p)}return out}
function add(list,code,detail){list.push({code,detail})}

const violations=[];
const baselineSha256=existsSync(BASE)?sha(BASE):null;
const compatibilityDistSha256=existsSync(COMPAT)?sha(COMPAT):null;
const candidateText=existsSync(CANDIDATE)?readFileSync(CANDIDATE,'utf8'):'';
const baselineText=existsSync(BASE)?readFileSync(BASE,'utf8'):'';
if(baselineSha256!==EXPECTED) add(violations,'BASELINE_HASH_DRIFT',String(baselineSha256));
if(compatibilityDistSha256!==EXPECTED) add(violations,'COMPATIBILITY_DIST_HASH_DRIFT',String(compatibilityDistSha256));
if(POS_ROOT!=='toko_segeranjiwa_v58') add(violations,'POS_ROOT_DRIFT',POS_ROOT);
if(QRIS_ROOT!=='segeranjiwa_qris_beta_v1') add(violations,'QRIS_ROOT_DRIFT',QRIS_ROOT);

const candidateEntryCount=(candidateText.match(/data-sj-sc03-entry="true"/g)||[]).length;
if(candidateEntryCount!==1) add(violations,'SC03_ENTRY_COUNT',String(candidateEntryCount));
if(!candidateText.includes('src/sc03-entry.js')) add(violations,'SC03_ENTRY_MISSING','src/sc03-entry.js');
if(!candidateText.includes('toko_segeranjiwa_v58')) add(violations,'CANDIDATE_POS_ROOT_MISSING','toko_segeranjiwa_v58');
if(!candidateText.includes('segeranjiwa_qris_beta_v1')) add(violations,'CANDIDATE_QRIS_ROOT_MISSING','segeranjiwa_qris_beta_v1');

const directMutationFiles=[];
const sessionWorkaroundFiles=[];
const scannedFiles=[];
for(const dir of ['src/app','src/core','src/modules']){
  for(const file of walk(join(ROOT,dir))){
    scannedFiles.push(relative(ROOT,file));
    const text=readFileSync(file,'utf8');
    if(mutation.test(text)) directMutationFiles.push(relative(ROOT,file));
    if(/firebase\.initializeApp\s*\(/.test(text)) add(violations,'SECOND_FIREBASE_INIT',relative(ROOT,file));
    if(/localStorage/i.test(text)) sessionWorkaroundFiles.push(relative(ROOT,file));
  }
}
if(directMutationFiles.length) add(violations,'DIRECT_MUTATION_IN_SC03_BOUNDARY',directMutationFiles.join(', '));
if(sessionWorkaroundFiles.length) add(violations,'SC03_SESSION_WORKAROUND',sessionWorkaroundFiles.join(', '));

const targetFeaturePlaceholderFiles=[];
let targetFeatureCount=0;
for(const family of TARGET_FAMILIES){
  for(const file of walk(join(ROOT,'src','modules',family))){
    targetFeatureCount++;
    if(readFileSync(file,'utf8').includes('SC-01 scaffold placeholder')) targetFeaturePlaceholderFiles.push(relative(ROOT,file));
  }
}
if(targetFeatureCount!==42) add(violations,'FEATURE_INVENTORY_DRIFT',String(targetFeatureCount));
if(targetFeaturePlaceholderFiles.length) add(violations,'FEATURE_PLACEHOLDER_REMAINS',targetFeaturePlaceholderFiles.join(', '));

const bootstrapText=readFileSync(join(ROOT,'src','app','bootstrap.js'),'utf8');

const domainMarkers=Object.freeze({
  qris:Object.freeze({id:'qris'}),
  transaction:Object.freeze({id:'transaction'}),
  inventory:Object.freeze({id:'inventory'}),
  shift:Object.freeze({id:'shift'}),
  refundVoid:Object.freeze({id:'refundVoid'}),
  report:Object.freeze({id:'report'}),
  debt:Object.freeze({id:'debt'})
});
const featureProbe=createFeatureRuntime({
  router:{},
  guard:{currentRole:()=> 'owner'},
  services:domainMarkers
});
const featureSnapshot=featureProbe.snapshot();
const featureRuntime={
  featureCount:featureSnapshot.featureCount,
  activeCount:featureSnapshot.active.length,
  deferredCount:featureSnapshot.deferred.length,
  bootstrapUsesFeatureRuntime:
    bootstrapText.includes("import { createFeatureRuntime } from '../modules/runtime-registry.js';") &&
    bootstrapText.includes('const features=createFeatureRuntime({router,guard,services});'),
  publicWrappersThroughFeatures:[
    "installGlobal('showView',view=>features.navigateLegacyView(view)",
    "installGlobal('openOpr',id=>features.openOperational(id)",
    "installGlobal('closeOpr',()=>features.closeOperational()",
    "installGlobal('openLap',id=>features.openReport(id)",
    "installGlobal('closeLap',()=>features.closeReport()",
    "installGlobal('openMst',id=>features.openSettings(id)",
    "installGlobal('closeMst',()=>features.closeSettings()",
    "installGlobal('openCartModal',()=>features.openCart()",
    "installMethod('SJX','openDashboard',()=>features.openDashboard()",
    "installMethod('SJCommercialFinalV5961','openPayment',method=>features.openPayment(method)",
    "installMethod('SJRefinementCheckoutV100','openCheckout',()=>features.openCheckout()"
  ].every(token=>bootstrapText.includes(token)),
  domainSeams:Object.freeze({
    qris:featureProbe.get('payments.qris')?.domain===domainMarkers.qris,
    transaction:featureProbe.get('sales.checkout')?.domain===domainMarkers.transaction,
    inventory:featureProbe.get('operational.stock')?.domain===domainMarkers.inventory,
    shift:featureProbe.get('operational.shift')?.domain===domainMarkers.shift,
    refundVoid:featureProbe.get('operational.refund-void')?.domain===domainMarkers.refundVoid,
    report:featureProbe.get('reports.sales-report')?.domain===domainMarkers.report,
    debt:featureProbe.get('operational.5')?.domain===domainMarkers.debt
  })
};
if(featureRuntime.featureCount!==42) add(violations,'FEATURE_RUNTIME_COUNT_DRIFT',String(featureRuntime.featureCount));
if(featureRuntime.activeCount!==40) add(violations,'FEATURE_RUNTIME_ACTIVE_DRIFT',String(featureRuntime.activeCount));
if(featureRuntime.deferredCount!==2) add(violations,'FEATURE_RUNTIME_DEFERRED_DRIFT',String(featureRuntime.deferredCount));
if(!featureRuntime.bootstrapUsesFeatureRuntime) add(violations,'FEATURE_RUNTIME_BOOTSTRAP_BYPASS','bootstrap.js');
if(!featureRuntime.publicWrappersThroughFeatures) add(violations,'PUBLIC_WRAPPER_FEATURE_BYPASS','bootstrap.js');
for(const [name,present] of Object.entries(featureRuntime.domainSeams)){
  if(!present) add(violations,'SC02_DOMAIN_SEAM_MISSING',name);
}

const callerOwnership={};
for(const name of ['showView','openOpr','closeOpr','openLap','closeLap','openMst','closeMst','openCartModal']){
  const count=(bootstrapText.match(new RegExp(`installGlobal\\('${name}'`,'g'))||[]).length;
  callerOwnership[name]=count;
  if(count!==1) add(violations,'CALLER_OWNERSHIP_COUNT',`${name}:${count}`);
}
for(const [objectName,methodName] of [['SJX','openDashboard'],['SJCommercialFinalV5961','openPayment'],['SJRefinementCheckoutV100','openCheckout']]){
  const key=`${objectName}.${methodName}`;
  const count=(bootstrapText.match(new RegExp(`installMethod\\('${objectName}','${methodName}'`,'g'))||[]).length;
  callerOwnership[key]=count;
  if(count!==1) add(violations,'CALLER_OWNERSHIP_COUNT',`${key}:${count}`);
}

const legacyAuthorityTokens=['processTransaction','SJQrisSignalBeta','SJInventoryV2','SJCostingV1','SJShift','SJOperationalHardening','lunasiHutang','simpanKasbonKaryawan','lunasiKasbonKaryawan','SJReportFoundationV010'];
const legacyAuthorityPresence={};
for(const token of legacyAuthorityTokens){
  const present=baselineText.includes(token);
  legacyAuthorityPresence[token]=present;
  if(!present) add(violations,'LEGACY_AUTHORITY_MISSING',token);
}

const menuContract={
  primary:Object.keys(PRIMARY_ROUTES),
  operationalIds:Object.keys(OPERATIONAL_CHILDREN).map(Number),
  reportIds:Object.keys(REPORT_CHILDREN).map(Number),
  settingsIds:Object.keys(SETTINGS_CHILDREN).map(Number),
  hiddenOperational4:OPERATIONAL_CHILDREN[4]?.status==='legacy-hidden',
  cashierOperationalIds:Object.entries(OPERATIONAL_CHILDREN).filter(([,v])=>v.cashier===true).map(([id])=>Number(id)),
  cashierReportIds:Object.entries(REPORT_CHILDREN).filter(([,v])=>v.cashier===true).map(([id])=>Number(id))
};
if(JSON.stringify(menuContract.primary)!==JSON.stringify(['home','sales','operational','reports','settings'])) add(violations,'PRIMARY_MENU_DRIFT',menuContract.primary.join(','));
if(JSON.stringify(menuContract.operationalIds)!==JSON.stringify([1,3,4,5,6,7,9,10,11,12])) add(violations,'OPERATIONAL_MENU_DRIFT',menuContract.operationalIds.join(','));
if(!menuContract.hiddenOperational4) add(violations,'HIDDEN_OPR4_REVIVED','4');
if(JSON.stringify(menuContract.reportIds)!==JSON.stringify([1,2,3,4,5])) add(violations,'REPORT_MENU_DRIFT',menuContract.reportIds.join(','));
if(JSON.stringify(menuContract.settingsIds)!==JSON.stringify([1,2,4,5,6,7,8,9,10])) add(violations,'SETTINGS_MENU_DRIFT',menuContract.settingsIds.join(','));
if(JSON.stringify(menuContract.cashierOperationalIds)!==JSON.stringify([1,3,5,7,9,10])) add(violations,'CASHIER_OPERATIONAL_GUARD_DRIFT',menuContract.cashierOperationalIds.join(','));
if(JSON.stringify(menuContract.cashierReportIds)!==JSON.stringify([3])) add(violations,'CASHIER_REPORT_GUARD_DRIFT',menuContract.cashierReportIds.join(','));

for(const rel of ['docs/SC03_LEGACY_CALLER_RENDERER_MAP.md','docs/SC03_MENU_CAPABILITY_MAP.md','docs/SC03_NO_REGRESSION_CONTRACT.md']){
  if(!existsSync(join(ROOT,rel))) add(violations,'SC03_DOC_MISSING',rel);
}

const result={
  generatedAt:new Date().toISOString(),
  phase:'SC-03',
  baselineSha256,
  compatibilityDistSha256,
  expectedBaselineSha256:EXPECTED,
  candidateSha256:existsSync(CANDIDATE)?sha(CANDIDATE):null,
  candidateEntryCount,
  posRoot:POS_ROOT,
  qrisRoot:QRIS_ROOT,
  targetFeatureCount,
  targetFeaturePlaceholderFiles,
  scannedFiles,
  directMutationFiles,
  sessionWorkaroundFiles,
  callerOwnership,
  featureRuntime,
  legacyAuthorityPresence,
  menuContract,
  violations
};
writeFileSync(join(ROOT,'audit','sc03-verification.json'),JSON.stringify(result,null,2)+'\n');
if(violations.length){
  console.error(`SC-03 verification FAILED: ${violations.length} violation(s)`);
  for(const item of violations) console.error(`- ${item.code}: ${item.detail}`);
  process.exit(1);
}
console.log(`SC-03 verification PASS: ${targetFeatureCount} feature boundaries; ${scannedFiles.length} app/core/module JS files; 0 direct mutations; 1 modular entry; caller/menu/root/hash gates fixed.`);
