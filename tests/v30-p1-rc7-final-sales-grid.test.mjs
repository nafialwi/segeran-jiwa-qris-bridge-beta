import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=path.resolve(new URL('..', import.meta.url).pathname);
const bootstrapUrl=pathToFileURL(path.join(ROOT,'src/app/ref01-bootstrap.js')).href;

function grid(cls){return {className:cls,style:{},dataset:{}}}

test('final VC01A sales grid is an authority target, not only legacy UI03A grid',async()=>{
  const mod=await import(`${bootstrapUrl}?rc7target=${Date.now()}`);
  const final=grid('sjvc01-grid'),older=grid('sjui03a-grid');
  const document={querySelectorAll(sel){
    assert.match(sel,/\.sjvc01-grid/,'selector must include the final VC01A grid');
    return [final,older];
  }};
  assert.equal(mod.applySalesGridLayout(document,4),2);
  assert.equal(final.style.gridTemplateColumns,'repeat(4,minmax(0,1fr))');
  assert.equal(final.dataset.sjEffectiveProductCols,'4');
});

test('local QA computed-column probe prefers final VC01A grid',()=>{
  const source=fs.readFileSync(path.join(ROOT,'scripts/local-qa-html.mjs'),'utf8');
  assert.match(source,/\.sjvc01-grid/,'QA indicator must probe the final VC01A grid');
});
