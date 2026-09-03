import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCupInventoryRowsV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCategoryCupMappingV34, installCupProductCostingV34 } from '../src/ui/cup-product-costing-v34.js';

test('P5 Batch-2 category mapping UI uses existing cp codes and is read-only in LOCAL QA',()=>{
  const html=renderCategoryCupMappingV34(['ES TEH','ES KEKINIAN'],[{id:'P1',c:'ES TEH',cp:'c22d'}],{readOnly:true});
  assert.match(html,/Mapping Cup per Kategori/);assert.match(html,/Cup 10 Oz/);assert.match(html,/Cup 22 Oz Datar Polos/);
  assert.match(html,/data-v34-cup-category="ES TEH"/);assert.match(html,/READ ONLY/);assert.match(html,/disabled/);
});

test('P5 Batch-2 costing installer decorates exposed recipeForProduct using existing product cp and registered Inventory V2 cup',async()=>{
  const cups=buildCupInventoryRowsV34({ingredients:{ICUP:{name:'Cup 16 Oz',unit:'pcs'}},balances:{ingredients:{ICUP:{}}}});
  const runtime={
    SJInventoryV2:{recipeForProduct:id=>({productId:id,variants:{V:{active:true,components:{TEH:10}}}})},
    __SJ_V32_INVENTORY_WORKSPACE:{cupRows:()=>cups},
    Function:()=>()=>[{id:'P1',n:'ES TEH',c:'MINUMAN',cp:'c16'}]
  };
  const api=installCupProductCostingV34(runtime,{inventoryWorkspace:runtime.__SJ_V32_INVENTORY_WORKSPACE,autoEnhance:false});
  const recipe=runtime.SJInventoryV2.recipeForProduct('P1');
  assert.equal(recipe.variants.V.components.ICUP,1);assert.equal(recipe._packagingV34.code,'c16');assert.equal(api.installed,true);
});

test('P5 Batch-2 preloads cup inventory for costing even when Bahan & Gudang was never opened',async()=>{
  const runtime={
    SJInventoryV2:{recipeForProduct:id=>({productId:id,variants:{V:{active:true,components:{TEH:10}}}})},
    Function:()=>()=>[{id:'P1',cp:'c22d'}]
  };
  const repository={readInventoryV2:async()=>({ingredients:{CUP:{name:'Cup 22 Oz Datar',unit:'pcs'}},balances:{ingredients:{CUP:{}}}})};
  const api=installCupProductCostingV34(runtime,{inventoryWorkspace:{cupRows:()=>[]},repository,autoEnhance:false});
  await api.ready;
  const recipe=runtime.SJInventoryV2.recipeForProduct('P1');
  assert.equal(recipe.variants.V.components.CUP,1);
});
