/* RC01-S10A QRIS Deferred Settlement & Parked Sale compatibility bridge.
   Classic script on purpose: it shares the frozen legacy lexical environment
   (cart/payMethod/currentLoginId/activeDate) without editing the baseline. */
(function(){
'use strict';
if(window.SJRC01S10AQrisCompat)return;
var VERSION='RC01-S10A';
var SNAPSHOT_VERSION='S10A-1';
var PARK_REASON='SERVE_NEXT_CUSTOMER';
var runtime=null,installed=false,cacheReady=false,ownedParked=[],lateReview=[],lateQueue={},lateInFlight={},lateAttempts={},lateHeld={},lateDrainRunning=false,lateDrainTimer=null,busyPark=false,busyRecover=false,busyCommercialCancel=false;
var COMMERCIAL_CANCEL_TIMEOUT_MS=8000;
var baseOpenPayment=null,baseMatchSignal=null;
function n(v){v=Number(v);return Number.isFinite(v)?v:0}
function txt(v){return String(v==null?'':v).trim()}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function money(v){try{return fmt(n(v))}catch(_){return 'Rp '+n(v).toLocaleString('id-ID')}}
function toast(message,type){try{if(typeof showToast==='function')return showToast(message,type||'info')}catch(_){}try{alert(message)}catch(_){}}
function cashierId(){try{return txt(currentLoginId)}catch(_){return''}}
function currentItems(){try{return Array.isArray(cart)?cart:[]}catch(_){return[]}}
function isQris(method){return txt(method).toUpperCase()==='QRIS'}
function unresolved(row){return !!(runtime&&runtime.policy&&runtime.policy.isUnresolvedParkedPending(row))}
function parkedOwned(){return ownedParked.filter(unresolved)}
function primaryParked(){var rows=parkedOwned();return rows.find(function(x){return String(x.status)==='MATCHED'})||rows[0]||null}
function qrisOpen(){try{var ov=document.getElementById('modal-bayar');return !!(ov&&ov.style.display!=='none'&&isQris(payMethod))}catch(_){return false}}
function safeClosePayment(){try{if(typeof clsModal==='function')clsModal('modal-bayar');else{var x=document.getElementById('modal-bayar');if(x)x.style.display='none'}}catch(_){}try{if(typeof clsModal==='function')clsModal('modal-qris-fs')}catch(_){}}
function goSales(){try{if(typeof showView==='function')showView(1)}catch(_){}try{if(window.SJRefinementSalesV100&&typeof SJRefinementSalesV100.renderSales==='function')SJRefinementSalesV100.renderSales()}catch(_){}
}
function core(){return window.SJQrisSignalCore||null}
function beta(){return window.SJQrisSignalBeta||null}
function price(){return window.SJPrice||null}
function statusActiveId(){try{return txt(beta()&&beta().status&&beta().status().activePendingId)}catch(_){return''}}
function cartBaseFingerprint(items){var c=core();if(!c||typeof c.cartFingerprint!=='function')throw new Error('QRIS_S10A_CORE_REQUIRED');return txt(c.cartFingerprint(items||[]))}
function pricingFingerprint(items){if(!window.SJPrice||typeof SJPrice.fingerprint!=='function')throw new Error('QRIS_S10A_PRICE_REQUIRED');return txt(SJPrice.fingerprint(items||[]))}
function pricingQuote(items){if(!window.SJPrice||typeof SJPrice.quote!=='function')throw new Error('QRIS_S10A_PRICE_REQUIRED');return clone(SJPrice.quote(items||[]))}
function stripItem(item){
  var out={};
  ['id','n','q','p','note','cp','c','discountType','discountValue','inventoryMode','baseProductId','recipeVariantId','virtualCartId','sku','barcode','variantName','recipeVariantName','trackStock'].forEach(function(k){if(item&&item[k]!=null)out[k]=clone(item[k])});
  return out;
}
function captureSnapshot(pending){
  var items=currentItems().map(stripItem),p=price();if(!items.length||!p)throw new Error('QRIS_S10A_SNAPSHOT_CART_REQUIRED');
  var quote=pricingQuote(items),base=cartBaseFingerprint(items),pf=pricingFingerprint(items),amount=n(quote.total);
  if(amount!==n(pending&&pending.amount))throw new Error('QRIS_S10A_SNAPSHOT_AMOUNT_MISMATCH');
  return{capturedAt:Date.now(),amount:amount,cartFingerprint:base,pricingFingerprint:pf,items:items,pricing:quote};
}
async function refreshEvidence(){
  if(!runtime)return;
  try{ownedParked=await runtime.findOwnedUnresolvedParked(cashierId());cacheReady=true}catch(_){cacheReady=false}
  try{lateReview=await runtime.findLateReviewSignals(cashierId())}catch(_){lateReview=[]}
  renderSurface();
}
function guardSecondQris(){
  if(!cacheReady){refreshEvidence();toast('Memeriksa QRIS yang masih diparkir. Coba QRIS lagi setelah status selesai dimuat.','warning');return false}
  var row=primaryParked();if(!row)return true;
  var message='QRIS baru diblokir karena masih ada transaksi QRIS diparkir '+money(row.amount)+'. Selesaikan atau batalkan pending tersebut terlebih dahulu.';
  toast(message,'warning');try{var e=new Error(message);e.code='QRIS_S10A_SECOND_QRIS_BLOCKED';window.__SJ_QRIS_S10A_LAST_BLOCK=e}catch(_){}
  return false;
}
async function parkCurrent(){
  if(busyPark)return false;busyPark=true;
  try{
    if(!runtime)throw new Error('QRIS_S10A_RUNTIME_REQUIRED');
    var id=statusActiveId();if(!id)throw new Error('QRIS_S10A_PENDING_REQUIRED');
    var row=await runtime.readPending(id);if(!row)throw new Error('QRIS_S10A_PENDING_NOT_FOUND');
    if(txt(row.cashierId)!==cashierId())throw new Error('QRIS_S10A_CASHIER_MISMATCH');
    if(txt(row.status)!=='WAITING_QRIS'||row.providerTransactionId)throw new Error('QRIS_S10A_PENDING_NOT_PARKABLE');
    var persisted=row;
    if(!(row.parkedAt!=null&&txt(row.saleSnapshotVersion)===SNAPSHOT_VERSION&&row.saleSnapshot)){
      var snapshot=captureSnapshot(row);
      persisted=await runtime.writer.attachSnapshotAndPark({pendingId:id,cashierId:cashierId(),parkedBy:cashierId(),snapshot:snapshot});
    }
    if(!persisted||persisted.parkedAt==null||txt(persisted.saleSnapshotVersion)!==SNAPSHOT_VERSION||!persisted.saleSnapshot)throw new Error('QRIS_S10A_PARK_VERIFY_FAILED');
    ownedParked=[persisted].concat(ownedParked.filter(function(x){return txt(x.pendingId)!==id}));cacheReady=true;
    try{cart=[]}catch(_){}
    try{if(price()&&typeof SJPrice.resetSession==='function')SJPrice.resetSession()}catch(_){}
    try{if(window.SJCommercialFinalV5961)SJCommercialFinalV5961.saleCustomer=''}catch(_){}
    try{payMethod='Tunai';if(window.SJCommercialFinalV5961)SJCommercialFinalV5961.cartMethod='Tunai'}catch(_){}
    try{if(typeof updateCartUI==='function')updateCartUI()}catch(_){}
    safeClosePayment();goSales();renderSurface();
    toast('QRIS '+money(persisted.amount)+' diparkir. Anda dapat melayani transaksi non-QRIS berikutnya.','success');
    return true;
  }catch(error){toast(error&&error.message||'QRIS belum dapat diparkir.','error');return false}
  finally{busyPark=false}
}
async function trueCancelParked(row){
  if(!row)return false;
  var warning='Batalkan pending QRIS '+money(row.amount)+'?\n\nPembatalan hanya menghentikan pending di POS dan TIDAK dapat membatalkan pembayaran yang mungkin sudah dikirim pelanggan. Jika signal datang terlambat, sistem akan menahannya untuk Perlu Tindakan.';
  if(!confirm(warning))return false;
  try{
    var b=beta();if(!b||typeof b.cancelWaiting!=='function')throw new Error('QRIS_S10A_CANCEL_AUTHORITY_REQUIRED');
    var ok=await b.cancelWaiting(true);if(!ok)throw new Error('Pending sudah menerima signal dan tidak boleh dibatalkan.');
    ownedParked=ownedParked.filter(function(x){return txt(x.pendingId)!==txt(row.pendingId)});renderSurface();await refreshEvidence();return true;
  }catch(error){toast(error&&error.message||'Pending QRIS tidak dapat dibatalkan.','error');return false}
}
function cloneStoredPricing(snapshot){return clone(snapshot&&snapshot.pricing||{})}
async function recoverMatched(row){
  if(busyRecover)return false;busyRecover=true;
  var originalQuote=null,originalFingerprint=null,originalRevalidate=null,revalidateOwner=null,restored=false;
  try{
    if(!runtime)throw new Error('QRIS_S10A_RUNTIME_REQUIRED');
    if(currentItems().length)throw new Error('QRIS_S10A_RECOVERY_CART_NOT_EMPTY');
    var fresh=await runtime.readPending(row&&row.pendingId);if(!fresh||txt(fresh.status)!=='MATCHED'||!fresh.providerTransactionId)throw new Error('QRIS_S10A_RECOVERY_NOT_MATCHED');
    if(txt(fresh.saleSnapshotVersion)!==SNAPSHOT_VERSION||!fresh.saleSnapshot)throw new Error('QRIS_S10A_RECOVERY_SNAPSHOT_REQUIRED');
    var snapshot=clone(fresh.saleSnapshot),items=clone(snapshot.items||[]);if(!items.length)throw new Error('QRIS_S10A_RECOVERY_SNAPSHOT_REQUIRED');
    var base=cartBaseFingerprint(items);if(base!==txt(snapshot.cartFingerprint))throw new Error('QRIS_S10A_RECOVERY_FINGERPRINT_MISMATCH');
    var p=price();if(!p||typeof p.quote!=='function'||typeof p.fingerprint!=='function')throw new Error('QRIS_S10A_PRICE_REQUIRED');
    originalQuote=p.quote;originalFingerprint=p.fingerprint;
    revalidateOwner=window.SJReliability&&typeof SJReliability.revalidateCart==='function'?SJReliability:null;
    if(revalidateOwner){
      originalRevalidate=SJReliability.revalidateCart;
      SJReliability.revalidateCart=async function(){
        var paidCart=clone(currentItems());
        try{
          var menu=await originalRevalidate.apply(this,arguments);
          /* paid snapshot price is authoritative: preserve the exact paid cart after all ordinary availability/recipe checks. */
          cart=clone(paidCart);
          return menu;
        }catch(error){
          cart=clone(paidCart);
          if(error&&error.priceChanged===true){
            /* The customer already paid the snapshot amount; a later master-price edit must not rewrite this sale. */
            return await this.freshMenu();
          }
          if(error&&error.code==='CART_PRODUCT_MISSING')error.s10aCode='QRIS_S10A_RECOVERY_PRODUCT_MISSING';
          throw error;
        }
      };
    }
    var storedPricing=cloneStoredPricing(snapshot),storedPf=txt(snapshot.pricingFingerprint);
    p.quote=function(target){if(target===cart||target===items||JSON.stringify(target||[])===JSON.stringify(cart||[]))return clone(storedPricing);return originalQuote.apply(this,arguments)};
    p.fingerprint=function(target){if(target===cart||target===items||JSON.stringify(target||[])===JSON.stringify(cart||[]))return storedPf;return originalFingerprint.apply(this,arguments)};
    cart=items;restored=true;try{payMethod='QRIS';if(window.SJCommercialFinalV5961){SJCommercialFinalV5961.cartMethod='QRIS';SJCommercialFinalV5961.saleCustomer=''}}catch(_){}
    try{if(typeof updateCartUI==='function')updateCartUI()}catch(_){}
    var combined=runtime.policy.combinedQrisFingerprint(cartBaseFingerprint(cart),p.fingerprint(cart));
    if(combined!==txt(fresh.cartFingerprint))throw new Error('QRIS_S10A_RECOVERY_FINGERPRINT_MISMATCH');
    var b=beta();if(!b||typeof b.confirmMatched!=='function')throw new Error('QRIS_S10A_FINALIZER_REQUIRED');
    await b.confirmMatched();
    var after=await runtime.readPending(fresh.pendingId);if(!after||txt(after.status)!=='FINALIZED')throw new Error('QRIS_S10A_RECOVERY_NOT_FINALIZED');
    restored=false;ownedParked=ownedParked.filter(function(x){return txt(x.pendingId)!==txt(fresh.pendingId)});await refreshEvidence();return true;
  }catch(error){
    if(restored)toast('QRIS belum selesai. Keranjang transaksi yang diparkir tetap dipulihkan agar evidence tidak hilang. '+(error&&error.message||''),'error');
    else toast(error&&error.message||'QRIS diparkir belum dapat dipulihkan.','error');
    return false;
  }finally{
    try{var p2=price();if(p2&&originalQuote)p2.quote=originalQuote;if(p2&&originalFingerprint)p2.fingerprint=originalFingerprint}catch(_){}
    try{if(revalidateOwner&&originalRevalidate)revalidateOwner.revalidateCart=originalRevalidate}catch(_){}
    busyRecover=false;renderSurface();
  }
}
function lateLabel(row){return txt(row&&row.status)==='LATE_OR_NEW_AMBIGUOUS'?'Pembayaran terlambat / QRIS baru ambigu':'Pembayaran masuk setelah pending dibatalkan'}
function ensureSurface(){
  if(document.getElementById('sj-s10a-qris-surface'))return;
  var root=document.createElement('div');root.id='sj-s10a-qris-surface';root.style.cssText='position:fixed;left:10px;right:10px;bottom:78px;z-index:8600;display:none;max-width:620px;margin:auto;font-family:inherit';document.body.appendChild(root);
}
function renderSurface(){
  if(typeof document==='undefined')return;ensureSurface();var root=document.getElementById('sj-s10a-qris-surface');if(!root)return;
  var row=primaryParked(),late=lateReview[0];if(!row&&!late){root.style.display='none';root.innerHTML='';return}
  var html='<div style="border:1px solid #d5e5dc;background:#fff;border-radius:14px;box-shadow:0 8px 26px rgba(0,0,0,.16);padding:10px 12px;color:#183126">';
  if(row){var matched=txt(row.status)==='MATCHED';html+='<div style="font-weight:800;font-size:13px">'+(matched?'✓ QRIS diterima • selesaikan transaksi diparkir':'⏳ 1 QRIS diparkir • '+money(row.amount))+'</div><div style="font-size:11px;color:#61756a;margin-top:3px">'+money(row.amount)+' • '+txt(row.pendingId).slice(-10)+'</div><div style="display:flex;gap:7px;margin-top:8px;flex-wrap:wrap">'+(matched?'<button data-s10a-recover style="border:0;border-radius:9px;background:#087545;color:white;padding:9px 11px;font-weight:750">Pulihkan & Selesaikan</button>':'<button data-s10a-open style="border:1px solid #bfd8c9;border-radius:9px;background:white;color:#087545;padding:9px 11px;font-weight:750">Lihat QRIS Pending</button><button data-s10a-cancel style="border:1px solid #fecaca;border-radius:9px;background:#fff;color:#b91c1c;padding:9px 11px;font-weight:750">Batalkan Pending</button>')+'</div>'}
  if(late){html+='<div style="margin-top:'+(row?'9':'0')+'px;border-top:'+(row?'1px solid #e7eeea':'0')+';padding-top:'+(row?'9':'0')+'px"><div style="font-weight:800;color:#b45309;font-size:12.5px">⚠ Perlu Tindakan</div><div style="font-size:11px;color:#6b6255;margin-top:3px">'+lateLabel(late)+' • '+money(late.amount)+' • auto-match diblokir: '+String(late.autoMatchBlocked===true)+'</div></div>'}
  html+='</div>';root.innerHTML=html;root.style.display='block';
  var recover=root.querySelector('[data-s10a-recover]');if(recover)recover.onclick=function(){recoverMatched(row)};
  var cancel=root.querySelector('[data-s10a-cancel]');if(cancel)cancel.onclick=function(){trueCancelParked(row)};
  var open=root.querySelector('[data-s10a-open]');if(open)open.onclick=function(){try{showView(1);if(window.SJCommercialFinalV5961)SJCommercialFinalV5961.openPayment('QRIS')}catch(_){}};
}
function releaseCommercialPayment(){
  safeClosePayment();
  try{if(window.SJFinalRefinementVC01A2&&typeof SJFinalRefinementVC01A2.leaveTransactionFlow==='function')SJFinalRefinementVC01A2.leaveTransactionFlow()}catch(_){}
  goSales();
}
function cancelWithTimeout(b){
  return Promise.race([
    Promise.resolve().then(function(){return b.cancelWaiting(true)}),
    new Promise(function(_,reject){setTimeout(function(){var e=new Error('Pembatalan QRIS melewati batas waktu. Status tetap ditahan; cek kembali sebelum mencoba lagi.');e.code='QRIS_S10C_R6_CANCEL_TIMEOUT';reject(e)},COMMERCIAL_CANCEL_TIMEOUT_MS)})
  ]);
}
async function cancelCommercialPending(cancel){
  if(busyCommercialCancel)return false;
  var id=statusActiveId(),fresh=id&&runtime?await runtime.readPending(id):null;if(!fresh)return false;
  if(fresh.providerTransactionId){toast('Pembayaran QRIS sudah terdeteksi. Pending tidak boleh ditutup sebagai pembatalan.','warning');return false}
  var warning='Batalkan pending QRIS '+money(fresh.amount)+'?\n\nIni tidak membatalkan pembayaran yang mungkin sudah dikirim pelanggan. Signal terlambat akan masuk Perlu Tindakan.';if(!confirm(warning))return false;
  var b=beta();if(!b||typeof b.cancelWaiting!=='function'){toast('QRIS_S10A_CANCEL_AUTHORITY_REQUIRED','error');return false}
  var label=cancel&&cancel.textContent||'Batalkan QRIS';busyCommercialCancel=true;if(cancel){cancel.disabled=true;cancel.textContent='Membatalkan…'}
  try{
    var ok=await cancelWithTimeout(b);if(!ok)throw new Error('Pending sudah menerima signal dan tidak boleh dibatalkan.');
    releaseCommercialPayment();setTimeout(refreshEvidence,50);return true;
  }catch(error){toast(error&&error.message||'Pending QRIS tidak dapat dibatalkan.','error');return false}
  finally{busyCommercialCancel=false;if(cancel&&qrisOpen()){cancel.disabled=false;cancel.textContent=label}}
}
function patchQrisSheet(){
  if(!qrisOpen())return;var modal=document.querySelector('#modal-bayar .modal'),page=modal&&modal.querySelector('.sj61-pay');if(!page)return;
  var active=statusActiveId(),row=ownedParked.find(function(x){return txt(x.pendingId)===active});
  if(!row){
    var actions=page.querySelector('#sj-qris-commercial-actions');if(actions&&!page.querySelector('[data-s10a-park]')){var park=document.createElement('button');park.type='button';park.setAttribute('data-s10a-park','1');park.className='sj-qris-secondary';park.style.cssText='background:#087545;color:#fff;border-color:#087545';park.textContent='Parkir QRIS & Layani Berikutnya';actions.insertBefore(park,actions.firstChild);park.onclick=parkCurrent}
  }
  var back=page.querySelector('[data-pay-back]'),close=page.querySelector('[data-pay-close]');if(back){back.textContent='Parkir QRIS & Layani Berikutnya';back.onclick=parkCurrent}if(close)close.onclick=parkCurrent;
  var cancel=page.querySelector('#sj-qris-commercial-cancel');if(cancel&&!cancel.__s10a){cancel.__s10a=true;cancel.onclick=function(){return cancelCommercialPending(cancel)}}
}
function lateIds(value){return Array.from(new Set((Array.isArray(value)?value:[]).map(function(x){return txt(x)}).filter(Boolean))).sort()}
function sameLateRequest(a,b){return !!(a&&b&&txt(a.status)===txt(b.status)&&JSON.stringify(lateIds(a.lateCandidatePendingIds))===JSON.stringify(lateIds(b.lateCandidatePendingIds)))}
function sameDurableLate(signal,request){return !!(signal&&request&&txt(signal.status)===txt(request.status)&&signal.autoMatchBlocked===true&&txt(signal.resolutionState)==='REVIEW_REQUIRED'&&JSON.stringify(lateIds(signal.lateCandidatePendingIds))===JSON.stringify(lateIds(request.lateCandidatePendingIds)))}
function scheduleLateDrain(delay){
  if(lateDrainRunning||lateDrainTimer)return false;
  lateDrainTimer=setTimeout(function(){lateDrainTimer=null;drainLateQueue()},Math.max(0,n(delay)));
  return true;
}
function queueLate(conflict){
  if(!conflict||!conflict.providerTransactionId)return false;
  var id=txt(conflict.providerTransactionId);if(!id)return false;
  try{if(window.SJRC01S10A1QrisEventShield&&typeof SJRC01S10A1QrisEventShield.markBlocked==='function')SJRC01S10A1QrisEventShield.markBlocked(id,n(conflict.amount))}catch(_){}
  if(lateHeld[id])return false;
  if(sameLateRequest(lateQueue[id],conflict)||sameLateRequest(lateInFlight[id],conflict))return false;
  lateQueue[id]=conflict;scheduleLateDrain(0);return true;
}
async function drainLateQueue(){
  if(!runtime||lateDrainRunning)return false;
  lateDrainRunning=true;
  try{
    var keys=Object.keys(lateQueue);for(var i=0;i<keys.length;i++){
      var id=keys[i],c=lateQueue[id];if(!c||lateInFlight[id])continue;
      delete lateQueue[id];lateInFlight[id]=c;
      try{
        var existing=null;
        try{if(typeof runtime.readSignal==='function')existing=await runtime.readSignal(id)}catch(_){existing=null}
        if(!sameDurableLate(existing,c)){
          lateAttempts[id]=(lateAttempts[id]||0)+1;
          await runtime.writer.quarantineLateSignal({providerTransactionId:id,status:c.status,lateCandidatePendingIds:c.lateCandidatePendingIds});
          delete lateAttempts[id];delete lateHeld[id];
          toast('Pembayaran QRIS terlambat '+money(c.amount||0)+' ditahan sebagai Perlu Tindakan. autoMatchBlocked=true','warning');
        }else{delete lateAttempts[id];delete lateHeld[id]}
      }catch(error){
        var attempt=lateAttempts[id]||1;
        if(attempt<2){if(!lateQueue[id])lateQueue[id]=c}
        else{
          lateHeld[id]={request:c,failedAt:Date.now(),attempts:attempt};
          try{
            if(typeof sjSaveError==='function'){
              var rootCode=txt(error&&error.code)||'UNKNOWN',rootMessage=txt(error&&error.message)||txt(error)||'Unknown Firebase error';
              var heldError=new Error('QRIS late quarantine held after '+attempt+' attempts for '+id+' ['+rootCode+'] '+rootMessage);
              heldError.code='QRIS_LATE_QUARANTINE_FAILED_HELD';heldError.providerTransactionId=id;heldError.rootCode=rootCode;heldError.attempts=attempt;
              sjSaveError('QRIS_LATE_QUARANTINE_FAILED_HELD',heldError);
            }
          }catch(_){}
        }
      }
      finally{delete lateInFlight[id]}
    }
  }finally{
    lateDrainRunning=false;
    if(Object.keys(lateQueue).length)scheduleLateDrain(500);
    setTimeout(refreshEvidence,50);
  }
  return true;
}
function patchMatcher(){
  var c=core();if(!c||typeof window.SJQrisSignalCore.matchSignal!=='function'||window.SJQrisSignalCore.matchSignal.__s10a)return;
  baseMatchSignal=window.SJQrisSignalCore.matchSignal.bind(c);
  var wrapped=function(signal,pendingRows,nowMs,windowMs){
    var conflict=runtime.policy.classifyLateSignalConflict(signal,pendingRows,nowMs,windowMs);if(conflict){conflict=Object.assign({amount:n(signal&&signal.amount)},conflict);queueLate(conflict);return{status:'UNMATCHED',candidateIds:[],s10aLateStatus:conflict.status,lateCandidatePendingIds:conflict.lateCandidatePendingIds,autoMatchBlocked:true}}
    return baseMatchSignal(signal,pendingRows,nowMs,windowMs);
  };
  wrapped.__s10a=true;wrapped.__s10aBaseMatch=baseMatchSignal;c.matchSignal=wrapped;
  try{if(beta())beta().matchSignal=wrapped}catch(_){}
}
function patchPaymentOpen(){
  if(!window.SJCommercialFinalV5961||typeof SJCommercialFinalV5961.openPayment!=='function'||SJCommercialFinalV5961.openPayment.__s10a)return;
  baseOpenPayment=SJCommercialFinalV5961.openPayment.bind(SJCommercialFinalV5961);
  var wrapped=function(method){if(isQris(method||this.cartMethod)&&!guardSecondQris())return false;return baseOpenPayment(method)};wrapped.__s10a=true;SJCommercialFinalV5961.openPayment=wrapped;
  try{if(window.SJCommercialUIV5953)SJCommercialUIV5953.openPay=function(m){return SJCommercialFinalV5961.openPayment(m||SJCommercialFinalV5961.cartMethod)};if(window.SJCommercialVisualV5955)SJCommercialVisualV5955.openPay=function(m){return SJCommercialFinalV5961.openPayment(m||SJCommercialFinalV5961.cartMethod)}}catch(_){}
}
function install(){
  if(installed||!window.__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME||!core()||!beta()||!window.SJCommercialFinalV5961)return false;
  runtime=window.__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME;installed=true;patchMatcher();patchPaymentOpen();refreshEvidence();
  setInterval(refreshEvidence,1400);setInterval(patchQrisSheet,250);setInterval(renderSurface,750);window.addEventListener('online',refreshEvidence);window.addEventListener('focus',refreshEvidence);
  window.SJRC01S10AQrisCompat=Object.freeze({version:VERSION,parkCurrent:parkCurrent,recoverMatched:recoverMatched,refreshEvidence:refreshEvidence,getParked:function(){return clone(ownedParked)},getLateReview:function(){return clone(lateReview)},constants:Object.freeze({saleSnapshotVersion:SNAPSHOT_VERSION,parkReason:PARK_REASON,LATE_AFTER_CANCEL:'LATE_AFTER_CANCEL',LATE_OR_NEW_AMBIGUOUS:'LATE_OR_NEW_AMBIGUOUS',QRIS_S10A_SECOND_QRIS_BLOCKED:'QRIS_S10A_SECOND_QRIS_BLOCKED'})});
  return true;
}
var timer=setInterval(function(){if(install())clearInterval(timer)},40);setTimeout(function(){install()},0);
})();
