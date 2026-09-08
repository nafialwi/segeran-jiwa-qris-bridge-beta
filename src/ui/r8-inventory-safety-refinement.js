import { posPath } from '../data/firebase-client.js';

const MARK='__SJ_R8_INVENTORY_SAFETY';

const num=value=>Number.isFinite(Number(value))?Number(value):0;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function planRestockReceiptR8({requestedQty,receivedQty,reason=''}={}){
  const requested=num(requestedQty),received=num(receivedQty),note=String(reason||'').trim();
  if(!Number.isFinite(requested)||requested<=0)throw new Error('RESTOCK_REQUEST_QTY_INVALID');
  if(!Number.isFinite(received)||received<0)throw new Error('RESTOCK_RECEIVED_QTY_INVALID');
  const variance=received-requested;
  if(variance!==0&&!note)throw new Error('RESTOCK_RECEIVE_VARIANCE_REASON_REQUIRED');
  return Object.freeze({requestedQty:requested,receivedQty:received,receiveVariance:variance,receiveReason:note});
}

export function openPurchaseCorrectionR8(runtime=globalThis,financeWorkspace=null){
  if(!financeWorkspace?.setSurface||!financeWorkspace?.setTab)return false;
  try{runtime?.showView?.(3)}catch(_){}
  financeWorkspace.setSurface('finance');
  financeWorkspace.setTab('cashflow');
  financeWorkspace.enhance?.();
  return true;
}

function globalValue(runtime,expression,fallback=null){
  try{if(typeof runtime?.Function==='function')return runtime.Function(`try{return (${expression})}catch(_){return null}`)()??fallback}catch(_){}
  return fallback;
}

function parsePhysical(value){
  const digits=String(value??'').replace(/[^0-9-]/g,'');
  if(!digits)return NaN;
  return Number(digits);
}

function runtimeValue(runtime,expression,fallback=''){
  try{if(typeof runtime?.Function==='function')return runtime.Function(`try{return (${expression})}catch(_){return null}`)()??fallback}catch(_){}
  return fallback;
}

function makePhysicalReceiptCoordinator(runtime,legacyReceive){
  const hardening=runtime?.SJOperationalHardening,db=runtime?.firebase?.database?.();
  if(typeof legacyReceive!=='function'||!hardening||typeof hardening.verifiedUpdate!=='function'||!db)return null;
  return async function coordinatePhysicalReceipt(key,input){
    const row=requestRows(runtime).find(item=>String(item._key)===String(key));if(!row)throw new Error('RESTOCK_REQUEST_NOT_FOUND');
    const plan=planRestockReceiptR8({requestedQty:row.requestQty,receivedQty:input?.receivedQty,reason:input?.reason});
    const receivedPath=`global/restockRequests/${key}/receivedAttemptId`,baseVerified=hardening.verifiedUpdate.bind(hardening),baseToast=runtime?.showToast;
    let capturedAttempt='';
    async function captureVerified(updates,...rest){
      if(updates&&updates[receivedPath])capturedAttempt=String(updates[receivedPath]||'');
      return baseVerified(updates,...rest);
    }
    function quietRestockToast(message,kind,...rest){
      if(String(kind||'').toLowerCase()==='success'&&/^(?:Stok diterima\.|Penerimaan stok sudah tersimpan)/i.test(String(message||'')))return false;
      return typeof baseToast==='function'?baseToast.call(this,message,kind,...rest):undefined;
    }
    hardening.verifiedUpdate=captureVerified;if(typeof baseToast==='function')runtime.showToast=quietRestockToast;
    try{await legacyReceive(key)}finally{if(hardening.verifiedUpdate===captureVerified)hardening.verifiedUpdate=baseVerified;if(runtime.showToast===quietRestockToast)runtime.showToast=baseToast}
    if(!capturedAttempt)throw new Error('RESTOCK_RECEIVE_NOT_COMMITTED');
    const requestSnap=await db.ref(posPath('global','restockRequests',key)).once('value'),request=requestSnap?.val?.()||{};
    if(String(request.status||'').toUpperCase()!=='DONE'||String(request.receivedAttemptId||'')!==capturedAttempt)throw new Error('RESTOCK_RECEIVE_EVIDENCE_MISMATCH');
    if(request.receivingAttemptId&&String(request.receivingAttemptId)!==capturedAttempt)throw new Error('RESTOCK_RECEIVE_ATTEMPT_MISMATCH');
    const serverPlan=planRestockReceiptR8({requestedQty:request.requestQty,receivedQty:plan.receivedQty,reason:plan.receiveReason});
    const correctionId=`R8-${capturedAttempt}`,updates={};
    updates[`global/restockRequests/${key}/requestedQty`]=serverPlan.requestedQty;
    updates[`global/restockRequests/${key}/receivedQty`]=serverPlan.receivedQty;
    updates[`global/restockRequests/${key}/receiveVariance`]=serverPlan.receiveVariance;
    updates[`global/restockRequests/${key}/receiveReason`]=serverPlan.receiveReason||null;
    updates[`global/restockRequests/${key}/r8PhysicalCorrectionAttemptId`]=correctionId;
    if(serverPlan.receiveVariance!==0){
      updates[`global/inventory/${request.productId}`]=runtime.firebase.database.ServerValue.increment(serverPlan.receiveVariance);
      const ledgerRef=db.ref(posPath('global','stockLedger')).push(),ledgerId=ledgerRef?.key||`R8-${Date.now()}`;
      updates[`global/stockLedger/${ledgerId}`]={id:ledgerId,productId:request.productId,productName:request.productName||row.productName||'Produk',delta:serverPlan.receiveVariance,type:'RESTOCK_RECEIVE_VARIANCE',refId:key,receiveAttemptId:capturedAttempt,requestedQty:serverPlan.requestedQty,receivedQty:serverPlan.receivedQty,receiveVariance:serverPlan.receiveVariance,receiveReason:serverPlan.receiveReason,user:runtimeValue(runtime,'typeof currentUserName!=="undefined"?currentUserName:""',''),userId:runtimeValue(runtime,'typeof currentLoginId!=="undefined"?currentLoginId:""',''),ts:Date.now(),at:new Date().toISOString(),shift:runtimeValue(runtime,'typeof activeDate!=="undefined"?activeDate:""','')};
    }
    await hardening.verifiedUpdate(updates,'RESTOCK_PHYSICAL_VARIANCE_TIMEOUT',async()=>String((await db.ref(posPath('global','restockRequests',key,'r8PhysicalCorrectionAttemptId')).once('value')).val?.()||'')===correctionId);
    runtime?.showToast?.(`Penerimaan terverifikasi: ${serverPlan.receivedQty} dari ${serverPlan.requestedQty}${serverPlan.receiveVariance?` · selisih ${serverPlan.receiveVariance>0?'+':''}${serverPlan.receiveVariance}`:''}.`,'success');
    return serverPlan;
  };
}
function requestRows(runtime){
  const value=globalValue(runtime,'typeof cloudData!=="undefined"?cloudData?.global?.restockRequests:null',null);
  if(Array.isArray(value))return value.filter(Boolean).map((row,index)=>({...row,_key:row?._key??row?.id??String(index)}));
  if(value&&typeof value==='object')return Object.entries(value).filter(([,row])=>row!=null).map(([key,row])=>({...row,_key:row?._key??key}));
  return [];
}

function ensureModal(runtime,onSubmit){
  const document=runtime?.document;if(!document?.body)return null;
  let modal=document.getElementById?.('modal-r8-restock-receive');
  if(modal)return modal;
  const host=document.createElement?.('div');if(!host)return null;
  host.innerHTML=`<div class="overlay" id="modal-r8-restock-receive" style="display:none"><div class="modal"><div class="modal-title">TERIMA &amp; HITUNG STOK</div><div class="sjx-note"><b data-r8-restock-name>Barang</b><br>Jumlah dikirim: <b data-r8-restock-requested>0</b>. Hitung barang fisik sebelum menyimpan.</div><div class="sjx-form"><label>JUMLAH FISIK DITERIMA</label><input data-r8-restock-received inputmode="numeric" placeholder="Isi hasil hitung fisik"><label>ALASAN SELISIH</label><textarea data-r8-restock-reason rows="3" placeholder="Wajib jika jumlah diterima berbeda"></textarea><div data-r8-restock-error class="sjx-note" style="display:none"></div><button type="button" class="sjx-primary" data-r8-restock-save style="width:100%">SIMPAN PENERIMAAN</button><button type="button" class="sjx-secondary" data-r8-restock-cancel style="width:100%;margin-top:7px">BATAL</button></div></div></div>`;
  modal=host.firstElementChild;if(!modal)return null;document.body.appendChild(modal);
  modal.querySelector?.('[data-r8-restock-cancel]')?.addEventListener?.('click',()=>{modal.style.display='none'});
  modal.querySelector?.('[data-r8-restock-save]')?.addEventListener?.('click',()=>onSubmit(modal));
  return modal;
}

function decorateInventoryCorrection(document,onOpen){
  const more=document?.querySelector?.('.sj-v32-inv-more');if(!more||more.querySelector?.('[data-r8-purchase-correction]'))return false;
  const button=document.createElement?.('button');if(!button)return false;
  button.type='button';button.dataset.r8PurchaseCorrection='true';button.innerHTML='<span aria-hidden="true">↩</span><b>Koreksi Pembelian</b><small>Buka riwayat pembelian dan gunakan Purchase Reversal yang terkontrol.</small>';
  button.addEventListener?.('click',onOpen);more.insertAdjacentElement?.('afterbegin',button);return true;
}

function decorateReceiptButtons(document){
  let changed=0;for(const button of Array.from(document?.querySelectorAll?.('button[onclick*="SJX.receiveRestock"]')||[])){
    if(button.dataset?.r8PhysicalReceipt==='true')continue;
    button.dataset.r8PhysicalReceipt='true';button.textContent='TERIMA & HITUNG';changed++;
  }return changed;
}

export function installR8InventorySafetyRefinement(runtime=globalThis,{inventoryWorkspace=null,financeWorkspace=null,notify=()=>{}}={}){
  if(runtime?.[MARK])return runtime[MARK];
  const document=runtime?.document??null,legacyReceive=typeof runtime?.SJX?.receiveRestock==='function'?runtime.SJX.receiveRestock.bind(runtime.SJX):null,writer=makePhysicalReceiptCoordinator(runtime,legacyReceive);
  let activeKey='';
  const api={
    installed:true,
    openPurchaseCorrection(){
      try{document?.getElementById?.('sj-v32-inventory-workspace')&&(document.getElementById('sj-v32-inventory-workspace').style.display='none')}catch(_){}
      const ok=openPurchaseCorrectionR8(runtime,financeWorkspace);if(ok)notify('Pilih transaksi pembelian pada Arus Kas untuk membuka audit dan Purchase Reversal.','info');return ok;
    },
    openPhysicalReceipt(key){
      const row=requestRows(runtime).find(item=>String(item._key)===String(key));if(!row)return false;
      activeKey=String(key);const modal=ensureModal(runtime,async node=>{
        const save=node.querySelector?.('[data-r8-restock-save]'),error=node.querySelector?.('[data-r8-restock-error]');
        try{
          const received=parsePhysical(node.querySelector?.('[data-r8-restock-received]')?.value),reason=node.querySelector?.('[data-r8-restock-reason]')?.value||'';
          planRestockReceiptR8({requestedQty:row.requestQty,receivedQty:received,reason});
          if(!writer)throw new Error('RESTOCK_RECEIVE_AUTHORITY_UNAVAILABLE');
          if(save){save.disabled=true;save.textContent='MENYIMPAN…'};if(error)error.style.display='none';
          await writer(activeKey,{receivedQty:received,reason});node.style.display='none';
        }catch(e){if(error){error.style.display='block';error.textContent=e?.message==='RESTOCK_RECEIVE_VARIANCE_REASON_REQUIRED'?'Alasan wajib jika jumlah fisik berbeda dari jumlah dikirim.':e?.message==='RESTOCK_RECEIVED_QTY_INVALID'?'Jumlah fisik tidak valid.':e?.message||'Penerimaan belum tersimpan.'}else runtime?.alert?.(e?.message||'Penerimaan belum tersimpan.')}finally{if(save){save.disabled=false;save.textContent='SIMPAN PENERIMAAN'}}
      });
      if(!modal)return false;modal.querySelector?.('[data-r8-restock-name]')&&(modal.querySelector('[data-r8-restock-name]').textContent=row.productName||'Barang');modal.querySelector?.('[data-r8-restock-requested]')&&(modal.querySelector('[data-r8-restock-requested]').textContent=String(num(row.requestQty)));const input=modal.querySelector?.('[data-r8-restock-received]');if(input)input.value='';const reason=modal.querySelector?.('[data-r8-restock-reason]');if(reason)reason.value='';const error=modal.querySelector?.('[data-r8-restock-error]');if(error)error.style.display='none';modal.style.display='flex';input?.focus?.();return true;
    },
    enhance(){decorateReceiptButtons(document);decorateInventoryCorrection(document,()=>api.openPurchaseCorrection());return true},
    snapshot:()=>Object.freeze({installed:true,writerAvailable:!!writer})
  };
  if(runtime?.SJX&&typeof runtime.SJX==='object')runtime.SJX.receiveRestock=key=>api.openPhysicalReceipt(key);
  const frozen=Object.freeze(api);try{Object.defineProperty(runtime,MARK,{value:frozen,writable:false,configurable:false,enumerable:false})}catch(_){}
  return frozen;
}
