import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeLegacyInventoryTabV32} from '../src/ui/inventory-workspace-v32.js';

const workspace=fs.readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');
const polish=fs.readFileSync(new URL('../src/ui/v31-ux-polish.js',import.meta.url),'utf8');
const psc=fs.readFileSync(new URL('../src/ui/product-stock-components-ui.js',import.meta.url),'utf8');

test('PU-05 legacy ingredients route resolves to the V3 Item Stok manager surface',()=>{
  assert.deepEqual(routeLegacyInventoryTabV32('ingredients'),{kind:'stock-items'});
  assert.match(workspace,/async function openStockItems\(\)/);
  assert.match(workspace,/openStockItems/);
  assert.match(workspace,/manager:true/);
});

test('PU-05 visible Item Stok shortcuts use only the V3 presentation authority',()=>{
  assert.match(polish,/v3\?\.openStockItems|v3\.openStockItems/);
  assert.doesNotMatch(polish,/legacyOpen\(['"]ingredients['"]\)/);
  assert.doesNotMatch(polish,/SJInventoryV2\?\.open\(['"]ingredients['"]\)/);
  assert.match(psc,/workspace\?\.openStockItems|workspace\.openStockItems/);
  assert.doesNotMatch(psc,/legacyOpen\(['"]ingredients['"]\)/);
  assert.doesNotMatch(psc,/SJInventoryV2\?\.open\(['"]ingredients['"]\)/);
});

test('PU-05 Item Stok manager keeps Cup out of the V3 operational inventory surface',()=>{
  assert.match(workspace,/filter\(row=>!isCupIngredientMasterV34\(row\?\.master\|\|row\)\)/);
});

test('PU-05 user-facing inventory copy avoids implementation jargon',()=>{
  for(const jargon of ['Pengaturan Inventori / Bahan Baku','Inventori Advanced','Writer tetap Inventory V2','writer existing']){
    assert.doesNotMatch(workspace,new RegExp(jargon.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));
  }
  assert.match(workspace,/Kelola Item Stok/);
  assert.match(workspace,/Item Stok \/ Bahan Baku/);
});
