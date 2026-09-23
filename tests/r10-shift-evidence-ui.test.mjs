import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderCupShiftEvidenceDetail,renderStockShiftEvidenceDetail,renderClosedShiftEvidenceCards} from '../src/ui/shift-evidence-v1.js';

test('closed shift cards expose Cup history immediately and stock evidence separately',()=>{
  const row={cupControl:{reconciliation:{rows:[
    {name:'Cup 22 Oz',status:'MATCH',physicalUsed:5,physicalClosing:10},
    {name:'Cup 10 Oz',status:'SHORTAGE',physicalUsed:2,physicalClosing:3}
  ]}},stockEvidence:{summary:{trackedCount:4,soldTotal:9,attentionCount:1,rows:{}}}};
  const html=renderClosedShiftEvidenceCards(row);
  assert.match(html,/Riwayat Cup/);assert.match(html,/Terpakai fisik 7/);assert.match(html,/1 perlu perhatian/);
  assert.match(html,/Stok Barang Jadi/);assert.match(html,/4 produk · 9 unit terjual · 1 perubahan lain/);
});

test('Cup detail keeps transaction usage, physical usage, closing and variance visible',()=>{
  const html=renderCupShiftEvidenceDetail({cupControl:{reconciliation:{rows:[{name:'Cup 22',code:'c22d',opening:20,restock:5,transactionUsage:10,physicalUsed:11,physicalClosing:14,variance:-1,status:'SHORTAGE'}]}}});
  assert.match(html,/Awal/);assert.match(html,/Transaksi/);assert.match(html,/Fisik terpakai/);assert.match(html,/Akhir fisik/);assert.match(html,/Selisih/);assert.match(html,/SHORTAGE/);
});

test('stock detail clearly separates non-sale changes from sold units',()=>{
  const html=renderStockShiftEvidenceDetail({rows:{P1:{productId:'P1',name:'Bakaran',openingQty:20,soldQty:8,returnedQty:1,nonSaleNetChange:3,closingSystemQty:16,status:'NON_SALE_CHANGE'}}});
  assert.match(html,/Terjual/);assert.match(html,/Retur ke stok/);assert.match(html,/Perubahan lain/);assert.match(html,/Akhir sistem/);assert.match(html,/Ada perubahan non-penjualan/);
});

test('historical shift without stock snapshot explains that evidence starts on later shifts',()=>{
  const html=renderStockShiftEvidenceDetail(null);
  assert.match(html,/belum tersedia/i);assert.match(html,/shift yang dibuka setelah fitur ini aktif/i);
});

test('mobile Cup history exposes usage-first cards without horizontal table dependency',()=>{
  const html=renderCupShiftEvidenceDetail({cupControl:{reconciliation:{rows:[{
    name:'Cup 22 Oz Datar Polos',code:'c22p',status:'MATCH',opening:10,restock:0,
    transactionUsage:10,physicalUsed:10,physicalClosing:0,variance:0
  }]}}});
  assert.match(html,/sj-shift-cup-mobile-list/);
  assert.match(html,/Dipakai transaksi/);
  assert.match(html,/Dipakai fisik/);
  assert.match(html,/Akhir fisik/);
  assert.match(html,/Selisih/);
  assert.match(html,/10 pcs/);
  assert.match(html,/Sesuai/);
});

test('Cup closing renderer uses Indonesian usage-first labels and a reactive summary hook',async()=>{
  const {renderCupClosingPanelV34}=await import('../src/ui/cup-shift-control-v34.js');
  const html=renderCupClosingPanelV34([],{reconciliation:{rows:[{
    code:'c22p',name:'Cup 22 Oz Datar Polos',opening:10,restock:0,transactionUsage:10,
    expectedClosing:0,physicalClosing:0,closing:0,variance:0,status:'MATCH'
  }]},closingValues:{c22p:0},openingKnown:true});
  assert.match(html,/data-v34-cup-usage-summary/);
  assert.match(html,/Dipakai transaksi/);
  assert.match(html,/Sisa sistem/);
  assert.match(html,/Fisik Akhir/);
  assert.doesNotMatch(html,/<small>Expected Closing<\/small>/);
  assert.doesNotMatch(html,/<small>Physical Closing<\/small>/);
});

test('Cup closing in-place refresh updates the usage header as well as reconciliation',()=>{
  const source=fs.readFileSync(new URL('../src/ui/cup-shift-control-v34.js',import.meta.url),'utf8');
  assert.match(source,/nextHeader/);
  assert.match(source,/header\.innerHTML=nextHeader\.innerHTML/);
});
