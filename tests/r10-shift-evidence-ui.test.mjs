import test from 'node:test';
import assert from 'node:assert/strict';
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
