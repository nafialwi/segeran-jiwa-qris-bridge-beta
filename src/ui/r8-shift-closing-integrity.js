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

function requestCupClosingPresentation(runtime,cupShiftControl){
  const modal=runtime?.document?.getElementById?.('modal-sjshift-close');
  if(!modal||modal?.style?.display!=='flex')return false;
  try{return cupShiftControl?.enhanceClosing?.()||false}catch(_){return false}
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
  const originals={renderWithDay:shift.renderWithDay?.bind(shift),startShift:shift.startShift?.bind(shift),openCloseModal:shift.openCloseModal?.bind(shift)};
  const state={rows:{},carry:null};
  if(originals.renderWithDay)shift.renderWithDay=function(root,rows,...rest){state.rows=rows||{};const out=originals.renderWithDay(root,rows,...rest);Promise.resolve().then(()=>decorateOpeningContinuity(runtime,state.rows,state));return out};
  if(originals.startShift)shift.startShift=async function(...args){
    const carry=state.carry||previousShiftClosingCashR8(state.rows,activeShift(runtime));if(carry){const opening=parseMoney(document.getElementById?.('sjshift-opening-cash')?.value),note=document.getElementById?.('sjshift-opening-note')?.value||'',check=openingContinuityR8({carryForward:carry.cash,openingCash:opening,note});if(check.requiresNote){runtime?.alert?.(`Kas Awal berbeda ${money(Math.abs(check.difference))} dari penutupan shift sebelumnya. Isi Catatan Awal untuk menjelaskan setoran, pengambilan, atau perpindahan kas.`);return false}}
    return originals.startShift(...args);
  };
  if(originals.openCloseModal)shift.openCloseModal=function(...args){const out=originals.openCloseModal(...args);Promise.resolve().then(()=>requestCupClosingPresentation(runtime,cupShiftControl));for(const delay of [80,240]){(runtime?.setTimeout||setTimeout)(()=>requestCupClosingPresentation(runtime,cupShiftControl),delay)}return out};
  const api=Object.freeze({installed:true,enhance(){decorateOpeningContinuity(runtime,state.rows,state);requestCupClosingPresentation(runtime,cupShiftControl);return true},snapshot:()=>Object.freeze({installed:true,carry:state.carry?{...state.carry}:null,cupAuthority:cupShiftControl?.installed===true,systemComparisonVisible:true})});
  try{Object.defineProperty(runtime,MARK,{value:api,writable:false,configurable:false,enumerable:false})}catch(_){}
  return api;
}
