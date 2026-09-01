import { renderIcon } from './icons.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const rupiah=v=>`Rp ${Math.round(num(v)).toLocaleString('id-ID')}`;
const count=v=>Math.max(0,Math.round(num(v))).toLocaleString('id-ID');

function trendMeta(model){
  const trend=model?.comparison?.netSales;
  if(!trend||!trend.direction)return {tone:'flat',label:'Belum ada pembanding',previous:null,current:num(model?.netSales)};
  const pct=Number(trend.percent);
  const current=num(model?.netSales);
  const previous=Number.isFinite(pct)&&pct!==-100?current/(1+pct/100):null;
  const sign=trend.direction==='up'?'▲':trend.direction==='down'?'▼':'•';
  return {tone:trend.direction,label:`${sign} ${Number.isFinite(pct)?Math.abs(pct).toLocaleString('id-ID',{maximumFractionDigits:1})+'%':'Perbandingan'} ${esc(model?.comparison?.label||'vs periode sebelumnya')}`,previous,current};
}
function trendSvg(meta){
  const a=meta.previous,b=meta.current;
  if(a==null||!Number.isFinite(a)||!Number.isFinite(b))return `<div class="sjr06-trend-empty">Tren tersedia setelah ada periode pembanding.</div>`;
  const max=Math.max(1,a,b),min=Math.min(a,b),span=Math.max(1,max-min),y=x=>46-((x-min)/span)*30;
  return `<svg viewBox="0 0 300 58" role="img" aria-label="Perbandingan penjualan periode sebelumnya dan saat ini"><path d="M18 46H282" class="sjr06-axis"/><polyline points="54,${y(a).toFixed(1)} 246,${y(b).toFixed(1)}" class="sjr06-line"/><circle cx="54" cy="${y(a).toFixed(1)}" r="4"/><circle cx="246" cy="${y(b).toFixed(1)}" r="4"/><text x="28" y="56">Sebelumnya</text><text x="220" y="56">Saat ini</text></svg>`;
}

export function renderRef01ReportSummary(model={}){
  const period=model.period||{preset:'today',label:'Hari Ini'};
  const costing=model.costing||{state:'unknown'};
  const grossAvailable=costing.state!=='unknown'&&model.grossProfit!==null&&model.grossProfit!==undefined;
  const gross=grossAvailable?rupiah(model.grossProfit):'Belum tersedia';
  const trend=trendMeta(model);
  const chips=[['today','Hari Ini'],['yesterday','Kemarin'],['7d','7 Hari'],['month','Bulan Ini'],['date','Pilih Tanggal']];
  const categories=[
    ['sale','Penjualan','Ringkasan transaksi dan metode bayar','sales-payment'],
    ['warehouse-box','Produk','Produk, stok, mutasi dan pembelian','purchase-funding'],
    ['customers','Pelanggan','Hutang, pembayaran dan saldo','debts'],
    ['reports','Keuangan','HPP, laba dan pengeluaran','profitability']
  ];
  return `<main class="sjr06-report sj-rep0" data-view="home"><header class="sjr06-report-head"><div><h1>Laporan</h1><p>Pantau kinerja toko Anda dengan mudah</p></div><button type="button" data-action="refresh" class="sjr06-refresh" aria-label="Segarkan laporan">↻</button></header><div class="sjr06-periods" aria-label="Pilih periode">${chips.map(([key,label])=>`<button type="button" class="${period.preset===key||(period.preset==='custom'&&key==='date')?'active':''}" data-action="period" data-period="${key}">${label}</button>`).join('')}<input class="sj-rep0-date" id="sj-rep0-date-input" type="date" aria-label="Pilih tanggal"></div><section class="sjr06-kpis"><button class="sjr06-kpi primary" type="button" data-action="category" data-category="sales-payment"><span>${renderIcon('reports',{size:21})}</span><small>Total Penjualan</small><strong>${rupiah(model.netSales)}</strong><em class="${trend.tone}">${trend.label}</em></button><button class="sjr06-kpi" type="button" data-action="category" data-category="sales-payment"><span>${renderIcon('receipt',{size:21})}</span><small>Transaksi</small><strong>${count(model.transactionCount)}</strong><em>${period.label||'Periode terpilih'}</em></button><button class="sjr06-kpi" type="button" data-action="category" data-category="profitability"><span>${renderIcon('chart',{size:21})}</span><small>Laba Kotor</small><strong>${esc(gross)}</strong><em>${grossAvailable?(model.margin==null?'Margin belum tersedia':`Margin ${Number(model.margin).toLocaleString('id-ID',{maximumFractionDigits:1})}%`):'HPP belum tersedia'}</em></button></section>${costing.state==='partial'?`<aside class="sjr06-cost-note">Sebagian transaksi belum memiliki snapshot HPP. Laba hanya mencakup transaksi dengan biaya tercatat.</aside>`:costing.state==='unknown'&&num(model.transactionCount)>0?`<aside class="sjr06-cost-note">HPP belum tersedia untuk periode ini. Sistem tidak menganggap biaya historis sebagai Rp0.</aside>`:''}<section class="sjr06-trend"><div class="sjr06-section-head"><div><h2>Tren Penjualan</h2><p>Perbandingan periode yang tersedia</p></div><span class="${trend.tone}">${trend.label}</span></div>${trendSvg(trend)}</section><section class="sjr06-categories"><h2>Kategori Laporan</h2>${categories.map(([icon,label,note,cat])=>`<button type="button" data-action="category" data-category="${cat}"><span class="ico">${renderIcon(icon,{size:20})}</span><span><b>${label}</b><small>${note}</small></span><span>${renderIcon('chevron',{size:17})}</span></button>`).join('')}</section><button type="button" class="sj-v26-history-entry" data-sj-sales-history-open="true"><span>${renderIcon('receipt',{size:21})}</span><span><b>Riwayat Penjualan</b><small>Lihat transaksi dan produk yang dijual · read-only</small></span><span>›</span></button></main>`;
}

export function installReportRefinement(runtime=globalThis){
  if(runtime?.__SJ_REF01_REPORT_REFINEMENT)return runtime.__SJ_REF01_REPORT_REFINEMENT;
  const report=runtime?.SJReportFoundationV010;
  const core=report?.Core;
  const api={installed:false};
  if(core&&typeof core.renderOwnerSummary==='function'){
    api.original=core.renderOwnerSummary;
    core.renderOwnerSummary=model=>renderRef01ReportSummary(model);
    api.installed=true;
  }
  Object.freeze(api);
  try{Object.defineProperty(runtime,'__SJ_REF01_REPORT_REFINEMENT',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
