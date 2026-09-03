import { renderIcon } from './icons.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const money=v=>`Rp ${Math.round(num(v)).toLocaleString('id-ID')}`;
const optionalMoney=v=>v===null||v===undefined?'Belum tersedia':money(v);
const nullableNum=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
function monthLabel(value=''){const raw=String(value||'');if(!/^\d{4}-\d{2}$/.test(raw))return raw||'Bulan ini';try{return new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(`${raw}-15T12:00:00+07:00`))}catch(_){return raw}}

function dateLabel(value=''){
  const raw=String(value||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw||'Hari ini';
  try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(`${raw}T12:00:00+07:00`)).replace(/\./g,'')}catch(_){return raw}
}
function issueRows(m){
  const rows=[];
  if(num(m.out)||num(m.low))rows.push({icon:'inventory',title:'Stok perlu ditindaklanjuti',detail:[num(m.out)?`${num(m.out)} habis`:null,num(m.low)?`${num(m.low)} menipis`:null].filter(Boolean).join(' • '),action:'showView(2);openOpr(3)'});
  if(num(m.pending))rows.push({icon:'restock',title:'Restock perlu tindakan',detail:`${num(m.pending)} permintaan aktif`,action:'showView(2);openOpr(9);SJX.renderRestockPage()'});
  if(num(m.debt))rows.push({icon:'debt',title:'Hutang pelanggan aktif',detail:`${num(m.debtCustomers)||1} pelanggan • ${money(m.debt)}`,action:'showView(2);openOpr(5)'});
  return rows;
}
function statusForShift(row){if(!row)return'BELUM ADA DATA';if(row.status)return String(row.status);if(row.diff!==null&&row.diff!==undefined)return'DITUTUP';return row.cashier&&row.cashier!=='-'?'AKTIF':'BELUM MULAI'}

export function normalizeOwnerHybridModel(input={}){
  const selected=input.selectedShift||null,f=input.finance&&typeof input.finance==='object'?input.finance:null;
  const finance=f?Object.freeze({period:String(f.period||''),periodLabel:monthLabel(f.period),cashAvailable:nullableNum(f.cashAvailable),opening:num(f.opening),additional:num(f.additional),prive:num(f.prive),netSales:num(f.netSales),businessExpenses:num(f.businessExpenses),netProfit:nullableNum(f.netProfit),hppKnown:f.hppKnown===true,calculatedEnding:nullableNum(f.calculatedEnding),unavailable:f.unavailable===true}):null;
  return Object.freeze({
    name:String(input.name||'Owner Utama'),online:input.online!==false,date:String(input.date||''),dateLabel:dateLabel(input.date),shiftLabel:String(input.shiftLabel||selected?.label||'Semua Shift'),
    sales:num(input.sales),cash:num(input.cash),txCount:num(input.txCount),qty:num(input.qty),expense:num(input.expense),debt:num(input.debt),debtCustomers:num(input.debtCustomers),pending:num(input.pending),low:num(input.low),out:num(input.out),finance,
    selectedShift:selected?Object.freeze({key:String(selected.key||''),label:String(selected.label||input.shiftLabel||'Shift'),cashier:String(selected.cashier||''),sales:num(selected.sales),expense:num(selected.expense),expected:num(selected.expected),diff:selected.diff===null||selected.diff===undefined?null:num(selected.diff),status:statusForShift(selected)}):null
  });
}

export function ownerHybridMarkup(input={}){
  const m=normalizeOwnerHybridModel(input),issues=issueRows(m),shift=m.selectedShift;
  const shiftMetrics=shift?[
    ['Penjualan',money(shift.sales)],['Pengeluaran',money(shift.expense)],['Kas Seharusnya',money(shift.expected)],['Status',shift.status]
  ]:[['Penjualan',money(m.sales)],['Pengeluaran',money(m.expense)],['Transaksi',String(m.txCount)],['Item',String(m.qty)]];
  const shiftAction=shift?.key?`sjOpenOwnerShiftDetail('${esc(shift.key).replace(/&#39;/g,"\\'")}')`:'showView(2);openOpr(1);SJShift.render()';
  const attention=issues.length?issues.map(x=>`<button class="sj-v31-owner-att-row" onclick="${x.action}"><span class="ico">${renderIcon(x.icon,{size:20})}</span><span><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></span><em>›</em></button>`).join(''):`<div class="sj-v31-owner-allgood"><span>${renderIcon('check',{size:19})}</span><span><b>Tidak ada tindakan mendesak</b><small>Stok, restock, dan hutang dalam kondisi terkendali.</small></span></div>`;
  const f=m.finance,financeSummary=f?`<section class="sjvc01-section sj-v31-owner-section sj-v31-owner-finance" data-sj-owner-finance="true"><div class="sjvc01-section-head"><div><h3>Ringkasan Keuangan Bulan Ini</h3><small>${esc(f.periodLabel)}</small></div><button onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance')">Keuangan ›</button></div>${f.unavailable?'<div class="sj-v31-fin-unavailable">Data Finance belum tersedia. Buka Keuangan untuk mencoba memuat ulang.</div>':`<div class="sj-v31-fin-grid"><button onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance')"><span>${renderIcon('cash',{size:18})}</span><small>Modal Awal</small><strong>${money(f.opening)}</strong></button><button onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance')"><span>${renderIcon('reports',{size:18})}</span><small>Penjualan Bersih</small><strong>${money(f.netSales)}</strong></button><button onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance')"><span>${renderIcon('cash',{size:18})}</span><small>Pengeluaran Usaha</small><strong>${money(f.businessExpenses)}</strong></button><button onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance')"><span>${renderIcon('receipt',{size:18})}</span><small>Prive Owner</small><strong>${money(f.prive)}</strong></button><button onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance')"><span>${renderIcon('reports',{size:18})}</span><small>Laba Bersih</small><strong class="${f.netProfit==null?'unknown':'positive'}">${optionalMoney(f.netProfit)}</strong>${f.hppKnown?'':'<em>HPP belum lengkap</em>'}</button><button onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance-close')"><span>${renderIcon('cash',{size:18})}</span><small>Modal Akhir</small><strong class="${f.calculatedEnding==null?'unknown':'positive'}">${optionalMoney(f.calculatedEnding)}</strong><em>Bukan Kas Tersedia</em></button></div>`}</section>`:'';
  return `<main class="sjvc01-dashboard sjvc01-owner sj-v31-owner-hybrid" data-sj-v31-owner-hybrid="true">
    <header class="sjvc01-top"><div><h1>Beranda</h1><p>Selamat pagi, ${esc(m.name)} 👋</p></div><div class="sjvc01-tools"><button class="sjvc01-tool" onclick="SJX.openNotifications()" aria-label="Notifikasi">${renderIcon('notification',{size:20})}<b class="sjx-badge" style="display:none">0</b></button><button class="sjvc01-tool sjvc01-help" onclick="try{showToast('Bantuan tersedia melalui Pengaturan dan Diagnostik.','info')}catch(_){}" aria-label="Bantuan">?</button></div></header>
    <section class="sjvc01-profile" onclick="SJAccountV5964&&SJAccountV5964.open&&SJAccountV5964.open()"><div class="sjvc01-avatar">${esc(m.name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'OU')}</div><div><h2>${esc(m.name)}</h2><span class="sjvc01-role">♛ Owner / Pemilik</span><span class="sjvc01-sync"><i>✓</i>${m.online?'Akun aman & tersinkronisasi':'Mode offline • data lokal aktif'}</span><small>${m.online?'Terakhir tersinkronisasi • Hari ini':'Sinkronisasi dilanjutkan saat online'}</small></div><span class="sjvc01-chevron">›</span></section>
    <button class="sj-v31-owner-scope" type="button" onclick="window.__SJ_SALES_SHIFT_UX&&window.__SJ_SALES_SHIFT_UX.history&&window.__SJ_SALES_SHIFT_UX.history.openSheet()"><span>${renderIcon('calendar',{size:18})}<b>${esc(m.dateLabel)}</b></span><span>${renderIcon('activity',{size:18})}<b>${esc(m.shiftLabel)}</b></span><em class="${m.online?'online':'offline'}">${m.online?'● ONLINE':'OFFLINE'}</em></button>
    <section class="sj-v31-owner-kpis"><button type="button" data-sj-owner-kpi="sales-report" onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('sales-report')"><span class="ico">${renderIcon('reports',{size:20})}</span><label>Penjualan</label><strong>${money(m.sales)}</strong><small>Hari ini</small></button><button type="button" data-sj-owner-kpi="cash-shift" onclick="${shiftAction}"><span class="ico">${renderIcon('cash',{size:20})}</span><label>Kas Tersedia</label><strong>${money(m.cash)}</strong><small>Kas laci aktif</small></button><button type="button" data-sj-owner-kpi="transactions" onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('transactions')"><span class="ico">${renderIcon('receipt',{size:20})}</span><label>Transaksi</label><strong>${m.txCount}</strong><small>Transaksi valid</small></button><button type="button" data-sj-owner-kpi="sold-items" onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('sold-items')"><span class="ico">${renderIcon('product',{size:20})}</span><label>Item Terjual</label><strong>${m.qty}</strong><small>Barang terjual</small></button></section>
    <button class="sj-v31-owner-daily-flow" type="button" onclick="showView(2);openOpr(7)"><span class="ico">${renderIcon('cash',{size:18})}</span><span><small>Pengeluaran Hari Ini</small><b>${money(m.expense)}</b></span><em>Lihat rincian ›</em></button>
    ${financeSummary}
    <section class="sjvc01-section sj-v31-owner-section"><div class="sjvc01-section-head"><h3>Perlu Perhatian</h3><button onclick="SJX.openNotifications()">Lihat semua ›</button></div><div class="sj-v31-owner-attention">${attention}</div></section>
    <section class="sjvc01-section sj-v31-owner-section"><div class="sjvc01-section-head"><h3>Aksi Cepat</h3></div><div class="sj-v31-owner-quick"><button onclick="showView(1)">${renderIcon('cart',{size:21})}<span>Penjualan</span></button><button onclick="showView(2);openOpr(3)">${renderIcon('inventory',{size:21})}<span>Stok</span></button><button onclick="showView(2);openOpr(7)">${renderIcon('cash',{size:21})}<span>Pengeluaran</span></button><button onclick="showView(2);openOpr(1);SJShift.render()">${renderIcon('activity',{size:21})}<span>Shift</span></button><button onclick="showView(3)">${renderIcon('reports',{size:21})}<span>Laporan</span></button><button data-sj-owner-quick="finance" onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance')">${renderIcon('cash',{size:21})}<span>Keuangan</span></button><button data-sj-owner-quick="finance-close" onclick="__SJ_V31_OWNER_DASHBOARD_HYBRID.navigate('finance-close')">${renderIcon('receipt',{size:21})}<span>Tutup Bulan</span></button></div></section>
    <section class="sjvc01-section sj-v31-owner-section"><div class="sjvc01-section-head"><h3>Ringkasan Shift</h3><button onclick="${shiftAction}">Lihat detail ›</button></div><button class="sj-v31-owner-shift" onclick="${shiftAction}"><span class="sj-v31-owner-shift-head"><span><b>${esc(shift?.label||m.shiftLabel)}</b><small>${esc(shift?.cashier||'Ringkasan scope aktif')}</small></span><em>${esc(shift?.status||'RINGKASAN')}</em></span><span class="sj-v31-owner-shift-metrics">${shiftMetrics.map(([k,v])=>`<span><small>${esc(k)}</small><strong>${esc(v)}</strong></span>`).join('')}</span></button></section>
  </main>`;
}

function currentScope(runtime){
  const document=runtime?.document;
  const date=String(document?.getElementById?.('date-sel')?.value||'');
  const shiftValue=String(document?.getElementById?.('shift-sel')?.value||'');
  let shiftLabel='Semua Shift';
  try{shiftLabel=String(document?.getElementById?.('shift-sel')?.selectedOptions?.[0]?.textContent||runtime?.SJShift?.label?.(shiftValue)||'Semua Shift')}catch(_){}
  return{date,shiftValue,shiftLabel};
}

function afterReportRender(runtime,fn,attempt=0){
  const defer=typeof runtime?.setTimeout==='function'?runtime.setTimeout.bind(runtime):setTimeout;
  defer(()=>{
    try{if(fn())return}catch(_){}
    if(attempt<7)afterReportRender(runtime,fn,attempt+1);
  },attempt?60:0);
}
export function createOwnerDashboardNavigator(runtime){
  const showReport=()=>{try{runtime?.showView?.(3);return true}catch(_){return false}};
  async function applyActiveScope(){
    const scope=currentScope(runtime),controller=runtime?.__SJ_V29_REPORT_CONTROLLER,shift=(String(scope.shiftValue||'').toUpperCase().match(/S[123]/)||[])[0]||'ALL';
    showReport();
    if(controller&&scope.date){await controller.applyScope?.('day',{anchorDate:scope.date});controller.setFilter?.('shift',shift);await controller.rerender?.()}
    return true;
  }
  return async function navigate(action){
    if(action==='finance'||action==='finance-close'){showReport();afterReportRender(runtime,()=>{const finance=runtime?.__SJ_REF01_RUNTIME?.financeWorkspace;if(typeof finance?.setSurface!=='function')return false;finance.setSurface('finance');finance.setTab?.(action==='finance-close'?'close':'summary');return true});return true}
    if(action==='sales-report'){await applyActiveScope();return true}
    if(action==='transactions'){
      await applyActiveScope();
      afterReportRender(runtime,()=>{const api=runtime?.__SJ_V26_SALES_HISTORY;if(typeof api?.openHistory==='function'){api.openHistory();return true}return false});
      return true;
    }
    if(action==='sold-items'){
      await applyActiveScope();
      afterReportRender(runtime,()=>{const el=runtime?.document?.querySelector?.('.sjv29-sold,.sjv30-sold-list')?.closest?.('.sjv29-sold')||runtime?.document?.querySelector?.('.sjv29-sold');if(!el)return false;el.scrollIntoView?.({block:'start',behavior:'smooth'});return true});
      return true;
    }
    return false;
  };
}

export function installOwnerDashboardHybrid(runtime=globalThis){
  if(runtime?.__SJ_V31_OWNER_DASHBOARD_HYBRID)return runtime.__SJ_V31_OWNER_DASHBOARD_HYBRID;
  const role=runtime?.SJRefinementRoleDashboardV100,sjx=runtime?.SJX;
  if(!role||typeof role.ownerModel!=='function'||typeof role.ownerHTML!=='function')return Object.freeze({installed:false});
  let lastDay=null;
  const originalDay=typeof sjx?.dayModel==='function'?sjx.dayModel.bind(sjx):null;
  if(originalDay&&!sjx.__sjV31HybridDayCache){
    sjx.dayModel=async function(...args){const result=await originalDay(...args);lastDay=result;return result};
    try{Object.defineProperty(sjx,'__sjV31HybridDayCache',{value:true,enumerable:false})}catch(_){}
  }
  const baseModel=role.ownerModel.bind(role);
  role.ownerModel=async function(){
    const base=await baseModel(),day=lastDay||{};const scope=currentScope(runtime),rows=Array.isArray(day.shiftRows)?day.shiftRows:[];
    const selected=rows.find(row=>scope.shiftValue&&String(row?.key||'').endsWith(scope.shiftValue))||rows.find(row=>row?.diff==null&&row?.cashier&&row.cashier!=='-')||rows[0]||null;
    const period=/^\d{4}-\d{2}/.test(scope.date)?scope.date.slice(0,7):new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(new Date()).slice(0,7);
    let finance=null;const service=runtime?.__SJ_P4_FINANCE_RUNTIME?.finance;
    if(typeof service?.loadMonth==='function'){try{const loaded=await service.loadMonth(period),p=loaded?.model?.profit||{},c=loaded?.model?.ownerCapital||{},cash=loaded?.model?.cashPosition||{};finance={period,cashAvailable:cash.available,opening:c.opening,additional:c.additional,prive:c.prive,netSales:p.netSales,businessExpenses:p.businessExpenses,netProfit:p.netProfit,hppKnown:p.cogsKnown===true,calculatedEnding:c.calculatedEnding}}catch(_){finance={period,unavailable:true}}}
    return normalizeOwnerHybridModel(Object.assign({},base,{date:scope.date,shiftLabel:scope.shiftLabel,qty:num(day.qty),expense:num(day.expense),finance,selectedShift:selected?Object.assign({},selected,{label:scope.shiftLabel}):null}));
  };
  role.ownerHTML=m=>ownerHybridMarkup(m);
  try{
    const active=runtime?.document?.getElementById?.('view5')?.classList?.contains?.('active');
    if(active&&typeof role.render==='function'){
      const defer=typeof runtime?.setTimeout==='function'?runtime.setTimeout.bind(runtime):setTimeout;
      defer(()=>role.render(),0);
    }
  }catch(_){}
  const api=Object.freeze({installed:true,ownerHTML:ownerHybridMarkup,normalize:normalizeOwnerHybridModel,navigate:createOwnerDashboardNavigator(runtime)});
  try{Object.defineProperty(runtime,'__SJ_V31_OWNER_DASHBOARD_HYBRID',{value:api,writable:false,configurable:false,enumerable:false})}catch(_){}
  return api;
}
