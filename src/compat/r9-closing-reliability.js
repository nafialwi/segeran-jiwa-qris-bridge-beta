(function(g){
  'use strict';
  if(!g||g.SJR9ClosingReliability)return;
  var STORAGE_KEY='sj:r9:closing-pending:v1',VERSION='R9-LIC01-A';
  var shift=g.SJShift,hardening=g.SJOperationalHardening;
  if(!shift||!hardening||typeof hardening.verifiedShiftWrite!=='function')return;
  var baseWrite=hardening.verifiedShiftWrite.bind(hardening);
  var baseSubmit=typeof shift.submitClose==='function'?shift.submitClose.bind(shift):null;
  var closeFlight=null;

  function now(){return Date.now()}
  function safeParse(raw){try{var value=JSON.parse(raw);return value&&typeof value==='object'?value:null}catch(_){return null}}
  function loadPending(){try{return safeParse(g.sessionStorage?.getItem?.(STORAGE_KEY)||'')}catch(_){return null}}
  function savePending(value){try{g.sessionStorage?.setItem?.(STORAGE_KEY,JSON.stringify(value));return true}catch(_){return false}}
  function clearPending(){try{g.sessionStorage?.removeItem?.(STORAGE_KEY)}catch(_){} }
  function text(value){return String(value??'')}
  function upper(value){return text(value).toUpperCase()}
  function same(a,b){return text(a)===text(b)}
  function delay(ms){return new Promise(resolve=>(g.setTimeout||setTimeout)(resolve,Math.max(0,Number(ms)||0)))}
  function delays(){return Array.isArray(g.__SJ_R9_CLOSING_TEST_DELAYS)?g.__SJ_R9_CLOSING_TEST_DELAYS.slice(0,4):[0,350,1200]}
  function timeoutLike(error){var code=upper(error?.code),message=upper(error?.message);return code==='SHIFT_CLOSE_TIMEOUT'||message.includes('SHIFT_CLOSE_TIMEOUT')}
  function database(){try{if(typeof db!=='undefined'&&db?.ref)return db}catch(_){}try{return g.firebase?.database?.()}catch(_){return null}}
  function rootPath(){try{if(typeof DB_PATH!=='undefined'&&DB_PATH)return String(DB_PATH)}catch(_){}return 'toko_segeranjiwa_v58'}

  function classify(data,sessionId){
    var row=data&&typeof data==='object'?data:{},control=row.sessionControl||{},session=row.sessions?.[sessionId]||{};
    if(row.locked===true&&upper(control.status)==='CLOSED'&&same(control.currentSessionId,sessionId)&&upper(session.status)==='CLOSED')return 'COMMITTED';
    if(upper(control.status)==='ACTIVE'&&same(control.currentSessionId,sessionId)&&(upper(session.status)==='ACTIVE'||!session.status))return 'NOT_COMMITTED';
    return 'UNKNOWN';
  }

  async function readState(shiftKey,sessionId){
    var connection=database();if(!connection?.ref)throw Object.assign(new Error('R9_CLOSE_DB_UNAVAILABLE'),{code:'R9_CLOSE_DB_UNAVAILABLE'});
    var snapshot=await connection.ref(rootPath()+'/'+shiftKey).once('value'),data=snapshot?.val?.()||{};
    return Object.freeze({state:classify(data,sessionId),data});
  }

  async function resolveState(shiftKey,sessionId,{allowActive=false}={}){
    var last=null,lastError=null;
    for(const wait of delays()){
      if(wait)await delay(wait);
      try{
        last=await readState(shiftKey,sessionId);
        if(last.state==='COMMITTED')return Object.freeze({state:'COMMITTED',shift:shiftKey,sessionId});
        if(allowActive&&last.state==='NOT_COMMITTED')return Object.freeze({state:'NOT_COMMITTED',shift:shiftKey,sessionId});
      }catch(error){lastError=error;try{g.sjSaveError?.('R9_CLOSE_VERIFY',error)}catch(_){}}
    }
    return Object.freeze({state:'UNKNOWN',shift:shiftKey,sessionId,error:lastError||null,last:last?.state||'UNKNOWN'});
  }

  async function resolvePending(){
    var pending=loadPending();if(!pending?.shift||!pending?.sessionId)return Object.freeze({state:'NONE'});
    var result=await resolveState(pending.shift,pending.sessionId,{allowActive:true});
    if(result.state==='COMMITTED'||result.state==='NOT_COMMITTED')clearPending();
    else savePending({...pending,state:'UNKNOWN',checkedTs:now()});
    return result;
  }

  function unknownError(cause,pending){
    var error=new Error('Status penutupan shift belum dapat dipastikan. Jangan menutup ulang sampai status terverifikasi.');
    error.code='UNKNOWN_COMMIT_STATE';error.cause=cause;error.shift=pending.shift;error.sessionId=pending.sessionId;return error;
  }

  hardening.verifiedShiftWrite=async function(kind,shiftKey,sessionId,updates,...rest){
    if(upper(kind)!=='CLOSE')return baseWrite(kind,shiftKey,sessionId,updates,...rest);
    var pending={version:VERSION,shift:text(shiftKey),sessionId:text(sessionId),state:'PENDING',createdTs:now(),updatedTs:now()};
    savePending(pending);
    try{
      var result=await baseWrite(kind,shiftKey,sessionId,updates,...rest);clearPending();return result;
    }catch(error){
      if(!timeoutLike(error)){clearPending();throw error}
      var resolved=await resolveState(pending.shift,pending.sessionId,{allowActive:false});
      if(resolved.state==='COMMITTED'){clearPending();return true}
      pending={...pending,state:'UNKNOWN',updatedTs:now(),lastErrorCode:text(error?.code||'SHIFT_CLOSE_TIMEOUT')};savePending(pending);
      throw unknownError(error,pending)
    }
  };

  if(baseSubmit)shift.submitClose=async function(...args){
    if(closeFlight)return closeFlight;
    var pending=loadPending();
    if(pending?.shift&&pending?.sessionId){
      var resolution=await resolvePending();
      if(resolution.state==='COMMITTED'){
        try{g.showToast?.('Shift sudah terkonfirmasi tertutup.','success');shift.render?.()}catch(_){}
        return true
      }
      if(resolution.state==='UNKNOWN'){
        try{g.alert?.('Status penutupan sebelumnya belum dapat dipastikan. Jangan menutup shift lagi. Periksa koneksi lalu coba cek status kembali.')}catch(_){}
        return false
      }
    }
    closeFlight=Promise.resolve().then(()=>baseSubmit(...args)).finally(()=>{closeFlight=null});
    return closeFlight
  };

  var api=Object.freeze({version:VERSION,resolvePending,snapshot:()=>Object.freeze({pending:loadPending()}),classify});
  try{Object.defineProperty(g,'SJR9ClosingReliability',{value:api,writable:false,configurable:false,enumerable:false})}catch(_){g.SJR9ClosingReliability=api}
  Promise.resolve().then(()=>resolvePending()).then(result=>{if(result.state==='COMMITTED')try{g.showToast?.('Penutupan shift sebelumnya terkonfirmasi berhasil.','success');shift.render?.()}catch(_){}}).catch(error=>{try{g.sjSaveError?.('R9_CLOSE_RECOVERY',error)}catch(_){}});
})(window);
