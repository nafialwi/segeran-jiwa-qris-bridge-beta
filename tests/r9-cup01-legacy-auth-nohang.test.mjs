import test from 'node:test';
import assert from 'node:assert/strict';
import { installCupProductCostingV34 } from '../src/ui/cup-product-costing-v34.js';

test('CUP-01 LEGACY mode stays bounded and only performs scoped read-only cost reference reads', async () => {
  let masterReads=0,costReads=0,fullReads=0,subscriptions=0;
  const auth={currentUser:null,onAuthStateChanged(){subscriptions++;return()=>{}}};
  const runtime={firebase:{auth:()=>auth},SJProductionArchitectureP3:{authMode:()=> 'LEGACY'},Function};
  const repository={
    async readIngredientMasters(){masterReads++;return{}},
    async readIngredientCosts(){costReads++;return{}},
    async readInventoryV2(){fullReads++;throw new Error('full Inventory V2 read forbidden for Cup costing')}
  };
  const api=installCupProductCostingV34(runtime,{repository,autoEnhance:false});
  const resolved=await Promise.race([api.ready.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),100))]);
  assert.equal(resolved,true);
  assert.equal(masterReads,1);assert.equal(costReads,1);assert.equal(fullReads,0);assert.equal(subscriptions,0);
});
