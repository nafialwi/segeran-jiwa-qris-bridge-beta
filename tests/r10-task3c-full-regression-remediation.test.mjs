import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');

test('Checkpoint C removes superseded Inventory-backed Cup reconciliation runtime',()=>{
  const workspace=read('src/ui/inventory-workspace-v32.js');
  const css=read('src/ui/ref01.css');
  assert.doesNotMatch(workspace,/buildCupReconciliationGroups|renderCupReconciliationV1|data-r10-recon|data-r10-opname-ref/);
  assert.doesNotMatch(css,/\.sj-r10-/);
  assert.equal(fs.existsSync(new URL('../src/domain/cup-reconciliation-v1.js',import.meta.url)),false);
  assert.equal(fs.existsSync(new URL('../src/ui/cup-reconciliation-v1.js',import.meta.url)),false);
});

test('Checkpoint C keeps Cup Control separate from Inventory V2 quantity authority',()=>{
  const shift=read('src/ui/cup-shift-control-v34.js');
  const packaging=read('src/domain/packaging-cup-v34.js');
  assert.match(shift,/authority:'CUP_CONTROL'/);
  assert.match(shift,/theoreticalCupUsageV34/);
  assert.doesNotMatch(shift,/readInventoryV2|readIngredientBalances|cupStockComponentUsageV34/);
  assert.match(packaging,/Inventory V2 movements are no longer Cup Control authority/);
  assert.match(packaging,/never translated into an Inventory V2 Opname draft/);
});

test('Checkpoint C removes legacy cp from Recipe stock reservation while keeping Product Stock Components runtime',()=>{
  const build=read('scripts/build-ref01.mjs');
  const runtime=read('src/compat/legacy-stock-components-runtime.js');
  const start=build.indexOf('function patchBw02RecipeSaleIdentity');
  const end=build.indexOf('function patchBw02CostingSaleIdentity');
  const recipeBlock=build.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.match(recipeBlock,/reserveRecipeConsumption\(snapshot\)/);
  assert.doesNotMatch(recipeBlock,/cupUsage|__SJ_V34_CUP_SALE_USAGE|cpMapped/);
  assert.match(runtime,/readProductStockComponents/);
  assert.match(runtime,/applyCompletedSale/);
  assert.match(runtime,/STOCK_COMPONENT_RECIPE_OVERLAP/);
});

test('Checkpoint C Inventory workspace normal load stays bandwidth-bounded',()=>{
  const src=read('src/ui/inventory-workspace-v32.js');
  assert.doesNotMatch(src,/repository\.readInventoryV2\(\)/);
  assert.match(src,/repository\.readWorkspaceState\(\)/);
  assert.match(src,/repository\.readRecentMovements\(\{limit:120\}\)/);
  assert.doesNotMatch(src,/repository\.readMovements\(\)/);
  assert.match(src,/__SJ_INV01_READ_DIAGNOSTICS/);
});
