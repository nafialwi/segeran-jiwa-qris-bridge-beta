import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('final close uses visible shift cash difference as note authority',()=>{
  const src=fs.readFileSync(new URL('../scripts/build-ref01.mjs',import.meta.url),'utf8');
  assert.match(src,/R10_UAT_CLOSE_SHIFT_AUTHORITY/);
  assert.match(src,/if\(shiftDiff!==0&&!note\)throw/);
});

test('mobile receipt uses the full success surface and gives PDF action the shared design system',()=>{
  const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
  assert.match(css,/R10 UAT final receipt convergence/);
  assert.match(css,/\.sjvc011-success\{[^}]*height:100%/s);
  assert.match(css,/\.sjvc011-success-card\{[^}]*flex:1 1 auto/s);
  assert.match(css,/\.sjvc011-success-pdf\{[^}]*grid-column:1\/-1/s);
});