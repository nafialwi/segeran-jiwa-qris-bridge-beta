import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  transactionItemLines,
  aggregateProductLeaderboard
} from '../src/domain/report-product-analytics.js';
import {
  renderSalesHistory,
  renderSalesTransactionDetail,
  installSalesHistoryRefinement
} from '../src/ui/report-sales-history-refinement.js';
import {
  keepFinishedProductOptions,
  installFinishedGoodsWarehouseRefinement,
  relabelRecipeCancellation
} from '../src/ui/finished-goods-warehouse-refinement.js';

const txA={
  id:'TX-A',status:'RECORDED',method:'Tunai',_shift:'2026-09-01-S1',cashierName:'Nafi',ts:1000,
  cartData:[
    {id:'p1',n:'JASJUS 1.000',q:3,p:1000},
    {id:'p2',n:'POP ICE 4.000',q:1,p:4000}
  ],
  refundedQty:{0:1},
  pricing:{lines:[{net:3000},{net:4000}],total:7000}
};
const txB={
  id:'TX-B',status:'RECORDED',method:'QRIS',_shift:'2026-09-01-S2',cashierName:'Owner',ts:2000,
  cartData:[{id:'p2',n:'POP ICE 4.000',q:2,p:4000}],
  pricing:{lines:[{net:8000}],total:8000}
};
const txVoid={
  id:'TX-V',status:'VOIDED',method:'Tunai',_shift:'2026-09-01-S1',
  cartData:[{id:'p1',n:'JASJUS 1.000',q:99,p:1000}]
};

test('transaction item lines preserve item detail and subtract refunded quantity without counting VOID sales',()=>{
  const lines=transactionItemLines(txA);
  assert.equal(lines.length,2);
  assert.deepEqual(lines[0],assert.matching?lines[0]:lines[0]);
  assert.equal(lines[0].name,'JASJUS 1.000');
  assert.equal(lines[0].originalQty,3);
  assert.equal(lines[0].refundedQty,1);
  assert.equal(lines[0].netQty,2);
  assert.equal(lines[0].netRevenue,2000);
  assert.equal(transactionItemLines(txVoid)[0].netQty,0);
});

test('product leaderboard can rank by net quantity or omzet and excludes VOID quantities',()=>{
  const byQty=aggregateProductLeaderboard([txA,txB,txVoid],{sortBy:'qty'});
  assert.equal(byQty[0].id,'p2');
  assert.equal(byQty[0].qty,3);
  assert.equal(byQty[0].revenue,12000);
  assert.equal(byQty.find(x=>x.id==='p1').qty,2);
  const byRevenue=aggregateProductLeaderboard([txA,txB,txVoid],{sortBy:'revenue'});
  assert.equal(byRevenue[0].id,'p2');
  assert.equal(byRevenue[0].revenue,12000);
});

test('sales history markup exposes filters and both product leaderboard modes',()=>{
  const html=renderSalesHistory({transactions:[txA,txB],periodLabel:'Hari Ini',sortBy:'qty'});
  assert.match(html,/Riwayat Penjualan/);
  assert.match(html,/data-sales-filter="shift"/);
  assert.match(html,/data-sales-filter="method"/);
  assert.match(html,/data-sales-filter="cashier"/);
  assert.match(html,/data-sales-filter="query"/);
  assert.match(html,/Jumlah Terjual/);
  assert.match(html,/Omzet/);
  assert.match(html,/TX-A/);
  assert.match(html,/TX-B/);
});

test('transaction detail displays sold items and remains read-only',()=>{
  const html=renderSalesTransactionDetail(txA,{role:'cashier'});
  assert.match(html,/Detail Transaksi/);
  assert.match(html,/JASJUS 1\.000/);
  assert.match(html,/2 item/);
  assert.match(html,/Refund 1/);
  assert.match(html,/POP ICE 4\.000/);
  assert.doesNotMatch(html,/data-action="void"/i);
  assert.doesNotMatch(html,/data-action="refund"/i);
});

test('sales history installer is available for cashier and owner using existing report state model only',()=>{
  const report={state:{model:{period:{label:'Hari Ini'},transactions:[txA]}},Core:{transactionDetail:tx=>({id:tx.id,pricing:{total:7000},payment:{method:'CASH',status:'RECORDED'}})}};
  const runtime={SJReportFoundationV010:report,document:{getElementById(){return null}}};
  const api=installSalesHistoryRefinement(runtime);
  assert.equal(api.installed,true);
  assert.equal(typeof api.openHistory,'function');
  assert.equal(typeof api.openTransaction,'function');
});

test('finished goods selector filter removes ingredient options and keeps product options only',()=>{
  const options=[
    {value:'I:tea',hidden:false,remove(){this.removed=true}},
    {value:'P:p1',hidden:false,remove(){this.removed=true}},
    {value:'P:p2',hidden:false,remove(){this.removed=true}}
  ];
  const select={options};
  const kept=keepFinishedProductOptions(select);
  assert.deepEqual(kept,['P:p1','P:p2']);
  assert.equal(options[0].removed,true);
  assert.notEqual(options[1].removed,true);
});

test('finished goods hub delegates receive/transfer/outlet actions to existing authorities',()=>{
  const calls=[];
  const runtime={
    SJInventoryV2:{open:tab=>calls.push(['inventory',tab])},
    openOpr:id=>calls.push(['opr',id]),
    document:{getElementById(){return null},querySelector(){return null},querySelectorAll(){return []}}
  };
  const api=installFinishedGoodsWarehouseRefinement(runtime);
  assert.equal(api.installed,true);
  api.openReceive();api.openTransfer();api.openOutletStock();
  assert.deepEqual(calls,[['inventory','purchase'],['inventory','transfer'],['opr',3]]);
});

test('recipe cancellation presentation relabels existing non-destructive toggle rather than adding delete behavior',()=>{
  const button={textContent:'Nonaktifkan',dataset:{toggleVar:'V1'}};
  const root={querySelectorAll:()=>[button],querySelector:()=>null,insertAdjacentHTML(){}};
  const changed=relabelRecipeCancellation(root);
  assert.equal(changed,1);
  assert.equal(button.textContent,'Batalkan Rumus');
  const src=fs.readFileSync('src/ui/finished-goods-warehouse-refinement.js','utf8');
  assert.doesNotMatch(src,/\.remove\(\)|\.set\(null\)|recipes\/.+null/s);
});

test('v2.6 bootstrap installs sales history and finished-goods warehouse adapters',()=>{
  const src=fs.readFileSync('src/app/ref01-bootstrap.js','utf8');
  assert.match(src,/installSalesHistoryRefinement/);
  assert.match(src,/installFinishedGoodsWarehouseRefinement/);
});

test('quantity stepper v2.6 uses one compact pill with circular minus and plus buttons and no pseudo separators',()=>{
  const css=fs.readFileSync('src/ui/ref01.css','utf8');
  assert.match(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\)\{[^}]*grid-template-columns:32px 28px 32px[^}]*width:96px[^}]*border-radius:999px/s);
  assert.doesNotMatch(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\)::before/);
  assert.doesNotMatch(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\)::after/);
  assert.match(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\) \.item-minus-btn\{[^}]*border-radius:50%/s);
  assert.match(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\) \[data-add\]\{[^}]*border-radius:50%/s);
  assert.match(css,/font-variant-numeric:tabular-nums/);
});
