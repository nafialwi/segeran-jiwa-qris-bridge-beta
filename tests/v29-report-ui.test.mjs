import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderV29OwnerReport,
  renderV28CashierShift,
  createCanonicalReportController
} from '../src/ui/report-refinement.js';

const at=(day,hour)=>new Date(2026,8,day,hour,0,0,0).getTime();
const tx=(id,shift,day,hour,total,product='P1')=>({id,_shift:`2026-09-${String(day).padStart(2,'0')}-${shift}`,ts:at(day,hour),status:'PAID',paymentMethod:shift==='S1'?'CASH':'QRIS',pricing:{netSubtotal:total,total},items:[{id:product,name:product==='P1'?'JASJUS 1.000':'ES TEH 2K',qty:2,price:total/2}]});

function core(){return{
  summary({period,transactions=[],expenses=[]}){return{period,netSales:transactions.reduce((s,x)=>s+x.pricing.netSubtotal,0),transactionCount:transactions.length,expenses:expenses.reduce((s,x)=>s+Number(x.amount||0),0),costing:{state:'unknown'},cogs:null}},
  shiftDetail(s){return{id:s.id,openingCash:Number(s.kasAwal||0),sales:{total:Number(s.omset||0)},expenses:{total:Number(s.expense||0)},expectedClosing:Number(s.expected||0),actualClosing:s.actual??null,variance:s.actual==null?null:Number(s.actual)-Number(s.expected||0)}}
}}

test('v2.9 owner report exposes one Shift/Hari/Minggu/Bulan/Custom hierarchy and scope-consistent business sections',()=>{
  const model={period:{preset:'custom',label:'1 Sep 2026',start:at(1,0),end:at(1,23)},transactions:[tx('T1','S1',1,8,10000)],expenses:[],shifts:[{id:'2026-09-01-S1',kasAwal:50000,omset:10000,expected:60000,actual:60000}]};
  const html=renderV29OwnerReport({period:model.period,costing:{state:'unknown'}},model,{state:{scope:'day',anchorDate:'2026-09-01',shift:'ALL',day:'ALL',week:'ALL',metric:'revenue',topSort:'qty'},core:core(),compat:{outletStock:()=>17}});
  for(const scope of ['shift','day','week','month','custom'])assert.match(html,new RegExp(`data-v29-scope="${scope}"`));
  for(const text of ['Penjualan Bersih','Transaksi','Rata-rata Transaksi','Item Terjual','Metode Pembayaran','Grafik Omzet','Top Produk','Ringkasan Kas & Shift','Barang Terjual','Stok Gerai Saat Ini','Riwayat Penjualan','Belum tersedia'])assert.ok(html.includes(text),text);
  assert.match(html,/JASJUS 1\.000/);
  assert.match(html,/>17</);
  for(const cashLabel of ['Kas Awal','Penjualan','Pengeluaran','Ekspektasi Kas','Kas Penutupan','Selisih'])assert.ok(html.includes(cashLabel),cashLabel);
});

test('v2.9 canonical report controller filters one model and changes underlying read period only when report scope changes',async()=>{
  const selected=[];let opens=0;
  const report={
    state:{model:{transactions:[tx('T1','S1',1,8,10000),tx('T2','S3',1,20,20000)],shifts:[{id:'2026-09-01-S1'},{id:'2026-09-01-S3'}],expenses:[]}},
    Core:core(),
    selectPeriod(p){selected.push(p)},
    async open(){opens++}
  };
  const runtime={document:{getElementById(id){if(id==='date-sel')return{value:'2026-09-01'};if(id==='shift-sel')return{value:'-S3',selectedOptions:[{textContent:'Shift Malam'}]};return null}}};
  const controller=createCanonicalReportController({runtime,report});
  controller.setFilter('shift','S3');
  assert.deepEqual(controller.filteredModel().transactions.map(x=>x.id),['T2']);
  await controller.applyScope('week',{anchorDate:'2026-09-03'});
  assert.deepEqual(selected.at(-1).explicit,{from:'2026-08-31',to:'2026-09-06'});
  assert.equal(controller.state.scope,'week');
  assert.equal(opens,1);
});


test('v2.9 cashier keeps Laporan Shift presentation and adds sold items current outlet stock payment mix and read-only history',()=>{
  const model={transactions:[tx('T1','S3',1,20,20000,'P1')],expenses:[],shifts:[{id:'2026-09-01-S3'}]};
  const html=renderV28CashierShift('<main><h1>Laporan Shift</h1></main>',model,{compat:{outletStock:()=>23},core:core()});
  for(const text of ['Laporan Shift','Transaksi','Item Terjual','Metode Pembayaran','Barang Terjual','Stok Gerai Saat Ini','Riwayat Penjualan','read-only'])assert.ok(html.includes(text),text);
  assert.match(html,/JASJUS 1\.000/);
  assert.match(html,/>23</);
  assert.doesNotMatch(html,/data-v29-scope="month"/,'cashier shift report must not expose Owner period hierarchy');
});

test('v2.9 top product and transaction history inherit the controller filtered model',()=>{
  const report={state:{model:{period:{label:'1 Sep'},transactions:[tx('T1','S1',1,8,10000,'P1'),tx('T2','S3',1,20,30000,'P2')],shifts:[{id:'2026-09-01-S1'},{id:'2026-09-01-S3'}],expenses:[]}},Core:core()};
  const runtime={document:{getElementById(id){if(id==='date-sel')return{value:'2026-09-01'};if(id==='shift-sel')return{value:'-S3'};return null}}};
  const controller=createCanonicalReportController({runtime,report});
  controller.setFilter('shift','S3');
  const filtered=controller.filteredModel();
  const html=renderV29OwnerReport({},filtered,{state:controller.state,core:core(),compat:{outletStock:()=>9}});
  assert.ok(html.includes('ES TEH 2K'));
  assert.ok(html.includes('T2'));
  assert.ok(!html.includes('JASJUS 1.000'));
  assert.ok(!html.includes('T1'));
});
