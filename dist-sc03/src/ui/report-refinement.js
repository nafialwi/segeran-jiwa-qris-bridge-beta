import { renderIcon } from './icons.js';
import { salesAnalytics, chartBuckets } from '../domain/report-v28-analytics.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const rupiah=v=>`Rp ${Math.round(num(v)).toLocaleString('id-ID')}`;
const count=v=>Math.max(0,Math.round(num(v))).toLocaleString('id-ID');
const uiState={metric:'revenue',topSort:'qty'};

function paymentMixHTML(rows=[]){
  const total=Math.max(1,rows.reduce((s,x)=>s+x.amount,0));
  if(!rows.length)return '<div class="sjv28-empty">Belum ada pembayaran pada periode ini.</div>';
  return `<div class="sjv28-paymix">${rows.map(row=>`<div><span><b>${esc(row.method)}</b><small>${count(row.count)} transaksi</small></span><span class="sjv28-paybar"><i style="width:${Math.max(3,Math.round(row.amount/total*100))}%"></i></span><strong>${rupiah(row.amount)}</strong></div>`).join('')}</div>`;
}
function chartHTML(transactions=[]){
  const buckets=chartBuckets(transactions),metric=uiState.metric;
  const key=metric==='transactions'?'transactions':metric==='items'?'items':'revenue';
  const max=Math.max(1,...buckets.map(x=>num(x[key])));
  const label=metric==='transactions'?'Transaksi':metric==='items'?'Item':'Omzet';
  return `<section class="sjv28-card sjv28-chart"><div class="sjv28-section-head"><div><h2>Grafik ${label}</h2><p>Data transaksi riil pada periode terpilih</p></div><div class="sjv28-toggle"><button data-v28-metric="revenue" class="${metric==='revenue'?'active':''}">Omzet</button><button data-v28-metric="transactions" class="${metric==='transactions'?'active':''}">Transaksi</button><button data-v28-metric="items" class="${metric==='items'?'active':''}">Item</button></div></div>${buckets.length?`<div class="sjv28-bars">${buckets.map(x=>`<div class="sjv28-bar-col" title="${esc(x.label)} · ${key==='revenue'?rupiah(x[key]):count(x[key])}"><div class="sjv28-bar-track"><i style="height:${Math.max(4,Math.round(num(x[key])/max*100))}%"></i></div><small>${esc(x.label)}</small></div>`).join('')}</div>`:'<div class="sjv28-empty">Belum ada data untuk grafik.</div>'}</section>`;
}
function topProductsHTML(analytics){
  const sort=uiState.topSort,rows=(sort==='revenue'?analytics.topByRevenue:analytics.topByQty).slice(0,5);
  return `<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Top Produk</h2><p>Produk terlaris berdasarkan jumlah atau omzet</p></div><div class="sjv28-toggle"><button data-v28-top-sort="qty" class="${sort==='qty'?'active':''}">Jumlah</button><button data-v28-top-sort="revenue" class="${sort==='revenue'?'active':''}">Omzet</button></div></div><div class="sjv28-top-products">${rows.length?rows.map((x,i)=>`<div><span class="rank">${i+1}</span><span><b>${esc(x.name)}</b><small>${count(x.qty)} item</small></span><strong>${sort==='revenue'?rupiah(x.revenue):count(x.qty)}</strong></div>`).join(''):'<div class="sjv28-empty">Belum ada produk terjual.</div>'}</div><button type="button" class="sj-v26-history-entry sjv28-inline-link" data-sj-sales-history-open="true">Lihat Semua &amp; Detail Item</button></section>`;
}
function shiftSummaryHTML(shifts=[]){
  const rows=(shifts||[]).slice(-4).reverse();
  return `<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Ringkasan Shift</h2><p>Shift pada periode laporan</p></div></div><div class="sjv28-shifts">${rows.length?rows.map(s=>`<div><span><b>${esc(s.id??s._key??s.key??'Shift')}</b><small>${esc(s.cashierName??s.namaKasir??s.currentCashierName??'-')}</small></span><strong>${esc(String(s.status??s.shiftStatus??'').toUpperCase()||'-')}</strong></div>`).join(''):'<div class="sjv28-empty">Belum ada shift pada periode ini.</div>'}</div></section>`;
}
function historyPreviewHTML(transactions=[]){
  const rows=(transactions||[]).filter(tx=>!['VOID','VOIDED','CANCELLED','CANCELED'].includes(String(tx?.status||'').toUpperCase())).slice().sort((a,b)=>num(b?.ts??b?.timestamp)-num(a?.ts??a?.timestamp)).slice(0,6);
  return `<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Riwayat Penjualan</h2><p>Read-only · pilih riwayat untuk drilldown item transaksi</p></div></div><div class="sjv28-history-preview">${rows.length?rows.map(tx=>`<button type="button" data-sj-sales-history-open="true"><span><b>${esc(tx.id??tx._key??tx.transactionId??'Transaksi')}</b><small>${esc(String(tx.paymentMethod??tx.method??tx.payment?.method??'-'))}</small></span><strong>${rupiah(tx?.pricing?.total??tx?.grandTotal??tx?.total)}</strong></button>`).join(''):'<div class="sjv28-empty">Belum ada transaksi.</div>'}</div><button type="button" class="sj-v26-history-entry" data-sj-sales-history-open="true"><span>${renderIcon('receipt',{size:20})}</span><span><b>Buka Riwayat Penjualan</b><small>Filter, Top Produk, dan detail item · read-only</small></span><span>›</span></button></section>`;
}
function hppHTML(summary={}){
  const state=summary?.costing?.state||'unknown';if(state==='unknown')return '<div class="sjv28-hpp-note"><b>HPP</b><span>Belum tersedia</span><small>Snapshot HPP historis tidak dianggap Rp0.</small></div>';
  return `<div class="sjv28-hpp-note"><b>HPP${state==='partial'?' Tercatat':''}</b><span>${summary.cogs==null?'Belum tersedia':rupiah(summary.cogs)}</span><small>${state==='partial'?'Sebagian transaksi belum memiliki HPP.':'Snapshot HPP tersedia.'}</small></div>`;
}

export function renderRef01ReportSummary(summary={},fullModel={}){return renderV28OwnerReport(summary,fullModel)}
export function renderV28OwnerReport(summary={},fullModel={}){
  const period=summary.period||fullModel.period||{preset:'today',label:'Hari Ini'},transactions=fullModel.transactions||[],analytics=salesAnalytics(transactions);
  const customActive=period.preset==='custom';
  return `<main class="sjr06-report sjv28-report sj-rep0" data-view="home"><header class="sjr06-report-head"><div><h1>Laporan Penjualan</h1><p>${esc(period.label||'Periode terpilih')} · canonical read-only sales report</p></div><button type="button" data-action="refresh" class="sjr06-refresh" aria-label="Segarkan laporan">${renderIcon('refresh',{size:19})}</button></header><div class="sjr06-periods sjv28-periods"><button data-action="period" data-period="today" class="${period.preset==='today'?'active':''}">Hari Ini</button><button data-action="period" data-period="7d" class="${period.preset==='7d'?'active':''}">7 Hari</button><button data-v28-period="30d">30 Hari</button><button data-action="period" data-period="month" class="${period.preset==='month'?'active':''}">Bulan Ini</button><button data-v28-period="custom" class="${customActive?'active':''}">Custom</button></div><div class="sjv28-custom" ${customActive?'':'hidden'}><label>Dari<input type="date" data-v28-custom="from"></label><label>Sampai<input type="date" data-v28-custom="to"></label><button type="button" data-v28-custom-apply>Terapkan</button></div><section class="sjv28-kpis"><div class="primary"><small>Penjualan Bersih</small><strong>${rupiah(analytics.netSales)}</strong><span>VOID dikeluarkan · refund dikurangi</span></div><div><small>Transaksi</small><strong>${count(analytics.transactionCount)}</strong><span>Transaksi valid</span></div><div><small>Rata-rata Transaksi</small><strong>${rupiah(analytics.averageTransaction)}</strong><span>Penjualan bersih / transaksi</span></div><div><small>Item Terjual</small><strong>${count(analytics.itemCount)}</strong><span>Setelah refund</span></div></section>${hppHTML(summary)}${chartHTML(transactions)}<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Metode Pembayaran</h2><p>Payment mix berdasarkan penjualan bersih</p></div></div>${paymentMixHTML(analytics.paymentMix)}</section>${topProductsHTML(analytics)}${shiftSummaryHTML(fullModel.shifts)}${historyPreviewHTML(transactions)}</main>`;
}

export function renderV28CashierShift(baseHtml='',fullModel={}){
  const transactions=fullModel.transactions||[],analytics=salesAnalytics(transactions);
  return `${baseHtml}<section class="sjv28-cashier-extra"><div class="sjv28-kpis"><div><small>Transaksi</small><strong>${count(analytics.transactionCount)}</strong></div><div><small>Item Terjual</small><strong>${count(analytics.itemCount)}</strong></div></div><section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Metode Pembayaran</h2><p>Ringkasan Laporan Shift</p></div></div>${paymentMixHTML(analytics.paymentMix)}</section><section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Riwayat Penjualan</h2><p>read-only · transaksi pada periode shift</p></div></div><button type="button" class="sj-v26-history-entry" data-sj-sales-history-open="true"><span>${renderIcon('receipt',{size:20})}</span><span><b>Buka Riwayat Penjualan</b><small>Detail transaksi dan item</small></span><span>›</span></button></section></section>`;
}

function localDate(ts){const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function bindReportInteractions(runtime,report){
  const root=runtime?.document?.getElementById?.('lap-menu-view');if(!root||root.dataset?.v28ReportBound==='true')return false;root.dataset.v28ReportBound='true';
  root.addEventListener?.('click',event=>{
    const metric=event.target?.closest?.('[data-v28-metric]');if(metric){uiState.metric=metric.dataset.v28Metric||'revenue';report.open?.();return}
    const top=event.target?.closest?.('[data-v28-top-sort]');if(top){uiState.topSort=top.dataset.v28TopSort||'qty';report.open?.();return}
    const period=event.target?.closest?.('[data-v28-period]');if(period){const preset=period.dataset.v28Period;if(preset==='30d'){const end=Date.now(),start=end-29*86400000;report.selectPeriod?.({preset:'custom',explicit:{from:localDate(start),to:localDate(end)}});report.open?.()}else root.querySelector?.('.sjv28-custom')?.removeAttribute?.('hidden');return}
    if(event.target?.closest?.('[data-v28-custom-apply]')){const from=root.querySelector?.('[data-v28-custom="from"]')?.value,to=root.querySelector?.('[data-v28-custom="to"]')?.value;if(from&&to){report.selectPeriod?.({preset:'custom',explicit:{from,to}});report.open?.()}return}
  });return true;
}

export function installReportRefinement(runtime=globalThis){
  if(runtime?.__SJ_REF01_REPORT_REFINEMENT)return runtime.__SJ_REF01_REPORT_REFINEMENT;
  const report=runtime?.SJReportFoundationV010,core=report?.Core,api={installed:false};
  if(core&&typeof core.renderOwnerSummary==='function'){
    api.originalOwner=core.renderOwnerSummary;core.renderOwnerSummary=summary=>renderV28OwnerReport(summary,report?.state?.model||{});
    if(typeof core.renderCashierShift==='function'){api.originalCashier=core.renderCashierShift;core.renderCashierShift=detail=>renderV28CashierShift(api.originalCashier(detail),report?.state?.model||{})}
    bindReportInteractions(runtime,report);api.installed=true;
  }
  Object.freeze(api);try{Object.defineProperty(runtime,'__SJ_REF01_REPORT_REFINEMENT',{value:api,writable:false,configurable:false})}catch(_){}return api;
}
