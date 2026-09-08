const MARK='__SJ_R8_SHIFT_CLOSING';
const SHIFT_ORDER=['-S1','-S2','-S3'];
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const text=value=>String(value??'').trim();

function isClosed(row={}){
  const status=String(row?.sessionControl?.status||row?.shiftStatus||row?.status||'').toUpperCase();
  return row?.locked===true||status==='CLOSED'||status==='SELESAI';
}
function actualClosingCash(row={}){
  const candidates=[row?.uangLaci,row?.actualClosing,row?.closingCash,row?.closingSnapshot?.cash?.actual,row?.closingSnapshot?.actualClosing,row?.closingSnapshot?.actualCash,row?.closingSnapshot?.uangLaci];
  for(const value of candidates){if(value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value)))return Number(value)}
  return null;
}

export function previousShiftClosingCashR8(rows={},activeShift=''){
  const index=SHIFT_ORDER.indexOf(String(activeShift));if(index<=0)return null;
  const previous=SHIFT_ORDER[index-1],row=rows?.[previous];if(!row||!isClosed(row))return null;
  const cash=actualClosingCash(row);return cash===null?null:Object.freeze({shift:previous,cash});
}

export function openingContinuityR8({carryForward=null,openingCash=0,note=''}={}){
  if(carryForward===null||carryForward===undefined||!Number.isFinite(Number(carryForward)))return Object.freeze({difference:null,requiresNote:false});
  const difference=num(openingCash)-num(carryForward);return Object.freeze({difference,requiresNote:difference!==0&&!text(note)});
}

export function physicalClosingGateR8({cashValue='',cupValues={}}={}){
  if(!text(cashValue))return Object.freeze({ready:false,code:'CASH_REQUIRED'});
  for(const [code,value] of Object.entries(cupValues||{})){if(value===null||value===undefined||text(value)==='')return Object.freeze({ready:false,code:'CUP_REQUIRED',cupCode:code})}
  return Object.freeze({ready:true,code:'READY'});
}

function runtimeValue(runtime,expression,fallback=''){
  try{if(typeof runtime?.Function==='function')return runtime.Function(`try{return (${expression})}catch(_){return null}`)()??fallback}catch(_){}
  return fallback;
}
function parseMoney(value){const digits=String(value??'').replace(/[^0-9-]/g,'');return digits?Number(digits):0}
function money(value){try{return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(num(value))}catch(_){return `Rp ${num(value)}`}}

function activeShift(runtime){return String(runtimeValue(runtime,'typeof activeShift!=="undefined"?activeShift:""',''))}

function tagSensitive(element){
  if(!element||element.dataset?.r8BlindSensitive==='true')return;
  element.dataset.r8BlindSensitive='true';element.dataset.r8BlindDisplay=element.style?.display||'';element.style.display='none';
}
function revealSensitive(modal){
  for(const element of Array.from(modal?.querySelectorAll?.('[data-r8-blind-sensitive="true"]')||[]))element.style.display=element.dataset?.r8BlindDisplay||'';
}
function hideBlindSensitive(document,modal){
  const sessionExpected=document?.getElementById?.('sjshift-close-session-exp');tagSensitive(sessionExpected?.closest?.('.sjshift-ownerline'));
  tagSensitive(document?.getElementById?.('sjshift-close-worksheet'));
  tagSensitive(document?.getElementById?.('sjshift-close-live-diff'));
  for(const element of Array.from(modal?.querySelectorAll?.('.sj-v34-cup-close-row header span,.sj-v34-cup-recon,.sj-v34-cup-reason,.sj-v34-cup-opname-note')||[]))tagSensitive(element);
}

function cupPhysicalValues(modal){
  const values={};for(const input of Array.from(modal?.querySelectorAll?.('[data-v34-cup-closing]')||[])){if(input.disabled)continue;values[String(input.dataset?.v34CupClosing||'')]=input.value??''}return values;
}

function ensureBlindControls(runtime,modal,state){
  const document=runtime?.document,save=document?.getElementById?.('sjshift-close-save');if(!modal||!save)return null;
  let controls=modal.querySelector?.('[data-r8-blind-controls]');if(!controls){
    controls=document.createElement?.('section');if(!controls)return null;controls.dataset.r8BlindControls='true';controls.className='sjx-note';controls.style.margin='12px 0';controls.innerHTML='<b>Hitung fisik terlebih dahulu</b><div data-r8-blind-message style="margin:5px 0 9px">Hitung uang laci dan seluruh cup tanpa melihat angka sistem. Setelah selesai, kunci hasil hitungan untuk membandingkan selisih.</div><button type="button" class="sjx-primary" data-r8-blind-lock style="width:100%">KUNCI HITUNGAN FISIK</button>';
    controls.querySelector?.('[data-r8-blind-lock]')?.addEventListener?.('click',async()=>{
      const cash=document?.getElementById?.('sjshift-close-cash'),gate=physicalClosingGateR8({cashValue:cash?.value??'',cupValues:cupPhysicalValues(modal)});
      if(!gate.ready){runtime?.alert?.(gate.code==='CASH_REQUIRED'?'Isi Kas Aktual setelah menghitung uang fisik.':'Hitung semua cup fisik sebelum melihat hasil sistem.');return}
      const lockButton=controls.querySelector?.('[data-r8-blind-lock]');if(lockButton){lockButton.disabled=true;lockButton.textContent='MENGUNCI…'}
      await new Promise(resolve=>(runtime?.setTimeout||setTimeout)(resolve,100));
      state.locked=true;
      if(cash){cash.disabled=true;cash.dataset.r8LockedPhysical='true'}
      for(const input of Array.from(modal.querySelectorAll?.('[data-v34-cup-closing]')||[])){if(!input.disabled){input.disabled=true;input.dataset.r8LockedPhysical='true'}}
      for(const input of Array.from(modal.querySelectorAll?.('.sjclose-denom input')||[]))input.disabled=true;
      for(const button of Array.from(modal.querySelectorAll?.('.sjclose-denom button')||[]))button.disabled=true;
      revealSensitive(modal);
      if(save?.dataset?.sjV34ReadOnly!=='true'){save.disabled=false;save.removeAttribute?.('aria-disabled')}
      const message=controls.querySelector?.('[data-r8-blind-message]');if(message)message.textContent='Hitungan fisik sudah dikunci. Sekarang bandingkan Kas Seharusnya, selisih cup, lalu isi alasan/catatan bila ada perbedaan.';
      if(lockButton){lockButton.textContent='HITUNGAN FISIK TERKUNCI'}
    });
  }
  if(controls.parentNode===save.parentNode)save.parentNode.insertBefore(controls,save);
  return controls;
}

function applyBlindClose(runtime,state){
  const document=runtime?.document,modal=document?.querySelector?.('#modal-sjshift-close .modal');if(!modal)return false;
  const overlay=document?.getElementById?.('modal-sjshift-close');if(overlay?.style?.display==='none')return false;
  const save=document?.getElementById?.('sjshift-close-save');ensureBlindControls(runtime,modal,state);
  if(!state.locked){hideBlindSensitive(document,modal);if(save)save.disabled=true}
  else{
    revealSensitive(modal);
    const cash=document?.getElementById?.('sjshift-close-cash');if(cash){cash.disabled=true;cash.dataset.r8LockedPhysical='true'}
    for(const input of Array.from(modal.querySelectorAll?.('[data-v34-cup-closing]')||[])){input.disabled=true;input.dataset.r8LockedPhysical='true'}
    for(const input of Array.from(modal.querySelectorAll?.('.sjclose-denom input')||[]))input.disabled=true;
    for(const button of Array.from(modal.querySelectorAll?.('.sjclose-denom button')||[]))button.disabled=true;
  }
  if(!modal.__sjR8BlindObserver&&typeof runtime?.MutationObserver==='function'){
    const observer=new runtime.MutationObserver(()=>{applyBlindClose(runtime,state)});observer.observe(modal,{childList:true,subtree:true});modal.__sjR8BlindObserver=observer;
  }
  return true;
}

function decorateOpeningContinuity(runtime,rows,state){
  const document=runtime?.document,carry=previousShiftClosingCashR8(rows,activeShift(runtime));state.carry=carry;
  const start=document?.getElementById?.('sjshift-start-btn');if(!start)return false;
  const old=document.querySelector?.('[data-r8-opening-continuity]');if(old)old.remove?.();if(!carry)return false;
  const note=document.createElement?.('aside');if(!note)return false;note.dataset.r8OpeningContinuity='true';note.className='sjshift-warning';note.innerHTML=`Kas aktual ${carry.shift.replace('-S1','Shift Pagi').replace('-S2','Shift Siang').replace('-S3','Shift Malam')} sebelumnya: <b>${money(carry.cash)}</b>.<br>Jika uang tetap berada di laci, gunakan sebagai Kas Awal. Jika berbeda, isi Catatan Awal agar perpindahan kas dapat ditelusuri. <button type="button" data-r8-use-carry style="margin-top:7px">Gunakan ${money(carry.cash)}</button>`;
  note.querySelector?.('[data-r8-use-carry]')?.addEventListener?.('click',()=>{const input=document.getElementById?.('sjshift-opening-cash');if(input){input.value=new Intl.NumberFormat('id-ID').format(carry.cash);input.dispatchEvent?.(new Event('input',{bubbles:true}))}});
  start.insertAdjacentElement?.('beforebegin',note);return true;
}

export function installR8ShiftClosingIntegrity(runtime=globalThis,{cupShiftControl=null}={}){
  if(runtime?.[MARK])return runtime[MARK];
  const shift=runtime?.SJShift,document=runtime?.document;if(!shift||!document)return Object.freeze({installed:false,enhance(){return false}});
  const originals={renderWithDay:shift.renderWithDay?.bind(shift),startShift:shift.startShift?.bind(shift),openCloseModal:shift.openCloseModal?.bind(shift),submitClose:shift.submitClose?.bind(shift)};
  const state={rows:{},carry:null,close:{locked:false}};
  if(originals.renderWithDay)shift.renderWithDay=function(root,rows,...rest){state.rows=rows||{};const out=originals.renderWithDay(root,rows,...rest);Promise.resolve().then(()=>decorateOpeningContinuity(runtime,state.rows,state));return out};
  if(originals.startShift)shift.startShift=async function(...args){
    const carry=state.carry||previousShiftClosingCashR8(state.rows,activeShift(runtime));if(carry){const opening=parseMoney(document.getElementById?.('sjshift-opening-cash')?.value),note=document.getElementById?.('sjshift-opening-note')?.value||'',check=openingContinuityR8({carryForward:carry.cash,openingCash:opening,note});if(check.requiresNote){runtime?.alert?.(`Kas Awal berbeda ${money(Math.abs(check.difference))} dari penutupan shift sebelumnya. Isi Catatan Awal untuk menjelaskan setoran, pengambilan, atau perpindahan kas.`);return false}}
    return originals.startShift(...args);
  };
  if(originals.openCloseModal)shift.openCloseModal=function(...args){state.close={locked:false};const out=originals.openCloseModal(...args);Promise.resolve().then(()=>applyBlindClose(runtime,state.close));for(const delay of [40,160,500]){(runtime?.setTimeout||setTimeout)(()=>applyBlindClose(runtime,state.close),delay)}return out};
  if(originals.submitClose)shift.submitClose=async function(...args){const overlay=document.getElementById?.('modal-sjshift-close');if(overlay?.style?.display!=='none'&&state.close.locked!==true){runtime?.alert?.('Kunci hitungan fisik terlebih dahulu sebelum menutup shift.');return false}return originals.submitClose(...args)};
  const api=Object.freeze({installed:true,enhance(){decorateOpeningContinuity(runtime,state.rows,state);applyBlindClose(runtime,state.close);return true},snapshot:()=>Object.freeze({installed:true,carry:state.carry?{...state.carry}:null,physicalLocked:state.close.locked===true,cupAuthority:cupShiftControl?.installed===true})});
  try{Object.defineProperty(runtime,MARK,{value:api,writable:false,configurable:false,enumerable:false})}catch(_){}
  return api;
}
