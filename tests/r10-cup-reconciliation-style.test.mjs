import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cssPath=new URL('../src/ui/ref01.css',import.meta.url);
const css=fs.readFileSync(cssPath,'utf8');

test('R10 style contract is scoped and contains all approved reconciliation sections',()=>{
  for(const token of [
    'R10 CUP RECONCILIATION',
    '.sj-r10-cup-recon',
    '.sj-r10-kpis',
    '.sj-r10-date-group',
    '.sj-r10-date-toggle',
    '.sj-r10-recon-item',
    '.sj-r10-detail-hero',
    '.sj-r10-detail-metrics',
    '.sj-r10-reason',
    '.sj-r10-primary-action',
    '.sj-r10-timeline',
    '.sj-r10-authority-note'
  ]){
    assert.ok(css.includes(token),`missing R10 style token: ${token}`);
  }
});

test('R10 status colors remain semantic and visually distinct',()=>{
  assert.match(css,/\.sj-r10-status\.unresolved[\s\S]*?#fff0ef[\s\S]*?#b44a42/);
  assert.match(css,/\.sj-r10-status\.needs-opname[\s\S]*?#fff7dc[\s\S]*?#9a7213/);
  assert.match(css,/\.sj-r10-status\.resolved[\s\S]*?#e8f7ee[\s\S]*?#27774b/);
});

test('R10 styling remains mobile-first and date badges wrap on narrow screens',()=>{
  assert.match(css,/@media\s*\(max-width:360px\)/);
  assert.match(css,/\.sj-r10-date-badges[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(css,/min-height:\s*44px/);
});

test('R10 CSS does not introduce broad global element overrides',()=>{
  const r10Section=css.split('R10 CUP RECONCILIATION')[1]||'';
  assert.doesNotMatch(r10Section,/(^|\n)\s*(button|article|section|header|small|strong|em|span)\s*\{/);
});
