import { closeSync, cpSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const SOURCE=join(ROOT,'src');
const OUT=join(ROOT,'dist-ref01');
const LOCK=join(ROOT,'.ref01-build.lock');
const STAMP=join(OUT,'.ref01-build-fingerprint');
const S10A1_EARLY_ENTRY='<script src="./src/compat/rc01-qris-event-sync-shield.js" data-sj-rc01-s10a1-event-shield="true"></script>';
const S10C_R2_EARLY_ENTRY='<script src="./src/compat/rc01-qris-evaluation-convergence.js" data-sj-rc01-s10c-r2-qris-convergence="true"></script>';
const CLASSIC_ENTRY='<script src="./src/compat/ref01-production-sales-compat.js" data-sj-ref01-production-sales-compat="true"></script>';
const S10C_SYNC_ENTRY='<script src="./src/compat/rc01-sync-authority.js" data-sj-rc01-s10c-sync-authority="true"></script>';
const R6C_NOTIFICATION_ENTRY='<script src="./src/compat/rc01-notification-permission-hygiene.js" data-sj-rc01-s10c-r6c-notification-hygiene="true"></script>';
const R6D_SALES_RECURSION_ENTRY='<script src="./src/compat/rc01-sales-render-recursion-hardening.js" data-sj-rc01-s10c-r6d-sales-recursion="true"></script>';
const R6C_NOTIFICATION_BOOTSTRAP_MARKER='SJX.init();';
const S10C_INSTALL_MARKER='try{SJMobileUX.install();';
const QRIS_BETA_MARKER='if(window.SJQrisSignalBeta)return;';
const QRIS_MANUAL_ONLY_GUARD="if(window.SJQrisSignalBeta)return;window.SJQrisSignalBeta=Object.freeze({version:'QRIS-MANUAL-ONLY',disabled:true,status:function(){return{started:false,activePendingId:'',signals:0,pending:0}},ensureWaitingPending:async function(){throw new Error('QRIS_AUTOMATIC_BRIDGE_DISABLED_MANUAL_ONLY')},renderCommercialQrisState:function(){return false},cancelWaiting:async function(){return true}});window.SJRC01S10AQrisCompat=Object.freeze({version:'QRIS-MANUAL-ONLY',disabled:true,refreshEvidence:async function(){return false},getParked:function(){return[]},getLateReview:function(){return[]}});return;";
const S10A_CLASSIC_ENTRY='<script src="./src/compat/rc01-qris-deferred-settlement-compat.js" data-sj-rc01-s10a-qris="true"></script>';
const QRIS_MANUAL_ENTRY='<script src="./src/compat/rc01-qris-manual-bypass.js" data-sj-rc01-qris-manual="true"></script>';
const PRODUCT_CUP_UI_ENTRY='<script src="./src/compat/legacy-cup-01b-product-cup-ui.js" data-sj-legacy-cup-01b-product-ui="true"></script>';
const ENTRY='<script type="module" src="./src/ref01-entry.js" data-sj-ref01-entry="true"></script>';

function injectBeforeQrisBeta(legacy){
  const marker=legacy.indexOf(QRIS_BETA_MARKER);if(marker<0)throw new Error('REF01_QRIS_BETA_MARKER_MISSING');
  const scriptStart=legacy.lastIndexOf('<script>',marker);if(scriptStart<0)throw new Error('REF01_QRIS_BETA_SCRIPT_START_MISSING');
  return legacy.slice(0,scriptStart)+S10C_R2_EARLY_ENTRY+'\n'+S10A1_EARLY_ENTRY+'\n'+legacy.slice(scriptStart);
}

function disableAutomaticQrisBridge(legacy){
  if(!legacy.includes(QRIS_BETA_MARKER))throw new Error('QRIS_AUTOMATIC_BRIDGE_MARKER_MISSING');
  return legacy.replace(QRIS_BETA_MARKER,QRIS_MANUAL_ONLY_GUARD);
}

function patchQrisEvaluationConvergence(legacy){
  const originalAll="function evaluateAllSignals(){eligibleSignals().forEach(function(s){setTimeout(function(){evaluateSignal(s)},100)})}";
  const patchedAll="function evaluateAllSignals(){var gate=window.SJRC01S10CR2QrisConvergence;eligibleSignals().forEach(function(s){var id=String(s&&((s._key||s.providerTransactionId)||''));if(gate&&typeof gate.schedule==='function'&&id){gate.schedule(id,function(){return evaluateSignal(s)},100);return}setTimeout(function(){evaluateSignal(s)},100)})}";
  const ambiguous="try{await qrisRef('signals/'+id).transaction(function(cur){if(!cur||cur.matchedTransactionId||String(cur.status)==='CONFIRMED'||!Core.eligibleSignalStatus(cur.status))return;cur.status='AMBIGUOUS';return cur})}catch(e){sjSaveError('QRIS_MATCH_STATE',e)}";
  const ambiguousPatched="if(!(window.SJRC01S10CR2QrisConvergence&&window.SJRC01S10CR2QrisConvergence.shouldSkipSignalState(s,'AMBIGUOUS'))){"+ambiguous+"}";
  const unmatched="try{await qrisRef('signals/'+id).transaction(function(cur){if(!cur||cur.matchedTransactionId||String(cur.status)==='CONFIRMED'||!Core.eligibleSignalStatus(cur.status))return;cur.status='UNMATCHED';return cur})}catch(e){sjSaveError('QRIS_MATCH_STATE',e)}";
  const unmatchedPatched="if(!(window.SJRC01S10CR2QrisConvergence&&window.SJRC01S10CR2QrisConvergence.shouldSkipSignalState(s,'UNMATCHED'))){"+unmatched+"}";
  if(!legacy.includes(originalAll))throw new Error('RC01_S10C_R2_EVALUATE_ALL_ANCHOR_MISSING');
  if(!legacy.includes(ambiguous)||!legacy.includes(unmatched))throw new Error('RC01_S10C_R2_MATCH_STATE_ANCHOR_MISSING');
  return legacy.replace(originalAll,patchedAll).replace(ambiguous,ambiguousPatched).replace(unmatched,unmatchedPatched);
}

function injectR6CNotificationHygiene(legacy){
  const marker=legacy.indexOf(R6C_NOTIFICATION_BOOTSTRAP_MARKER);if(marker<0)throw new Error('RC01_S10C_R6C_NOTIFICATION_BOOTSTRAP_MARKER_MISSING');
  const scriptStart=legacy.lastIndexOf('<script>',marker),scriptEnd=legacy.indexOf('</script>',marker);
  if(scriptStart<0||scriptEnd<0)throw new Error('RC01_S10C_R6C_NOTIFICATION_SCRIPT_BOUNDARY_INVALID');
  return legacy.slice(0,marker)+'</script>\n'+R6C_NOTIFICATION_ENTRY+'\n<script>\n'+legacy.slice(marker);
}

function injectS10CSyncAuthority(legacy){
  const marker=legacy.indexOf(S10C_INSTALL_MARKER);if(marker<0)throw new Error('RC01_S10C_INSTALL_MARKER_MISSING');
  const scriptStart=legacy.lastIndexOf('<script>',marker),scriptEnd=legacy.indexOf('</script>',marker);
  if(scriptStart<0||scriptEnd<0)throw new Error('RC01_S10C_SCRIPT_BOUNDARY_INVALID');
  return legacy.slice(0,marker)+'</script>\n'+S10C_SYNC_ENTRY+'\n<script>\n'+legacy.slice(marker);
}

const PRODUCT_CUP_SELECT_OPTIONS='<option value="">Per produk / tanpa cup</option><option value="c10">Cup 10 Oz</option><option value="c10p">Cup Paper 10 Oz</option><option value="c16">Cup 16 Oz</option><option value="c22p">Cup 22 Oz Datar Polos</option><option value="c22d">Cup 22 Oz Datar</option><option value="c22o">Cup 22 Oz Oval</option>';
function patchLegacyProductCupSelects(legacy){
  let count=0;
  const patched=legacy.replace(/(<select id="(?:new-cp|edit-m-cp)"[^>]*>)[\s\S]*?(<\/select>)/g,(full,start,end)=>{count++;return `${start}\n${PRODUCT_CUP_SELECT_OPTIONS}\n${end}`});
  if(count!==2)throw new Error(`LEGACY_CUP_01B_PRODUCT_SELECT_ANCHOR_DRIFT:${count}`);
  return patched;
}
function sleep(ms){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms)}
function acquireLock(){
  const deadline=Date.now()+30000;
  while(true){
    try{const fd=openSync(LOCK,'wx');writeFileSync(fd,String(process.pid));closeSync(fd);return}
    catch(error){
      if(error?.code!=='EEXIST')throw error;
      try{if(Date.now()-statSync(LOCK).mtimeMs>120000)unlinkSync(LOCK)}catch(_){}
      if(Date.now()>deadline)throw new Error('REF01_BUILD_LOCK_TIMEOUT');
      sleep(40);
    }
  }
}
function sourceFiles(dir){
  const out=[];
  for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const full=join(dir,entry.name);
    if(entry.isDirectory())out.push(...sourceFiles(full));
    else if(entry.isFile())out.push(full);
  }
  return out;
}
function fingerprint(){
  const hash=createHash('sha256');
  hash.update('REF01-BUILD-V3-S10C-R2\0');
  hash.update(readFileSync(BASE));
  for(const file of sourceFiles(SOURCE)){
    hash.update(relative(ROOT,file));hash.update('\0');hash.update(readFileSync(file));hash.update('\0');
  }
  return hash.digest('hex');
}
function outputReady(fp){
  if(!existsSync(join(OUT,'index.html'))||!existsSync(join(OUT,'src','ref01-entry.js'))||!existsSync(STAMP))return false;
  try{return readFileSync(STAMP,'utf8').trim()===fp}catch(_){return false}
}

acquireLock();
let staging=null;
try{
  const fp=fingerprint();
  if(outputReady(fp)){
    const existing=readFileSync(join(OUT,'index.html'));
    console.log(`REF-01 candidate build: dist-ref01/index.html ${createHash('sha256').update(existing).digest('hex')} (cached)`);
  }else{
    staging=join(ROOT,`.dist-ref01-build-${process.pid}-${Date.now()}`);
    rmSync(staging,{recursive:true,force:true});
    mkdirSync(staging,{recursive:true});
    cpSync(SOURCE,join(staging,'src'),{recursive:true});
    const legacy=readFileSync(BASE,'utf8');
    if((legacy.match(/<\/body>/gi)||[]).length!==1)throw new Error('REF01_BUILD_BODY_ANCHOR_INVALID');
    const converged=patchQrisEvaluationConvergence(legacy);
    const early=injectBeforeQrisBeta(converged);
    const manualOnly=disableAutomaticQrisBridge(early);
    const notificationSafe=injectR6CNotificationHygiene(manualOnly);
    const withSync=injectS10CSyncAuthority(notificationSafe);
    const withProductCup=patchLegacyProductCupSelects(withSync);
    const candidate=withProductCup.replace(/<\/body>/i,`${PRODUCT_CUP_UI_ENTRY}\n${R6D_SALES_RECURSION_ENTRY}\n${CLASSIC_ENTRY}\n${S10A_CLASSIC_ENTRY}\n${QRIS_MANUAL_ENTRY}\n${ENTRY}\n</body>`);
    writeFileSync(join(staging,'index.html'),candidate);
    writeFileSync(join(staging,'.ref01-build-fingerprint'),`${fp}\n`);
    rmSync(OUT,{recursive:true,force:true});
    renameSync(staging,OUT);staging=null;
    const sha=createHash('sha256').update(candidate).digest('hex');
    console.log(`REF-01 candidate build: dist-ref01/index.html ${sha}`);
  }
}finally{
  if(staging)rmSync(staging,{recursive:true,force:true});
  try{unlinkSync(LOCK)}catch(_){}
}
