import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  CUP_CATALOG_V34,
  decorateRecipeWithCupV34,
  reconcileCupShiftV34,
  theoreticalCupUsageV34
} from '../src/domain/packaging-cup-v34.js';
import {
  cupSaleConsumptionV34,
  installCupProductCostingV34
} from '../src/ui/cup-product-costing-v34.js';

const read=rel=>fs.readFileSync(new URL(rel,import.meta.url),'utf8');
const runtimeSrc=read('../src/compat/legacy-stock-components-runtime.js');
const writerSrc=read('../src/data/writers/stock-component-writer.js');
const shiftSrc=read('../src/ui/cup-shift-control-v34.js');
const costingSrc=read('../src/ui/cup-product-costing-v34.js');
const buildSrc=read('../scripts/build-ref01.mjs');

test('Final authority split: Cup Control reconciles physical shift counts while Product Stock Components owns Inventory mutation',()=>{
  const theoretical=theoreticalCupUsageV34([
    {id:'T1',status:'DONE',cartData:[{id:'P1',q:4,cp:'c16'}]},
    {id:'T2',status:'VOIDED',cartData:[{id:'P1',q:9,cp:'c16'}]}
  ],[]);
  assert.equal(theoretical.c16,4);

  const recon=reconcileCupShiftV34({
    opening:{c16:20},inbound:{c16:5},closing:{c16:19},theoretical
  });
  const row=recon.rows.find(x=>x.code==='c16');
  assert.equal(recon.authority,'CUP_CONTROL');
  assert.equal(row.expectedClosing,21);
  assert.equal(row.physicalClosing,19);
  assert.equal(row.variance,-2);

  assert.match(runtimeSrc,/readProductStockComponents/);
  assert.match(runtimeSrc,/applyCompletedSale/);
  assert.match(writerSrc,/SALE_COMPONENT/);
  assert.match(writerSrc,/restore\.kind.*_COMPONENT/);
  assert.match(writerSrc,/kind:'REFUND'/);
  assert.match(writerSrc,/kind:'VOID'/);
});

test('Legacy cp no longer enters the Recipe reservation writer',()=>{
  const block=buildSrc.slice(
    buildSrc.indexOf('function patchBw02RecipeSaleIdentity'),
    buildSrc.indexOf('function patchBw02CostingSaleIdentity')
  );
  assert.ok(block.length>100);
  assert.doesNotMatch(block,/cupUsage|__SJ_V34_CUP_SALE_USAGE|cpMapped/);
  assert.match(block,/reserveRecipeConsumption\(snapshot\)/);
  assert.doesNotMatch(costingSrc,/recipeForProduct\s*=|decorateRecipeWithCupV34/);
});

test('Cup product usage remains read-only Cup Control evidence keyed by cup code',async()=>{
  const usage=cupSaleConsumptionV34([{id:'P1',cp:'c16',q:2},{id:'P2',cp:'c22d',q:3}]);
  assert.equal(usage.c16,2);
  assert.equal(usage.c22d,3);
  assert.deepEqual(Object.keys(usage).sort(),CUP_CATALOG_V34.map(x=>x.code).sort());

  const runtime={Function:()=>()=>[],document:null};
  const repository={readIngredientMasters:async()=>({}),readIngredientCosts:async()=>({})};
  const api=installCupProductCostingV34(runtime,{repository,autoEnhance:false});
  await api.ready;
  assert.equal(api.inventoryTracked,false);
  assert.equal(api.usage([{cp:'c10',q:1}]).c10,1);
});

test('Legacy recipe decoration is metadata-only and never injects Cup as a Recipe component',()=>{
  const recipe={variants:{V1:{active:true,components:{TEH:10}}}};
  const out=decorateRecipeWithCupV34(recipe,{id:'P1',cp:'c16'},[
    {code:'c16',ingredientId:'LEGACY_CUP',costKnown:true,wac:400}
  ]);
  assert.equal(out.variants.V1.components.TEH,10);
  assert.equal(out.variants.V1.components.LEGACY_CUP,undefined);
  assert.equal(out._packagingV34.code,'c16');
  assert.equal(out._packagingV34.inventoryTracked,false);
});

test('Cup Control active shift path is independent of Inventory V2 and overlap protection remains fail-closed',()=>{
  assert.match(shiftSrc,/theoreticalCupUsageV34/);
  assert.match(shiftSrc,/CUP_CONTROL/);
  assert.doesNotMatch(shiftSrc,/readInventoryV2|cupStockComponentUsageV34|buildCupOutletOpnameDraftsV34/);
  assert.match(runtimeSrc,/STOCK_COMPONENT_RECIPE_OVERLAP/);
});
