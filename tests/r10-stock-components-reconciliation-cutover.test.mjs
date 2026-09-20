import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildCupInventoryRowsV34,
  cupStockComponentUsageV34,
  reconcileCupShiftV34,
  theoreticalCupUsageV34
} from '../src/domain/packaging-cup-v34.js';
import { installCupProductCostingV34 } from '../src/ui/cup-product-costing-v34.js';

const runtimeSrc=fs.readFileSync(new URL('../src/compat/legacy-stock-components-runtime.js',import.meta.url),'utf8');
const shiftSrc=fs.readFileSync(new URL('../src/ui/cup-shift-control-v34.js',import.meta.url),'utf8');
const costingSrc=fs.readFileSync(new URL('../src/ui/cup-product-costing-v34.js',import.meta.url),'utf8');

test('Task 10 uses completed Product Stock Component movements as current cup usage authority',()=>{
  const cups=buildCupInventoryRowsV34({
    ingredients:{C16:{id:'C16',name:'Cup 16 Oz',unit:'pcs'}},
    balances:{ingredients:{C16:{outlet:19,warehouse:100}}}
  });
  const raw={
    stockApplications:{
      APP1:{id:'APP1',status:'COMPLETED'}
    },
    movements:{
      T1:{itemType:'ingredient',itemId:'C16',type:'TRANSFER_IN',location:'outlet',delta:5,shift:'2026-09-20-S1',ts:1100},
      S1:{itemType:'ingredient',itemId:'C16',type:'SALE_COMPONENT',location:'outlet',delta:-7,shift:'2026-09-20-S1',ts:1200,applicationId:'APP1'},
      R1:{itemType:'ingredient',itemId:'C16',type:'REFUND_COMPONENT',location:'outlet',delta:2,shift:'2026-09-20-S1',ts:1300,applicationId:'APP1'},
      V1:{itemType:'ingredient',itemId:'C16',type:'VOID_COMPONENT',location:'outlet',delta:1,shift:'2026-09-20-S1',ts:1400,applicationId:'APP1'},
      OTHER:{itemType:'ingredient',itemId:'C16',type:'SALE_COMPONENT',location:'outlet',delta:-99,shift:'2026-09-20-S2',ts:1500,applicationId:'APP1'}
    }
  };
  const authority=cupStockComponentUsageV34(raw,cups,'2026-09-20-S1',{startTs:1000,endTs:2000});
  assert.equal(authority.sales.c16,7);
  assert.equal(authority.restores.c16,3);
  assert.equal(authority.netUsage.c16,4);
  assert.equal(authority.authority,'PRODUCT_STOCK_COMPONENTS');

  const recon=reconcileCupShiftV34({
    opening:{c16:20},
    inbound:{c16:5},
    closing:{c16:19},
    theoretical:authority.netUsage,
    usageAuthority:authority.authority
  });
  const row=recon.rows.find(x=>x.code==='c16');
  assert.equal(row.expectedClosing,21);
  assert.equal(row.physicalClosing,19);
  assert.equal(row.variance,-2);
  assert.equal(recon.usageAuthority,'PRODUCT_STOCK_COMPONENTS');
});

test('Task 10 fails closed on component movement whose application is not completed',()=>{
  const cups=buildCupInventoryRowsV34({
    ingredients:{C16:{id:'C16',name:'Cup 16 Oz',unit:'pcs'}},
    balances:{ingredients:{C16:{}}}
  });
  assert.throws(()=>cupStockComponentUsageV34({
    stockApplications:{APP1:{status:'CLAIMED'}},
    movements:{S1:{itemType:'ingredient',itemId:'C16',type:'SALE_COMPONENT',location:'outlet',delta:-1,shift:'2026-09-20-S1',applicationId:'APP1'}}
  },cups,'2026-09-20-S1'),/STOCK_COMPONENT_APPLICATION_EVIDENCE_REQUIRED/);
});

test('Task 10 keeps legacy cp history readable but does not make it current physical authority',()=>{
  const old=theoreticalCupUsageV34([{status:'DONE',cartData:[{id:'P1',q:3,cp:'c16'}]}],[]);
  assert.equal(old.c16,3);

  const cups=buildCupInventoryRowsV34({
    ingredients:{C16:{id:'C16',name:'Cup 16 Oz',unit:'pcs'}},
    balances:{ingredients:{C16:{}}}
  });
  const current=cupStockComponentUsageV34({movements:{},stockApplications:{}},cups,'2026-09-20-S1');
  assert.equal(current.netUsage.c16,0);
});

test('Task 10 active costing no longer injects cup into Recipe; overlap guard remains fail-closed',async()=>{
  const cups=buildCupInventoryRowsV34({
    ingredients:{C16:{id:'C16',name:'Cup 16 Oz',unit:'pcs'}},
    balances:{ingredients:{C16:{}}}
  });
  const runtime={
    SJInventoryV2:{recipeForProduct:id=>({productId:id,variants:{V:{active:true,components:{TEH:10}}}})},
    __SJ_V32_INVENTORY_WORKSPACE:{cupRows:()=>cups},
    Function:()=>()=>[{id:'P1',cp:'c16'}]
  };
  const api=installCupProductCostingV34(runtime,{inventoryWorkspace:runtime.__SJ_V32_INVENTORY_WORKSPACE,autoEnhance:false});
  await api.ready;
  const recipe=runtime.SJInventoryV2.recipeForProduct('P1');
  assert.equal(recipe.variants.V.components.TEH,10);
  assert.equal(recipe.variants.V.components.C16,undefined);
  assert.equal(recipe._packagingV34,undefined);
  assert.match(runtimeSrc,/STOCK_COMPONENT_RECIPE_OVERLAP/);
});


test('Task 10 active callers are cut over without deleting historical helpers',()=>{
  assert.match(shiftSrc,/cupStockComponentUsageV34/);
  assert.doesNotMatch(shiftSrc,/theoreticalCupUsageV34/);
  assert.doesNotMatch(costingSrc,/decorateRecipeWithCupV34/);
  assert.match(runtimeSrc,/STOCK_COMPONENT_RECIPE_OVERLAP/);
});
