import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const buildSrc=fs.readFileSync(new URL('../scripts/build-ref01.mjs',import.meta.url),'utf8');

test('PU-02 build retires the visible legacy GELAS authority without deleting historical data',()=>{
  assert.match(buildSrc,/PU02_CUP_CONVERGENCE/);
  assert.match(buildSrc,/Cup dikelola melalui Buka\/Tutup Shift/);
  assert.match(buildSrc,/PU02_LEGACY_GELAS_TAB/);
});

test('PU-02 refund keeps a disposable Cup consumed while VOID may reverse legacy cpLaku compatibility evidence',()=>{
  assert.match(buildSrc,/PU02_REFUND_CUP_CONSUMED/);
  assert.match(buildSrc,/refunded Cup tetap dianggap terpakai/);
});
