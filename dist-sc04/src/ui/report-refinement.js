import { renderIcon } from './icons.js';
import { salesAnalytics, chartBucketsForScope } from '../domain/report-v28-analytics.js';
import { filterReportModel, reportScopePeriod, reportDateKey } from '../domain/report-v29-scope.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const rupiah=v=>v===null||v===undefined||!Number.isFinite(Number(v))?'Belum tersedia':`Rp ${Math.round(num(v)).toLocaleString('id-ID')}`;
const count=v=>Math.max(0,Math.round(num(v))).toLocaleString('id-ID');
const SHIFT_LABEL=Object.freeze({S1:'Shift Pagi',S2:'Shift Siang',S3:'Shift Malam'});

function localDate(value=Date.now()){
  const d=value instanceof Date?value:new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(ymd,delta){const [y,m,d]=String(ymd).split('-').map(Number),x=new Date(y,m-1,d,12);x.setDate(x.getDate()+Number(delta||0));return localDate(x)}
function activeDate(runtime){return String(runtime?.document?.getElementById?.('date-sel')?.value||localDate())}
function activeShift(runtime){const value=String(runtime?.document?.getElementById?.('shift-sel')?.value||runtime?.activeShift||'').toUpperCase();const m=value.match(/S[123]/);return m?m[0]:'S1'}
function stateFilters(state){
  if(state.scope==='shift')return{day:state.anchorDate,shift:state.shift==='ALL'?'S1':state.shift};
  if(state.scope==='day')return{day:state.anchorDate,shift:state.shift};
  if(state.scope==='week')return{day:state.day,shift:state.shift};
  if(state.scope==='month')return{week:state.week,shift:state.shift};
  return{shift:state.shift};
}

export function createCanonicalReportController({runtime=globalThis,report=runtime?.SJReportFoundationV010}={}){
  const anchor=activeDate(runtime),shift=activeShift(runtime);
  const state={scope:'day',anchorDate:anchor,shift:'ALL',day:'ALL',week:'ALL',metric:'revenue',topSort:'qty',customFrom:addDays(anchor,-29),customTo:anchor};
  function filteredModel(){return filterReportModel(report?.state?.model||{},stateFilters(state))}
  function setFilter(key,value){if(['shift','day','week','metric','topSort'].includes(key))state[key]=String(value||'ALL');return filteredModel()}
  async function applyScope(scope,{anchorDate:nextAnchor,from,to}={}){
    scope=String(scope||'day').toLowerCase();state.scope=['shift','day','week','month','custom'].includes(scope)?scope:'day';
    if(nextAnchor)state.anchorDate=String(nextAnchor);
    state.day='ALL';state.week='ALL';
    if(state.scope==='shift'){state.shift=state.shift==='ALL'?activeShift(runtime):state.shift}
    else if(state.scope!=='custom')state.shift='ALL';
    if(state.scope==='custom'){
      if(from)state.customFrom=String(from);if(to)state.customTo=String(to);
    }
    const period=reportScopePeriod({scope:state.scope,anchorDate:state.anchorDate,from:state.customFrom,to:state.customTo});
    report?.selectPeriod?.({preset:'custom',explicit:{...period.explicit}});
    await report?.open?.();return period;
  }
  function rerender(){return report?.open?.()}
  return Object.freeze({state,filteredModel,setFilter,applyScope,rerender,filters:()=>Object.freeze({...stateFilters(state)})});
}

function paymentMixHTML(rows=[]){
  const total=Math.max(1,rows.reduce((s,x)=>s+x.amount,0));
  if(!rows.length)return '<div class="sjv28-empty">Belum ada pembayaran pada scope ini.</div>';
  return `<div class="sjv28-paymix">${rows.map(row=>`<div><span><b>${esc(row.method)}</b><small>${count(row.count)} transaksi</small></span><span class="sjv28-paybar"><i style="width:${Math.max(3,Math.round(row.amount/total*100))}%"></i></span><strong>${rupiah(row.amount)}</strong></div>`).join('')}</div>`;
}
function chartHTML(transactions=[],state={}){
  const buckets=chartBucketsForScope(transactions,{scope:state.scope,shift:state.shift}),metric=state.metric||'revenue';
  const key=metric==='transactions'?'transactions':metric==='items'?'items':'revenue',max=Math.max(1,...buckets.map(x=>num(x[key]))),label=metric==='transactions'?'Transaksi':metric==='items'?'Item':'Omzet';
  return `<section class="sjv28-card sjv28-chart"><div class="sjv28-section-head"><div><h2>Grafik ${label}</h2><p>Bucket otomatis mengikuti scope laporan aktif.</p></div><div class="sjv28-toggle"><button data-v29-metric="revenue" data-v28-metric="revenue" class="${metric==='revenue'?'active':''}">Omzet</button><button data-v29-metric="transactions" data-v28-metric="transactions" class="${metric==='transactions'?'active':''}">Transaksi</button><button data-v29-metric="items" data-v28-metric="items" class="${metric==='items'?'active':''}">Item</button></div></div>${buckets.length?`<div class="sjv28-bars">${buckets.map(x=>`<div class="sjv28-bar-col" title="${esc(x.label)} · ${key==='revenue'?rupiah(x[key]):count(x[key])}"><div class="sjv28-bar-track"><i style="height:${Math.max(4,Math.round(num(x[key])/max*100))}%"></i></div><small>${esc(x.label)}</small></div>`).join('')}</div>`:'<div class="sjv28-empty">Belum ada data untuk grafik.</div>'}</section>`;
}
function topProductsHTML(analytics,state={}){
  const sort=state.topSort||'qty',rows=(sort==='revenue'?analytics.topByRevenue:analytics.topByQty).slice(0,5);
  return `<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Top Produk</h2><p>Mengikuti scope laporan aktif.</p></div><div class="sjv28-toggle"><button data-v29-top-sort="qty" data-v28-top-sort="qty" class="${sort==='qty'?'active':''}">Jumlah</button><button data-v29-top-sort="revenue" data-v28-top-sort="revenue" class="${sort==='revenue'?'active':''}">Omzet</button></div></div><div class="sjv28-top-products">${rows.length?rows.map((x,i)=>`<div><span class="rank">${i+1}</span><span><b>${esc(x.name)}</b><small>${count(x.qty)} item · ${count(x.transactions)} transaksi</small></span><strong>${sort==='revenue'?rupiah(x.revenue):count(x.qty)}</strong></div>`).join(''):'<div class="sjv28-empty">Belum ada produk terjual.</div>'}</div><button type="button" class="sj-v26-history-entry sjv28-inline-link" data-sj-sales-history-open="true">Lihat Semua &amp; Detail Item</button></section>`;
}
function hppHTML(summary={}){
  const state=summary?.costing?.state||'unknown';if(state==='unknown')return '<div class="sjv28-hpp-note"><b>HPP</b><span>Belum tersedia</span><small>Snapshot HPP historis yang tidak ada tidak dianggap Rp0.</small></div>';
  return `<div class="sjv28-hpp-note"><b>HPP${state==='partial'?' Tercatat':''}</b><span>${summary.cogs==null?'Belum tersedia':rupiah(summary.cogs)}</span><small>${state==='partial'?'Sebagian transaksi belum memiliki HPP.':'Snapshot HPP tersedia.'}</small></div>`;
}
function shiftFinance(shifts=[],core=null){
  const details=(shifts||[]).map(s=>{try{return core?.shiftDetail?.(s)||null}catch(_){return null}}).filter(Boolean);
  const sum=fn=>details.reduce((n,x)=>n+num(fn(x)),0),allActual=details.length>0&&details.every(x=>x.actualClosing!==null&&x.actualClosing!==undefined),allVariance=details.length>0&&details.every(x=>x.variance!==null&&x.variance!==undefined);
  return{count:details.length,openingCash:sum(x=>x.openingCash),sales:sum(x=>x.sales?.total),expenses:sum(x=>x.expenses?.total),expectedClosing:sum(x=>x.expectedClosing),actualClosing:allActual?sum(x=>x.actualClosing):null,variance:allVariance?sum(x=>x.variance):null};
}
function shiftFinanceHTML(shifts=[],core=null){
  const x=shiftFinance(shifts,core);return `<section class="sjv28-card sjv29-shift-finance"><div class="sjv28-section-head"><div><h2>Ringkasan Kas & Shift</h2><p>Ringkasan Shift · ${count(x.count)} shift pada scope aktif</p></div></div><div class="sjv29-finance-grid"><div><span>Kas Awal</span><b>${rupiah(x.openingCash)}</b></div><div><span>Penjualan</span><b>${rupiah(x.sales)}</b></div><div><span>Pengeluaran</span><b>${rupiah(x.expenses)}</b></div><div><span>Ekspektasi Kas</span><b>${rupiah(x.expectedClosing)}</b></div><div><span>Kas Penutupan</span><b>${rupiah(x.actualClosing)}</b></div><div><span>Selisih</span><b>${rupiah(x.variance)}</b></div></div></section>`;
}
function soldProductsHTML(analytics,compat){
  const rows=analytics.topByQty||[];return `<section class="sjv28-card sjv29-sold"><div class="sjv28-section-head"><div><h2>Barang Terjual</h2><p>Jumlah/omzet scope aktif · stok adalah saldo Gerai saat ini, bukan snapshot historis.</p></div></div><div class="sjv29-sold-head"><span>Produk</span><span>Terjual</span><span>Omzet</span><span>Stok Gerai Saat Ini</span></div><div class="sjv29-sold-list">${rows.length?rows.map(row=>{let stock=null;try{stock=compat?.outletStock?compat.outletStock(row.id):null}catch(_){}return `<div><span><b>${esc(row.name)}</b><small>${count(row.transactions)} transaksi</small></span><strong>${count(row.qty)}</strong><strong>${rupiah(row.revenue)}</strong><strong>${stock===null||stock===undefined?'Belum tersedia':count(stock)}</strong></div>`}).join(''):'<div class="sjv28-empty">Belum ada barang terjual pada scope ini.</div>'}</div></section>`;
}
function historyPreviewHTML(transactions=[]){
  const rows=(transactions||[]).filter(tx=>!['VOID','VOIDED','CANCELLED','CANCELED'].includes(String(tx?.status||'').toUpperCase())).slice().sort((a,b)=>num(b?.ts??b?.timestamp)-num(a?.ts??a?.timestamp)).slice(0,8);
  return `<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Riwayat Penjualan</h2><p>Scope aktif · klik transaksi untuk detail item.</p></div></div><div class="sjv28-history-preview">${rows.length?rows.map(tx=>{const id=String(tx.id??tx._key??tx.transactionId??'');return `<button type="button" data-v29-history-tx="${esc(id)}"><span><b>${esc(id||'Transaksi')}</b><small>${esc(String(tx.paymentMethod??tx.method??tx.payment?.method??'-'))}</small></span><strong>${rupiah(tx?.pricing?.total??tx?.grandTotal??tx?.total)}</strong></button>`}).join(''):'<div class="sjv28-empty">Belum ada transaksi.</div>'}</div><button type="button" class="sj-v26-history-entry" data-sj-sales-history-open="true"><span>${renderIcon('receipt',{size:20})}</span><span><b>Buka Riwayat Penjualan</b><small>Cari ID, filter pembayaran/kasir, dan detail item · read-only</small></span><span>›</span></button></section>`;
}
function shiftOptions(value='ALL',allowAll=true){return `${allowAll?`<option value="ALL" ${value==='ALL'?'selected':''}>Semua Shift</option>`:''}${['S1','S2','S3'].map(x=>`<option value="${x}" ${value===x?'selected':''}>${SHIFT_LABEL[x]}</option>`).join('')}`}
function dayOptions(model,value='ALL'){const days=[...new Set((model?.shifts||[]).map(reportDateKey).filter(Boolean))].sort();return `<option value="ALL">Semua Hari</option>${days.map(x=>`<option value="${x}" ${value===x?'selected':''}>${esc(x)}</option>`).join('')}`}
function scopeControlsHTML(state,model){
  const tabs=`<div class="sjv29-scopes">${[['shift','Shift'],['day','Hari'],['week','Minggu'],['month','Bulan Ini'],['custom','Custom']].map(([v,l])=>`<button type="button" data-v29-scope="${v}" class="${state.scope===v?'active':''}">${l}</button>`).join('')}</div>`;
  let controls='';
  if(state.scope==='shift')controls=`<label>Tanggal<input type="date" data-v29-anchor-date value="${esc(state.anchorDate)}"></label><label>Shift<select data-v29-filter="shift">${shiftOptions(state.shift,false)}</select></label>`;
  else if(state.scope==='day')controls=`<label>Tanggal<input type="date" data-v29-anchor-date value="${esc(state.anchorDate)}"></label><label>Shift<select data-v29-filter="shift">${shiftOptions(state.shift,true)}</select></label>`;
  else if(state.scope==='week')controls=`<label>Minggu yang memuat tanggal<input type="date" data-v29-anchor-date value="${esc(state.anchorDate)}"></label><label>Hari<select data-v29-filter="day">${dayOptions(model,state.day)}</select></label><label>Shift<select data-v29-filter="shift">${shiftOptions(state.shift,true)}</select></label>`;
  else if(state.scope==='month')controls=`<label>Bulan<input type="month" data-v29-month value="${esc(String(state.anchorDate).slice(0,7))}"></label><label>Minggu<select data-v29-filter="week"><option value="ALL">Semua Minggu</option>${[1,2,3,4,5].map(x=>`<option value="${x}" ${String(state.week)===String(x)?'selected':''}>Minggu ${x}</option>`).join('')}</select></label><label>Shift<select data-v29-filter="shift">${shiftOptions(state.shift,true)}</select></label>`;
  else controls=`<label>Dari<input type="date" data-v29-custom="from" value="${esc(state.customFrom)}"></label><label>Sampai<input type="date" data-v29-custom="to" value="${esc(state.customTo)}"></label><label>Shift<select data-v29-filter="shift">${shiftOptions(state.shift,true)}</select></label><button type="button" data-v29-custom-apply>Terapkan</button><button type="button" data-v29-custom-quick="7d">7 Hari</button><button type="button" data-v29-custom-quick="30d" data-v28-period="30d">30 Hari</button>`;
  return `${tabs}<div class="sjv29-scope-controls">${controls}</div>`;
}
function scopedSummary(base,model,core){
  try{return core?.summary?.({period:model?.period||base?.period,transactions:model?.transactions||[],expenses:model?.expenses||[],selectedShift:(model?.shifts||[]).length===1?model.shifts[0]:null,shifts:model?.shifts||[]})||base}catch(_){return base}
}
function contextTitle(state,model){
  if(state.scope==='shift')return `${state.anchorDate} · ${SHIFT_LABEL[state.shift]||'Shift'}`;
  if(state.scope==='day')return `${state.anchorDate}${state.shift!=='ALL'?` · ${SHIFT_LABEL[state.shift]||state.shift}`:' · Semua Shift'}`;
  if(state.scope==='week')return `${model?.period?.label||'Minggu Ini'}${state.day!=='ALL'?` · ${state.day}`:''}${state.shift!=='ALL'?` · ${SHIFT_LABEL[state.shift]||state.shift}`:''}`;
  if(state.scope==='month')return `${String(state.anchorDate).slice(0,7)}${state.week!=='ALL'?` · Minggu ${state.week}`:''}${state.shift!=='ALL'?` · ${SHIFT_LABEL[state.shift]||state.shift}`:''}`;
  return `${state.customFrom} – ${state.customTo}${state.shift!=='ALL'?` · ${SHIFT_LABEL[state.shift]||state.shift}`:''}`;
}

export function renderV29OwnerReport(summary={},fullModel={},context={}){
  const state=context.state||{scope:'day',anchorDate:localDate(),shift:'ALL',day:'ALL',week:'ALL',metric:'revenue',topSort:'qty',customFrom:addDays(localDate(),-29),customTo:localDate()},core=context.core||null,compat=context.compat||null;
  const scoped=scopedSummary(summary,fullModel,core),transactions=fullModel.transactions||[],analytics=salesAnalytics(transactions);
  return `<main class="sjr06-report sjv28-report sjv29-report sj-rep0" data-view="home" data-v29-report-scope="${esc(state.scope)}"><header class="sjr06-report-head"><div><h1>Laporan Penjualan</h1><p>${esc(contextTitle(state,fullModel))} · canonical read-only</p></div><button type="button" data-action="refresh" class="sjr06-refresh" aria-label="Segarkan laporan">${renderIcon('refresh',{size:19})}</button></header>${scopeControlsHTML(state,fullModel)}<section class="sjv28-kpis"><div class="primary"><small>Penjualan Bersih</small><strong>${rupiah(analytics.netSales)}</strong><span>VOID dikeluarkan · refund dikurangi</span></div><div><small>Transaksi</small><strong>${count(analytics.transactionCount)}</strong><span>Transaksi valid</span></div><div><small>Rata-rata Transaksi</small><strong>${rupiah(analytics.averageTransaction)}</strong><span>Penjualan bersih / transaksi</span></div><div><small>Item Terjual</small><strong>${count(analytics.itemCount)}</strong><span>Setelah refund</span></div></section>${hppHTML(scoped)}${shiftFinanceHTML(fullModel.shifts||[],core)}${chartHTML(transactions,state)}<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Metode Pembayaran</h2><p>Payment mix berdasarkan penjualan bersih pada scope aktif.</p></div></div>${paymentMixHTML(analytics.paymentMix)}</section>${topProductsHTML(analytics,state)}${soldProductsHTML(analytics,compat)}${historyPreviewHTML(transactions)}</main>`;
}

export function renderRef01ReportSummary(summary={},fullModel={}){return renderV29OwnerReport(summary,fullModel,{})}
export function renderV28OwnerReport(summary={},fullModel={}){return renderV29OwnerReport(summary,fullModel,{})}

export function renderV28CashierShift(baseHtml='',fullModel={},context={}){
  const transactions=fullModel.transactions||[],analytics=salesAnalytics(transactions),compat=context.compat||null;
  return `${baseHtml}<section class="sjv28-cashier-extra sjv29-cashier-extra"><div class="sjv28-kpis"><div><small>Transaksi</small><strong>${count(analytics.transactionCount)}</strong></div><div><small>Item Terjual</small><strong>${count(analytics.itemCount)}</strong></div></div><section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Metode Pembayaran</h2><p>Ringkasan Laporan Shift</p></div></div>${paymentMixHTML(analytics.paymentMix)}</section>${soldProductsHTML(analytics,compat)}<section class="sjv28-card"><div class="sjv28-section-head"><div><h2>Riwayat Penjualan</h2><p>read-only · transaksi pada Laporan Shift</p></div></div><button type="button" class="sj-v26-history-entry" data-sj-sales-history-open="true"><span>${renderIcon('receipt',{size:20})}</span><span><b>Buka Riwayat Penjualan</b><small>Detail transaksi dan item</small></span><span>›</span></button></section></section>`;
}

function bindReportInteractions(runtime,report,controller){
  const root=runtime?.document?.getElementById?.('lap-menu-view');if(!root||root.dataset?.v29ReportBound==='true')return false;root.dataset.v29ReportBound='true';
  root.addEventListener?.('click',async event=>{
    const metric=event.target?.closest?.('[data-v29-metric]');if(metric){controller.setFilter('metric',metric.dataset.v29Metric||'revenue');await controller.rerender();return}
    const top=event.target?.closest?.('[data-v29-top-sort]');if(top){controller.setFilter('topSort',top.dataset.v29TopSort||'qty');await controller.rerender();return}
    const scope=event.target?.closest?.('[data-v29-scope]');if(scope){await controller.applyScope(scope.dataset.v29Scope,{anchorDate:controller.state.anchorDate});return}
    const apply=event.target?.closest?.('[data-v29-custom-apply]');if(apply){const from=root.querySelector?.('[data-v29-custom="from"]')?.value,to=root.querySelector?.('[data-v29-custom="to"]')?.value;if(from&&to)await controller.applyScope('custom',{from,to});return}
    const quick=event.target?.closest?.('[data-v29-custom-quick]');if(quick){const to=controller.state.customTo||activeDate(runtime),days=quick.dataset.v29CustomQuick==='7d'?6:29,from=addDays(to,-days);await controller.applyScope('custom',{from,to});return}
    const tx=event.target?.closest?.('[data-v29-history-tx]');if(tx){runtime?.__SJ_V26_SALES_HISTORY?.openTransaction?.(tx.dataset.v29HistoryTx);return}
  });
  root.addEventListener?.('change',async event=>{
    const filter=event.target?.dataset?.v29Filter;if(filter){controller.setFilter(filter,event.target.value||'ALL');await controller.rerender();return}
    if(event.target?.dataset?.v29AnchorDate!==undefined){await controller.applyScope(controller.state.scope,{anchorDate:event.target.value});return}
    if(event.target?.dataset?.v29Month!==undefined&&event.target.value){await controller.applyScope('month',{anchorDate:`${event.target.value}-01`});return}
  });return true;
}

export function installReportRefinement(runtime=globalThis){
  if(runtime?.__SJ_REF01_REPORT_REFINEMENT)return runtime.__SJ_REF01_REPORT_REFINEMENT;
  const report=runtime?.SJReportFoundationV010,core=report?.Core,api={installed:false};
  if(core&&typeof core.renderOwnerSummary==='function'){
    const controller=createCanonicalReportController({runtime,report}),compat=runtime?.SJRef01ProductionSalesCompat||null;
    api.originalOwner=core.renderOwnerSummary;core.renderOwnerSummary=summary=>{const model=controller.filteredModel(),scoped=scopedSummary(summary,model,core);return renderV29OwnerReport(scoped,model,{state:controller.state,core,compat})};
    if(typeof core.renderCashierShift==='function'){
      api.originalCashier=core.renderCashierShift;core.renderCashierShift=detail=>{
        const model=filterReportModel(report?.state?.model||{},{day:activeDate(runtime),shift:activeShift(runtime)});
        return renderV28CashierShift(api.originalCashier(detail),model,{compat,core});
      };
    }
    try{Object.defineProperty(runtime,'__SJ_V29_REPORT_CONTROLLER',{value:controller,writable:false,configurable:false})}catch(_){}
    bindReportInteractions(runtime,report,controller);api.controller=controller;api.installed=true;
  }
  Object.freeze(api);try{Object.defineProperty(runtime,'__SJ_REF01_REPORT_REFINEMENT',{value:api,writable:false,configurable:false})}catch(_){}return api;
}
