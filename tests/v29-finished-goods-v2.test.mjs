import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  endingStockDecision,
  buildFinishedGoodsRows,
  filterFinishedGoodsRows
} from '../src/domain/finished-goods-stock.js';
import {
  renderFinishedGoodsHubView,
  installFinishedGoodsWarehouseRefinement
} from '../src/ui/finished-goods-warehouse-refinement.js';

const products=[
  {id:'P1',n:'JASJUS 1.000',sku:'SJ-MT1389FM',trackStock:true},
  {id:'P2',n:'ES TEH 2K',sku:'SJ-TEH2',trackStock:true}
];

test('v2.9 finished-goods read model keeps Gudang and Gerai balances separate and searchable',()=>{
  const rows=buildFinishedGoodsRows(products,{warehouse:{P1:50,P2:9},outlet:{P1:70,P2:21}});
  assert.deepEqual(rows.map(x=>[x.id,x.warehouseQty,x.outletQty]),[['P1',50,70],['P2',9,21]]);
  assert.deepEqual(filterFinishedGoodsRows(rows,'jas').map(x=>x.id),['P1']);
  assert.deepEqual(filterFinishedGoodsRows(rows,'SJ-TEH2').map(x=>x.id),['P2']);
  assert.deepEqual(filterFinishedGoodsRows(rows,'P1').map(x=>x.id),['P1']);
});

test('v2.9 finished-goods hub has Gudang Gerai Pergerakan tabs search and clearly separated balances without product dropdown',()=>{
  const rows=buildFinishedGoodsRows(products,{warehouse:{P1:50},outlet:{P1:70}});
  const html=renderFinishedGoodsHubView({role:'owner',tab:'warehouse',rows,query:''});
  for(const token of ['data-v29-fg-tab="warehouse"','data-v29-fg-tab="outlet"','data-v29-fg-tab="movement"','Cari produk','Gudang','Gerai','Set Stok Gudang','Transfer ke Gerai','Pembelian (Advanced)','Laporkan Masalah'])assert.ok(html.includes(token),token);
  assert.ok(html.includes('JASJUS 1.000'));
  assert.match(html,/Gudang[\s\S]*50/);
  assert.match(html,/Gerai[\s\S]*70/);
  assert.doesNotMatch(html,/<select[^>]*data-v29-fg-product/i);
});

test('v2.9 owner product actions delegate to existing Inventory V2 and preselect product/location',()=>{
  const calls=[];
  const fields={
    'sjinv-opname-item':{value:'',dispatchEvent(){calls.push(['change','opname-item',this.value])}},
    'sjinv-opname-loc':{value:'outlet',dispatchEvent(){calls.push(['change','opname-loc',this.value])}},
    'sjinv-transfer-item':{value:'',dispatchEvent(){calls.push(['change','transfer-item',this.value])}},
    'sjinv-purchase-item':{value:'',dispatchEvent(){calls.push(['change','purchase-item',this.value])}}
  };
  const runtime={
    __SJ_SC03_RUNTIME:{guard:{currentRole:()=> 'owner'}},
    SJInventoryV2:{open:tab=>calls.push(['open',tab])},
    setTimeout:fn=>fn(),
    document:{getElementById:id=>fields[id]||null,querySelector(){return null},querySelectorAll(){return []}}
  };
  const api=installFinishedGoodsWarehouseRefinement(runtime);
  api.openWarehouseOpname('P1');
  assert.deepEqual(calls.slice(0,3),[['open','opname'],['change','opname-item','P:P1'],['change','opname-loc','warehouse']]);
  calls.length=0;
  api.openTransferForProduct('P2');
  assert.deepEqual(calls.slice(0,2),[['open','transfer'],['change','transfer-item','P:P2']]);
  calls.length=0;
  api.openAdvancedPurchase('P1');
  assert.deepEqual(calls.slice(0,2),[['open','purchase'],['change','purchase-item','P:P1']]);
});

test('v2.9 exception draft copy is truthful: no persistent approval queue and no automatic mutation',()=>{
  const d=endingStockDecision({productId:'P1',productName:'JASJUS 1.000',systemQty:70,countedQty:68,disposition:'EXCEPTION',reason:'RUSAK',reportedBy:'Kasir'});
  assert.equal(d.mutationAllowed,false);
  assert.equal(d.authority,'INVENTORY_V2_OPNAME');
  assert.match(d.whatsappText,/BELUM MENGUBAH STOK/);
  assert.match(d.whatsappText,/rekonsiliasi/i);
  assert.doesNotMatch(d.whatsappText,/MENUNGGU PERSETUJUAN OWNER/i);
  const src=fs.readFileSync('src/ui/finished-goods-warehouse-refinement.js','utf8');
  assert.ok(src.includes('Draft ini belum mengubah stok'));
  assert.ok(src.includes('data-v29-stock-search'));
  assert.ok(src.includes('data-v29-stock-results'));
  assert.doesNotMatch(src,/<select data-v28-stock-product>/);
  assert.doesNotMatch(src,/\.(set|update|transaction|remove)\s*\(/);
});

test('v2.9 Operasional card is concise and mobile activity grid is two columns',()=>{
  const src=fs.readFileSync('src/ui/finished-goods-warehouse-refinement.js','utf8');
  const css=fs.readFileSync('src/ui/ref01.css','utf8');
  assert.ok(src.includes('<b>Stok Barang Jadi</b><span>Gudang &amp; Gerai</span>'));
  assert.doesNotMatch(src,/<b>Stok Barang Jadi<\/b><span>Gudang → Gerai → Penjualan<\/span>/);
  assert.match(css,/@media\(max-width:767px\)[\s\S]*\.sjvc02-activities\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
