import test from 'node:test';
import assert from 'node:assert/strict';

import {
  installProductStockComponentsUi,
  normalizeProductStockComponentRows,
  summarizeProductStockComponents
} from '../src/ui/product-stock-components-ui.js';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

import { POS_ROOT } from '../src/data/firebase-client.js';
import { createInventoryRepository } from '../src/data/repositories/inventory-repository.js';

function fakeDb(values={}){
  const calls=[];
  return {
    calls,
    ref(path){
      return {
        once:async type=>{
          assert.equal(type,'value');
          calls.push(path);
          return {val:()=>values[path]??null};
        }
      };
    }
  };
}

test('Task 6 repository reads only targeted Inventory V2 paths',async()=>{
  const mappingPath=`${POS_ROOT}/global/inventoryV2/productStockComponents/P1`;
  const itemPath=`${POS_ROOT}/global/inventoryV2/ingredients/ING1`;
  const itemsPath=`${POS_ROOT}/global/inventoryV2/ingredients`;
  const appPath=`${POS_ROOT}/global/inventoryV2/stockApplications/APP1`;

  const db=fakeDb({
    [mappingPath]:{ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}},
    [itemPath]:{name:'Sedotan',unit:'pcs'},
    [itemsPath]:{ING1:{name:'Sedotan',unit:'pcs'}},
    [appPath]:{status:'COMPLETED'}
  });

  const repo=createInventoryRepository({db});

  assert.deepEqual(await repo.readProductStockComponents('P1'),{
    ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}
  });
  assert.deepEqual(await repo.readStockItem('ING1'),{
    name:'Sedotan',unit:'pcs'
  });
  assert.deepEqual(await repo.readStockItems(),{
    ING1:{name:'Sedotan',unit:'pcs'}
  });
  assert.deepEqual(await repo.readStockApplication('APP1'),{
    status:'COMPLETED'
  });

  assert.deepEqual(db.calls,[mappingPath,itemPath,itemsPath,appPath]);
  assert.equal(db.calls.includes(`${POS_ROOT}/global/inventoryV2`),false);
});


test('Task 6 component rows reject duplicates and non-positive quantities',()=>{
  assert.throws(()=>normalizeProductStockComponentRows([
    {stockItemId:'ING1',qtyPerUnit:1},{stockItemId:'ING1',qtyPerUnit:2}
  ]),error=>error?.code==='STOCK_COMPONENT_DUPLICATE_ITEM');
  for(const qty of [0,-1,'',null]){
    assert.throws(()=>normalizeProductStockComponentRows([
      {stockItemId:'ING1',qtyPerUnit:qty}
    ]),error=>error?.code==='STOCK_COMPONENT_QTY_REQUIRED');
  }
});

test('Task 6 summary is compact for one or multiple components',()=>{
  const items={
    ING1:{name:'Sedotan',unit:'pcs'},
    ING2:{name:'Sedotan',unit:'pcs'},
    ING3:{name:'Tutup Datar',unit:'pcs'}
  };
  assert.equal(summarizeProductStockComponents(
    {ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}},items
  ),'Sedotan ×1');
  assert.equal(summarizeProductStockComponents({
    ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true},
    ING2:{stockItemId:'ING2',qtyPerUnit:1,active:true},
    ING3:{stockItemId:'ING3',qtyPerUnit:1,active:true}
  },items),'3 item stok');
});

test('Owner can save multiple Item Stok rows only through dedicated writer',async()=>{
  let writerCalls=0;
  const opened=[];
  const ui=installProductStockComponentsUi({
    currentUserRole:'manajemen',currentLoginId:'owner-1',currentUserName:'Owner',
    __SJ_V32_INVENTORY_WORKSPACE:{legacyOpen(tab){opened.push(tab);return true;}}
  },{
    document:null,
    inventoryRepository:{
      readProductStockComponents:async()=>({ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}}),
      readStockItems:async()=>({ING1:{name:'Sedotan',unit:'pcs'},ING2:{name:'Sedotan',unit:'pcs'}})
    },
    stockComponentWriter:{saveProductComponents:async input=>{writerCalls++;return input;}}
  });
  assert.equal(ui.management(),true);
  const model=await ui.openProduct('P1');
  assert.equal(model.summary,'Sedotan ×1');
  const result=await ui.saveProduct('P1',[
    {stockItemId:'ING1',qtyPerUnit:1},{stockItemId:'ING2',qtyPerUnit:2}
  ]);
  assert.equal(writerCalls,1);
  assert.equal(result.actor.role,'manajemen');
  assert.deepEqual(Object.keys(result.components).sort(),['ING1','ING2']);
  assert.equal(ui.openStockItems(),true);
  assert.deepEqual(opened,['ingredients']);
});

test('Cashier has no Product Stock Component configuration authority',async()=>{
  let reads=0,writes=0,masterOpens=0;
  const ui=installProductStockComponentsUi({
    currentUserRole:'transaksi',
    __SJ_V32_INVENTORY_WORKSPACE:{legacyOpen(){masterOpens++;}}
  },{
    document:null,
    inventoryRepository:{
      readProductStockComponents:async()=>{reads++;return{};},
      readStockItems:async()=>{reads++;return{};}
    },
    stockComponentWriter:{saveProductComponents:async()=>{writes++;}}
  });
  await assert.rejects(ui.openProduct('P1'),error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED');
  await assert.rejects(ui.saveProduct('P1',[{stockItemId:'ING1',qtyPerUnit:1}]),error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED');
  assert.throws(()=>ui.openStockItems(),error=>error?.code==='STOCK_COMPONENT_CONFIG_OWNER_REQUIRED');
  assert.equal(reads,0);assert.equal(writes,0);assert.equal(masterOpens,0);
});

test('Task 6 UI source owns presentation but no direct Firebase mutation or bottom nav',()=>{
  const source=readFileSync(new URL('../src/ui/product-stock-components-ui.js',import.meta.url),'utf8');
  for(const copy of ['data-sj-stock-components','PEMAKAIAN STOK','Atur Pemakaian Stok','Item Stok']){
    assert.match(source,new RegExp(copy));
  }
  assert.doesNotMatch(source,/\.(?:set|update|transaction|remove)\s*\(/);
  assert.doesNotMatch(source,/bottom[-_ ]?nav/i);
});

test('Task 6 V31 Item Stok shortcut delegates to existing Inventory V2 authority',()=>{
  const source=readFileSync(new URL('../src/ui/v31-ux-polish.js',import.meta.url),'utf8');
  assert.match(source,/ensureStockItemsShortcut/);
  assert.match(source,/data-sj-v31-stock-items|sjV31StockItems/);
  assert.match(source,/legacyOpen\(['"]ingredients['"]\)/);
});


test('Task 6 installs through REF01 bootstrap after Inventory Workspace and leaves entry frozen',()=>{
  const bootstrap=readFileSync(
    new URL('../src/app/ref01-bootstrap.js',import.meta.url),
    'utf8'
  );
  const entry=readFileSync(
    new URL('../src/ref01-entry.js',import.meta.url),
    'utf8'
  );
  const headEntry=execFileSync(
    'git',
    ['show','HEAD:src/ref01-entry.js'],
    {encoding:'utf8'}
  );

  assert.equal(entry,headEntry);
  assert.doesNotMatch(
    entry,
    /product-stock-components-ui|installProductStockComponentsUi/
  );

  assert.match(
    bootstrap,
    /product-stock-components-ui\.js/
  );
  assert.match(
    bootstrap,
    /installProductStockComponentsUi\(runtime\)/
  );

  const inventoryIndex=bootstrap.indexOf(
    'let inventoryWorkspace=installInventoryWorkspaceV32(runtime);'
  );
  const componentsIndex=bootstrap.indexOf(
    'const productStockComponentsUi=installProductStockComponentsUi(runtime);'
  );

  assert.ok(inventoryIndex>=0);
  assert.ok(
    componentsIndex>inventoryIndex,
    'Product Stock Components must install after Inventory Workspace'
  );

  assert.match(
    bootstrap,
    /productStockComponentsUi\?\.refresh\?\.\(\)/
  );
  assert.match(
    bootstrap,
    /inventoryWorkspace,productStockComponentsUi,p5Packaging/
  );
});
