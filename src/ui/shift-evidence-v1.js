import { POS_ROOT } from '../data/firebase-client.js';
import {
  buildFinishedGoodsShiftSnapshot,
  buildFinishedGoodsShiftSummary,
  augmentShiftStockEvidenceUpdates
} from '../domain/shift-stock-evidence-v1.js';

const text=v=>String(v??'').trim();
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qty=v=>v===null||v===undefined?'—':Number(v).toLocaleString('id-ID');

function currentShiftKey(runtime){
  const date=text(runtime?.document?.getElementById?.('date-sel')?.value);
  const suffix=text(runtime?.document?.getElementById?.('shift-sel')?.value);
  return date&&suffix?`${date}${suffix}`:'';
}
function currentShiftSuffix(runtime){const key=currentShiftKey(runtime);return key?key.slice(-3):''}
function menuRows(runtime){
  const rows=runtime?.cloudData?.global?.menu;
  if(Array.isArray(rows))return rows;
  try{
    const value=runtime?.Function?runtime.Function('try{return typeof cloudData!=="undefined"?cloudData.global.menu:[]}catch(_){return []}')():[];
    return Array.isArray(value)?value:[];
  }catch(_){return[]}
}
function values(row){return row&&typeof row==='object'?Object.values(row):[]}

export function cupEvidenceFromShift(row={}){
  const cup=row?.cupControl||{},snap=row?.closingSnapshot?.cupControl||{};
  const reconciliation=cup.reconciliation||snap.reconciliation||null;
  const opening=cup.opening||null,restock=cup.restock||snap.restock||null,closing=cup.closing||snap.closing||null;
  return {opening,restock,closing,reconciliation};
}

function cupStatusLabel(status,variance){
  const s=text(status).toUpperCase();
  if(s==='MATCH')return 'Sesuai';
  if(s==='SHORTAGE')return 'Kurang';
  if(s==='MORE')return 'Lebih';
  if(s==='NEEDS_ATTENTION')return 'Perlu perhatian';
  return variance===0?'Sesuai':'Perlu perhatian';
}

export function renderCupShiftEvidenceDetail(row={}){
  const evidence=cupEvidenceFromShift(row),rows=evidence.reconciliation?.rows||[];
  if(!rows.length)return '<div class="sj-shift-evidence-empty">Riwayat Cup belum tersedia untuk shift ini.</div>';
  const transactionUsed=rows.reduce((a,x)=>a+Math.max(0,num(x.transactionUsage)),0);
  const physicalUsed=rows.reduce((a,x)=>a+Math.max(0,num(x.physicalUsed)),0);
  const physicalClosing=rows.reduce((a,x)=>a+Math.max(0,num(x.physicalClosing??x.closing)),0);
  const attention=rows.filter(x=>text(x.status).toUpperCase()!=='MATCH').length;
  const summary=`<section class="sj-shift-evidence-summary sj-shift-evidence-summary--cup">
    <span><small>Dipakai transaksi</small><b>${qty(transactionUsed)} pcs</b></span>
    <span><small>Dipakai fisik</small><b>${qty(physicalUsed)} pcs</b></span>
    <span><small>Sisa fisik</small><b>${qty(physicalClosing)} pcs</b></span>
    <span class="${attention?'warn':'ok'}"><small>Status</small><b>${attention?`${attention} perlu perhatian`:'Semua sesuai'}</b></span>
  </section>`;
  const body=rows.map(x=>`<tr><td><b>${esc(x.name||x.code)}</b><small data-status="${esc(x.status||'')}">${esc(cupStatusLabel(x.status,num(x.variance)))}</small></td><td>${qty(x.opening)}</td><td>+${qty(x.restock)}</td><td>${qty(x.transactionUsage)}</td><td>${qty(x.physicalUsed)}</td><td>${qty(x.physicalClosing??x.closing)}</td><td class="${num(x.variance)===0?'ok':'warn'}">${num(x.variance)>0?'+':''}${qty(x.variance)}</td></tr>`).join('');
  const mobile=rows.map(x=>{
    const reason=text(x.reason);
    return `<article class="sj-shift-cup-mobile-card"><header><div><b>${esc(x.name||x.code)}</b><small data-status="${esc(x.status||'')}">${esc(cupStatusLabel(x.status,num(x.variance)))}</small></div><strong class="${num(x.variance)===0?'ok':'warn'}">Selisih ${num(x.variance)>0?'+':''}${qty(x.variance)}</strong></header><div class="sj-shift-cup-usage"><span><small>Dipakai transaksi</small><b>${qty(x.transactionUsage)} pcs</b></span><span><small>Dipakai fisik</small><b>${qty(x.physicalUsed)} pcs</b></span></div><div class="sj-shift-cup-meta"><span><small>Awal</small><b>${qty(x.opening)}</b></span><span><small>Masuk</small><b>+${qty(x.restock)}</b></span><span><small>Akhir fisik</small><b>${qty(x.physicalClosing??x.closing)}</b></span><span><small>Selisih</small><b class="${num(x.variance)===0?'ok':'warn'}">${num(x.variance)>0?'+':''}${qty(x.variance)}</b></span></div>${reason?`<div class="sj-shift-evidence-reason"><small>Catatan selisih</small><b>${esc(reason)}</b></div>`:''}</article>`;
  }).join('');
  return `${summary}<div class="sj-shift-evidence-note">Cup Control adalah authority fisik. <b>Dipakai transaksi</b> dan <b>dipakai fisik</b> ditampilkan terpisah agar selisih tidak disamarkan. Transaksi baru memakai snapshot Cup saat transaksi; perubahan mapping produk tidak mengubah snapshot yang sudah tersimpan.</div><div class="sj-shift-cup-mobile-list">${mobile}</div><div class="sj-shift-evidence-table-wrap sj-shift-cup-desktop-table"><table class="sj-shift-evidence-table"><thead><tr><th>Cup</th><th>Awal</th><th>Masuk</th><th>Transaksi</th><th>Fisik terpakai</th><th>Akhir fisik</th><th>Selisih</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

export function renderStockShiftEvidenceDetail(summary=null){
  const rows=Object.values(summary?.rows||{});
  if(!rows.length)return '<div class="sj-shift-evidence-empty">Evidence stok barang jadi belum tersedia untuk shift ini. Pencatatan otomatis dimulai pada shift yang dibuka setelah fitur ini aktif. Data stok utama tidak hilang.</div>';
  const trackedCount=Number.isFinite(Number(summary?.trackedCount))?num(summary.trackedCount):rows.length;
  const soldTotal=Number.isFinite(Number(summary?.soldTotal))?num(summary.soldTotal):rows.reduce((a,x)=>a+Math.max(0,num(x.soldQty)),0);
  const returnedTotal=Number.isFinite(Number(summary?.returnedTotal))?num(summary.returnedTotal):rows.reduce((a,x)=>a+Math.max(0,num(x.returnedQty)),0);
  const attentionCount=Number.isFinite(Number(summary?.attentionCount))?num(summary.attentionCount):rows.filter(x=>x.status!=='MATCH_SALES_ONLY').length;
  const topSummary=`<section class="sj-shift-evidence-summary sj-shift-evidence-summary--stock">
    <span><small>Produk dilacak</small><b>${qty(trackedCount)}</b></span>
    <span><small>Terjual</small><b>${qty(soldTotal)} unit</b></span>
    <span><small>Retur ke stok</small><b>${qty(returnedTotal)} unit</b></span>
    <span class="${attentionCount?'warn':'ok'}"><small>Status</small><b>${attentionCount?`${qty(attentionCount)} ada perubahan lain`:'Semua sesuai'}</b></span>
  </section>`;
  const statusLabel=x=>{
    if(x.status==='NON_SALE_CHANGE'){
      const delta=num(x.nonSaleNetChange);
      return `Ada perubahan lain ${delta>0?'+':''}${qty(delta)}`;
    }
    if(x.status==='PARTIAL')return 'Data sebagian';
    return 'Sesuai penjualan';
  };
  const body=rows.map(x=>`<tr><td><b>${esc(x.name||x.productId)}</b><small>${esc(statusLabel(x))}</small></td><td>${qty(x.openingQty)}</td><td>-${qty(x.soldQty)}</td><td>+${qty(x.returnedQty)}</td><td class="${num(x.nonSaleNetChange)===0?'ok':'warn'}">${x.nonSaleNetChange===null?'—':`${num(x.nonSaleNetChange)>0?'+':''}${qty(x.nonSaleNetChange)}`}</td><td>${qty(x.closingSystemQty)}</td></tr>`).join('');
  const mobile=rows.map(x=>{
    const delta=x.nonSaleNetChange===null?null:num(x.nonSaleNetChange);
    const deltaText=delta===null?'—':`${delta>0?'+':''}${qty(delta)} unit`;
    return `<article class="sj-shift-stock-mobile-card"><header><div><b>${esc(x.name||x.productId)}</b><small class="${x.status==='NON_SALE_CHANGE'?'warn':x.status==='PARTIAL'?'muted':'ok'}">${esc(statusLabel(x))}</small></div></header><div class="sj-shift-stock-primary"><span><small>Terjual</small><b>${qty(x.soldQty)} unit</b></span><span class="${delta===0?'':'attention'}"><small>Perubahan lain</small><b>${deltaText}</b></span></div><div class="sj-shift-stock-meta"><span><small>Awal</small><b>${qty(x.openingQty)}</b></span><span><small>Retur ke stok</small><b>+${qty(x.returnedQty)}</b></span><span><small>Akhir sistem</small><b>${qty(x.closingSystemQty)}</b></span></div>${x.status==='NON_SALE_CHANGE'?'<div class="sj-shift-stock-explainer">Perubahan lain bukan penjualan. Lihat Pergerakan untuk audit transfer, opname, atau koreksi.</div>':''}</article>`;
  }).join('');
  return `${topSummary}<div class="sj-shift-evidence-note">Stok awal/akhir adalah snapshot sistem, bukan authority baru. <b>Perubahan lain</b> memisahkan transfer/opname/koreksi dari penjualan agar jumlah terjual tidak dipalsukan.</div><div class="sj-shift-stock-mobile-list">${mobile}</div><div class="sj-shift-evidence-table-wrap sj-shift-stock-desktop-table"><table class="sj-shift-evidence-table"><thead><tr><th>Produk</th><th>Awal</th><th>Terjual</th><th>Retur ke stok</th><th>Perubahan lain</th><th>Akhir sistem</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

export function renderClosedShiftEvidenceCards(row={}){
  const cup=cupEvidenceFromShift(row),cupRows=cup.reconciliation?.rows||[],summary=row?.stockEvidence?.summary||row?.closingSnapshot?.stockEvidence?.summary||null;
  const cupAttention=cupRows.filter(x=>text(x.status).toUpperCase()!=='MATCH').length;
  const cupPhysicalUsed=cupRows.reduce((a,x)=>a+Math.max(0,num(x.physicalUsed)),0);
  const cupClosing=cupRows.reduce((a,x)=>a+Math.max(0,num(x.physicalClosing??x.closing)),0);
  const stockText=summary?`${num(summary.trackedCount)} produk · ${num(summary.soldTotal)} unit terjual · ${num(summary.attentionCount)} perubahan lain`:'Mulai tersedia pada shift berikutnya';
  return `<section class="sj-shift-evidence-cards" data-shift-evidence-cards>
    <button type="button" data-shift-evidence-open="cup"><span><b>Riwayat Cup</b><small>${cupRows.length?`Terpakai fisik ${cupPhysicalUsed} · Closing ${cupClosing} · ${cupAttention} perlu perhatian`:'Belum ada evidence Cup'}</small></span><i>›</i></button>
    <button type="button" data-shift-evidence-open="stock"><span><b>Stok Barang Jadi</b><small>${esc(stockText)}</small></span><i>›</i></button>
  </section>`;
}

export function installShiftEvidenceV1(runtime=globalThis){
  if(runtime?.__SJ_SHIFT_EVIDENCE_V1)return runtime.__SJ_SHIFT_EVIDENCE_V1;
  const shift=runtime?.SJShift,hardening=runtime?.SJOperationalHardening,document=runtime?.document,db=runtime?.firebase?.database?.();
  if(!shift||!hardening||typeof hardening.verifiedShiftWrite!=='function'||!document||!db)return Object.freeze({installed:false});
  const originals={renderWithDay:shift.renderWithDay?.bind(shift),startShift:shift.startShift?.bind(shift),submitClose:shift.submitClose?.bind(shift),verifiedShiftWrite:hardening.verifiedShiftWrite.bind(hardening)};
  let dayRows={},pendingStart=null,pendingClose=null;

  async function readOutletBalances(){const snap=await db.ref(`${POS_ROOT}/global/inventory`).once('value');return snap?.val?.()||{}}
  async function readRefunds(shiftKey){
    const base=db.ref(`${POS_ROOT}/global/refunds`);
    try{
      if(typeof base.orderByChild==='function'){
        const snap=await base.orderByChild('shift').equalTo(shiftKey).once('value');
        return values(snap?.val?.()||{});
      }
    }catch(_){}
    const snap=await base.once('value');return values(snap?.val?.()||{}).filter(x=>text(x?.shift)===text(shiftKey));
  }
  async function snapshot(includeSnapshot=null,source='SYSTEM_SNAPSHOT'){
    const balances=await readOutletBalances();
    return buildFinishedGoodsShiftSnapshot({products:menuRows(runtime),balances,includeSnapshot,source,capturedTs:Date.now(),capturedAt:new Date().toISOString()});
  }
  function shiftData(){return shift.currentData?.()||{}}
  function openingEvidence(data,sid){return data?.sessions?.[sid]?.stockEvidence?.opening||data?.stockEvidence?.opening||null}
  function notify(message){try{runtime?.showToast?.(message,'warning')}catch(_){}}
  function log(error){try{runtime?.console?.warn?.('[SHIFT-STOCK-EVIDENCE]',error)}catch(_){}}

  if(typeof shift.startShift==='function')shift.startShift=async function(...args){
    pendingStart=null;
    try{pendingStart={opening:await snapshot(null,'SHIFT_OPEN_SYSTEM_SNAPSHOT')}}catch(error){log(error);notify('Shift tetap dapat dimulai, tetapi snapshot stok awal belum berhasil disimpan.')}
    return originals.startShift(...args);
  };
  if(typeof shift.submitClose==='function')shift.submitClose=async function(...args){
    pendingClose=null;
    try{
      const data=shiftData(),shiftKey=currentShiftKey(runtime),sid=text(shift.currentSessionId?.()||data?.sessionControl?.currentSessionId||data?.currentSessionId),opening=openingEvidence(data,sid);
      const closing=await snapshot(opening,'SHIFT_CLOSE_SYSTEM_SNAPSHOT');
      let refunds=[],refundsKnown=true;try{refunds=await readRefunds(shiftKey)}catch(error){refundsKnown=false;log(error)}
      const summary=opening&&refundsKnown?buildFinishedGoodsShiftSummary({opening,closing,transactions:values(data?.tx),refunds,shiftKey,capturedTs:Date.now(),capturedAt:new Date().toISOString()}):null;
      pendingClose={closing,summary};
    }catch(error){log(error);notify('Shift tetap dapat ditutup, tetapi evidence stok barang jadi belum lengkap.')}
    return originals.submitClose(...args);
  };
  hardening.verifiedShiftWrite=async function(kind,shiftKey,sessionId,updates,...rest){
    let next=updates,key=text(kind).toUpperCase();
    if(key==='START'&&pendingStart)next=augmentShiftStockEvidenceUpdates(kind,shiftKey,sessionId,next,pendingStart);
    if(key==='CLOSE'&&pendingClose)next=augmentShiftStockEvidenceUpdates(kind,shiftKey,sessionId,next,pendingClose);
    try{return await originals.verifiedShiftWrite(kind,shiftKey,sessionId,next,...rest)}
    finally{if(key==='START')pendingStart=null;if(key==='CLOSE')pendingClose=null}
  };

  function ensureModal(){
    let modal=document.getElementById?.('sj-shift-evidence-detail');if(modal)return modal;
    modal=document.createElement('div');modal.id='sj-shift-evidence-detail';modal.className='overlay sj-shift-evidence-overlay';modal.innerHTML='<div class="modal sj-shift-evidence-modal"><header><div><small>Audit Shift · Read only</small><h3 data-shift-evidence-title>Detail Shift</h3></div><button type="button" data-shift-evidence-close aria-label="Tutup">×</button></header><div data-shift-evidence-body></div></div>';
    modal.querySelector?.('[data-shift-evidence-close]')?.addEventListener?.('click',()=>{modal.style.display='none'});
    modal.addEventListener?.('click',event=>{if(event.target===modal)modal.style.display='none'});
    document.body?.appendChild?.(modal);return modal;
  }
  function openDetail(kind,row){
    const modal=ensureModal(),title=modal?.querySelector?.('[data-shift-evidence-title]'),body=modal?.querySelector?.('[data-shift-evidence-body]');if(!modal||!body)return false;
    if(kind==='cup'){if(title)title.textContent='Riwayat Cup';body.innerHTML=renderCupShiftEvidenceDetail(row)}
    else{if(title)title.textContent='Stok Barang Jadi';body.innerHTML=renderStockShiftEvidenceDetail(row?.stockEvidence?.summary||row?.closingSnapshot?.stockEvidence?.summary||null)}
    modal.style.display='flex';return true;
  }
  function enhance(){
    try{
      const root=document.getElementById?.('sj-shift-session-root'),panel=root?.querySelector?.('.sjshift-panel.closed');if(!root||!panel)return false;
      const suffix=currentShiftSuffix(runtime),row=dayRows?.[suffix]||shiftData(),old=root.querySelector?.('[data-shift-evidence-cards]');if(old?.parentNode)old.parentNode.removeChild(old);
      panel.insertAdjacentHTML?.('afterend',renderClosedShiftEvidenceCards(row));
      const cards=root.querySelector?.('[data-shift-evidence-cards]');
      cards?.querySelectorAll?.('[data-shift-evidence-open]')?.forEach?.(button=>button.addEventListener?.('click',()=>openDetail(button.dataset.shiftEvidenceOpen,row)));
      return true;
    }catch(error){log(error);return false}
  }
  if(typeof shift.renderWithDay==='function')shift.renderWithDay=function(...args){dayRows=args?.[1]||{};const out=originals.renderWithDay(...args);Promise.resolve().then(enhance);return out};

  const api=Object.freeze({installed:true,enhance,openDetail,snapshot,authority:'EVIDENCE_ONLY'});
  try{Object.defineProperty(runtime,'__SJ_SHIFT_EVIDENCE_V1',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
