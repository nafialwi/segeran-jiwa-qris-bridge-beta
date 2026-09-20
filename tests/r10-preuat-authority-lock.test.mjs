import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  aggregateSaleComponents,
  isProductStockItemEligible
} from '../src/domain/product-stock-components.js';
import { CUP_CATALOG_V34 } from '../src/domain/packaging-cup-v34.js';

const migrationSrc=fs.readFileSync(new URL('../scripts/r10-stock-components-migration.mjs',import.meta.url),'utf8');
const uiSrc=fs.readFileSync(new URL('../src/ui/product-stock-components-ui.js',import.meta.url),'utf8');

test('PU-01 Cup is exclusively Cup Control and cannot be a Product Stock Component',()=>{
  assert.equal(isProductStockItemEligible({id:'C16',name:'Cup 16 Oz',unit:'pcs'}),false);
  assert.equal(isProductStockItemEligible({id:'C22',name:'Cup 22 Oz Datar',unit:'pcs',cpCode:'c22d'}),false);
  assert.throws(
    ()=>aggregateSaleComponents(
      [{id:'P1',q:1}],
      {P1:{C16:{qtyPerUnit:1,active:true}}},
      {C16:{id:'C16',name:'Cup 16 Oz',unit:'pcs'}}
    ),
    error=>error?.code==='STOCK_COMPONENT_CUP_FORBIDDEN'
  );
});

test('PU-01 archived/inactive Item Stok cannot become an active Product Stock Component',()=>{
  assert.equal(isProductStockItemEligible({id:'A',name:'Sedotan',unit:'pcs',active:false}),false);
  assert.equal(isProductStockItemEligible({id:'B',name:'Susu',unit:'pcs',archived:true}),false);
  assert.equal(isProductStockItemEligible({id:'C',name:'Topping',unit:'pcs',status:'ARCHIVED'}),false);
  assert.equal(isProductStockItemEligible({id:'D',name:'Sedotan',unit:'pcs',active:true}),true);
  assert.throws(
    ()=>aggregateSaleComponents(
      [{id:'P1',q:1}],
      {P1:{A:{qtyPerUnit:1,active:true}}},
      {A:{id:'A',name:'Sedotan',unit:'pcs',active:false}}
    ),
    error=>error?.code==='STOCK_ITEM_INACTIVE'
  );
});

test('PU-01 Cup Paper 10 Oz is a valid Cup Control sale packaging option',()=>{
  const paper=CUP_CATALOG_V34.find(row=>row.code==='c10p');
  assert.ok(paper);
  assert.notEqual(paper.saleMapping,false);
});

test('PU-01 legacy cp to Product Stock Components migration is fixture-only historical audit',()=>{
  assert.match(migrationSrc,/LEGACY_CUP_MIGRATION_RETIRED/);
  assert.doesNotMatch(migrationSrc,/firebase-tools|database:get|database:set|spawnSync/);
});

test('PU-01 Product Stock Components UI filters stock items through the authority policy',()=>{
  assert.match(uiSrc,/isProductStockItemEligible/);
});
