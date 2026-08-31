import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRef01ReportSummary, installReportRefinement } from '../src/ui/report-refinement.js';

test('REF_06 report summary renders exactly three headline KPIs and never synthesizes unknown gross profit',()=>{
  const html=renderRef01ReportSummary({
    period:{preset:'7d',label:'7 Hari'},netSales:12500000,transactionCount:326,grossProfit:null,
    costing:{state:'unknown',unknown:326},comparison:{label:'vs minggu lalu',netSales:{direction:'up',percent:12.5}},counts:{sales:326,expenses:3,purchases:4,debts:2,shifts:7}
  });
  assert.equal((html.match(/class="sjr06-kpi(?:\s|")/g)||[]).length,3);
  assert.match(html,/Total Penjualan/);
  assert.match(html,/Transaksi/);
  assert.match(html,/Laba Kotor/);
  assert.match(html,/Belum tersedia/);
  assert.doesNotMatch(html,/Laba Kotor[^<]*Rp\s*0/);
  assert.match(html,/class="sjr06-trend"/);
  assert.match(html,/data-action="category" data-category="sales-payment"/);
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
