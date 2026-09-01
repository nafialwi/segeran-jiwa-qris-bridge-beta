import { POS_ROOT } from '../data/firebase-client.js';
import { resolveProductCode, resolveScannedCandidates } from '../domain/product-code-resolver.js';
import { historicalShiftRows, shiftContextLabel } from './shift-refinement.js';

function activeProducts(runtime){
  const rows=runtime?.cloudData?.global?.menu;
  return (Array.isArray(rows)?rows:[]).filter(p=>{try{return runtime?.SJHarden?.isActiveProduct?runtime.SJHarden.isActiveProduct(p):!p?.archived}catch(_){return !p?.archived}});
}
function notify(runtime,message,kind='info'){try{return runtime?.showToast?.(message,kind)}catch(_){return undefined}}
function audit(runtime,type,detail){try{return runtime?.sjAudit?.(type,detail)}catch(_){return undefined}}
function money(runtime,value){try{return runtime?.fmt?.(Number(value)||0)||`Rp ${Number(value||0).toLocaleString('id-ID')}`}catch(_){return `Rp ${Number(value||0).toLocaleString('id-ID')}`}}

export function createSafeResolveAndAdd({getProducts,addProduct,notify:send=()=>{},audit:log=()=>{}}={}){
  return function safeResolveAndAdd(code,source='scan'){
    const resolved=resolveProductCode(code,getProducts?.()||[]);
    if(resolved.status==='match'){
      addProduct?.(resolved.product.id);log('BARCODE_SCAN_MATCH',`${resolved.code} • ${resolved.product.n||resolved.product.id} • ${source}`);
      send(`✓ ${resolved.product.n||'Produk'} ditambahkan`,'success');return resolved;
    }
    if(resolved.status==='ambiguous'){
      send(`Kode ${resolved.code} cocok dengan lebih dari satu produk. Pilih produk secara manual.`,'warning');log('BARCODE_SCAN_AMBIGUOUS',`${resolved.code} • ${source}`);return resolved;
    }
    send(`Kode tidak ditemukan: ${resolved.code}`,'warning');log('BARCODE_SCAN_MISS',`${resolved.code} • ${source}`);return resolved;
  };
}

export function installMiniCartPresentation(runtime=globalThis){
  const final=runtime?.SJFinalRefinementVC01A2,document=runtime?.document;
  if(!final||typeof final.openCart!=='function'||typeof final.openCheckout!=='function')return Object.freeze({installed:false});
  if(final.__sjMiniCartPatched)return Object.freeze({installed:true,alreadyInstalled:true});
  const baseCart=final.openCart.bind(final),baseCheckout=final.openCheckout.bind(final);
  const overlay=()=>document?.getElementById?.('modal-cart');
  const raf=fn=>typeof runtime?.requestAnimationFrame==='function'?runtime.requestAnimationFrame(fn):fn();
  const decorate=()=>{const ov=overlay();if(!ov)return false;ov.classList?.add?.('sj-ref-mini-cart');ov.setAttribute?.('aria-label','Keranjang ringkas');return true};
  const clear=()=>overlay()?.classList?.remove?.('sj-ref-mini-cart');
  final.openCart=function(...args){const out=baseCart(...args);raf(decorate);return out};
  final.openCheckout=function(...args){clear();return baseCheckout(...args)};
  Object.defineProperty(final,'__sjMiniCartPatched',{value:true,configurable:false,enumerable:false});
  return Object.freeze({installed:true,decorate,clear});
}

function ensureSmartCamera(runtime,stop){
  const d=runtime?.document;if(!d?.body)return null;let box=d.getElementById?.('sj-ref-smart-camera');if(box)return box;
  box=d.createElement('div');box.id='sj-ref-smart-camera';box.className='sj-ref-smart-camera';box.innerHTML='<div class="sj-ref-smart-camera-card"><div class="sj-ref-smart-camera-head"><div><b>Scan Produk</b><span>Cari barcode produk yang terdaftar</span></div><button type="button" data-smart-close>Tutup</button></div><video data-smart-video autoplay playsinline muted></video><div class="sj-ref-scan-frame" aria-hidden="true"></div><p data-smart-note>Arahkan kamera ke barcode produk.</p></div>';
  box.querySelector?.('[data-smart-close]')?.addEventListener?.('click',stop);d.body.appendChild(box);return box;
}

export function installSmartBarcodeResolver(runtime=globalThis){
  const barcode=runtime?.SJBarcodeV1;if(!barcode)return Object.freeze({installed:false});
  if(barcode.__sjSmartResolverPatched)return Object.freeze({installed:true,alreadyInstalled:true});
  const originalOpen=typeof barcode.openCameraScanner==='function'?barcode.openCameraScanner.bind(barcode):null;
  const getProducts=()=>activeProducts(runtime);
  const addProduct=id=>{if(typeof runtime?.quickAddCart!=='function')throw new Error('QUICK_ADD_AUTHORITY_UNAVAILABLE');return runtime.quickAddCart(id)};
  const safe=createSafeResolveAndAdd({getProducts,addProduct,notify:(m,k)=>notify(runtime,m,k),audit:(t,d)=>audit(runtime,t,d)});
  barcode.resolveAndAdd=safe;
  let stream=null,frame=0,busy=false;
  const stop=()=>{if(frame){try{runtime.cancelAnimationFrame?.(frame)}catch(_){}frame=0}if(stream){try{stream.getTracks().forEach(t=>t.stop())}catch(_){}stream=null}const box=runtime?.document?.getElementById?.('sj-ref-smart-camera');if(box)box.style.display='none';busy=false};
  async function openCameraScanner(targetFieldId=''){
    if(String(targetFieldId||''))return originalOpen?originalOpen(targetFieldId):false;
    if(typeof runtime?.BarcodeDetector==='undefined'||!runtime?.navigator?.mediaDevices?.getUserMedia){notify(runtime,'Kamera scanner tidak tersedia. Gunakan input manual atau scanner fisik.','warning');return false}
    stop();const box=ensureSmartCamera(runtime,stop),video=box?.querySelector?.('[data-smart-video]'),note=box?.querySelector?.('[data-smart-note]');if(!box||!video)return false;box.style.display='flex';
    try{
      stream=await runtime.navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=stream;await video.play();
      const formats=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf','qr_code'];let detector;try{detector=new runtime.BarcodeDetector({formats})}catch(_){detector=new runtime.BarcodeDetector()}
      const loop=async()=>{if(!stream)return;if(!busy&&video.readyState>=2){busy=true;try{const found=await detector.detect(video),codes=(found||[]).map(x=>String(x?.rawValue||'')).filter(Boolean);if(codes.length){const r=resolveScannedCandidates(codes,getProducts());if(r.status==='match'){addProduct(r.product.id);audit(runtime,'BARCODE_SCAN_MATCH',`${r.code} • ${r.product.n||r.product.id} • camera`);notify(runtime,`✓ ${r.product.n||'Produk'} ditambahkan`,'success');stop();return}if(note){note.textContent=r.status==='ambiguous'?'Kode cocok dengan beberapa produk. Arahkan ke barcode retail atau gunakan pencarian manual.':`Terbaca ${codes[0]} — belum cocok. Scanner tetap aktif.`}}}catch(_){}finally{busy=false}}frame=runtime.requestAnimationFrame(loop)};
      frame=runtime.requestAnimationFrame(loop);return true;
    }catch(error){stop();notify(runtime,'Kamera scanner tidak dapat dibuka. Gunakan input manual atau scanner fisik.','warning');audit(runtime,'BARCODE_CAMERA_UNAVAILABLE',String(error?.name||error));return false}
  }
  barcode.openCameraScanner=openCameraScanner;barcode.stopSalesCamera=stop;Object.defineProperty(barcode,'__sjSmartResolverPatched',{value:true,configurable:false,enumerable:false});
  return Object.freeze({installed:true,resolveAndAdd:safe,openCameraScanner,stop});
}

function dateMinusDays(dateText,days){const d=new Date(`${dateText}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-days);return d.toISOString().slice(0,10)}
function currentDate(runtime){return String(runtime?.document?.getElementById?.('date-sel')?.value||runtime?.activeDateOnly||'')}
function currentShiftLabel(runtime){const select=runtime?.document?.getElementById?.('shift-sel'),text=select?.selectedOptions?.[0]?.textContent;try{return String(text||runtime?.SJShift?.label?.(select?.value||runtime?.activeShift)||'Shift')}catch(_){return String(text||'Shift')}}
async function readRecentShifts(runtime,date){
  const db=runtime?.firebase?.database?.();if(!db||!date)return {};
  const start=`${dateMinusDays(date,45)}-S1`,end=`${date}-S3`;
  const snap=await db.ref(POS_ROOT).orderByKey().startAt(start).endAt(end).once('value');return snap?.val?.()||{};
}
function statusText(row){if(row.open&&row.overdue)return 'BELUM DITUTUP';if(row.open)return 'AKTIF';return 'DITUTUP'}

export function installHistoricalShiftContext(runtime=globalThis,{shiftAdapter}={}){
  const document=runtime?.document;if(!document)return Object.freeze({installed:false,enhance:()=>false});
  let loading=false;
  function closeSheet(){const sheet=document.getElementById?.('sj-ref-shift-history');if(sheet)sheet.style.display='none'}
  function ensureSheet(){let sheet=document.getElementById?.('sj-ref-shift-history');if(sheet)return sheet;sheet=document.createElement('div');sheet.id='sj-ref-shift-history';sheet.className='sj-ref-shift-history';sheet.innerHTML='<div class="sj-ref-shift-history-card"><div class="sj-ref-shift-history-head"><div><b>Tanggal & Shift</b><span>Pilih hanya shift yang sudah ada</span></div><button type="button" data-history-close>×</button></div><div data-history-body></div></div>';sheet.querySelector('[data-history-close]')?.addEventListener('click',closeSheet);sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});document.body?.appendChild(sheet);return sheet}
  async function openSheet(){
    const sheet=ensureSheet(),body=sheet?.querySelector?.('[data-history-body]');if(!sheet||!body||loading)return;sheet.style.display='flex';loading=true;body.innerHTML='<div class="sj-ref-history-loading">Memuat shift yang sudah ada…</div>';
    try{
      const date=currentDate(runtime),snapshot=await readRecentShifts(runtime,date),rows=historicalShiftRows(snapshot,{now:new Date()}),role=runtime?.__SJ_SC03_RUNTIME?.guard?.currentRole?.(),owner=role==='owner';
      const currentKey=`${date}${document.getElementById('shift-sel')?.value||''}`;
      body.innerHTML=`<div class="sj-ref-current-shift"><span>Konteks aktif</span><b>${shiftContextLabel(date,currentShiftLabel(runtime))}</b></div>${rows.length?rows.map(row=>`<article class="sj-ref-history-row ${row.overdue?'overdue':''}" data-history-key="${row.key}"><div><b>${shiftContextLabel(row.date,`Shift ${row.code.slice(1)}`)}</b><span>${statusText(row)}${row.open?` · ${row.durationLabel}`:''}</span></div><button type="button" data-history-action="${row.overdue&&owner?'close':'open'}" ${row.key===currentKey&&!row.overdue?'disabled':''}>${row.overdue&&owner?'Buka Closing':row.key===currentKey?'Aktif':'Buka'}</button></article>`).join(''):'<div class="sj-ref-history-empty">Belum ada record shift pada 45 hari terakhir.</div>'}`;
      body.querySelectorAll?.('[data-history-key]')?.forEach?.(row=>row.querySelector?.('button')?.addEventListener?.('click',()=>{const key=row.dataset.historyKey,action=row.querySelector('button')?.dataset.historyAction;if(action==='close')shiftAdapter?.openClosing?.(key);else shiftAdapter?.select?.(key);closeSheet()}));
    }catch(error){body.innerHTML='<div class="sj-ref-history-empty">Riwayat shift belum dapat dimuat. Koneksi dan data aktif tidak diubah.</div>';audit(runtime,'SHIFT_HISTORY_READ_FAILED',String(error?.message||error))}finally{loading=false}
  }
  function enhance(){
    const date=currentDate(runtime);if(!date)return false;const shift=currentShiftLabel(runtime),label=shiftContextLabel(date,shift);
    const salesChip=document.querySelector?.('.sjvc01-status span,.sjui03a-status span');if(salesChip){salesChip.textContent=label;salesChip.setAttribute?.('role','button');salesChip.setAttribute?.('tabindex','0');salesChip.setAttribute?.('aria-label',`Tanggal dan shift: ${label}`);if(salesChip.dataset?.sjHistoryBound!=='1'){salesChip.dataset.sjHistoryBound='1';salesChip.addEventListener('click',openSheet);salesChip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSheet()}})}}
    let globalButton=document.getElementById?.('sj-ref-date-context');const controls=document.querySelector?.('.sjpro-header-controls');if(controls&&!globalButton){globalButton=document.createElement('button');globalButton.type='button';globalButton.id='sj-ref-date-context';globalButton.className='sj-ref-date-context';globalButton.addEventListener('click',openSheet);controls.insertBefore(globalButton,controls.firstChild)}if(globalButton)globalButton.textContent=new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(`${date}T12:00:00`)).replace(/\./g,'');return true;
  }
  return Object.freeze({installed:true,enhance,openSheet,closeSheet});
}

export function installSalesShiftUxRefinement(runtime=globalThis,{shiftAdapter}={}){
  if(runtime?.__SJ_SALES_SHIFT_UX)return runtime.__SJ_SALES_SHIFT_UX;
  const barcode=installSmartBarcodeResolver(runtime),miniCart=installMiniCartPresentation(runtime),history=installHistoricalShiftContext(runtime,{shiftAdapter});
  const api=Object.freeze({barcode,miniCart,history,enhance:()=>history.enhance()});
  try{Object.defineProperty(runtime,'__SJ_SALES_SHIFT_UX',{value:api,writable:false,configurable:false,enumerable:false})}catch(_){}
  try{api.enhance()}catch(_){}return api;
}
