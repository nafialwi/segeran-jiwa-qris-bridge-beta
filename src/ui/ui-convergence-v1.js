const text=v=>String(v??'').trim();

export function shiftUiContextKeyV1(runtime=globalThis){
  const document=runtime?.document;
  let shiftKey='';
  try{shiftKey=text(runtime?.Function?.('try{return typeof activeDate!=="undefined"?activeDate:""}catch(_){return ""}')?.())}catch(_){}
  if(!shiftKey){
    const date=text(document?.getElementById?.('date-sel')?.value),shift=text(document?.getElementById?.('shift-sel')?.value);
    shiftKey=date&&shift?date+shift:'';
  }
  let sessionId='';
  try{sessionId=text(runtime?.SJShift?.currentSessionId?.())}catch(_){}
  return Object.freeze({shiftKey,sessionId,key:shiftKey+'|'+sessionId});
}

export function convergePaymentDomV1(document,method='Tunai'){
  if(!document)return false;
  const selected=text(method)||'Tunai',upper=selected.toUpperCase();
  const map={TUNAI:'btn-tunai',QRIS:'btn-qris',TRANSFER:'btn-tf',KASBON:'btn-kasbon'};
  for(const node of Array.from(document.querySelectorAll?.('#modal-bayar .m-card,#modal-bayar .sj53-method,#modal-bayar .sj54-method,#modal-bayar .sj61-method,#modal-cart .sj61-method')||[])){
    const nodeMethod=text(node?.dataset?.method).toUpperCase();
    const active=(node.id===map[upper])||(nodeMethod===upper);
    node.classList?.toggle?.('active',active);
  }
  const cash=document.getElementById?.('area-tunai'),debt=document.getElementById?.('area-kasbon');
  if(cash)cash.style.display=upper==='TUNAI'?'block':'none';
  if(debt)debt.style.display=upper==='KASBON'?'block':'none';
  return true;
}

export function forceUiRepaintV1(runtime=globalThis,nodes=[]){
  const document=runtime?.document,raf=typeof runtime?.requestAnimationFrame==='function'?runtime.requestAnimationFrame.bind(runtime):(fn=>runtime?.setTimeout?.(fn,0)??setTimeout(fn,0));
  const list=(nodes||[]).map(node=>typeof node==='string'?document?.querySelector?.(node):node).filter(Boolean);
  raf(()=>{
    for(const node of list){try{node.classList?.add?.('sj-ui-convergence-paint');void node.offsetHeight}catch(_){}}
    raf(()=>{for(const node of list){try{node.classList?.remove?.('sj-ui-convergence-paint');void node.offsetHeight}catch(_){}}});
  });
  return list.length;
}

export function resetCompletedSaleVisualStateV1(runtime=globalThis){
  const document=runtime?.document,commercial=runtime?.SJCommercialFinalV5961;
  try{if(commercial){commercial.cartMethod='Tunai';commercial.saleCustomer=''}}catch(_){}
  try{if(runtime?.SJCommercialVisualV5955)runtime.SJCommercialVisualV5955.saleCustomer=''}catch(_){}
  try{commercial?.selectCartMethod?.('Tunai')}catch(_){}
  try{runtime?.selMet?.('Tunai')}catch(_){}
  try{
    for(const id of ['m-kasbon-nama','sj59-customer','sj61-customer']){
      const field=document?.getElementById?.(id);if(field)field.value='';
    }
  }catch(_){}
  try{runtime?.updateCartUI?.()}catch(_){}
  try{runtime?.SJRefinementSalesV100?.renderSales?.()}catch(_){}
  convergePaymentDomV1(document,'Tunai');
  forceUiRepaintV1(runtime,['#view1','#kasir-scroll','#modal-cart','#modal-bayar','#sj-shift-session-root']);
  return true;
}

export function installUiConvergenceV1(runtime=globalThis,{cupShiftControl=runtime?.__SJ_V34_CUP_SHIFT_CONTROL}={}){
  if(runtime?.__SJ_UI_CONVERGENCE_V1)return runtime.__SJ_UI_CONVERGENCE_V1;
  const document=runtime?.document,shift=runtime?.SJShift,context=runtime?.__SJ_LEGACY_STOCK_COMPONENT_CONTEXT;
  const bases={selectShift:shift?.selectShift,openCloseModal:shift?.openCloseModal,renderWithDay:shift?.renderWithDay,processTransaction:runtime?.processTransaction,openPayment:runtime?.SJCommercialFinalV5961?.openPayment};
  const wrappedRefs={};
  const state={lastShiftKey:'',lastSessionId:'',saleWrap:false,shiftWrap:false,paymentWrap:false,renderWrap:false};

  const schedule=(reason='')=>{
    const ctx=shiftUiContextKeyV1(runtime);
    state.lastShiftKey=ctx.shiftKey;state.lastSessionId=ctx.sessionId;
    forceUiRepaintV1(runtime,['#view1','#kasir-scroll','#modal-bayar','#modal-sjshift-close','#sj-shift-session-root']);
    try{runtime?.__SJ_REF01_RUNTIME?.scheduleEnhance?.()}catch(_){}
    return reason;
  };


  if(shift&&typeof shift.renderWithDay==='function'&&!shift.renderWithDay.__sjUiConvergenceV1){
    const base=shift.renderWithDay.bind(shift);
    const wrapped=function(...args){
      const out=base(...args);
      forceUiRepaintV1(runtime,['#sj-shift-session-root','#modal-sjshift-close']);
      return out;
    };
    try{Object.defineProperty(wrapped,'__sjUiConvergenceV1',{value:true})}catch(_){wrapped.__sjUiConvergenceV1=true}
    shift.renderWithDay=wrapped;wrappedRefs.renderWithDay=wrapped;state.renderWrap=true;
  }

  if(shift&&typeof shift.selectShift==='function'&&!shift.selectShift.__sjUiConvergenceV1){
    const base=shift.selectShift.bind(shift);
    const wrapped=async function(...args){
      const out=await base(...args);
      try{document?.querySelector?.('#modal-sjshift-close .sj54-close-summary')?.remove?.()}catch(_){}
      try{await cupShiftControl?.refresh?.()}catch(_){}
      schedule('SHIFT_SELECT');
      return out;
    };
    try{Object.defineProperty(wrapped,'__sjUiConvergenceV1',{value:true})}catch(_){wrapped.__sjUiConvergenceV1=true}
    shift.selectShift=wrapped;wrappedRefs.selectShift=wrapped;state.shiftWrap=true;
  }

  if(shift&&typeof shift.openCloseModal==='function'&&!shift.openCloseModal.__sjUiConvergenceV1){
    const base=shift.openCloseModal.bind(shift);
    const wrapped=function(...args){
      try{document?.querySelector?.('#modal-sjshift-close .sj54-close-summary')?.remove?.()}catch(_){}
      const out=base(...args);
      Promise.resolve().then(()=>cupShiftControl?.enhanceClosing?.()).catch(()=>{});
      schedule('SHIFT_CLOSE_OPEN');
      return out;
    };
    try{Object.defineProperty(wrapped,'__sjUiConvergenceV1',{value:true})}catch(_){wrapped.__sjUiConvergenceV1=true}
    shift.openCloseModal=wrapped;wrappedRefs.openCloseModal=wrapped;state.shiftWrap=true;
  }

  if(typeof runtime?.processTransaction==='function'&&context?.snapshotSale&&!runtime.processTransaction.__sjUiConvergenceV1){
    const base=runtime.processTransaction;
    const wrapped=async function(...args){
      const before=context.snapshotSale?.()||{},beforeCount=Array.isArray(before.cart)?before.cart.length:0;
      const out=await base.apply(this,args);
      const after=context.snapshotSale?.()||{},afterCount=Array.isArray(after.cart)?after.cart.length:0;
      if(beforeCount>0&&afterCount===0)resetCompletedSaleVisualStateV1(runtime);
      else schedule('TRANSACTION_NO_RESET');
      return out;
    };
    try{Object.defineProperty(wrapped,'__sjUiConvergenceV1',{value:true})}catch(_){wrapped.__sjUiConvergenceV1=true}
    runtime.processTransaction=wrapped;wrappedRefs.processTransaction=wrapped;state.saleWrap=true;
  }

  const commercial=runtime?.SJCommercialFinalV5961;
  if(commercial&&typeof commercial.openPayment==='function'&&!commercial.openPayment.__sjUiConvergenceV1){
    const base=commercial.openPayment;
    const wrapped=function(method,...args){
      const selected=text(method||this?.cartMethod||'Tunai')||'Tunai';
      const out=base.call(this,selected,...args);
      const apply=()=>{convergePaymentDomV1(document,selected);forceUiRepaintV1(runtime,['#modal-bayar'])};
      try{runtime?.requestAnimationFrame?runtime.requestAnimationFrame(apply):runtime?.setTimeout?.(apply,0)}catch(_){apply()}
      return out;
    };
    try{Object.defineProperty(wrapped,'__sjUiConvergenceV1',{value:true})}catch(_){wrapped.__sjUiConvergenceV1=true}
    commercial.openPayment=wrapped;wrappedRefs.openPayment=wrapped;state.paymentWrap=true;
  }

  function stop(){
    try{if(shift&&wrappedRefs.renderWithDay&&shift.renderWithDay===wrappedRefs.renderWithDay)shift.renderWithDay=bases.renderWithDay}catch(_){}
    try{if(shift&&wrappedRefs.selectShift&&shift.selectShift===wrappedRefs.selectShift)shift.selectShift=bases.selectShift}catch(_){}
    try{if(shift&&wrappedRefs.openCloseModal&&shift.openCloseModal===wrappedRefs.openCloseModal)shift.openCloseModal=bases.openCloseModal}catch(_){}
    try{if(wrappedRefs.processTransaction&&runtime.processTransaction===wrappedRefs.processTransaction)runtime.processTransaction=bases.processTransaction}catch(_){}
    try{if(commercial&&wrappedRefs.openPayment&&commercial.openPayment===wrappedRefs.openPayment)commercial.openPayment=bases.openPayment}catch(_){}
  }
  const api=Object.freeze({installed:true,schedule,resetCompletedSale:()=>resetCompletedSaleVisualStateV1(runtime),stop,snapshot:()=>Object.freeze({...state,...shiftUiContextKeyV1(runtime)})});
  try{Object.defineProperty(runtime,'__SJ_UI_CONVERGENCE_V1',{value:api,writable:false,configurable:false,enumerable:false})}catch(_){runtime.__SJ_UI_CONVERGENCE_V1=api}
  return api;
}
