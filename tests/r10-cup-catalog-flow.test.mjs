import test from 'node:test';
import assert from 'node:assert/strict';
import { theoreticalCupUsageV34,reconcileCupClosingAuthorityV34 } from '../src/domain/packaging-cup-v34.js';
import {
  collectCupCountValuesV34,
  renderCupOpeningPanelV34,
  renderCupLiveRestockPanelV34,
  renderCupClosingPanelV34
} from '../src/ui/cup-shift-control-v34.js';
import { renderCategoryCupMappingV34,cupSaleConsumptionV34 } from '../src/ui/cup-product-costing-v34.js';

const catalog=[
  {code:'c10',name:'Cup 10 Oz',unit:'pcs',active:true,categoryDefault:true},
  {code:'cup24',name:'Cup 24 Oz',unit:'pcs',active:true,categoryDefault:true}
];

test('custom Cup participates in Opening and required physical count',()=>{
  const html=renderCupOpeningPanelV34(catalog,{values:{c10:3,cup24:7}});
  assert.match(html,/data-v34-cup-opening="cup24"/);
  assert.match(html,/Cup 24 Oz/);
  assert.equal(collectCupCountValuesV34({c10:3,cup24:7},catalog).cup24,7);
  assert.throws(()=>collectCupCountValuesV34({c10:3,cup24:''},catalog),/CUP_COUNT_REQUIRED:cup24/);
});

test('custom Cup appears in live restock and closing reconciliation',()=>{
  const restock=renderCupLiveRestockPanelV34({cup24:4},{catalog});
  assert.match(restock,/<option value="cup24">Cup 24 Oz<\/option>/);
  const recon=reconcileCupClosingAuthorityV34({
    catalog,openingKnown:true,opening:{c10:0,cup24:10},inbound:{c10:0,cup24:2},
    theoretical:{c10:0,cup24:5},closing:{c10:0,cup24:7}
  });
  const closing=renderCupClosingPanelV34(catalog,{reconciliation:recon,closingValues:{c10:0,cup24:7},restockValues:{c10:0,cup24:2}});
  assert.match(closing,/data-v34-cup-closing="cup24"/);
  assert.match(closing,/Dipakai transaksi/);
  assert.match(closing,/>5<\/strong>/);
});

test('transaction and category mapping recognize custom Cup catalog',()=>{
  const usage=theoreticalCupUsageV34([{id:'T1',status:'DONE',items:[{id:'P1',q:2}]}],[{id:'P1',cp:'cup24'}],catalog);
  assert.equal(usage.cup24,2);
  assert.equal(cupSaleConsumptionV34([{cp:'cup24',q:3}],catalog).cup24,3);
  const html=renderCategoryCupMappingV34(['MINUMAN'],[{id:'P1',c:'MINUMAN',cp:'cup24'}],{catalog});
  assert.match(html,/value="cup24" selected/);
});
