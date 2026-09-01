import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const locked=path.join(root,'src','assets','icons','locked');
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]):[];

test('v2.8 ships exactly the 61 locked B01-B05 production SVG assets and excludes B06',()=>{
  const svgs=walk(locked).filter(f=>f.endsWith('.svg'));
  assert.equal(svgs.length,61);
  assert.equal(svgs.some(f=>/batch.?06|authority.only|inventory.stock/i.test(f)),false);
  assert.ok(fs.existsSync(path.join(locked,'outline','core','refresh.svg')));
});

test('v2.8 bottom navigation owns five outline and five dedicated active locked SVGs',()=>{
  const names=['home','operations','point-of-sale','reports','settings'];
  for(const name of names){
    assert.ok(fs.existsSync(path.join(locked,'outline','navigation',`${name}.svg`)),`missing outline ${name}`);
    assert.ok(fs.existsSync(path.join(locked,'active','navigation',`${name}.svg`)),`missing active ${name}`);
  }
});

test('v2.8 icon rendering uses locked asset authority and never generic warehouse-box fallback or synthetic filled nav state',()=>{
  const iconAuthority=fs.readFileSync(path.join(root,'src','ui','icon-authority.js'),'utf8');
  const nav=fs.readFileSync(path.join(root,'src','ui','bottom-nav.js'),'utf8');
  assert.match(iconAuthority,/locked-icon-registry/);
  assert.doesNotMatch(iconAuthority,/warehouse-box/);
  assert.match(nav,/renderLockedIcon/);
  assert.doesNotMatch(nav,/renderFilledIcon/);
});

test('v2.8 locked icon guard exists and is wired into verify:ref01',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.ok(fs.existsSync(path.join(root,'scripts','verify-v28-icons.mjs')));
  assert.match(pkg.scripts['verify:ref01']||'',/verify-v28-icons/);
});

test('missing semantic icon never falls back to cube or warehouse-box', async()=>{
  const { renderIcon }=await import('../src/ui/icons.js');
  const html=renderIcon('__definitely_missing_v28_icon__',{size:20});
  assert.equal(html,'');
});
