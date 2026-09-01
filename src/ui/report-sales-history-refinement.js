import { aggregateProductLeaderboard, transactionItemLines } from '../domain/report-product-analytics.js';
import { renderIcon } from './icons.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const rupiah=v=>`Rp ${Math.round(num(v)).toLocaleString('id-ID')}`;
const roleOf=runtime=>{try{return runtime?.__SJ_SC03_RUNTIME?.guard?.currentRole?.()||'cashier'}catch(_){return'cashier'}};
const txId=tx=>String(tx?.id??tx?._key??tx?.transactionId??'-');
const txShift=tx=>String(tx?._shift??tx?.shift??'-');
const txMethod=tx=>String(tx?.paymentMethod??tx?.method??tx?.payment?.method??tx?.payment??'-');
const txCashier=tx=>String(tx?.cashierName??tx?.kasir??tx?.processedBy??tx?.userName??'-');
const txTime=tx=>{
  const raw=tx?.ts??tx?.timestamp??tx?.createdTs??tx?.createdAt??tx?.time;
  const d=typeof raw==='number'?new Date(raw):new Date(raw||0);
  return Number.isFinite(d.getTime())&&d.getTime()>0?d.toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):String(tx?.time||'Waktu tidak tersedia');
};
const txStatus=tx=>String(tx?.status||'RECORDED').toUpperCase();
const txTotal=tx=>num(tx?.pricing?.total??tx?.total??tx?.grandTotal);

function options(values,current,label){
  return `<option value="">${esc(label)}</option>${[...new Set(values.filter(Boolean))].sort().map(v=>`<option value="${esc(v)}" ${String(v)===String(current)?'selected':''}>${esc(v)}</option>`).join('')}`;
}
function matchesFilters(tx,filters){
  if(filters.shift&&txShift(tx)!==filters.shift)return false;
  if(filters.method&&txMethod(tx)!==filters.method)return false;
  if(filters.cashier&&txCashier(tx)!==filters.cashier)return false;
  const q=String(filters.query||'').trim().toLowerCase();if(!q)return true;
  const itemText=transactionItemLines(tx).map(x=>`${x.name} ${x.sku}`).join(' ');
  return `${txId(tx)} ${txShift(tx)} ${txCashier(tx)} ${txMethod(tx)} ${itemText}`.toLowerCase().includes(q);
}
function visibleTransactions(transactions,filters){
  return (transactions||[]).filter(tx=>matchesFilters(tx,filters)).sort((a,b)=>num(b?.ts??b?.timestamp)-num(a?.ts??a?.timestamp));
}
function leaderContent(visible,sortBy){
  const leaders=aggregateProductLeaderboard(visible,{sortBy}).slice(0,5);
  const max=Math.max(1,...leaders.map(x=>sortBy==='revenue'?x.revenue:x.qty));
  return `<div class="sj-v26-section-head"><div><h2>Produk Terlaris</h2><p>Urutkan berdasarkan jumlah atau omzet</p></div><div class="sj-v26-rank-toggle"><button type="button" data-sales-rank="qty" class="${sortBy==='qty'?'active':''}">Jumlah Terjual</button><button type="button" data-sales-rank="revenue" class="${sortBy==='revenue'?'active':''}">Omzet</button></div></div>${leaders.length?leaders.map((x,i)=>{const value=sortBy==='revenue'?x.revenue:x.qty,pct=Math.max(6,Math.round(value/max*100));return `<article class="sj-v26-rank-row"><b>${i+1}</b><div><strong>${esc(x.name)}</strong><small>${x.qty.toLocaleString('id-ID')} item · ${rupiah(x.revenue)} · ${x.transactions} transaksi</small><span><i style="width:${pct}%"></i></span></div><em>${sortBy==='revenue'?rupiah(x.revenue):`${x.qty.toLocaleString('id-ID')} item`}</em></article>`}).join(''):'<div class="sj-v26-empty">Belum ada produk terjual pada periode/filter ini.</div>'}`;
}
function historyListContent(visible){
  return `<div class="sj-v26-section-head"><div><h2>Transaksi</h2><p>Klik transaksi untuk melihat produk yang dijual.</p></div></div>${visible.length?visible.map(tx=>{const lines=transactionItemLines(tx),units=lines.reduce((s,x)=>s+x.netQty,0);return `<button type="button" class="sj-v26-tx-row" data-sales-tx="${esc(txId(tx))}"><span class="ico">${renderIcon('receipt',{size:20})}</span><span><b>${esc(txId(tx))}</b><small>${esc(txTime(tx))} · ${esc(txShift(tx))} · ${esc(txCashier(tx))}</small><small>${units} item · ${esc(txMethod(tx))} · ${esc(txStatus(tx))}</small></span><strong>${rupiah(txTotal(tx))}</strong><span class="arrow">›</span></button>`}).join(''):'<div class="sj-v26-empty">Tidak ada transaksi pada filter ini.</div>'}`;
}

export function resolveSalesHistoryModel(runtime=globalThis,report=runtime?.SJReportFoundationV010){
  try{
    const canonical=runtime?.__SJ_V29_REPORT_CONTROLLER?.filteredModel?.();
    if(canonical&&typeof canonical==='object')return canonical;
  }catch(_){}
  return report?.state?.model||{period:{label:'Periode terpilih'},transactions:[]};
}

export function renderSalesHistory({transactions=[],periodLabel='Periode terpilih',sortBy='qty',filters={},canonicalScope=false}={}){
  const visible=visibleTransactions(transactions,filters);
  const shifts=(transactions||[]).map(txShift).filter(v=>v&&v!=='-');
  const methods=(transactions||[]).map(txMethod).filter(v=>v&&v!=='-');
  const cashiers=(transactions||[]).map(txCashier).filter(v=>v&&v!=='-');
  const periodControls=canonicalScope?'':`<section class="sj-v26-history-periods"><button type="button" data-sales-period="today">Hari Ini</button><button type="button" data-sales-period="yesterday">Kemarin</button><button type="button" data-sales-period="7d">7 Hari</button><button type="button" data-sales-period="month">Bulan Ini</button><label>Pilih Tanggal<input type="date" data-sales-period-date></label></section>`;
  return `<main class="sj-v26-sales-history" data-sj-v26-view="history"><header class="sj-v26-history-head"><button type="button" data-sales-action="back">${renderIcon('chevron-left',{size:18})}<span>Kembali</span></button><div><h1>Riwayat Penjualan</h1><p>${esc(periodLabel)} · <span data-sales-visible-count>${visible.length}</span> transaksi</p></div></header>${periodControls}<section class="sj-v26-history-filters"><select data-sales-filter="shift">${options(shifts,filters.shift,'Semua Shift')}</select><select data-sales-filter="method">${options(methods,filters.method,'Semua Pembayaran')}</select><select data-sales-filter="cashier">${options(cashiers,filters.cashier,'Semua Kasir')}</select><input data-sales-filter="query" value="${esc(filters.query||'')}" placeholder="Cari ID transaksi / produk"></section><section class="sj-v26-leader" data-sales-results="leader">${leaderContent(visible,sortBy)}</section><section class="sj-v26-history-list" data-sales-results="transactions">${historyListContent(visible)}</section></main>`;
}

export function renderSalesTransactionDetail(tx={}, {core=null,role='cashier'}={}){
  const lines=transactionItemLines(tx),detail=core?.transactionDetail?core.transactionDetail(tx):null;
  const pricing=detail?.pricing||tx?.pricing||{},payment=detail?.payment||{},units=lines.reduce((s,x)=>s+x.netQty,0);
  return `<main class="sj-v26-sales-history" data-sj-v26-view="detail"><header class="sj-v26-history-head"><button type="button" data-sales-action="history">${renderIcon('chevron-left',{size:18})}<span>Riwayat</span></button><div><h1>Detail Transaksi</h1><p>${esc(txId(tx))} · ${esc(txTime(tx))}</p></div></header><section class="sj-v26-detail-meta"><div><span>Shift</span><b>${esc(txShift(tx))}</b></div><div><span>Kasir</span><b>${esc(txCashier(tx))}</b></div><div><span>Pembayaran</span><b>${esc(payment.method||txMethod(tx))}</b></div><div><span>Status</span><b>${esc(detail?.status||payment.status||txStatus(tx))}</b></div></section><section class="sj-v26-detail-items"><div class="sj-v26-section-head"><div><h2>Produk Terjual</h2><p>${units} item setelah refund</p></div></div>${lines.length?lines.map(line=>`<article class="sj-v26-detail-line"><div><b>${esc(line.name)}</b><small>${line.variant?`${esc(line.variant)} · `:''}${rupiah(line.unitPrice)} / item</small>${line.refundedQty?`<em>Refund ${line.refundedQty} · tersisa ${line.netQty} item</em>`:''}</div><span>${line.netQty} item</span><strong>${rupiah(line.netRevenue)}</strong></article>`).join(''):'<div class="sj-v26-empty">Detail item historis tidak tersedia.</div>'}</section><section class="sj-v26-detail-totals"><div><span>Subtotal</span><b>${rupiah(pricing.subtotal??tx?.subtotal??txTotal(tx))}</b></div><div><span>Diskon</span><b>-${rupiah(pricing.totalDiscount??pricing.discountTotal??0)}</b></div><div><span>Total</span><strong>${rupiah(pricing.total??txTotal(tx))}</strong></div>${detail?.refund?.total?`<div><span>Refund</span><b>-${rupiah(detail.refund.total)}</b></div>`:''}</section><aside class="sj-v26-readonly">${role==='owner'?'Detail laporan bersifat read-only. Tindakan Refund/VOID tetap melalui alur operasional Owner.':'Detail laporan bersifat read-only untuk Kasir.'}</aside></main>`;
}

export function installSalesHistoryRefinement(runtime=globalThis){
  if(runtime?.__SJ_V26_SALES_HISTORY)return runtime.__SJ_V26_SALES_HISTORY;
  const report=runtime?.SJReportFoundationV010,document=runtime?.document;
  if(!report?.state||!report?.Core)return Object.freeze({installed:false});
  const state={sortBy:'qty',filters:{},view:'default',transactionId:''};
  const entryMarkup=()=>`<button type="button" class="sj-v26-history-entry" data-sj-sales-history-open="true"><span>${renderIcon('receipt',{size:21})}</span><span><b>Riwayat Penjualan</b><small>Lihat transaksi dan produk yang dijual · read-only</small></span><span>›</span></button>`;
  const ownerBase=report.Core.renderOwnerSummary?.bind(report.Core),cashierBase=report.Core.renderCashierShift?.bind(report.Core);
  if(ownerBase)report.Core.renderOwnerSummary=model=>{const html=ownerBase(model);return /data-sj-sales-history-open/.test(html)?html:html.replace(/<\/main>\s*$/i,`${entryMarkup()}</main>`)};
  if(cashierBase)report.Core.renderCashierShift=data=>{const html=cashierBase(data);return /data-sj-sales-history-open/.test(html)?html:html.replace(/<\/div>\s*$/i,`${entryMarkup()}</div>`)};
  function root(){return document?.getElementById?.('lap-menu-view')||null}
  function model(){return resolveSalesHistoryModel(runtime,report)}
  function show(html){const el=root();if(!el)return false;const container=document?.getElementById?.('lap-container-view');if(container)container.style.display='none';el.style.display='block';el.innerHTML=html;return true}
  function bindResultEvents(el){
    el?.querySelectorAll?.('[data-sales-rank]')?.forEach?.(b=>b.addEventListener?.('click',()=>{state.sortBy=b.dataset.salesRank==='revenue'?'revenue':'qty';openHistory()}));
    el?.querySelectorAll?.('[data-sales-tx]')?.forEach?.(b=>b.addEventListener?.('click',()=>openTransaction(b.dataset.salesTx)));
  }
  function refreshHistoryResults(){
    const el=root(),m=model();if(!el)return false;
    const visible=visibleTransactions(m.transactions||[],state.filters);
    const leader=el.querySelector?.('[data-sales-results="leader"]');
    const list=el.querySelector?.('[data-sales-results="transactions"]');
    const count=el.querySelector?.('[data-sales-visible-count]');
    if(leader)leader.innerHTML=leaderContent(visible,state.sortBy);
    if(list)list.innerHTML=historyListContent(visible);
    if(count)count.textContent=String(visible.length);
    bindResultEvents(el);
    return true;
  }
  function bindHistory(){
    const el=root();if(!el)return;
    el.querySelectorAll?.('[data-sales-filter]')?.forEach?.(node=>{
      const event=node.tagName==='INPUT'?'input':'change';
      node.addEventListener?.(event,()=>{
        state.filters[node.dataset.salesFilter]=node.value;
        if(node.dataset.salesFilter==='query'){refreshHistoryResults();return}
        openHistory();
      });
    });
    bindResultEvents(el);
    el.querySelector?.('[data-sales-action="back"]')?.addEventListener?.('click',()=>{state.view='default';report.open?.()});
    el.querySelectorAll?.('[data-sales-period]')?.forEach?.(b=>b.addEventListener?.('click',async()=>{report.selectPeriod?.(b.dataset.salesPeriod);await report.refresh?.();openHistory()}));
    el.querySelector?.('[data-sales-period-date]')?.addEventListener?.('change',async e=>{if(!e.target?.value)return;report.selectPeriod?.({preset:'custom',explicit:{from:e.target.value,to:e.target.value}});await report.refresh?.();openHistory()});
  }
  function openHistory(){
    state.view='history';const m=model();
    show(renderSalesHistory({transactions:m.transactions||[],periodLabel:m.period?.label||m.summary?.period?.label||'Periode terpilih',sortBy:state.sortBy,filters:state.filters,canonicalScope:!!runtime?.__SJ_V29_REPORT_CONTROLLER}));
    bindHistory();return true;
  }
  function openTransaction(id){
    const tx=(model().transactions||[]).find(x=>txId(x)===String(id));if(!tx)return false;
    state.view='detail';state.transactionId=String(id);
    show(renderSalesTransactionDetail(tx,{core:report.Core,role:roleOf(runtime)}));
    root()?.querySelector?.('[data-sales-action="history"]')?.addEventListener?.('click',openHistory);return true;
  }
  if(document?.addEventListener&&!document.__sjV27SalesHistoryDelegated){
    document.__sjV27SalesHistoryDelegated=true;
    document.addEventListener('click',event=>{const trigger=event.target?.closest?.('[data-sj-sales-history-open]');if(!trigger)return;event.preventDefault?.();openHistory()});
  }
  function enhance(){return !!root()?.querySelector?.('[data-sj-sales-history-open]')}
  const api=Object.freeze({installed:true,openHistory,openTransaction,refreshHistoryResults,enhance,state});
  try{Object.defineProperty(runtime,'__SJ_V26_SALES_HISTORY',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
