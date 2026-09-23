import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderCupOpeningPanelV34,renderCupClosingPanelV34 } from '../src/ui/cup-shift-control-v34.js';
const catalog=[{code:'c10',name:'Cup 10 Oz'}];
test('Cup Opening carries explicit shift context so S1 draft cannot be reused by S2',()=>{
  const html=renderCupOpeningPanelV34(catalog,{values:{c10:8},contextKey:'2026-09-23-S2'});
  assert.match(html,/data-v34-shift-context="2026-09-23-S2"/);
});
test('Cup Closing carries shift plus session context',()=>{
  const html=renderCupClosingPanelV34(catalog,{contextKey:'2026-09-23-S2|SES-S2',reconciliation:{rows:[{code:'c10',opening:8,restock:0,transactionUsage:1,physicalUsed:1,physicalClosing:7,expectedClosing:7,variance:0,status:'MATCH'}]},closingValues:{c10:7}});
  assert.match(html,/data-v34-shift-context="2026-09-23-S2\|SES-S2"/);
});
test('runtime source rejects stale opening and stale closing panel context',()=>{
  const src=readFileSync(new URL('../src/ui/cup-shift-control-v34.js',import.meta.url),'utf8');
  assert.match(src,/sameContext=existing\?\.dataset\?\.v34ShiftContext===contextKey/);
  assert.match(src,/panel\?\.dataset\?\.v34ShiftContext===expected/);
  assert.match(src,/closeContext=null/);
});
