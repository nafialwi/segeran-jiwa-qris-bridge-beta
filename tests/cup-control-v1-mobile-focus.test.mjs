import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src=readFileSync(new URL('../src/ui/cup-shift-control-v34.js',import.meta.url),'utf8');

test('CUP-CONTROL-V1 mobile closing keeps Restock/Physical nodes stable during live reconciliation',()=>{
  assert.match(src,/function syncCupClosingPanelInPlaceV34\(/);
  assert.match(src,/modal\.__sjV34CupClosingInputSeq/);
  assert.match(src,/recon\.innerHTML=nextRecon\.innerHTML/);
  assert.match(src,/\[data-v34-cup-closing\],\[data-v34-cup-restock\]/);
  assert.doesNotMatch(src,/current\.outerHTML=renderCupClosingPanelV34/);
});

test('CUP-CONTROL-V1 mobile focus hotfix is mutation-policy clean and updates derived UI only',()=>{
  const start=src.indexOf('function syncCupClosingPanelInPlaceV34');
  const end=src.indexOf('export function applyReadOnlyShiftActionStateV34');
  assert.ok(start>=0&&end>start);
  const helper=src.slice(start,end);
  assert.match(helper,/\.sj-v34-cup-recon/);
  assert.match(helper,/data-v34-cup-uncovered/);
  assert.match(helper,/\.sj-v34-cup-reason/);
  assert.match(helper,/removeChild/);
  assert.doesNotMatch(helper,/\.remove\s*\(/);
  assert.doesNotMatch(helper,/\.(?:set|update|transaction|remove)\s*\(/);
  assert.doesNotMatch(helper,/outerHTML\s*=/);
  assert.doesNotMatch(helper,/\.value\s*=/);
});
