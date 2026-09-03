import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installP5PackagingV34 } from '../src/app/p5-packaging-bootstrap.js';

test('P5 Batch-2 packaging bootstrap composes inventory, shift and costing surfaces without new writer API',()=>{
  const runtime={};
  const api=installP5PackagingV34(runtime,{inventoryWorkspace:{installed:false}});
  assert.equal(api.version,'3.4');assert.equal('writer' in api,false);
  assert.ok(api.shiftControl);assert.ok(api.productCosting);
});

test('REF01 installs and enhances P5 packaging runtime',()=>{
  const source=fs.readFileSync(new URL('../src/app/ref01-bootstrap.js',import.meta.url),'utf8');
  assert.match(source,/installP5PackagingV34/);
  assert.match(source,/p5Packaging/);
  assert.match(source,/p5Packaging\?\.enhance/);
});
