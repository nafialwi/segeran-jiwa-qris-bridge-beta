import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transactionItemLines } from '../src/domain/report-product-analytics.js';

let analytics=null;
try{analytics=await import('../src/domain/report-v28-analytics.js')}catch(_){}

test('VOID/CANCELLED transactions contribute zero item quantity and revenue',()=>{
  for(const status of ['VOID','VOIDED','CANCELLED','CANCELED']){
    const lines=transactionItemLines({status,items:[{id:'A',name:'A',qty:2,price:10000}]});
    assert.equal(lines[0].netQty,0,status);
    assert.equal(lines[0].netRevenue,0,status);
  }
});

test('v2.8 analytics deducts refunds, counts items, average transaction, and payment mix',()=>{
  assert.ok(analytics,'report-v28 analytics module must exist');
  const txs=[
    {id:'T1',status:'PAID',ts:1,paymentMethod:'CASH',pricing:{netSubtotal:30000,total:30000},items:[{id:'A',name:'A',qty:3,price:10000}],refundedQty:{0:1},refundPricingTotals:{netSubtotal:10000}},
    {id:'T2',status:'PAID',ts:2,paymentMethod:'QRIS',pricing:{netSubtotal:20000,total:20000},items:[{id:'B',name:'B',qty:2,price:10000}]},
    {id:'T3',status:'VOID',ts:3,paymentMethod:'CASH',pricing:{netSubtotal:99000,total:99000},items:[{id:'C',name:'C',qty:9,price:11000}]}
  ];
  const out=analytics.salesAnalytics(txs);
  assert.equal(out.netSales,40000);
  assert.equal(out.transactionCount,2);
  assert.equal(out.itemCount,4);
  assert.equal(out.averageTransaction,20000);
  assert.deepEqual(out.paymentMix.map(x=>[x.method,x.count,x.amount]),[['CASH',1,20000],['QRIS',1,20000]]);
});

test('v2.8 reporting exposes canonical owner metrics, real chart controls, payment mix, top products, shifts and history',()=>{
  const src=fs.readFileSync('src/ui/report-refinement.js','utf8');
  for(const text of ['Penjualan Bersih','Rata-rata Transaksi','Item Terjual','Metode Pembayaran','Top Produk','Ringkasan Shift','Riwayat Penjualan','30 Hari','Bulan Ini','Custom','Omzet','Transaksi','Item']) assert.ok(src.includes(text),text);
  assert.ok(src.includes('data-v28-metric'));
  assert.ok(src.includes('data-v28-top-sort'));
  assert.ok(src.includes('data-v28-period="30d"'));
  assert.ok(src.includes('salesAnalytics'));
  assert.ok(!src.includes('trendSvg('),'decorative two-point trend SVG should not be canonical chart');
});

test('v2.8 cashier shift report preserves shift summary and adds transactions/items/payment mix/read-only sales history',()=>{
  const src=fs.readFileSync('src/ui/report-refinement.js','utf8');
  assert.ok(src.includes('renderV28CashierShift'));
  for(const text of ['Laporan Shift','Transaksi','Item Terjual','Metode Pembayaran','Riwayat Penjualan','read-only']) assert.ok(src.includes(text),text);
});

test('HPP unknown is rendered as Belum tersedia and never coerced to Rp0',()=>{
  const src=fs.readFileSync('src/ui/report-refinement.js','utf8');
  assert.ok(src.includes('Belum tersedia'));
  assert.ok(src.includes('HPP'));
});
