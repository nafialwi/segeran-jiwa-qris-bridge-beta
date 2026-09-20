import { CUP_CATALOG_V34, ensureCupLocalSimulationStoreV34, reconcileCupClosingAuthorityV34, theoreticalCupUsageV34 } from '../domain/packaging-cup-v34.js';
import { buildCupControlLedgerV1 } from '../domain/cup-control-v1.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const REASONS=Object.freeze([
  ['DAMAGED','Rusak'],['OUTSIDE_TX','Terpakai di luar transaksi'],['COUNT_ERROR','Salah hitung sebelumnya'],
  ['RESTOCK_MISSING','Restock belum tercatat'],['REMAKE','Tumpah / remake'],['OTHER','Lainnya']
]);
const SHIFT_ORDER_V34=Object.freeze(['-S1','-S2','-S3']);
const SHIFT_LABEL_V34=Object.freeze({'-S1':'Shift Pagi','-S2':'Shift Siang','-S3':'Shift Malam'});
const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);
const staticRows=()=>CUP_CATALOG_V34.map(x=>Object.freeze({...x,registered:true,inventoryTracked:false}));
function closedShiftRowV34(row={}){const status=text(row?.sessionControl?.status||row?.shiftStatus||row?.status).toUpperCase();return row?.locked===true||status==='CLOSED'||status==='SELESAI'}
function physicalClosingEvidenceV34(row={}){const candidates=[row?.closingSnapshot?.cupControl?.closing,row?.cupControl?.closing];for(const value of candidates){if(value?.counts&&typeof value.counts==='object')return value}let latest=null;for(const session of Object.values(row?.sessions||{})){const value=session?.cupControl?.closing;if(!value?.counts||typeof value.counts!=='object')continue;if(!latest||num(value.capturedTs)>num(latest.capturedTs))latest=value}return latest}
export function previousShiftCupClosingV34(rows={},activeShift=''){const normalized=String(activeShift||'').match(/-S[123]$/)?.[0]||String(activeShift||''),index=SHIFT_ORDER_V34.indexOf(normalized);if(index<=0)return null;const previous=SHIFT_ORDER_V34[index-1],row=rows?.[previous];if(!row||!closedShiftRowV34(row))return null;const evidence=physicalClosingEvidenceV34(row);if(!evidence?.counts)return null;const counts={};for(const spec of CUP_CATALOG_V34){if(hasOwn(evidence.counts,spec.code)&&Number.isFinite(Number(evidence.counts[spec.code])))counts[spec.code]=Number(evidence.counts[spec.code])}if(!Object.keys(counts).length)return null;return {shift:previous,counts,capturedTs:num(evidence.capturedTs)||null}}

export function collectCupCountValuesV34(values={}){
  const out={};
  for(const spec of CUP_CATALOG_V34){
    const raw=values?.[spec.code];if(raw===null||raw===undefined||String(raw).trim()==='')throw Object.assign(new Error(`CUP_COUNT_REQUIRED:${spec.code}`),{code:'CUP_COUNT_REQUIRED'});
    const n=Number(raw);if(!Number.isFinite(n)||n<0||!Number.isInteger(n))throw Object.assign(new Error(`CUP_COUNT_INVALID:${spec.code}`),{code:'CUP_COUNT_INVALID'});
    out[spec.code]=n;
  }
  return Object.freeze(out);
}

export function collectCupOptionalCountValuesV34(values={}){
  const out={};for(const spec of CUP_CATALOG_V34){const raw=values?.[spec.code];if(raw===null||raw===undefined||String(raw).trim()===''){out[spec.code]=0;continue}const n=Number(raw);if(!Number.isFinite(n)||n<0||!Number.isInteger(n))throw Object.assign(new Error(`CUP_COUNT_INVALID:${spec.code}`),{code:'CUP_COUNT_INVALID'});out[spec.code]=n}return Object.freeze(out);
}

export function renderCupOpeningPanelV34(_cupRows=[],{readOnly=false,values={},previousClosing=null}={}){
  const previousCounts=previousClosing?.counts&&typeof previousClosing.counts==='object'?previousClosing.counts:null,previousLabel=SHIFT_LABEL_V34[previousClosing?.shift]||'shift sebelumnya';
  const fields=CUP_CATALOG_V34.map(spec=>{const previousKnown=!!previousCounts&&hasOwn(previousCounts,spec.code)&&Number.isFinite(Number(previousCounts[spec.code])),previousQty=previousKnown?num(previousCounts[spec.code]):null;const reference=previousKnown?`<small><b>Fisik akhir ${esc(previousLabel)}: ${esc(previousQty)} pcs</b> · dibawa sebagai opening</small>`:'<small>Hitung fisik awal shift ini.</small>';return `<label class="sj-v34-cup-count-row"><span><b>${esc(spec.name)}</b>${reference}</span><input type="number" min="0" step="1" inputmode="numeric" required data-v34-cup-opening="${esc(spec.code)}" value="${esc(values?.[spec.code]??(previousKnown?previousQty:''))}"></label>`}).join('');
  const continuity=previousCounts?`<div class="sj-v34-cup-note"><b>Kontinuitas shift:</b> Physical Closing ${esc(previousLabel)} menjadi Opening shift ini. Verifikasi angka fisik; koreksi hanya jika hasil hitung nyata berbeda.</div>`:'<div class="sj-v34-cup-note"><b>Opening pertama:</b> hitung fisik semua jenis cup. Cup Control berdiri sendiri dan tidak memakai saldo Inventory V2.</div>';
  const simulationNote=readOnly?'<div class="sj-v34-cup-note"><b>Simulasi input lokal</b> · persistence tetap diblokir.</div>':'';
  return `<section class="sj-v34-cup-shift-panel" data-v34-cup-opening-panel><header><div><small>Cup Control · stok fisik operasional</small><h4>Hitung Cup Awal</h4><p>Opening berasal dari Physical Closing shift sebelumnya atau hitung fisik awal. Inventory V2 bukan authority Cup.</p></div>${readOnly?'<em>LOCAL QA · READ ONLY</em>':''}</header>${simulationNote}${continuity}<div class="sj-v34-cup-count-grid">${fields}</div></section>`;
}

function statusLabel(row={}){
  if(row.status==='MATCH')return 'Sesuai';if(row.status==='MORE')return `Lebih ${Math.abs(num(row.variance))} pcs`;if(row.status==='SHORTAGE')return `Kurang ${Math.abs(num(row.variance))} pcs`;if(row.status==='NEEDS_ATTENTION')return 'Perlu perhatian';return 'Belum dihitung';
}

export function renderCupClosingPanelV34(_cupRows=[],{reconciliation={rows:[]},readOnly=false,closingValues=null,openingKnown=true,simulationInbound={},restockValues=null}={}){
  const byCode=Object.fromEntries((reconciliation?.rows||[]).map(x=>[x.code,x]));
  const legacyNote=!openingKnown?'<div class="sj-v34-cup-note warn"><b>Opening belum tersedia.</b> Shift lama ini tetap dapat dihitung fisiknya, tetapi Expected Closing sengaja tidak ditebak dari Inventory V2. Physical Closing akan menjadi continuity shift berikutnya.</div>':'';
  const simulationNote=readOnly?'<div class="sj-v34-cup-note"><b>Simulasi input lokal</b> · CLOSE/persistence tetap diblokir.</div>':'';
  const fields=CUP_CATALOG_V34.map(spec=>{
    const row=byCode[spec.code]||{code:spec.code,name:spec.name,opening:openingKnown?0:null,restock:0,transactionUsage:0,expectedClosing:openingKnown?0:null,uncoveredUsage:0,variance:null,status:'AWAITING_PHYSICAL'};
    const rawClosing=closingValues===null?row.closing:(closingValues?.[spec.code]??'');
    const hasClosing=rawClosing!==null&&rawClosing!==undefined&&String(rawClosing).trim()!=='';
    const restock=restockValues?.[spec.code]??simulationInbound?.[spec.code]??row.restock??row.inbound??0;
    const variance=hasClosing&&row.variance!==null?num(row.variance):null;
    const reasonNeeded=hasClosing&&(variance!==0||num(row.uncoveredUsage)>0);
    const reason=reasonNeeded?`<label class="sj-v34-cup-reason"><span>Alasan selisih</span><select data-v34-cup-reason="${esc(spec.code)}" required><option value="">Pilih alasan...</option>${REASONS.map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('')}</select><input data-v34-cup-reason-note="${esc(spec.code)}" placeholder="Catatan opsional"></label>`:'';
    const expected=row.expectedClosing===null||row.expectedClosing===undefined?'—':`${esc(num(row.expectedClosing))} pcs`;
    const physical=hasClosing?`${esc(num(row.physicalClosing??rawClosing))} pcs`:'—';
    const varianceText=variance===null?'—':`${variance>0?'+':''}${esc(variance)} pcs`;
    const warning=num(row.uncoveredUsage)>0?`<aside class="sj-v34-cup-uncovered" data-v34-cup-uncovered="${esc(spec.code)}"><b>Perlu perhatian</b><span>${esc(num(row.uncoveredUsage))} pcs penggunaan tidak memiliki stok sumber yang tercatat.</span></aside>`:'';
    return `<article class="sj-v34-cup-close-row" data-v34-cup-close-row="${esc(spec.code)}"><header><b>${esc(spec.name)}</b><span>Awal ${openingKnown?esc(num(row.opening)):'—'} · Terpakai ${esc(num(row.transactionUsage??row.theoreticalUsed))}</span></header><label class="sj-v34-cup-restock"><span>Masuk / Restock selama shift</span><input type="number" min="0" step="1" inputmode="numeric" data-v34-cup-restock="${esc(spec.code)}" value="${esc(num(restock))}"></label><label><span>Hitung fisik akhir</span><input type="number" min="0" step="1" inputmode="numeric" required data-v34-cup-closing="${esc(spec.code)}" value="${hasClosing?esc(num(rawClosing)):''}"></label><div class="sj-v34-cup-recon"><span><small>Expected Closing</small><b>${expected}</b></span><span><small>Physical Closing</small><b>${physical}</b></span><span class="${variance===null||variance===0?'ok':'warn'}"><small>Selisih</small><b>${varianceText}</b><em>${hasClosing?esc(statusLabel(row)):''}</em></span></div>${warning}${reason}</article>`;
  }).join('');
  return `<section class="sj-v34-cup-shift-panel" data-v34-cup-closing-panel><header><div><small>Cup Control · rekonsiliasi fisik</small><h4>Hitung Cup Akhir</h4><p>Expected = Opening + Restock − Expected Usage. Selisih = Physical − Expected. Nilai negatif tidak pernah disimpan sebagai stok.</p></div>${readOnly?'<em>LOCAL QA · READ ONLY</em>':''}</header>${simulationNote}${legacyNote}<div class="sj-v34-cup-close-grid">${fields}</div><aside class="sj-v34-cup-opname-note ok"><b>Authority Cup Control</b><span>Physical Closing menjadi Opening shift berikutnya. Tidak ada Opname atau decrement Cup ke Inventory V2.</span></aside></section>`;
}


function syncCupClosingPanelInPlaceV34(current,html,document){
  if(!current||!document?.createElement)return false;
  const shell=document.createElement('div');shell.innerHTML=html;
  const fresh=shell.querySelector?.('[data-v34-cup-closing-panel]');if(!fresh)return false;
  for(const spec of CUP_CATALOG_V34){
    const selector=`[data-v34-cup-close-row="${spec.code}"]`,row=current.querySelector?.(selector),next=fresh.querySelector?.(selector);
    if(!row||!next)continue;
    const recon=row.querySelector?.('.sj-v34-cup-recon'),nextRecon=next.querySelector?.('.sj-v34-cup-recon');
    if(recon&&nextRecon){recon.className=nextRecon.className;recon.innerHTML=nextRecon.innerHTML}
    const warningSelector=`[data-v34-cup-uncovered="${spec.code}"]`,warning=row.querySelector?.(warningSelector),nextWarning=next.querySelector?.(warningSelector);
    if(warning&&!nextWarning){
      if(warning.parentNode)warning.parentNode.removeChild(warning);
    }else if(!warning&&nextWarning){
      const reason=row.querySelector?.('.sj-v34-cup-reason');
      if(reason)reason.insertAdjacentElement?.('beforebegin',nextWarning.cloneNode(true));
      else row.appendChild(nextWarning.cloneNode(true));
    }else if(warning&&nextWarning){
      warning.innerHTML=nextWarning.innerHTML;
    }
    const reason=row.querySelector?.('.sj-v34-cup-reason'),nextReason=next.querySelector?.('.sj-v34-cup-reason');
    if(reason&&!nextReason){
      if(reason.parentNode)reason.parentNode.removeChild(reason);
    }else if(!reason&&nextReason){
      row.appendChild(nextReason.cloneNode(true));
    }
  }
  return true;
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
    if(payload.restock){out[`${shift}/sessions/${sid}/cupControl/restock`]=clone(payload.restock);out[`${shift}/cupControl/restock`]=clone(payload.restock)}
    if(payload.ledger){out[`${shift}/sessions/${sid}/cupControl/ledger`]=clone(payload.ledger);out[`${shift}/cupControl/ledger`]=clone(payload.ledger)}
    if(payload.reconciliation){out[`${shift}/sessions/${sid}/cupControl/reconciliation`]=clone(payload.reconciliation);out[`${shift}/cupControl/reconciliation`]=clone(payload.reconciliation)}
    const snapPath=`${shift}/closingSnapshot`,snap=out[snapPath]&&typeof out[snapPath]==='object'?out[snapPath]:{};
    out[snapPath]={...snap,cupControl:{...(snap.cupControl||{}),closing:clone(payload.closing),...(payload.restock?{restock:clone(payload.restock)}:{}),...(payload.reconciliation?{reconciliation:clone(payload.reconciliation)}:{})}};
  }
  return out;
}

function currentShiftKey(runtime){
  try{const key=runtime?.Function?runtime.Function('try{return typeof activeDate!=="undefined"?activeDate:""}catch(_){return ""}')():'';if(key)return String(key)}catch(_){}
  const date=String(runtime?.document?.getElementById?.('date-sel')?.value||''),sel=String(runtime?.document?.getElementById?.('shift-sel')?.value||'');return date&&sel?`${date}${sel}`:'';
}
function currentShiftSuffix(runtime){try{const value=runtime?.Function?runtime.Function('try{return typeof activeShift!=="undefined"?activeShift:""}catch(_){return ""}')():'';const match=String(value||'').match(/-S[123]$/);if(match)return match[0]}catch(_){}const value=String(runtime?.document?.getElementById?.('shift-sel')?.value||''),match=value.match(/-S[123]$/);return match?match[0]:value}
function menuRows(runtime){try{const value=runtime?.Function?runtime.Function('try{return typeof cloudData!=="undefined"?cloudData.global.menu:[]}catch(_){return []}')():[];return Array.isArray(value)?value:[]}catch(_){return[]}}
function collectInputs(document,attr){const out={};for(const spec of CUP_CATALOG_V34)out[spec.code]=document?.querySelector?.(`[${attr}="${spec.code}"]`)?.value??'';return out}
function reasonInputs(document,reconciliation){
  const out={};for(const row of reconciliation?.rows||[]){if(num(row.variance)===0&&num(row.uncoveredUsage)===0)continue;const reason=text(document?.querySelector?.(`[data-v34-cup-reason="${row.code}"]`)?.value);if(!reason)throw Object.assign(new Error(`CUP_VARIANCE_REASON_REQUIRED:${row.code}`),{code:'CUP_VARIANCE_REASON_REQUIRED'});out[row.code]={reason,note:text(document?.querySelector?.(`[data-v34-cup-reason-note="${row.code}"]`)?.value)}}return out;
}

export function installCupShiftControlV34(runtime=globalThis){
  if(runtime?.__SJ_V34_CUP_SHIFT_CONTROL)return runtime.__SJ_V34_CUP_SHIFT_CONTROL;
  const shift=runtime?.SJShift,hardening=runtime?.SJOperationalHardening,document=runtime?.document;
  if(!shift||!hardening||typeof hardening.verifiedShiftWrite!=='function'||!document)return Object.freeze({installed:false});
  const readOnly=runtime?.__SJ_LOCAL_QA_READ_ONLY===true,localSimulation=ensureCupLocalSimulationStoreV34(runtime),cupRows=staticRows();
  const originals={renderWithDay:shift.renderWithDay?.bind(shift),startShift:shift.startShift?.bind(shift),openCloseModal:shift.openCloseModal?.bind(shift),submitClose:shift.submitClose?.bind(shift),verifiedShiftWrite:hardening.verifiedShiftWrite.bind(hardening)};
  let dayRows={},pendingStart=null,pendingClose=null,closeContext=null,closeEnhanceTask=null;
  const refreshCupRows=async()=>cupRows.slice();
  async function enhanceOpening(){try{const btn=document.getElementById?.('sjshift-start-btn'),panel=btn?.closest?.('.sjshift-panel');if(!panel)return false;const existing=panel.querySelector?.('[data-v34-cup-opening-panel]'),previousClosing=previousShiftCupClosingV34(dayRows,currentShiftSuffix(runtime)),draft=existing?collectInputs(document,'data-v34-cup-opening'):(readOnly&&localSimulation.openingCounts?localSimulation.openingCounts:previousClosing?.counts||{}),html=renderCupOpeningPanelV34(cupRows,{readOnly,values:draft,previousClosing});if(existing)existing.outerHTML=html;else btn.insertAdjacentHTML?.('beforebegin',html);const cupPanel=panel.querySelector?.('[data-v34-cup-opening-panel]');if(readOnly&&cupPanel&&!cupPanel.__sjV34LocalOpeningBound){cupPanel.__sjV34LocalOpeningBound=true;cupPanel.addEventListener?.('input',()=>{try{const counts=collectCupCountValuesV34(collectInputs(document,'data-v34-cup-opening'));localSimulation.openingCounts={...counts};localSimulation.openingCapturedTs=Date.now()}catch(_){localSimulation.openingCounts=null}})}applyReadOnlyShiftActionStateV34(document,readOnly);return true}catch(_){return false}}
  async function computeClose(closingValues=null,restockValues=null){
    const shiftKey=currentShiftKey(runtime),data=shift.currentData?.()||{},sid=String(shift.currentSessionId?.()||data.currentSessionId||''),session=data.sessions?.[sid]||{},realOpening=session?.cupControl?.opening||data?.cupControl?.opening||null,openingEvidence=readOnly&&localSimulation.openingCounts?{counts:localSimulation.openingCounts,capturedTs:localSimulation.openingCapturedTs||Date.now(),source:'LOCAL_SIMULATION'}:realOpening,opening=openingEvidence?.counts||{},openingKnown=Boolean(openingEvidence?.counts);
    const theoretical=theoreticalCupUsageV34(Object.values(data.tx||{}),menuRows(runtime));
    const persistedRestock=session?.cupControl?.restock?.counts||data?.cupControl?.restock?.counts||{};
    const restock=restockValues||persistedRestock||Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,0]));
    const closing=closingValues||Object.fromEntries(CUP_CATALOG_V34.map(x=>[x.code,'']));
    const reconciliation=reconcileCupClosingAuthorityV34({openingKnown,opening,inbound:restock,closing,theoretical});
    const capturedTs=Date.now(),ledger=buildCupControlLedgerV1({catalog:CUP_CATALOG_V34,opening,restock,transactionUsage:theoretical,physical:closing,capturedTs});
    return {shiftKey,sid,opening,openingKnown,restock,theoretical,closing,reconciliation,ledger,capturedTs};
  }
  async function enhanceClosing(){try{
    closeContext=await computeClose();const modal=document.querySelector?.('#modal-sjshift-close .modal');if(!modal)return false;const oldPanel=modal.querySelector?.('[data-v34-cup-closing-panel]');if(oldPanel?.parentNode)oldPanel.parentNode.removeChild(oldPanel);const save=document.getElementById?.('sjshift-close-save');if(!save)return false;
    save.insertAdjacentHTML?.('beforebegin',renderCupClosingPanelV34(cupRows,{reconciliation:closeContext.reconciliation,readOnly,closingValues:{},openingKnown:closeContext.openingKnown,restockValues:closeContext.restock}));
    if(!modal.__sjV34CupClosingBound){modal.__sjV34CupClosingBound=true;modal.addEventListener?.('input',async e=>{if(!e.target?.matches?.('[data-v34-cup-closing],[data-v34-cup-restock]'))return;try{const values=collectInputs(document,'data-v34-cup-closing'),restock=collectCupOptionalCountValuesV34(collectInputs(document,'data-v34-cup-restock'));if(readOnly)localSimulation.inboundCounts={...restock};const seq=(modal.__sjV34CupClosingInputSeq||0)+1;modal.__sjV34CupClosingInputSeq=seq;const nextContext=await computeClose(values,restock);if(seq!==modal.__sjV34CupClosingInputSeq)return;closeContext=nextContext;const current=modal.querySelector?.('[data-v34-cup-closing-panel]');if(current)syncCupClosingPanelInPlaceV34(current,renderCupClosingPanelV34(cupRows,{reconciliation:closeContext.reconciliation,readOnly,closingValues:values,openingKnown:closeContext.openingKnown,restockValues:restock}),document);}catch(_){}})}applyReadOnlyShiftActionStateV34(document,readOnly);return true
  }catch(_){return false}}

  if(typeof shift.renderWithDay==='function')shift.renderWithDay=function(...args){dayRows=args?.[1]||{};const out=originals.renderWithDay(...args);Promise.resolve().then(enhanceOpening);return out};
  if(typeof shift.startShift==='function')shift.startShift=async function(...args){
    try{const counts=collectCupCountValuesV34(collectInputs(document,'data-v34-cup-opening')),previous=previousShiftCupClosingV34(dayRows,currentShiftSuffix(runtime)),same=previous?.counts&&CUP_CATALOG_V34.every(x=>num(previous.counts[x.code])===num(counts[x.code]));pendingStart={opening:{version:'CUP-CONTROL-V1',schemaVersion:1,counts,capturedAt:new Date().toISOString(),capturedTs:Date.now(),source:same?'PREVIOUS_PHYSICAL_CLOSING_VERIFIED':'MANUAL_PHYSICAL_COUNT'}}}catch(e){runtime?.alert?.(e.code==='CUP_COUNT_REQUIRED'?`Hitung semua ${CUP_CATALOG_V34.length} jenis cup sebelum membuka shift.`:'Jumlah cup awal tidak valid.');return false}
    return originals.startShift(...args);
  };
  async function ensureClosingPanel(){const modal=document.querySelector?.('#modal-sjshift-close .modal');if(modal?.querySelector?.('[data-v34-cup-closing-panel]'))return true;if(closeEnhanceTask)return closeEnhanceTask;closeEnhanceTask=Promise.resolve().then(enhanceClosing).finally(()=>{closeEnhanceTask=null});return closeEnhanceTask}
  if(typeof shift.openCloseModal==='function')shift.openCloseModal=function(...args){const out=originals.openCloseModal(...args);for(const delay of [0,80,240]){(runtime?.setTimeout||setTimeout)(()=>{const modal=document.querySelector?.('#modal-sjshift-close .modal');if(!modal?.querySelector?.('[data-v34-cup-closing-panel]'))ensureClosingPanel().catch(()=>{})},delay)}return out};
  if(typeof shift.submitClose==='function')shift.submitClose=async function(...args){
    try{const closing=collectCupCountValuesV34(collectInputs(document,'data-v34-cup-closing')),restock=collectCupOptionalCountValuesV34(collectInputs(document,'data-v34-cup-restock')),ctx=await computeClose(closing,restock),reasons=reasonInputs(document,ctx.reconciliation),capturedAt=new Date().toISOString();pendingClose={closing:{version:'CUP-CONTROL-V1',schemaVersion:1,counts:closing,capturedAt,capturedTs:ctx.capturedTs,source:'MANUAL_PHYSICAL_COUNT'},restock:{version:'CUP-CONTROL-V1',schemaVersion:1,counts:restock,capturedAt,capturedTs:ctx.capturedTs,source:'SHIFT_DECLARED_RESTOCK'},ledger:{version:'CUP-CONTROL-V1',schemaVersion:1,events:ctx.ledger,capturedAt,capturedTs:ctx.capturedTs,derived:true},reconciliation:{version:'CUP-CONTROL-V1',schemaVersion:1,...ctx.reconciliation,reasons,capturedAt,capturedTs:ctx.capturedTs}}}catch(e){runtime?.alert?.(e.code==='CUP_VARIANCE_REASON_REQUIRED'?'Pilih alasan untuk setiap selisih atau anomali cup.':e.code==='CUP_COUNT_REQUIRED'?`Hitung semua ${CUP_CATALOG_V34.length} jenis cup sebelum menutup shift.`:'Jumlah cup akhir/restock tidak valid.');return false}
    return originals.submitClose(...args);
  };
  hardening.verifiedShiftWrite=async function(kind,shiftKey,sessionId,updates,...rest){let next=updates;if(String(kind).toUpperCase()==='START'&&pendingStart)next=augmentShiftUpdatesV34(kind,shiftKey,sessionId,updates,pendingStart);if(String(kind).toUpperCase()==='CLOSE'&&pendingClose)next=augmentShiftUpdatesV34(kind,shiftKey,sessionId,next,pendingClose);try{return await originals.verifiedShiftWrite(kind,shiftKey,sessionId,next,...rest)}finally{if(String(kind).toUpperCase()==='START')pendingStart=null;if(String(kind).toUpperCase()==='CLOSE')pendingClose=null}};
  const api=Object.freeze({installed:true,refresh:refreshCupRows,enhanceOpening,enhanceClosing:ensureClosingPanel,cupRows:()=>cupRows.slice(),computeClose,readOnly,authority:'CUP_CONTROL'});
  try{Object.defineProperty(runtime,'__SJ_V34_CUP_SHIFT_CONTROL',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
