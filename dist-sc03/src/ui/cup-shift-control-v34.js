import { CUP_CATALOG_V34, buildCupInventoryRowsV34, buildCupLocalSimulationRowsV34, buildCupOutletOpnameDraftsV34, cupInboundFromMovementsV34, ensureCupLocalSimulationStoreV34, reconcileCupShiftV34, theoreticalCupUsageV34 } from '../domain/packaging-cup-v34.js';
import { createInventoryRepository } from '../data/repositories/inventory-repository.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const REASONS=Object.freeze([
  ['DAMAGED','Rusak'],['REMAKE','Tumpah / remake'],['INTERNAL','Pemakaian internal'],['SAMPLING','Sampling'],['COUNT_ERROR','Salah hitung'],['OTHER','Lainnya']
]);

export function collectCupCountValuesV34(values={}){
  const out={};
  for(const spec of CUP_CATALOG_V34){
    const raw=values?.[spec.code];if(raw===null||raw===undefined||String(raw).trim()==='')throw Object.assign(new Error(`CUP_COUNT_REQUIRED:${spec.code}`),{code:'CUP_COUNT_REQUIRED'});
    const n=Number(raw);if(!Number.isFinite(n)||n<0||!Number.isInteger(n))throw Object.assign(new Error(`CUP_COUNT_INVALID:${spec.code}`),{code:'CUP_COUNT_INVALID'});
    out[spec.code]=n;
  }
  return Object.freeze(out);
}

function rowFor(cupRows,code){return (cupRows||[]).find(x=>x?.code===code)||CUP_CATALOG_V34.find(x=>x.code===code)||{code,name:code,outletQty:0}}

export function renderCupOpeningPanelV34(cupRows=[],{readOnly=false,values={}}={}){
  const registered=(cupRows||[]).filter(x=>x?.registered).length,ready=registered===CUP_CATALOG_V34.length;
  const note=!ready?`<div class="sj-v34-cup-note warn">Cup Control belum lengkap (${registered}/5 master). Siapkan master cup di Bahan &amp; Gudang.</div>`:'';
  const simulationNote=readOnly?'<div class="sj-v34-cup-note"><b>Simulasi input lokal</b> · angka boleh dicoba untuk QA, tetapi simpan/START tetap diblokir dan tidak menulis production.</div>':'';
  const fields=CUP_CATALOG_V34.map(spec=>{const row=rowFor(cupRows,spec.code);return `<label class="sj-v34-cup-count-row"><span><b>${esc(spec.name)}</b><small>Sistem Gerai: ${esc(num(row.outletQty))} pcs</small></span><input type="number" min="0" step="1" inputmode="numeric" required data-v34-cup-opening="${esc(spec.code)}" value="${esc(values?.[spec.code]??'')}"></label>`}).join('');
  return `<section class="sj-v34-cup-shift-panel" data-v34-cup-opening-panel><header><div><small>Kontrol Kemasan · manual fisik</small><h4>Hitung Cup Awal</h4><p>Hitung cup fisik sebelum transaksi dimulai. Angka sistem hanya referensi.</p></div>${readOnly?'<em>LOCAL QA · READ ONLY</em>':''}</header>${simulationNote}${note}<div class="sj-v34-cup-count-grid">${fields}</div></section>`;
}

export function renderCupClosingPanelV34(cupRows=[],{reconciliation={rows:[]},readOnly=false,closingValues=null,openingKnown=true,opnameDrafts=[],simulationInbound={}}={}){
  const byCode=new Map((reconciliation?.rows||[]).map(x=>[x.code,x]));
  const controlsLocked=!openingKnown;
  const legacyNote=!openingKnown?'<div class="sj-v34-cup-note warn">Shift ini dibuka sebelum Cup Control; hitung akhir dinonaktifkan untuk sesi ini. Mulai shift berikutnya agar rekonsiliasi cup memiliki hitung awal yang sah.</div>':'';
  const simulationNote=readOnly&&openingKnown?'<div class="sj-v34-cup-note"><b>Simulasi input lokal</b> · angka, selisih, dan alasan boleh dicoba untuk QA; CLOSE/persistence tetap diblokir.</div>':'';
  const fields=CUP_CATALOG_V34.map(spec=>{const row=byCode.get(spec.code)||{code:spec.code,name:spec.name,opening:0,inbound:0,closing:'',physicalUsed:0,theoreticalUsed:0,variance:0};const simInbound=readOnly&&openingKnown?`<label class="sj-v34-cup-sim-inbound"><span>Cup Masuk simulasi</span><input type="number" min="0" step="1" inputmode="numeric" data-v34-cup-inbound-sim="${esc(spec.code)}" value="${esc(num(simulationInbound?.[spec.code]))}"></label>`:'';const rawClosing=closingValues===null?row.closing:(closingValues?.[spec.code]??'');const hasClosing=rawClosing!==null&&rawClosing!==undefined&&String(rawClosing).trim()!=='';const variance=hasClosing?num(row.variance):0,disabled=controlsLocked?' disabled aria-disabled="true"':'';const reason=hasClosing&&variance!==0?`<label class="sj-v34-cup-reason"><span>Alasan selisih</span><select data-v34-cup-reason="${esc(spec.code)}" required${disabled}><option value="">Pilih alasan...</option>${REASONS.map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('')}</select><input data-v34-cup-reason-note="${esc(spec.code)}" placeholder="Catatan opsional"${disabled}></label>`:'';const physical=hasClosing?`${esc(num(row.physicalUsed))} pcs`:'—',theoretical=`${esc(num(row.theoreticalUsed))} pcs`,varianceText=hasClosing?`${esc(variance)} pcs`:'—';return `<article class="sj-v34-cup-close-row" data-v34-cup-close-row="${esc(spec.code)}"><header><b>${esc(spec.name)}</b><span>Awal ${esc(num(row.opening))} · Masuk ${esc(num(row.inbound))}</span></header>${simInbound}<label><span>Hitung fisik akhir</span><input type="number" min="0" step="1" inputmode="numeric" required data-v34-cup-closing="${esc(spec.code)}" value="${hasClosing?esc(num(rawClosing)):''}"${disabled}></label><div class="sj-v34-cup-recon"><span><small>Fisik terpakai</small><b>${physical}</b></span><span><small>Transaksi</small><b>${theoretical}</b></span><span class="${hasClosing&&variance!==0?'warn':'ok'}"><small>Selisih</small><b>${varianceText}</b></span></div>${reason}</article>`}).join('');
  const syncNote=(opnameDrafts||[]).length?`<aside class="sj-v34-cup-opname-note"><b>Sinkronisasi Inventory V2</b><span>${esc(opnameDrafts.length)} cup perlu Opname setelah closing. Cup Control menyimpan draft/evidence dan tidak mengubah saldo otomatis; gunakan Bahan &amp; Gudang → Opname agar writer tetap Inventory V2.</span></aside>`:'<aside class="sj-v34-cup-opname-note ok"><b>Sinkronisasi Inventory V2</b><span>Saldo Gerai cup sudah sama dengan hitung fisik akhir pada data yang terbaca.</span></aside>';
  return `<section class="sj-v34-cup-shift-panel" data-v34-cup-closing-panel><header><div><small>Kontrol Kemasan · rekonsiliasi fisik</small><h4>Hitung Cup Akhir</h4><p>Fisik terpakai = awal + masuk − akhir; dibandingkan dengan cup menurut transaksi.</p></div>${readOnly?'<em>LOCAL QA · READ ONLY</em>':''}</header>${simulationNote}${legacyNote}<div class="sj-v34-cup-close-grid">${fields}</div>${syncNote}</section>`;
}

export function applyReadOnlyShiftActionStateV34(document,readOnly=false){
  if(!readOnly||!document)return 0;let changed=0;for(const [id,label] of [['sjshift-start-btn','🔒 MULAI SHIFT · READ ONLY'],['sjshift-close-save','🔒 TUTUP SHIFT · READ ONLY']]){const button=document.getElementById?.(id);if(!button)continue;button.disabled=true;button.setAttribute?.('aria-disabled','true');button.dataset.sjV34ReadOnly='true';button.classList?.add?.('sj-v34-readonly-shift-action');button.textContent=label;changed++}return changed;
}

export function augmentShiftUpdatesV34(kind,shiftKey,sessionId,updates={},payload={}){
  const out=clone(updates)||{},key=String(kind||'').toUpperCase(),shift=text(shiftKey),sid=text(sessionId);if(!shift||!sid)return out;
  if(key==='START'&&payload?.opening){
    const sessionPath=`${shift}/sessions/${sid}`,current=out[sessionPath]&&typeof out[sessionPath]==='object'?out[sessionPath]:{};
    out[sessionPath]={...current,cupControl:{...(current.cupControl||{}),opening:clone(payload.opening)}};
    out[`${shift}/cupControl/opening`]=clone(payload.opening);
  }
  if(key==='CLOSE'&&payload?.closing){
    out[`${shift}/sessions/${sid}/cupControl/closing`]=clone(payload.closing);
    out[`${shift}/cupControl/closing`]=clone(payload.closing);
    if(payload.reconciliation){
      out[`${shift}/sessions/${sid}/cupControl/reconciliation`]=clone(payload.reconciliation);
      out[`${shift}/cupControl/reconciliation`]=clone(payload.reconciliation);
    }
    const snapPath=`${shift}/closingSnapshot`,snap=out[snapPath]&&typeof out[snapPath]==='object'?out[snapPath]:{};
    out[snapPath]={...snap,cupControl:{...(snap.cupControl||{}),closing:clone(payload.closing),...(payload.reconciliation?{reconciliation:clone(payload.reconciliation)}:{})}};
  }
  return out;
}

function currentShiftKey(runtime){
  try{const key=runtime?.Function?runtime.Function('try{return typeof activeDate!=="undefined"?activeDate:""}catch(_){return ""}')():'';if(key)return String(key)}catch(_){}
  const date=String(runtime?.document?.getElementById?.('date-sel')?.value||''),sel=String(runtime?.document?.getElementById?.('shift-sel')?.value||'');return date&&sel?`${date}${sel}`:'';
}
function menuRows(runtime){
  try{const value=runtime?.Function?runtime.Function('try{return typeof cloudData!=="undefined"?cloudData.global.menu:[]}catch(_){return []}')():[];return Array.isArray(value)?value:[]}catch(_){return[]}
}
function collectInputs(document,attr){const out={};for(const spec of CUP_CATALOG_V34)out[spec.code]=document?.querySelector?.(`[${attr}="${spec.code}"]`)?.value??'';return out}
function reasonInputs(document,reconciliation){
  const out={};for(const row of reconciliation?.rows||[]){if(num(row.variance)===0)continue;const reason=text(document?.querySelector?.(`[data-v34-cup-reason="${row.code}"]`)?.value);if(!reason)throw Object.assign(new Error(`CUP_VARIANCE_REASON_REQUIRED:${row.code}`),{code:'CUP_VARIANCE_REASON_REQUIRED'});out[row.code]={reason,note:text(document?.querySelector?.(`[data-v34-cup-reason-note="${row.code}"]`)?.value)};}return out;
}

export function installCupShiftControlV34(runtime=globalThis,{inventoryWorkspace=runtime?.__SJ_V32_INVENTORY_WORKSPACE}={}){
  if(runtime?.__SJ_V34_CUP_SHIFT_CONTROL)return runtime.__SJ_V34_CUP_SHIFT_CONTROL;
  const shift=runtime?.SJShift,hardening=runtime?.SJOperationalHardening,document=runtime?.document;
  if(!shift||!hardening||typeof hardening.verifiedShiftWrite!=='function'||!document)return Object.freeze({installed:false});
  const repository=createInventoryRepository({db:runtime?.firebase?.database?.()}),readOnly=runtime?.__SJ_LOCAL_QA_READ_ONLY===true,localSimulation=ensureCupLocalSimulationStoreV34(runtime);
  const originals={renderWithDay:shift.renderWithDay?.bind(shift),startShift:shift.startShift?.bind(shift),openCloseModal:shift.openCloseModal?.bind(shift),submitClose:shift.submitClose?.bind(shift),verifiedShiftWrite:hardening.verifiedShiftWrite.bind(hardening)};
  let cupRows=[],pendingStart=null,pendingClose=null,closeContext=null;
  async function refreshCupRows(){const raw=await repository.readInventoryV2();cupRows=readOnly&&localSimulation.masterConfig?buildCupLocalSimulationRowsV34(localSimulation.masterConfig):buildCupInventoryRowsV34(raw||{});return{raw:raw||{},cupRows}}
  const ready=()=>cupRows.filter(x=>x.registered).length===5;
  async function enhanceOpening(){try{await refreshCupRows();const btn=document.getElementById?.('sjshift-start-btn'),panel=btn?.closest?.('.sjshift-panel');if(!panel)return false;if(!panel.querySelector?.('[data-v34-cup-opening-panel]'))btn.insertAdjacentHTML?.('beforebegin',renderCupOpeningPanelV34(cupRows,{readOnly,values:readOnly?localSimulation.openingCounts||{}:{}}));const cupPanel=panel.querySelector?.('[data-v34-cup-opening-panel]');if(readOnly&&cupPanel&&!cupPanel.__sjV34LocalOpeningBound){cupPanel.__sjV34LocalOpeningBound=true;cupPanel.addEventListener?.('input',()=>{try{const counts=collectCupCountValuesV34(collectInputs(document,'data-v34-cup-opening'));localSimulation.openingCounts={...counts};localSimulation.openingCapturedTs=Date.now()}catch(_){localSimulation.openingCounts=null}})}applyReadOnlyShiftActionStateV34(document,readOnly);return true}catch(_){return false}}
  async function computeClose(closingValues=null){
    const shiftKey=currentShiftKey(runtime),data=shift.currentData?.()||{},sid=String(shift.currentSessionId?.()||data.currentSessionId||''),session=data.sessions?.[sid]||{},realOpening=session?.cupControl?.opening||data?.cupControl?.opening||null,openingEvidence=readOnly&&localSimulation.openingCounts?{counts:localSimulation.openingCounts,capturedTs:localSimulation.openingCapturedTs||Date.now(),source:'LOCAL_SIMULATION'}:realOpening,opening=openingEvidence?.counts||{},openingKnown=Boolean(openingEvidence?.counts);
    const startTs=num(openingEvidence?.capturedTs||session.openedTs),endTs=Date.now();
    const {raw,cupRows:currentCups}=await refreshCupRows(),theoretical=theoreticalCupUsageV34(Object.values(data.tx||{}),menuRows(runtime)),actualInbound=cupInboundFromMovementsV34(raw,currentCups,shiftKey,{startTs,endTs}),inbound=readOnly?Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,num(actualInbound?.[x.code])+num(localSimulation.inboundCounts?.[x.code])])):actualInbound,closing=closingValues||Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,'']));
    const reconciliation=reconcileCupShiftV34({opening,inbound,closing,theoretical}),opnameDrafts=buildCupOutletOpnameDraftsV34(currentCups,closing);
    return {shiftKey,sid,opening,openingKnown,inbound,theoretical,closing,reconciliation,opnameDrafts};
  }
  async function enhanceClosing(){try{
    closeContext=await computeClose();const modal=document.querySelector?.('#modal-sjshift-close .modal');if(!modal)return false;const oldPanel=modal.querySelector?.('[data-v34-cup-closing-panel]');if(oldPanel?.parentNode)oldPanel.parentNode.removeChild(oldPanel);const save=document.getElementById?.('sjshift-close-save');if(!save)return false;
    save.insertAdjacentHTML?.('beforebegin',renderCupClosingPanelV34(cupRows,{reconciliation:closeContext.reconciliation,readOnly,closingValues:{},openingKnown:closeContext.openingKnown,opnameDrafts:closeContext.opnameDrafts,simulationInbound:localSimulation.inboundCounts}));
    if(!modal.__sjV34CupClosingBound){modal.__sjV34CupClosingBound=true;modal.addEventListener?.('input',async e=>{if(e.target?.matches?.('[data-v34-cup-inbound-sim]')&&readOnly){const code=e.target.dataset.v34CupInboundSim;localSimulation.inboundCounts[code]=Math.max(0,num(e.target.value))}if(!e.target?.matches?.('[data-v34-cup-closing],[data-v34-cup-inbound-sim]'))return;try{const values=collectInputs(document,'data-v34-cup-closing');closeContext=await computeClose(values);const current=modal.querySelector?.('[data-v34-cup-closing-panel]');if(current)current.outerHTML=renderCupClosingPanelV34(cupRows,{reconciliation:closeContext.reconciliation,readOnly,closingValues:values,openingKnown:closeContext.openingKnown,opnameDrafts:closeContext.opnameDrafts,simulationInbound:localSimulation.inboundCounts});}catch(_){}})}applyReadOnlyShiftActionStateV34(document,readOnly);
    return true
  }catch(_){return false}}


  if(typeof shift.renderWithDay==='function')shift.renderWithDay=function(...args){const out=originals.renderWithDay(...args);Promise.resolve().then(enhanceOpening);return out};
  if(typeof shift.startShift==='function')shift.startShift=async function(...args){
    if(!cupRows.length)await refreshCupRows();if(ready()){
      try{const counts=collectCupCountValuesV34(collectInputs(document,'data-v34-cup-opening'));pendingStart={opening:{version:'3.4',counts,capturedAt:new Date().toISOString(),capturedTs:Date.now(),source:'MANUAL_PHYSICAL_COUNT'}}}catch(e){runtime?.alert?.(e.code==='CUP_COUNT_REQUIRED'?'Hitung semua 5 jenis cup sebelum membuka shift.':'Jumlah cup awal tidak valid.');return false}
    }
    return originals.startShift(...args);
  };
  if(typeof shift.openCloseModal==='function')shift.openCloseModal=function(...args){const out=originals.openCloseModal(...args);Promise.resolve().then(enhanceClosing);return out};
  if(typeof shift.submitClose==='function')shift.submitClose=async function(...args){
    if(!cupRows.length)await refreshCupRows();if(ready()){
      const data=shift.currentData?.()||{},sid=String(shift.currentSessionId?.()||data.currentSessionId||''),opening=data.sessions?.[sid]?.cupControl?.opening?.counts||data?.cupControl?.opening?.counts;
      if(opening){try{const closing=collectCupCountValuesV34(collectInputs(document,'data-v34-cup-closing')),ctx=await computeClose(closing),reasons=reasonInputs(document,ctx.reconciliation);pendingClose={closing:{version:'3.4',counts:closing,capturedAt:new Date().toISOString(),capturedTs:Date.now(),source:'MANUAL_PHYSICAL_COUNT'},reconciliation:{version:'3.4',...ctx.reconciliation,reasons,inventoryOpnameDrafts:ctx.opnameDrafts,capturedAt:new Date().toISOString()}}}catch(e){runtime?.alert?.(e.code==='CUP_VARIANCE_REASON_REQUIRED'?'Pilih alasan untuk setiap selisih cup.':e.code==='CUP_COUNT_REQUIRED'?'Hitung semua 5 jenis cup sebelum menutup shift.':'Jumlah cup akhir tidak valid.');return false}}
    }
    return originals.submitClose(...args);
  };
  hardening.verifiedShiftWrite=async function(kind,shiftKey,sessionId,updates,...rest){
    let next=updates;if(String(kind).toUpperCase()==='START'&&pendingStart)next=augmentShiftUpdatesV34(kind,shiftKey,sessionId,updates,pendingStart);if(String(kind).toUpperCase()==='CLOSE'&&pendingClose)next=augmentShiftUpdatesV34(kind,shiftKey,sessionId,next,pendingClose);
    try{return await originals.verifiedShiftWrite(kind,shiftKey,sessionId,next,...rest)}finally{if(String(kind).toUpperCase()==='START')pendingStart=null;if(String(kind).toUpperCase()==='CLOSE')pendingClose=null}
  };
  const api=Object.freeze({installed:true,refresh:refreshCupRows,enhanceOpening,enhanceClosing,cupRows:()=>cupRows.slice(),readOnly});
  try{Object.defineProperty(runtime,'__SJ_V34_CUP_SHIFT_CONTROL',{value:api,writable:false,configurable:false})}catch(_){}
  refreshCupRows().catch(()=>{});return api;
}
