import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const psc=fs.readFileSync(new URL('../src/ui/product-stock-components-ui.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
const cup=fs.readFileSync(new URL('../src/compat/legacy-cup-01b-product-cup-ui.js',import.meta.url),'utf8');

test('PU-04 Product Stock Components mounts inside the Edit Product modal card, never as overlay sibling',()=>{
  assert.match(psc,/querySelector\?\.\('\.modal'\)/);
  assert.match(psc,/host\.insertBefore/);
  assert.doesNotMatch(psc,/surface\.appendChild\?\.\(section\)/);
});

test('PU-04 component editor has a dedicated accessible overlay layer and responsive CSS',()=>{
  assert.match(psc,/sj-stock-components-editor-layer/);
  assert.match(psc,/role.*dialog|setAttribute\?\.\('role','dialog'\)/);
  for(const selector of [
    '.sj-stock-components-summary',
    '.sj-stock-components-editor-layer',
    '.sj-stock-components-editor-card',
    '.sj-stock-component-row',
    '.sj-stock-components-editor-actions'
  ]) assert.ok(css.includes(selector),selector);
});

test('PU-04 avoids ambiguous master-stock buttons inside product editing flow',()=>{
  assert.match(psc,/\+ Tambah Komponen/);
  assert.doesNotMatch(psc,/data-sj-stock-items-master/);
  assert.doesNotMatch(psc,/data-sj-stock-master/);
});

test('PU-04 editor discards stale async product loads and exposes loading/error summary states',()=>{
  assert.match(psc,/editorRequestSeq/);
  assert.match(psc,/requestId!==editorRequestSeq/);
  assert.match(psc,/Memuat/);
  assert.match(psc,/Tidak dapat dimuat/);
});

test('PU-04 Cup selector is compact/mobile-native instead of rendering all cup cards inline',()=>{
  assert.match(cup,/sj-product-cup-select/);
  assert.doesNotMatch(cup,/sj-product-cup-grid/);
  assert.doesNotMatch(cup,/sj-product-cup-option/);
});
