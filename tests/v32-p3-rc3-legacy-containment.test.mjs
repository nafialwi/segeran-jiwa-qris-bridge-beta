import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  renderInventoryActionPickerV32,
  renderInventoryProcessV32,
  routeLegacyInventoryTabV32
} from '../src/ui/inventory-workspace-v32.js';

const ingredient={id:'ING_TEA',name:'TEH',unit:'g',category:'BAHAN',outletQty:4500,warehouseQty:45500,totalQty:50000,action:'SAFE',actionLabel:'Aman',actionDetail:'Stok terkendali.',master:{}};
const product={id:'P_BAK2',name:'BAKARAN 2K',sku:'BK2',unit:'pcs',outletQty:9,warehouseQty:12,totalQty:21,itemType:'product'};

test('P3 RC3 routes visible Inventory V2 tabs into V3 presentation instead of legacy screens',()=>{
  assert.deepEqual(routeLegacyInventoryTabV32('movements'),{kind:'workspace',tab:'activity'});
  assert.deepEqual(routeLegacyInventoryTabV32('transfer'),{kind:'action',action:'transfer'});
  assert.deepEqual(routeLegacyInventoryTabV32('purchase'),{kind:'action',action:'purchase'});
  assert.deepEqual(routeLegacyInventoryTabV32('opname'),{kind:'action',action:'opname'});
  assert.deepEqual(routeLegacyInventoryTabV32('ingredients'),{kind:'workspace',tab:'more'});
  assert.deepEqual(routeLegacyInventoryTabV32('recipes'),{kind:'advanced',tab:'recipes'});
});

test('P3 RC3 uses a V3 search-first picker with explicit Bahan Baku and Barang Jadi types',()=>{
  const html=renderInventoryActionPickerV32({action:'transfer',ingredientRows:[ingredient],productRows:[product],query:'',typeFilter:'ALL'});
  assert.match(html,/Pindahkan Stok/);
  assert.match(html,/Bahan Baku/);
  assert.match(html,/Barang Jadi/);
  assert.match(html,/data-v32-action-pick="ingredient:ING_TEA"/);
  assert.match(html,/data-v32-action-pick="product:P_BAK2"/);
  assert.doesNotMatch(html,/Produk STOCK/);
  assert.doesNotMatch(html,/sjinv-transfer-item/);
});

test('P3 RC3 renders modern action forms without exposing mixed legacy selectors',()=>{
  const transfer=renderInventoryProcessV32({action:'transfer',itemType:'ingredient',row:ingredient});
  assert.match(transfer,/Gudang → Gerai/);
  assert.match(transfer,/45\.500 g/);
  assert.match(transfer,/4\.500 g/);
  assert.match(transfer,/data-v32-process-field="qty"/);
  assert.match(transfer,/data-v32-process-submit/);
  assert.doesNotMatch(transfer,/sjinv-transfer-item/);
  const purchase=renderInventoryProcessV32({action:'purchase',itemType:'product',row:product});
  assert.match(purchase,/Harga barang/);
  assert.match(purchase,/Supplier/);
  assert.match(purchase,/Dibayar dari/);
  assert.doesNotMatch(purchase,/Produk STOCK/);
  const opname=renderInventoryProcessV32({action:'opname',itemType:'product',row:product});
  assert.match(opname,/Lokasi/);
  assert.match(opname,/Jumlah fisik aktual/);
});

test('P3 RC3 contains the legacy writer host and never exposes legacy movements as primary UI',()=>{
  const source=fs.readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');
  assert.match(source,/function invokeLegacyWriter/);
  assert.match(source,/dataset\.sjV32WriterHost/);
  assert.match(source,/modal\.style\.display='none'/);
  assert.match(source,/routeLegacyInventoryTabV32/);
  assert.match(source,/value==='movements'.*activity/s);
  assert.doesNotMatch(source,/delegateLegacy\('movements'\)/);
});

test('P3 RC3 finished-goods actions route through V3 action surface before Inventory V2 writer',()=>{
  const source=fs.readFileSync(new URL('../src/ui/finished-goods-warehouse-refinement.js',import.meta.url),'utf8');
  assert.match(source,/__SJ_V32_INVENTORY_WORKSPACE/);
  assert.match(source,/openAction\?\.\('opname','product',productId/);
  assert.match(source,/openAction\?\.\('transfer','product',productId/);
  assert.match(source,/openAction\?\.\('purchase','product',productId/);
  assert.match(source,/open\?\.\('activity'\)/);
});

test('P3 RC3 visually suppresses legacy Inventory V2 chrome whenever it is used as hidden writer host',()=>{
  const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
  assert.match(css,/#modal-sjinv\[data-sj-v32-writer-host="true"\]/);
  assert.match(css,/\.sj-v32-action-picker/);
  assert.match(css,/\.sj-v32-process/);
});

test('P3 RC3 every visible ingredient management action is functional, including archive delegation',()=>{
  const source=fs.readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');
  assert.match(source,/data-v32-editor-archive/);
  assert.match(source,/function invokeLegacyIngredientArchive/);
  assert.match(source,/data-retire-ing=/);
  assert.match(source,/closest\?\.\('\[data-v32-editor-archive\]'\)/);
});
