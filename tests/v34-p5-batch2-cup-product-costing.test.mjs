import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCupInventoryRowsV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCategoryCupMappingV34, installCupProductCostingV34 } from '../src/ui/cup-product-costing-v34.js';

test('P5 Batch-2 category mapping UI uses existing cp codes and is read-only in LOCAL QA',()=>{
  const html=renderCategoryCupMappingV34(['ES TEH','ES KEKINIAN'],[{id:'P1',c:'ES TEH',cp:'c22d'}],{readOnly:true});
  assert.match(html,/Mapping Cup per Kategori/);assert.match(html,/Cup 10 Oz/);assert.match(html,/Cup 22 Oz Datar Polos/);
  assert.doesNotMatch(html,/Cup Paper 10 Oz/,'Cup Paper 10 Oz must stay outside sale mapping until explicitly mapped later');
  assert.doesNotMatch(html,/value="c10p"/);
  assert.match(html,/data-v34-cup-category="ES TEH"/);assert.match(html,/READ ONLY/);assert.match(html,/disabled/);
});

test('Task 10 costing installer keeps genuine Recipe unchanged; cup is no longer injected into Recipe',async()=>{
  const cups=buildCupInventoryRowsV34({ingredients:{ICUP:{name:'Cup 16 Oz',unit:'pcs'}},balances:{ingredients:{ICUP:{}}}});
  const runtime={
    SJInventoryV2:{recipeForProduct:id=>({productId:id,variants:{V:{active:true,components:{TEH:10}}}})},
    __SJ_V32_INVENTORY_WORKSPACE:{cupRows:()=>cups},
    Function:()=>()=>[{id:'P1',n:'ES TEH',c:'MINUMAN',cp:'c16'}]
  };
  const api=installCupProductCostingV34(runtime,{inventoryWorkspace:runtime.__SJ_V32_INVENTORY_WORKSPACE,autoEnhance:false});
  const recipe=runtime.SJInventoryV2.recipeForProduct('P1');
  assert.equal(recipe.variants.V.components.TEH,10);assert.equal(recipe.variants.V.components.ICUP,undefined);assert.equal(recipe._packagingV34,undefined);assert.equal(api.installed,true);
});

test('P5 Batch-2 still preloads cup inventory for legacy cp observability without mutating Recipe',async()=>{
  const runtime={
    SJInventoryV2:{recipeForProduct:id=>({productId:id,variants:{V:{active:true,components:{TEH:10}}}})},
    Function:()=>()=>[{id:'P1',cp:'c22d'}]
  };
  const repository={readInventoryV2:async()=>({ingredients:{CUP:{name:'Cup 22 Oz Datar',unit:'pcs'}},balances:{ingredients:{CUP:{}}}})};
  const api=installCupProductCostingV34(runtime,{inventoryWorkspace:{cupRows:()=>[]},repository,autoEnhance:false});
  await api.ready;
  const recipe=runtime.SJInventoryV2.recipeForProduct('P1');
  assert.equal(recipe.variants.V.components.CUP,undefined);
  assert.deepEqual({...runtime.__SJ_V34_CUP_SALE_USAGE([{id:'P1',cp:'c22d',q:2}])},{CUP:2});
});
