import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POS_ROOT, QRIS_ROOT } from '../src/data/firebase-client.js';
import { SETTINGS_GROUPS, IMPLICIT_CAPABILITIES, SCREEN_FAMILIES, RESPONSIVE_TARGETS, REPORT_HEADLINES } from '../src/ui/refinement-contract.js';
import { PRIMARY_NAV } from '../src/ui/bottom-nav.js';
import { ICONS } from '../src/ui/icons.js';
import { SCREEN_CONTRACTS } from '../src/ui/screen-contracts.js';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url))),EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const add=(a,code,detail)=>a.push({code,detail});
function walk(dir){if(!existsSync(dir))return[];const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else out.push(p)}return out}
const violations=[],BASE=join(ROOT,'baseline','legacy-v1.0.40.html'),COMPAT=join(ROOT,'dist','index.html'),CAND=join(ROOT,'dist-ref01','index.html');
const baselineSha256=existsSync(BASE)?sha(BASE):null,compatibilitySha256=existsSync(COMPAT)?sha(COMPAT):null,candidateText=existsSync(CAND)?readFileSync(CAND,'utf8'):'';
if(baselineSha256!==EXPECTED)add(violations,'BASELINE_HASH_DRIFT',String(baselineSha256));if(compatibilitySha256!==EXPECTED)add(violations,'COMPATIBILITY_HASH_DRIFT',String(compatibilitySha256));
if(POS_ROOT!=='toko_segeranjiwa_v58')add(violations,'POS_ROOT_DRIFT',POS_ROOT);if(QRIS_ROOT!=='segeranjiwa_qris_beta_v1')add(violations,'QRIS_ROOT_DRIFT',QRIS_ROOT);
const entries=(candidateText.match(/data-sj-ref01-entry="true"/g)||[]).length;if(entries!==1)add(violations,'REF01_ENTRY_COUNT',String(entries));if(!candidateText.includes('src/ref01-entry.js'))add(violations,'REF01_ENTRY_MISSING','src/ref01-entry.js');
const refDir=join(ROOT,'blueprint_authority','references','refinement'),refinementReferences=existsSync(refDir)?readdirSync(refDir).filter(x=>/^REF_.*\.png$/i.test(x)).length:0;if(refinementReferences!==9)add(violations,'REFINEMENT_REFERENCE_COUNT',String(refinementReferences));
const mutation=/\.(?:set|update|transaction|remove)\s*\(/,directMutationFiles=[],scanFiles=[...walk(join(ROOT,'src','ui')).filter(x=>x.endsWith('.js')),join(ROOT,'src','app','ref01-bootstrap.js'),join(ROOT,'src','ref01-entry.js')];
for(const file of scanFiles){if(!existsSync(file))continue;const text=readFileSync(file,'utf8');if(mutation.test(text))directMutationFiles.push(relative(ROOT,file));if(/firebase\.initializeApp\s*\(/.test(text))add(violations,'SECOND_FIREBASE_INIT',relative(ROOT,file))}
if(directMutationFiles.length)add(violations,'REF01_DIRECT_RTDB_MUTATION',directMutationFiles.join(', '));

const baselineText=existsSync(BASE)?readFileSync(BASE,'utf8'):'';
const unresolvedSelectors=[];
for(const [family,contract] of Object.entries(SCREEN_CONTRACTS)){
  if(family==='system-states') continue;
  const resolved=contract.selectors.some(selector=>{
    if(!selector.startsWith('#')) return true;
    const id=selector.slice(1);
    return baselineText.includes(`id="${id}"`)||baselineText.includes(`id='${id}'`);
  });
  if(!resolved) unresolvedSelectors.push(family);
}
const screenCoverage={coveredFamilies:Object.keys(SCREEN_CONTRACTS).length,unresolvedSelectors};
if(screenCoverage.coveredFamilies!==SCREEN_FAMILIES.length)add(violations,'SCREEN_CONTRACT_COUNT',`${screenCoverage.coveredFamilies}/${SCREEN_FAMILIES.length}`);
if(unresolvedSelectors.length)add(violations,'SCREEN_SELECTOR_UNRESOLVED',unresolvedSelectors.join(','));
const refBootstrapText=readFileSync(join(ROOT,'src','app','ref01-bootstrap.js'),'utf8');
const correctionObserverDefault=/observe\s*=\s*false/.test(refBootstrapText);
if(!correctionObserverDefault)add(violations,'REF01_OBSERVER_DEFAULT','MutationObserver correction stacking must be opt-in only');

const navOk=PRIMARY_NAV.map(x=>x.label).join('|')==='Beranda|Jual|Operasional|Laporan|Pengaturan';if(!navOk)add(violations,'PRIMARY_NAV_DRIFT',PRIMARY_NAV.map(x=>x.label).join(','));
const groups=Object.keys(SETTINGS_GROUPS),settingsOk=groups.join('|')==='Toko|Akses|Tampilan & Perangkat|Sistem|Data|Zona Sensitif';if(!settingsOk)add(violations,'SETTINGS_GROUP_DRIFT',groups.join(','));
const requiredIcons=['home','sale','operations','reports','settings','cash','users','inventory','shift','note','refund','employee','printer','bell','security','activity','diagnostics','backup','camera','image'];for(const icon of requiredIcons)if(!ICONS[icon])add(violations,'ICON_MISSING',icon);
const css=readFileSync(join(ROOT,'src','ui','ref01.css'),'utf8');if(!/--sj-ref-motion:\s*200ms/.test(css))add(violations,'MOTION_TOKEN_DRIFT','200ms');if(!/min-height:\s*var\(--sj-ref-touch\)/.test(css))add(violations,'TOUCH_TARGET_MISSING','44px token');if(!/@media \(min-width:768px\)/.test(css)||!/@media \(min-width:1200px\)/.test(css))add(violations,'RESPONSIVE_BREAKPOINT_MISSING','tablet/desktop');
const implicitLogic={photoLifecycle:IMPLICIT_CAPABILITIES.productPhoto.actions.length===4&&IMPLICIT_CAPABILITIES.profilePhoto.actions.length===4,barcodeFallback:IMPLICIT_CAPABILITIES.barcode.manualFallback===true,staleShiftRecovery:IMPLICIT_CAPABILITIES.staleShift.closingAuthority==='existing-SJShift'&&IMPLICIT_CAPABILITIES.staleShift.autoClose===false,unknownHppSafe:IMPLICIT_CAPABILITIES.unknownHpp.display==='Belum tersedia'&&IMPLICIT_CAPABILITIES.unknownHpp.zeroWhenUnknown===false,transferProofNoInventedWriter:IMPLICIT_CAPABILITIES.transferProof.persistence==='draft-only-until-existing-writer'};
for(const [k,v] of Object.entries(implicitLogic))if(!v)add(violations,'IMPLICIT_LOGIC_GATE',k);
if(REPORT_HEADLINES.join('|')!=='Total Penjualan|Transaksi|Laba Kotor')add(violations,'REPORT_HEADLINE_DRIFT',REPORT_HEADLINES.join(','));
if(RESPONSIVE_TARGETS.mobile.join(',')!=='320,390,430')add(violations,'MOBILE_TARGET_DRIFT',RESPONSIVE_TARGETS.mobile.join(','));if(SCREEN_FAMILIES.length<10)add(violations,'SCREEN_FAMILY_COVERAGE',String(SCREEN_FAMILIES.length));
const docs=['docs/REF01_IMPLEMENTATION_REPORT.md','docs/REF01_RELEASE_MANIFEST.md','docs/REF01_HANDOFF_TO_QA01.md'];for(const rel of docs)if(!existsSync(join(ROOT,rel)))add(violations,'REF01_DOC_MISSING',rel);
const result={generatedAt:new Date().toISOString(),phase:'REF-01',baselineSha256,compatibilitySha256,candidateSha256:existsSync(CAND)?sha(CAND):null,posRoot:POS_ROOT,qrisRoot:QRIS_ROOT,entries,refinementReferences,screenFamilies:SCREEN_FAMILIES,screenCoverage,correctionObserverDefault,settingsGroups:groups,nav:PRIMARY_NAV.map(x=>x.label),directMutationFiles,implicitLogic,violations};
writeFileSync(join(ROOT,'audit','ref01-verification.json'),JSON.stringify(result,null,2)+'\n');if(violations.length){console.error(`REF-01 verification FAILED: ${violations.length} violation(s)`);for(const v of violations)console.error(`- ${v.code}: ${v.detail}`);process.exit(1)}console.log(`REF-01 verification PASS: ${refinementReferences} references; ${SCREEN_FAMILIES.length} screen families; ${groups.length} Settings groups; 0 REF-01 RTDB mutations; 1 entry; fixed roots/hash retained.`);
