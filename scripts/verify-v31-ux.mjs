import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveLockedIcon} from '../src/ui/locked-icon-registry.js';
import {VISUAL_ICON_MAP} from '../src/ui/refinement-visual-contract.js';

const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors=[];
const add=(code,msg)=>errors.push(`${code}: ${msg}`);
const required=new Set([
  ...Object.values(VISUAL_ICON_MAP),
  'camera','trash','crown','check-circle','offline','chevron','shield-alert',
  'warehouse','warning-triangle','x-circle','activity','receipt','search','refresh',
  'home','sale','operations','reports','settings'
]);
for(const name of [...required].sort())if(!resolveLockedIcon(name))add('ICON_NOT_LOCKED',name);

const sourceRoots=['src/ui','src/app'];
const literalIcons=new Set();
for(const rel of sourceRoots){
  const dir=path.join(ROOT,rel);
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(!ent.isFile()||!ent.name.endsWith('.js'))continue;
    const file=path.join(dir,ent.name),source=fs.readFileSync(file,'utf8');
    for(const match of source.matchAll(/renderIcon\(\s*['"]([^'"]+)['"]/g))literalIcons.add(match[1]);
    if(ent.name!=='icons.js'&&source.includes('renderFilledIcon('))add('SYNTHETIC_FILLED_USAGE',`${rel}/${ent.name}`);
  }
}
for(const name of [...literalIcons].sort())if(!resolveLockedIcon(name))add('LITERAL_ICON_NOT_LOCKED',name);
const settings=fs.readFileSync(path.join(ROOT,'src/ui/settings-refinement.js'),'utf8');
if(settings.includes('renderFilledIcon'))add('SETTINGS_LOCAL_ICON_FAMILY','renderFilledIcon remains');
const stock=fs.readFileSync(path.join(ROOT,'src/ui/stock-refinement.js'),'utf8');
if(stock.includes('renderFilledIcon'))add('STOCK_LOCAL_ICON_FAMILY','renderFilledIcon remains');
const css=fs.readFileSync(path.join(ROOT,'src/ui/ref01.css'),'utf8');
const important=(css.match(/!important/g)||[]).length;
if(important>252)add('IMPORTANT_BUDGET',`${important} > 252`);
for(const token of ['--sj-v31-bg','--sj-v31-surface','--sj-v31-green','--sj-v31-radius-card','--sj-v31-touch'])if(!css.includes(token))add('TOKEN_MISSING',token);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`V3.1 UX guard PASS: ${required.size} semantic icons + ${literalIcons.size} literal renderIcon calls locked; no active synthetic-filled usage; !important ${important}/252; visual tokens present.`);
