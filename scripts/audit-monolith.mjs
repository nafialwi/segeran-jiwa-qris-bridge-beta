import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = join(ROOT, 'baseline', 'legacy-v1.0.40.html');
const OUT = join(ROOT, 'audit');
const DOCS = join(ROOT, 'docs');
mkdirSync(OUT, { recursive: true });
mkdirSync(DOCS, { recursive: true });
const text = readFileSync(BASE, 'utf8');
const lines = text.split(/\r?\n/);
const sha256 = createHash('sha256').update(readFileSync(BASE)).digest('hex');

function count(re){ return [...text.matchAll(re)].length; }
function lineNoAt(index){ return text.slice(0,index).split('\n').length; }
function uniq(arr){ return [...new Set(arr)]; }
function captures(re, group=1){ return [...text.matchAll(re)].map(m=>m[group]).filter(Boolean); }
function contexts(re, kind){
  const out=[];
  for(const m of text.matchAll(re)){
    const line=lineNoAt(m.index||0);
    const raw=lines[line-1]||'';
    out.push({kind,line,snippet:raw.trim().slice(0,360)});
  }
  return out;
}
function nearestMarker(index){
  const before=text.slice(Math.max(0,index-800),index);
  const markers=[...before.matchAll(/SJ-[A-Z0-9_.-]+/gi)].map(m=>m[0]);
  return markers.at(-1) || null;
}
function blockDescriptors(tag){
  const re = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
  return [...text.matchAll(re)].map((m,i)=>({
    index:i+1,
    line:lineNoAt(m.index||0),
    attrs:(m[1]||'').trim().slice(0,240),
    nearestMarker:nearestMarker(m.index||0)
  }));
}
function normalizePathExpression(expr){
  return String(expr||'')
    .replace(/\s+/g,'')
    .replace(/DB_PATH/g,'{POS_ROOT}')
    .replace(/QRIS_ROOT|QRIS_DB_PATH/g,'{QRIS_ROOT}')
    .replace(/\+[^+'"`),;]+/g,'+{dyn}')
    .replace(/["'`]/g,'')
    .replace(/\+\{dyn\}/g,'/{dyn}')
    .replace(/\+/g,'')
    .replace(/\/+/g,'/')
    .slice(0,220);
}
function mdEscape(s){return String(s).replace(/\|/g,'\\|').replace(/\n/g,' ');}

const functionMatches=[...text.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>({name:m[1],line:lineNoAt(m.index||0)}));
const arrowGlobals=[...text.matchAll(/(?:window\.)?([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g)].map(m=>({name:m[1],line:lineNoAt(m.index||0)}));
const windowModules=uniq(captures(/window\.([A-Za-z_$][\w$]*)\s*=/g)).filter(x=>/^SJ|^open|^render|^close|^share/i.test(x));

const styles=blockDescriptors('style');
const scripts=blockDescriptors('script');
const refinementMarkers=uniq(captures(/(?:\/\*|<!--)\s*(SJ-[A-Z0-9][A-Z0-9_.-]*(?:-[A-Z0-9_.-]+)*)/gi));
const explicitVersionMarkers=uniq(captures(/SJX-2026\.[^'"<\s)]+/g,0));

const writeSites=[
  ...contexts(/\.set\s*\(/g,'set'),
  ...contexts(/\.update\s*\(/g,'update'),
  ...contexts(/\.transaction\s*\(/g,'transaction'),
  ...contexts(/\.remove\s*\(/g,'remove')
].sort((a,b)=>a.line-b.line);
const readSites=[
  ...contexts(/\.once\s*\(\s*['"]value['"]/g,'once(value)'),
  ...contexts(/\.on\s*\(\s*['"]value['"]/g,'on(value)')
].sort((a,b)=>a.line-b.line);
const refExpressions=uniq([
  ...captures(/(?:db|qrisRef)\.ref\(([^\n;]{1,240}?)\)/g),
  ...captures(/firebase\.database\(\)\.ref\(([^\n;]{1,240}?)\)/g)
]).slice(0,500);
const literalFamilies=uniq([
  ...captures(/DB_PATH\s*\+\s*['"]([^'"]+)['"]/g).map(x=>`{POS_ROOT}${x}`),
  ...captures(/segeranjiwa_qris_beta_v1(?:\/[^'"`\s)<;]*)?/g,0).map(x=>x),
  ...refExpressions.map(normalizePathExpression)
].filter(x=>x && x.length>3)).sort();


const pathFamilies=uniq([
  ...captures(/DB_PATH\s*\+\s*['"](\/[^'"]+)['"]/g),
  ...captures(/qrisRef\(\s*['"]([^'"]+)['"]/g).map(x=>'/'+x.split('/')[0]),
  ...captures(/QRIS_DB_PATH\s*\+\s*['"](\/[^'"]+)['"]/g),
  ...captures(/['"]global\/([A-Za-z0-9_-]+)[/'"]/g).map(x=>'/global/'+x)
]).map(x=>String(x).replace(/\+.*$/,'')).filter(Boolean).sort();

const storage={
  localStorage: contexts(/localStorage\./g,'localStorage'),
  sessionStorage: contexts(/sessionStorage\./g,'sessionStorage'),
  firebaseAuth: contexts(/firebase\.auth\s*\(/g,'firebase.auth'),
  authState: contexts(/onAuthStateChanged/g,'onAuthStateChanged'),
  persistence: contexts(/setPersistence|LOCAL|SESSION|NONE/g,'auth-persistence')
};

const categoryRules={
  auth:/login|logout|user|pin|auth|session/i,
  transaction:/transaction|processTransaction|cart|checkout|payment|tunai|qris|transfer|kasbon/i,
  inventory:/stock|stok|inventory|restock|purchase|wac|menu/i,
  shift:/shift|kas|closing|handover|serah|absen/i,
  report:/report|laporan|rep0|export|history/i,
  ui:/render|open|modal|toast|nav|dashboard|settings|operational/i
};
const grouped={}; for(const k of Object.keys(categoryRules)) grouped[k]=[];
for(const f of functionMatches){ for(const [k,re] of Object.entries(categoryRules)){ if(re.test(f.name)) grouped[k].push(f); } }

const canonicalBottomNav=['Beranda','Jual','Operasional','Laporan','Pengaturan'];
const knownRoutes={
  bottomNavLabels:canonicalBottomNav.filter(x=>text.includes(x)),
  routeFunctions: uniq(functionMatches.map(x=>x.name).filter(n=>/^(go|open|close|render|switch|navigate|show)/i.test(n))).slice(0,240),
  operationalFunctions: uniq(functionMatches.map(x=>x.name).filter(n=>/Opr|Stock|Restock|Shift|Refund|Expense|Kasbon/i.test(n))).slice(0,240),
  reportFunctions: uniq(functionMatches.map(x=>x.name).filter(n=>/Report|Laporan|Rep0|Export/i.test(n))).slice(0,240),
  tabIds: uniq(captures(/id=['"](tab\d+)['"]/gi)).sort(),
  modalIds: uniq(captures(/id=['"](modal-[^'"]+)['"]/gi)).sort()
};

const qris={
  rootOccurrences: count(/segeranjiwa_qris_beta_v1/g),
  engineOccurrences: count(/SJQrisSignalBeta/g),
  pendingOccurrences: count(/pending/g),
  matchedOccurrences: count(/MATCHED|matched/g),
  ambiguousOccurrences: count(/AMBIGUOUS|ambiguous|ambigu/g),
  ensureWaitingPending: count(/ensureWaitingPending/g),
  cancelWaiting: count(/cancelWaiting/g),
  keySymbols: uniq(captures(/\b(SJQrisSignalBeta|QRIS_[A-Z0-9_]+|qris[A-Za-z0-9_$]*)\b/g)).slice(0,180)
};

const audit={
  generatedAt:new Date().toISOString(),
  baseline:{file:'baseline/legacy-v1.0.40.html',bytes:Buffer.byteLength(text),lines:lines.length,sha256},
  fixedContracts:{posRoot:'toko_segeranjiwa_v58',qrisRoot:'segeranjiwa_qris_beta_v1',packageId:'id.segeranjiwa.pos'},
  structure:{styleBlocks:styles.length,scriptBlocks:scripts.length,styles,scripts,htmlForms:count(/<form\b/gi),buttons:count(/<button\b/gi),modals:count(/class=['"][^'"]*modal/gi)},
  functions:{total:functionMatches.length,declared:functionMatches,arrowGlobals,windowModules,groups:grouped},
  layers:{refinementMarkers,explicitVersionMarkers},
  firebase:{refExpressions,pathFamilies:literalFamilies,writeSites,readSites},
  authSession:storage,
  routes:knownRoutes,
  qris
};
writeFileSync(join(OUT,'monolith-audit.json'), JSON.stringify(audit,null,2));

const md=[];
md.push('# SC-01 Monolith Audit — v1.0.40','',`Generated: ${audit.generatedAt}`,'');
md.push('## Baseline','',`- SHA256: \`${sha256}\``,`- Bytes: ${audit.baseline.bytes}`,`- Lines: ${audit.baseline.lines}`,`- Style blocks: ${audit.structure.styleBlocks}`,`- Script blocks: ${audit.structure.scriptBlocks}`,`- Declared functions: ${audit.functions.total}`,`- Firebase mutation tokens: ${writeSites.length}`,'');
md.push('## Fixed contracts','',`- POS root: \`${audit.fixedContracts.posRoot}\``,`- QRIS root: \`${audit.fixedContracts.qrisRoot}\``,`- Package ID: \`${audit.fixedContracts.packageId}\``,'');
md.push('## Style / renderer layering','', '| # | Line | Nearest marker | Attributes |','|---:|---:|---|---|',...styles.map(x=>`| ${x.index} | ${x.line} | ${mdEscape(x.nearestMarker||'—')} | ${mdEscape(x.attrs||'—')} |`),'');
md.push('## Script layering','', '| # | Line | Nearest marker | Attributes |','|---:|---:|---|---|',...scripts.map(x=>`| ${x.index} | ${x.line} | ${mdEscape(x.nearestMarker||'—')} | ${mdEscape(x.attrs||'—')} |`),'');
md.push('## Layer markers','',...refinementMarkers.map(x=>`- ${x}`),'');
md.push('## Firebase write sites','', '| Line | Operation | Snippet |','|---:|---|---|', ...writeSites.map(x=>`| ${x.line} | ${x.kind} | ${mdEscape(x.snippet)} |`),'');
md.push('## Firebase read/listener sites','', '| Line | Operation | Snippet |','|---:|---|---|', ...readSites.map(x=>`| ${x.line} | ${x.kind} | ${mdEscape(x.snippet)} |`),'');
md.push('## Auth / local persistence signals','',`- localStorage references: ${storage.localStorage.length}`,`- sessionStorage references: ${storage.sessionStorage.length}`,`- firebase.auth() references: ${storage.firebaseAuth.length}`,`- onAuthStateChanged references: ${storage.authState.length}`,'');
md.push('## QRIS signals','',`- root occurrences: ${qris.rootOccurrences}`,`- SJQrisSignalBeta occurrences: ${qris.engineOccurrences}`,`- pending token occurrences: ${qris.pendingOccurrences}`,`- matched token occurrences: ${qris.matchedOccurrences}`,`- ambiguous token occurrences: ${qris.ambiguousOccurrences}`,`- ensureWaitingPending occurrences: ${qris.ensureWaitingPending}`,`- cancelWaiting occurrences: ${qris.cancelWaiting}`,'');
md.push('## Function inventory by concern','');
for(const [k,v] of Object.entries(grouped)){ md.push(`### ${k}`,'',...v.slice(0,180).map(f=>`- L${f.line} \`${f.name}()\``),''); }
writeFileSync(join(OUT,'monolith-audit.md'), md.join('\n'));

const summary=[
'# SC-01 Audit Summary','',
'## Baseline freeze','',
`- Approved v1.0.40 SHA256: \`${sha256}\``,
`- Size: ${audit.baseline.bytes} bytes; ${audit.baseline.lines} lines.`,
`- ${styles.length} style blocks, ${scripts.length} script blocks, ${functionMatches.length} declared functions.`,
`- ${writeSites.length} Firebase mutation-operation tokens detected; these are inventory evidence, not permission to change them in SC-01.`,
'',
'## Structural conclusion','',
'- The application is a working but heavily layered monolith: UI, route/renderers, business logic and Firebase mutation paths coexist in one release artifact.',
'- SC-01 intentionally performs **no business extraction and no visual refinement**. `dist/index.html` remains byte-identical to v1.0.40.',
'- Highest-risk migrations for SC-02/03 are transaction finalization, QRIS pending/matching/finalization, inventory/purchase/WAC, shift ownership/closing, debt, and report evidence.',
'',
'## Exit recommendation','',
'- Proceed to SC-02 only after fresh verification confirms immutable baseline hash, build equivalence, script parse, audit generation and scaffold completeness.',
'- Do not change Firebase Rules/schema/root or add a second write engine.'
];
writeFileSync(join(DOCS,'SC01_AUDIT_SUMMARY.md'),summary.join('\n'));

const pathRows=literalFamilies.map((x,i)=>`| ${i+1} | \`${mdEscape(x)}\` | inventory only; classify authority in SC-02 |`);
const writeMap=['# SC-01 Firebase Read/Write Map','',`Detected mutation tokens: **${writeSites.length}**. Detected normalized/reference path families: **${literalFamilies.length}**.`,'','## Fixed boundaries','', '- POS root: `toko_segeranjiwa_v58`','- QRIS root: `segeranjiwa_qris_beta_v1`','- No Rules/schema/root change in SC-01.','','## Path families','','| # | Normalized expression/family | SC-01 handling |','|---:|---|---|',...pathRows,'','## Mutation sites','','| Line | Op | Source snippet |','|---:|---|---|',...writeSites.map(x=>`| ${x.line} | ${x.kind} | ${mdEscape(x.snippet)} |`),'','**SC-02 rule:** every active mutation must be assigned to exactly one repository/domain command before any legacy caller is removed.'];
writeFileSync(join(DOCS,'SC01_FIREBASE_WRITE_MAP.md'),writeMap.join('\n'));

const routeMap=['# SC-01 Route & Menu Map','', '## Canonical bottom navigation found in baseline','',...knownRoutes.bottomNavLabels.map(x=>`- ${x}`),'','## Legacy tab IDs','',...knownRoutes.tabIds.map(x=>`- \`${x}\``),'','## Route/open/render function candidates','',...knownRoutes.routeFunctions.map(x=>`- \`${x}()\``),'','## Operational route/function candidates','',...knownRoutes.operationalFunctions.map(x=>`- \`${x}()\``),'','## Report route/function candidates','',...knownRoutes.reportFunctions.map(x=>`- \`${x}()\``),'','## Modal IDs (legacy surface inventory)','',...knownRoutes.modalIds.map(x=>`- \`${x}\``),'','SC-03 must map every visible existing menu to one final renderer path; child checkout/payment flow remains under parent route **Jual**.'];
writeFileSync(join(DOCS,'SC01_ROUTE_MENU_MAP.md'),routeMap.join('\n'));

const sessionMap=['# SC-01 Auth / Session Map','',`- localStorage references: **${storage.localStorage.length}**`,`- sessionStorage references: **${storage.sessionStorage.length}**`,`- firebase.auth() references: **${storage.firebaseAuth.length}**`,`- onAuthStateChanged references: **${storage.authState.length}**`,'','## SC-01 interpretation','', '- Existing auth/session behavior remains untouched.', '- Persistent session is deferred to SC-04 after current auth modes and role/device mapping are extracted.', '- PIN/password plaintext must never be introduced into persistence.', '- Active shift state remains authoritative in Firebase/shift data; local session may later hold only a restoration hint.','','## Evidence locations','','| Type | Line | Snippet |','|---|---:|---|',...[...storage.localStorage,...storage.sessionStorage,...storage.firebaseAuth,...storage.authState].map(x=>`| ${x.kind} | ${x.line} | ${mdEscape(x.snippet)} |`)];
writeFileSync(join(DOCS,'SC01_SESSION_AUTH_MAP.md'),sessionMap.join('\n'));

const qrisMap=['# SC-01 QRIS Contract Map','', '> HIGH RISK — existing `SJQrisSignalBeta` is the migration authority; SC-01 does not rewrite it.','',`- QRIS root occurrences: **${qris.rootOccurrences}**`,`- SJQrisSignalBeta occurrences: **${qris.engineOccurrences}**`,`- pending tokens: **${qris.pendingOccurrences}**`,`- MATCHED tokens: **${qris.matchedOccurrences}**`,`- ambiguous tokens: **${qris.ambiguousOccurrences}**`,`- ensureWaitingPending occurrences: **${qris.ensureWaitingPending}**`,`- cancelWaiting occurrences: **${qris.cancelWaiting}**`,'','## Must remain true through migration','', '- pending creation/recovery remains one engine;', '- matching and active pending identity remain authoritative;', '- ambiguity cannot become false success;', '- manual fallback/cancel safety remains;', '- QR is not usable before real pending readiness;', '- no duplicate transaction finalization;', '- QRIS root remains separate from POS root.','','## Key symbols','',...qris.keySymbols.map(x=>'`'+x+'`').map(x=>'- '+x)];
writeFileSync(join(DOCS,'SC01_QRIS_CONTRACT_MAP.md'),qrisMap.join('\n'));

console.log(`SC-01 audit: ${functionMatches.length} functions, ${writeSites.length} write-site tokens, ${refinementMarkers.length} layer markers, ${literalFamilies.length} path families`);
