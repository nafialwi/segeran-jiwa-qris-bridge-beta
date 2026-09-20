import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCategoryCupMappingV34, installCupProductCostingV34, cupSaleConsumptionV34 } from '../src/ui/cup-product-costing-v34.js';

test('CUP-CONTROL-V1 category mapping uses cp codes, includes Paper 10 Oz, and states Inventory decoupling',()=>{
  const html=renderCategoryCupMappingV34(['ES TEH'],[{id:'P1',c:'ES TEH',cp:'c22d'}],{readOnly:true});
  assert.match(html,/Mapping Cup per Kategori/);assert.match(html,/Cup 22 Oz Datar/);assert.match(html,/Cup Paper 10 Oz/);assert.match(html,/value="c10p"/);assert.match(html,/tidak mengurangi Inventory V2/);assert.match(html,/READ ONLY/);
});

test('CUP-CONTROL-V1 sale usage is keyed by Cup Control codes and does not mutate recipe authority',async()=>{
  const original=id=>({productId:id,variants:{V:{active:true,components:{TEH:10}}}});
  const runtime={SJInventoryV2:{recipeForProduct:original},Function};
  const repository={async readIngredientMasters(){return{ICUP:{id:'ICUP',name:'Cup 16 Oz'}}},async readIngredientCosts(){return{ICUP:{wac:450,source:'PURCHASE'}}}};
  const api=installCupProductCostingV34(runtime,{repository,autoEnhance:false});await api.ready;
  assert.equal(runtime.SJInventoryV2.recipeForProduct,original);
  assert.deepEqual({...api.usage([{id:'P1',cp:'c16',q:3}])},{c10:0,c10p:0,c16:3,c22p:0,c22d:0,c22o:0});
  assert.equal(api.costForCode('c16').unitCost,450);assert.equal(api.costForCode('c16').inventoryTracked,false);
});

test('CUP-CONTROL-V1 Cup costing reads only ingredient masters and costs, never full Inventory V2 balances',async()=>{
  let masters=0,costs=0,full=0;
  const runtime={Function};
  const repository={async readIngredientMasters(){masters++;return{CUP:{id:'CUP',name:'Cup 22 Oz Datar'}}},async readIngredientCosts(){costs++;return{CUP:{wac:500,source:'PURCHASE'}}},async readInventoryV2(){full++;throw new Error('forbidden')}};
  const api=installCupProductCostingV34(runtime,{repository,autoEnhance:false});await api.ready;
  assert.equal(masters,1);assert.equal(costs,1);assert.equal(full,0);assert.equal(api.costForCode('c22d').unitCost,500);
});

test('CUP-CONTROL-V1 cart usage ignores unknown/non-cup mappings',()=>{
  const usage=cupSaleConsumptionV34([{cp:'c16',q:2},{cp:'none',q:99},{q:2}]);assert.equal(usage.c16,2);assert.equal(Object.values(usage).reduce((a,b)=>a+b,0),2);
});
