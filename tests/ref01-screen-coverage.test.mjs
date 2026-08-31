import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCREEN_CONTRACTS } from '../src/ui/screen-contracts.js';

const REQUIRED=['dashboard','sales','cart','checkout','payments','operational','shift-closing','refund-void','reports','settings','system-states'];

test('REF-01 screen contracts cover every frozen main family with real renderer selectors',()=>{
  assert.deepEqual(Object.keys(SCREEN_CONTRACTS),REQUIRED);
  for(const [family,contract] of Object.entries(SCREEN_CONTRACTS)){
    assert.ok(contract.selectors.length>=1,`${family}: selectors`);
    assert.ok(contract.authority,`${family}: authority`);
    assert.ok(contract.reference.length>=1,`${family}: reference`);
  }
});

test('REF-01 screen selectors point to real v1.0.40 surfaces except generated system-state host',()=>{
  const html=readFileSync('baseline/legacy-v1.0.40.html','utf8');
  for(const [family,contract] of Object.entries(SCREEN_CONTRACTS)){
    if(family==='system-states') continue;
    const atLeastOne=contract.selectors.some(selector=>{
      if(!selector.startsWith('#')) return true;
      const id=selector.slice(1);
      return html.includes(`id="${id}"`)||html.includes(`id='${id}'`);
    });
    assert.equal(atLeastOne,true,`${family}: no real selector found`);
  }
});

test('REF-01 runtime does not enable MutationObserver correction stacking by default',()=>{
  const source=readFileSync('src/app/ref01-bootstrap.js','utf8');
  assert.match(source,/observe\s*=\s*false/);
});
