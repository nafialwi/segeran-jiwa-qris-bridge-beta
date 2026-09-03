function currentShiftKey(runtime){
  const date=String(runtime?.document?.getElementById?.('date-sel')?.value||'');
  const shift=String(runtime?.document?.getElementById?.('shift-sel')?.value||'');
  return /^\d{4}-\d{2}-\d{2}$/.test(date)&&/^-S[123]$/.test(shift)?`${date}${shift}`:'';
}
function zeroBaseline(shift){
  try{return shift?.snapshot?.({})||{}}catch(_){return {}}
}
export function recoverLegacyActiveSessionForClose(runtime=globalThis){
  const shift=runtime?.SJShift;if(!shift||typeof shift.currentData!=='function')return Object.freeze({status:'unavailable'});
  const data=shift.currentData()||{};
  if(shift.state?.(data)!=='ACTIVE')return Object.freeze({status:'not-active'});
  if(typeof shift.isOwner==='function'&&!shift.isOwner())return Object.freeze({status:'owner-required'});
  const sessionId=String(shift.currentSessionId?.()||data?.sessionControl?.currentSessionId||data?.currentSessionId||'');
  if(!sessionId)return Object.freeze({status:'missing-session-id'});
  const existing=data?.sessions?.[sessionId];
  if(existing)return Object.freeze({status:'existing',sessionId,session:existing,shiftKey:currentShiftKey(runtime)});
  const startedAt=String(data?.sessionControl?.startedAt||data?.startedAt||data?.openedAt||'');
  const openedMs=Date.parse(startedAt);
  const session=Object.freeze({
    id:sessionId,
    status:'ACTIVE',
    cashierId:String(shift.currentCashierId?.()||data?.currentCashierId||data?.sessionControl?.currentCashierId||''),
    cashierName:String(shift.currentCashierName?.()||data?.currentCashierName||data?.sessionControl?.currentCashierName||data?.namaKasir||'OWNER'),
    openedAt:startedAt,
    openedTs:Number.isFinite(openedMs)?openedMs:0,
    openingCash:Number(data?.kasAwal||0),
    openingNote:'Legacy shift recovery for closing',
    baseline:zeroBaseline(shift),
    recoveredLegacy:true,
    recoveryReason:'MISSING_SESSION_RECORD'
  });
  data.sessions=Object.assign({},data.sessions||{}, {[sessionId]:session});
  return Object.freeze({status:'recovered',sessionId,session,shiftKey:currentShiftKey(runtime)});
}

export function installLegacyShiftCloseRecovery(runtime=globalThis){
  const shift=runtime?.SJShift,hardening=runtime?.SJOperationalHardening;
  if(!shift||!hardening||typeof hardening.verifiedShiftWrite!=='function')return Object.freeze({installed:false});
  if(shift.__sjLegacyCloseRecovery)return Object.freeze({installed:true,alreadyInstalled:true});
  const recovered=Object.create(null);
  const ensure=()=>{
    const result=recoverLegacyActiveSessionForClose(runtime);
    if(result.status==='recovered'&&result.shiftKey)recovered[`${result.shiftKey}|${result.sessionId}`]=result.session;
    return result;
  };
  const baseOpen=typeof shift.openCloseModal==='function'?shift.openCloseModal.bind(shift):null;
  const baseSubmit=typeof shift.submitClose==='function'?shift.submitClose.bind(shift):null;
  const baseWrite=hardening.verifiedShiftWrite.bind(hardening);
  if(baseOpen)shift.openCloseModal=function(...args){ensure();return baseOpen(...args)};
  if(baseSubmit)shift.submitClose=function(...args){ensure();return baseSubmit(...args)};
  hardening.verifiedShiftWrite=async function(kind,shiftKey,sessionId,updates,...rest){
    const key=`${String(shiftKey||'')}|${String(sessionId||'')}`,session=recovered[key];
    if(kind==='CLOSE'&&session&&updates&&typeof updates==='object'){
      const p=`${shiftKey}/sessions/${sessionId}`;
      const add=(field,value)=>{const k=`${p}/${field}`;if(!(k in updates))updates[k]=value};
      add('id',session.id);add('cashierId',session.cashierId);add('cashierName',session.cashierName);add('openedAt',session.openedAt);add('openedTs',session.openedTs);add('openingCash',session.openingCash);add('openingNote',session.openingNote);add('baseline',session.baseline);add('recoveredLegacy',true);add('recoveryReason',session.recoveryReason);
    }
    const out=await baseWrite(kind,shiftKey,sessionId,updates,...rest);
    if(kind==='CLOSE')delete recovered[key];
    return out;
  };
  try{Object.defineProperty(shift,'__sjLegacyCloseRecovery',{value:true,enumerable:false})}catch(_){shift.__sjLegacyCloseRecovery=true}
  return Object.freeze({installed:true,ensure,recovered});
}
