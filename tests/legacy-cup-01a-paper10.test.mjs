import test from 'node:test';
import assert from 'node:assert/strict';
import { CUP_CATALOG_V34, buildCupInventoryRowsV34, isCupIngredientMasterV34 } from '../src/domain/packaging-cup-v34.js';
import { renderCupInventorySectionV34 } from '../src/ui/inventory-workspace-v32.js';
import { renderCupOpeningPanelV34, renderCupClosingPanelV34 } from '../src/ui/cup-shift-control-v34.js';
import { renderCategoryCupMappingV34 } from '../src/ui/cup-product-costing-v34.js';

test('LEGACY-CUP-01A retains Cup Paper 10 Oz in Cup Control master but outside sale mapping',()=>{
  assert.deepEqual(CUP_CATALOG_V34.map(x=>x.code),['c10','c10p','c16','c22p','c22d','c22o']);
  const paper=CUP_CATALOG_V34.find(x=>x.code==='c10p');
  assert.equal(paper?.name,'Cup Paper 10 Oz');
  assert.equal(paper?.unit,'pcs');
  assert.equal(paper?.saleMapping,false);
  assert.equal(isCupIngredientMasterV34({name:'Paper Cup 10 Oz'}),true);
  assert.equal(isCupIngredientMasterV34({name:'Gelas Paper 10 Oz'}),true);
});

test('LEGACY-CUP-01A keeps Paper 10 Oz in shift Cup Control while excluding Cup from Inventory V2 UI',()=>{
  const cups=buildCupInventoryRowsV34({});
  assert.equal(cups.length,6,'legacy masters remain readable for compatibility/cost reference');
  assert.equal(renderCupInventorySectionV34(cups,{readOnly:true}),'','Cup cards must not be rendered in Inventory V2');
  const opening=renderCupOpeningPanelV34(cups,{readOnly:true});
  const recon={rows:CUP_CATALOG_V34.map(x=>({code:x.code,name:x.name,opening:0,restock:0,transactionUsage:0,expectedClosing:0,uncoveredUsage:0,physicalClosing:0,variance:0,status:'MATCH'}))};
  const closing=renderCupClosingPanelV34(cups,{reconciliation:recon,readOnly:true,closingValues:Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,0])),openingKnown:true});
  assert.match(opening,/data-v34-cup-opening="c10p"/);
  assert.match(closing,/data-v34-cup-closing="c10p"/);
  const mapping=renderCategoryCupMappingV34(['MINUMAN'],[],{readOnly:true});
  assert.doesNotMatch(mapping,/Cup Paper 10 Oz/);
  assert.doesNotMatch(mapping,/value="c10p"/);
});

test('LEGACY-CUP-01A Inventory V2 cup surface is deliberately empty for every catalog size',()=>{
  const rows=CUP_CATALOG_V34.map((x,i)=>({code:x.code,name:x.name,registered:true,ingredientId:`I${i}`,outletQty:1,warehouseQty:2,totalQty:3,wac:100,costKnown:true}));
  assert.equal(renderCupInventorySectionV34(rows,{readOnly:false}),'');
});
