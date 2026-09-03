import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {applySalesGridLayout} from '../src/app/ref01-bootstrap.js';
import {SETTINGS_LAYOUT} from '../src/ui/refinement-visual-contract.js';

const ROOT=path.resolve(new URL('..',import.meta.url).pathname);

test('P2 final VC01A product grid obeys sequential 2 -> 3 -> 4 layout without stale inline columns',()=>{
  const root={dataset:{}};
  const final={style:{},dataset:{}};
  const document={documentElement:root,querySelectorAll(sel){assert.match(sel,/\.sjvc01-grid/);return [final]}};
  for(const n of [2,3,4]){
    const result=applySalesGridLayout(document,n);
    assert.equal(result,1);
    assert.equal(final.dataset.sjEffectiveProductCols,String(n));
    assert.equal(final.style.gridTemplateColumns,`repeat(${n},minmax(0,1fr))`);
  }
});

test('P2 Settings keeps one grouped information architecture instead of old/new menu split',()=>{
  assert.deepEqual(Object.keys(SETTINGS_LAYOUT).filter(k=>k!=='logout'),['Toko','Akses','Tampilan & Perangkat','Sistem','Data','Zona Sensitif']);
  assert.ok(SETTINGS_LAYOUT.Toko.items.some(x=>x.label==='Bahan & Gudang'));
  assert.ok(SETTINGS_LAYOUT.Sistem.items.some(x=>x.label==='Diagnostik'));
});

test('P2 modal/touch grammar is safe for Android viewport and bottom safe-area',()=>{
  const css=fs.readFileSync(path.join(ROOT,'src/ui/ref01.css'),'utf8');
  assert.match(css,/--sj-v31-touch:44px/);
  assert.match(css,/\.overlay>\.modal\{[^}]*max-height:min\(88dvh,760px\)[^}]*overscroll-behavior:contain[^}]*safe-area-inset-bottom/s);
});

test('P2 grouped Operasional resets legacy first-card highlight and applies semantic stock treatment only',()=>{
  const css=fs.readFileSync(path.join(ROOT,'src/ui/ref01.css'),'utf8');
  assert.match(css,/\.sj-v31-op-group-grid>\.sjvc02-activity\{[^}]*background:var\(--sj-v31-surface\)/s);
  assert.match(css,/data-sj-v31-op-group="stock"[^}]*\.sjvc02-activity\{background:#f7fcf9\}/s);
});

test('P2 active UI modules do not call the old synthetic-filled icon renderer',()=>{
  for(const file of ['src/ui/settings-refinement.js','src/ui/stock-refinement.js','src/ui/v31-ux-polish.js']){
    const source=fs.readFileSync(path.join(ROOT,file),'utf8');
    assert.doesNotMatch(source,/renderFilledIcon\(/,`${file} revived synthetic filled icons`);
  }
});

test('P2 LOCAL QA state indicator exposes whether v3.1 visual grammar is actually active',()=>{
  const source=fs.readFileSync(path.join(ROOT,'scripts/local-qa-html.mjs'),'utf8');
  assert.match(source,/sjV31/);
  assert.match(source,/V31/);
});
