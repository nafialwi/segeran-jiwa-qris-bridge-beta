import { readFileSync,readdirSync,statSync,existsSync } from 'node:fs';
import { dirname,join,relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESENTATION_AUTHORITIES } from '../src/ui/presentation-authority.js';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const violations=[];
const add=(code,detail)=>violations.push({code,detail});
function walk(dir){if(!existsSync(dir))return[];const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else out.push(p)}return out}
const uiFiles=walk(join(ROOT,'src','ui')).filter(x=>x.endsWith('.js'));
const bootstrap=readFileSync(join(ROOT,'src','app','ref01-bootstrap.js'),'utf8');
const entry=readFileSync(join(ROOT,'src','ref01-entry.js'),'utf8');
if(Object.keys(PRESENTATION_AUTHORITIES).length!==10)add('AUTHORITY_COUNT',String(Object.keys(PRESENTATION_AUTHORITIES).length));
for(const [surface,contract] of Object.entries(PRESENTATION_AUTHORITIES)){if(!contract?.owner||!contract?.selector)add('AUTHORITY_INCOMPLETE',surface)}
if(/MutationObserver/.test(bootstrap))add('BROAD_MUTATION_OBSERVER','ref01-bootstrap.js');
if(/observe\s*:\s*true/.test(entry))add('OBSERVER_OPT_IN_ENTRY','src/ref01-entry.js');
for(const file of uiFiles){const text=readFileSync(file,'utf8');if(/document\.addEventListener\s*\(\s*['"]click['"]/.test(text))add('DOCUMENT_GLOBAL_CLICK',relative(ROOT,file))}
const cssFiles=walk(join(ROOT,'src','ui')).filter(x=>x.endsWith('.css'));let importantCount=0;const importantFiles=[];
for(const file of cssFiles){const text=readFileSync(file,'utf8'),count=(text.match(/!important\b/g)||[]).length;if(count){importantCount+=count;importantFiles.push([relative(ROOT,file),count])}}
if(importantCount>252)add('IMPORTANT_BUDGET_GROWTH',`${importantCount}>252`);
if(importantFiles.some(([file])=>file!=='src/ui/ref01.css'))add('IMPORTANT_OUTSIDE_CONTAINMENT',importantFiles.map(x=>x.join(':')).join(','));
const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
const [maj,min,pat]=String(pkg.version||'0.0.0').split('.').map(x=>Number(x)||0);
if(maj<3)add('PACKAGE_VERSION_FLOOR',pkg.version);
if(!pkg.scripts?.['qa:local']?.includes('SJ_LOCAL_QA=1'))add('LOCAL_QA_COMMAND','missing');
if(!pkg.scripts?.['verify:ref01']?.includes('verify:v30:presentation'))add('VERIFY_CHAIN','verify:v30:presentation missing');
const server=readFileSync(join(ROOT,'scripts','dev-server.mjs'),'utf8');
if(!server.includes('dist-ref01')||!server.includes('SJ_LOCAL_QA')||!server.includes('LOCAL QA'))add('LOCAL_QA_SERVER','incomplete');
console.log(`v3.0 presentation authority: ${Object.keys(PRESENTATION_AUTHORITIES).length} surfaces; broad MutationObserver 0; document-global click 0; !important budget ${importantCount}/252`);
if(violations.length){for(const v of violations)console.error(`VIOLATION ${v.code}: ${v.detail}`);process.exit(1)}
console.log('v3.0 presentation containment PASS');
