import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const compat=readFileSync(new URL('../src/compat/legacy-cup-01b-product-cup-ui.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');

test('legacy product Cup picker is connected to runtime Cup Catalog with built-in fallback',()=>{
  assert.match(compat,/__SJ_CUP_CATALOG_V1/);
  assert.match(compat,/activeCatalog/);
  assert.match(compat,/sj:cup-catalog-changed/);
  assert.match(compat,/CUP_OPTIONS/);
});

test('Cup Catalog settings uses full-screen mobile presentation and 44px actions',()=>{
  assert.match(css,/sj-cup-catalog-page/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/width:100vw/);
  assert.match(css,/height:100dvh/);
  assert.match(css,/min-height:44px/);
});
