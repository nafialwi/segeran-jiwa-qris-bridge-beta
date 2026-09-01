import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRef01ReportSummary, installReportRefinement } from '../src/ui/report-refinement.js';

test('REF_06 canonical report renders v2.8 sales KPIs and never synthesizes unknown HPP',()=>{
  const html=renderRef01ReportSummary({
    period:{preset:'7d',label:'7 Hari'},netSales:12500000,transactionCount:326,grossProfit:null,
    costing:{state:'unknown',unknown:326},comparison:{label:'vs minggu lalu',netSales:{direction:'up',percent:12.5}},counts:{sales:326,expenses:3,purchases:4,debts:2,shifts:7}
  },{transactions:[],shifts:[]});
  assert.equal((html.match(/<div(?: class="primary")?><small>(?:Penjualan Bersih|Transaksi|Rata-rata Transaksi|Item Terjual)<\/small>/g)||[]).length,4);
  assert.match(html,/Penjualan Bersih/);
  assert.match(html,/Rata-rata Transaksi/);
  assert.match(html,/Item Terjual/);
  assert.match(html,/HPP/);
  assert.match(html,/Belum tersedia/);
  assert.match(html,/<div class="sjv28-hpp-note"><b>HPP<\/b><span>Belum tersedia<\/span>/);
  assert.doesNotMatch(html,/<div class="sjv28-hpp-note"><b>HPP<\/b><span>Rp\s*0<\/span>/);
  assert.match(html,/Metode Pembayaran/);
  assert.match(html,/Top Produk/);
  assert.match(html,/Riwayat Penjualan/);
});

test('REF_06 installs by overriding only report presentation Core while retaining report navigation authority',()=>{
  const original=()=>'<div>legacy</div>';
  const runtime={SJReportFoundationV010:{Core:{renderOwnerSummary:original}}};
  const api=installReportRefinement(runtime);
  assert.equal(api.installed,true);
  assert.notEqual(runtime.SJReportFoundationV010.Core.renderOwnerSummary,original);
  assert.match(runtime.SJReportFoundationV010.Core.renderOwnerSummary({period:{label:'Hari Ini'},costing:{state:'unknown'},counts:{},comparison:{}}),/sjr06-report/);
  assert.equal(installReportRefinement(runtime),api);
});
