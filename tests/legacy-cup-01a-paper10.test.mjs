import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUP_CATALOG_V34,
  buildCupInventoryRowsV34,
  isCupIngredientMasterV34
} from '../src/domain/packaging-cup-v34.js';
import { renderCupInventorySectionV34, renderCupInitialSetupV34 } from '../src/ui/inventory-workspace-v32.js';
import { renderCupOpeningPanelV34, renderCupClosingPanelV34 } from '../src/ui/cup-shift-control-v34.js';
import { renderCategoryCupMappingV34 } from '../src/ui/cup-product-costing-v34.js';

test('LEGACY-CUP-01A adds Cup Paper 10 Oz as sixth stock-controlled cup',()=>{
  assert.deepEqual(CUP_CATALOG_V34.map(x=>x.code),['c10','c10p','c16','c22p','c22d','c22o']);
  const paper=CUP_CATALOG_V34.find(x=>x.code==='c10p');
  assert.equal(paper?.name,'Cup Paper 10 Oz');
  assert.equal(paper?.unit,'pcs');
  assert.equal(paper?.saleMapping,false);
  assert.equal(isCupIngredientMasterV34({name:'Paper Cup 10 Oz'}),true);
  assert.equal(isCupIngredientMasterV34({name:'Gelas Paper 10 Oz'}),true);
});

test('LEGACY-CUP-01A exposes Paper 10 Oz in inventory/opening/closing without sale mapping',()=>{
  const cups=buildCupInventoryRowsV34({});
  assert.equal(cups.length,6);
  const paper=cups.find(x=>x.code==='c10p');
  assert.equal(paper?.registered,false);
  const inv=renderCupInventorySectionV34(cups,{readOnly:true});
  const setup=renderCupInitialSetupV34(cups,{readOnly:true});
  const opening=renderCupOpeningPanelV34(cups,{readOnly:true});
  const recon={rows:CUP_CATALOG_V34.map(x=>({code:x.code,name:x.name,opening:0,inbound:0,closing:0,physicalUsed:0,theoreticalUsed:0,variance:0}))};
  const closing=renderCupClosingPanelV34(cups,{reconciliation:recon,readOnly:true,closingValues:Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,0])),openingKnown:true});
  assert.match(inv,/Cup Paper 10 Oz/);
  assert.match(setup,/data-v34-cup-setup-row="c10p"/);
  assert.match(setup,/6 jenis cup/);
  assert.match(opening,/data-v34-cup-opening="c10p"/);
  assert.match(closing,/data-v34-cup-closing="c10p"/);
  const mapping=renderCategoryCupMappingV34(['MINUMAN'],[],{readOnly:true});
  assert.doesNotMatch(mapping,/Cup Paper 10 Oz/);
  assert.doesNotMatch(mapping,/value="c10p"/);
});

test('LEGACY-CUP-01A all-ready label follows catalog size instead of frozen five-cup text',()=>{
  const rows=CUP_CATALOG_V34.map((x,i)=>({code:x.code,name:x.name,registered:true,ingredientId:`I${i}`,outletQty:1,warehouseQty:2,totalQty:3,wac:100,costKnown:true}));
  const html=renderCupInventorySectionV34(rows,{readOnly:false});
  assert.match(html,/6 master cup siap/);
  assert.doesNotMatch(html,/5 master cup siap/);
});
