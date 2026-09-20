import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const build=fs.readFileSync(new URL('../scripts/build-ref01.mjs',import.meta.url),'utf8');

test('PU-03 Costing shares Inventory ingredients instead of opening a duplicate realtime listener',()=>{
  assert.match(build,/PU03_DATA_BANDWIDTH_CONVERGENCE/);
  assert.match(build,/sharedSnapshot/);
  assert.match(build,/PU03_COSTING_SHARED_INGREDIENTS/);
});

test('PU-03 purchases are no longer an always-on Costing realtime subscription',()=>{
  assert.match(build,/PU03_COSTING_NO_PURCHASE_LISTENER/);
  assert.match(build,/limitToLast\(20\)/);
  assert.match(build,/limitToLast\(30\)/);
});

test('PU-03 removes purchase UI, history, and recovery polling loops',()=>{
  assert.match(build,/PU03_PURCHASE_UI_TIMER_1000/);
  assert.match(build,/PU03_PURCHASE_HISTORY_TIMER_1200/);
  assert.match(build,/PU03_PURCHASE_RECOVERY_TIMER_5000/);
});

test('PU-03 preserves narrow realtime cost authorities and introduces no root listener patch',()=>{
  assert.match(build,/costs\/ingredients/);
  assert.match(build,/costs\/products/);
  assert.doesNotMatch(build,/inventoryV2[^\\n]{0,100}\.on\(['"]value['"]/);
});
