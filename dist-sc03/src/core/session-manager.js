const SESSION_VERSION=1;
const VALID_MODES=new Set(['LEGACY','HYBRID','SECURE']);
const VALID_ROLES=new Set(['manajemen','transaksi']);
const DEFAULT_MAX_AGE_MS=30*24*60*60*1000;
const DEFAULT_LEGACY_MAX_AGE_MS=7*24*60*60*1000;

function text(value){return String(value??'').trim()}
function normalizeMode(value){
  const mode=text(value).toUpperCase();
  return VALID_MODES.has(mode)?mode:null;
}
function validRole(value){return VALID_ROLES.has(text(value))}
function finiteTs(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:0}
function shiftHint(value){
  const row=value&&typeof value==='object'?value:{};
  return {shiftKey:text(row.shiftKey),sessionId:text(row.sessionId)};
}

export function createSessionManager({
  store,
  auth,
  repository,
  legacy,
  readDeviceId=()=>'',
  readOnline=()=>true,
  readShiftHint=()=>({shiftKey:'',sessionId:''}),
  now=()=>Date.now(),
  maxAgeMs=DEFAULT_MAX_AGE_MS,
  legacyMaxAgeMs=DEFAULT_LEGACY_MAX_AGE_MS,
  onForcedLogout=null
}={}){
  if(!store || typeof store.read!=='function' || typeof store.write!=='function' || typeof store.clear!=='function') throw new TypeError('SESSION_STORE_REQUIRED');
  if(!auth || typeof auth.ensureLocalPersistence!=='function' || typeof auth.waitForInitialUser!=='function' || typeof auth.currentUser!=='function' || typeof auth.signOut!=='function') throw new TypeError('SESSION_AUTH_REQUIRED');
  if(!repository || typeof repository.readAuthMode!=='function' || typeof repository.readUser!=='function' || typeof repository.readDevice!=='function' || typeof repository.readAuthUser!=='function') throw new TypeError('SESSION_REPOSITORY_REQUIRED');
  if(!legacy || typeof legacy.completeLogin!=='function') throw new TypeError('SESSION_LEGACY_COMPLETION_REQUIRED');

  let prepared=false;
  let preparing=null;
  let lastResult=Object.freeze({restored:false,reason:'NOT_ATTEMPTED'});
  let liveStops=[];
  let forcing=false;

  async function prepareAuth(){
    if(prepared) return true;
    if(!preparing){
      preparing=Promise.resolve(auth.ensureLocalPersistence()).then(()=>{prepared=true;return true}).finally(()=>{preparing=null});
    }
    return preparing;
  }

  function buildEnvelope({username,authMode,firebaseUid='',savedAt=now(),validatedAt=now()}={}){
    const deviceId=text(readDeviceId());
    const hint=shiftHint(readShiftHint());
    return Object.freeze({
      version:SESSION_VERSION,
      username:text(username).toLowerCase(),
      deviceId,
      authMode:normalizeMode(authMode)||'LEGACY',
      firebaseUid:text(firebaseUid),
      savedAt:Number(savedAt)||now(),
      validatedAt:Number(validatedAt)||now(),
      shiftKey:hint.shiftKey,
      shiftSessionId:hint.sessionId
    });
  }

  function stopLiveGuard(){
    for(const stop of liveStops.splice(0)){try{stop()}catch(_){}}
  }

  async function forceLogout(reason){
    if(forcing) return lastResult;
    forcing=true;
    await invalidate(reason,{signOut:false});
    try{
      if(typeof onForcedLogout==='function') await onForcedLogout(reason);
      else await auth.signOut();
    }catch(_){}
    return lastResult;
  }

  function startLiveGuard(username,expectedRole=''){
    stopLiveGuard();
    forcing=false;
    const id=text(username).toLowerCase(),deviceId=text(readDeviceId());
    if(!id||!deviceId||typeof repository.watchUser!=='function'||typeof repository.watchDevice!=='function') return false;
    let role=text(expectedRole);
    const watchError=()=>{};
    liveStops.push(repository.watchUser(id,value=>{
      if(forcing) return;
      if(!value){void forceLogout('USER_MISSING');return}
      if(value.active===false){void forceLogout('USER_DISABLED');return}
      if(!validRole(value.role)){void forceLogout('ROLE_INVALID');return}
      const liveRole=text(value.role);
      if(role&&liveRole!==role){void forceLogout('ROLE_CHANGED');return}
      if(!role) role=liveRole;
    },watchError));
    liveStops.push(repository.watchDevice(deviceId,value=>{
      if(forcing) return;
      if(!value){void forceLogout('DEVICE_SESSION_MISSING');return}
      if(value.revoked===true){void forceLogout('DEVICE_REVOKED');return}
      if(text(value.userId)!==id){void forceLogout('DEVICE_USER_MISMATCH');return}
      if(role&&text(value.role)&&text(value.role)!==role){void forceLogout('DEVICE_ROLE_MISMATCH')}
    },watchError));
    return true;
  }

  async function saveAfterLogin({username,authMode,role=''}={}){
    const id=text(username).toLowerCase();
    if(!id) throw new TypeError('SESSION_USERNAME_REQUIRED');
    await prepareAuth();
    let mode=normalizeMode(authMode);
    if(!mode){
      try{mode=normalizeMode(await repository.readAuthMode())}catch(_){mode=null}
    }
    const current=auth.currentUser();
    const envelope=buildEnvelope({username:id,authMode:mode||'LEGACY',firebaseUid:current?.uid||''});
    if(!envelope.deviceId) throw new Error('SESSION_DEVICE_ID_REQUIRED');
    store.write(envelope);
    startLiveGuard(id,role);
    return envelope;
  }

  async function invalidate(reason,{signOut=true}={}){
    stopLiveGuard();
    store.clear();
    if(signOut){try{await auth.signOut()}catch(_){}}
    lastResult=Object.freeze({restored:false,reason:text(reason)||'SESSION_INVALID'});
    return lastResult;
  }

  function validateEnvelope(row,currentTs){
    if(!row || typeof row!=='object') return 'NO_SESSION';
    if(Number(row.version)!==SESSION_VERSION) return 'SESSION_VERSION_INVALID';
    if(!text(row.username) || !text(row.deviceId)) return 'SESSION_ENVELOPE_INVALID';
    const savedAt=finiteTs(row.savedAt);
    if(!savedAt) return 'SESSION_ENVELOPE_INVALID';
    if(Number.isFinite(maxAgeMs) && maxAgeMs>0 && currentTs-savedAt>maxAgeMs) return 'SESSION_EXPIRED';
    return null;
  }

  async function restore(){
    const row=store.read();
    if(!row){
      lastResult=Object.freeze({restored:false,reason:'NO_SESSION'});
      return lastResult;
    }
    const currentTs=Number(now());
    const envelopeError=validateEnvelope(row,currentTs);
    if(envelopeError) return invalidate(envelopeError,{signOut:envelopeError!=='NO_SESSION'});
    if(!readOnline()){
      lastResult=Object.freeze({restored:false,reason:'OFFLINE_REVALIDATION_REQUIRED'});
      return lastResult;
    }
    const currentDeviceId=text(readDeviceId());
    if(!currentDeviceId || currentDeviceId!==text(row.deviceId)) return invalidate('DEVICE_MISMATCH');

    let persistedUser=null,mode,user,device;
    try{
      await prepareAuth();
      persistedUser=await auth.waitForInitialUser();
      mode=normalizeMode(await repository.readAuthMode());
      if(!mode){return invalidate('AUTH_MODE_INVALID')}
      user=await repository.readUser(text(row.username).toLowerCase());
      device=await repository.readDevice(currentDeviceId);
    }catch(error){
      lastResult=Object.freeze({restored:false,reason:'REVALIDATION_UNAVAILABLE',errorCode:text(error?.code||error?.message)});
      return lastResult;
    }

    if(!user) return invalidate('USER_MISSING');
    if(user.active===false) return invalidate('USER_DISABLED');
    if(!validRole(user.role)) return invalidate('ROLE_INVALID');
    if(!device) return invalidate('DEVICE_SESSION_MISSING');
    if(device.revoked===true) return invalidate('DEVICE_REVOKED');
    if(text(device.userId)!==text(row.username)) return invalidate('DEVICE_USER_MISMATCH');
    if(text(device.role) && text(device.role)!==text(user.role)) return invalidate('DEVICE_ROLE_MISMATCH');

    if(mode==='LEGACY'){
      const lastSeen=finiteTs(device.lastSeenTs);
      if(!lastSeen || (Number.isFinite(legacyMaxAgeMs)&&legacyMaxAgeMs>0&&currentTs-lastSeen>legacyMaxAgeMs)) return invalidate('LEGACY_SESSION_STALE');
    }else{
      const current=persistedUser||auth.currentUser();
      const uid=text(current?.uid);
      if(!uid) return invalidate('FIREBASE_SESSION_MISSING');
      if(text(row.firebaseUid) && text(row.firebaseUid)!==uid) return invalidate('AUTH_UID_MISMATCH');
      if(text(user.authUid) && text(user.authUid)!==uid) return invalidate('AUTH_UID_MISMATCH');
      let mapping;
      try{mapping=await repository.readAuthUser(uid)}catch(error){
        lastResult=Object.freeze({restored:false,reason:'REVALIDATION_UNAVAILABLE',errorCode:text(error?.code||error?.message)});
        return lastResult;
      }
      if(!mapping || mapping.active!==true) return invalidate('AUTH_MAPPING_DISABLED');
      if(text(mapping.username)!==text(row.username)) return invalidate('AUTH_MAPPING_USER_MISMATCH');
      if(text(mapping.role)!==text(user.role)) return invalidate('AUTH_MAPPING_ROLE_MISMATCH');
    }

    try{
      await legacy.completeLogin(text(row.username).toLowerCase(),'',user);
    }catch(error){
      lastResult=Object.freeze({restored:false,reason:'RESTORE_COMPLETION_FAILED',errorCode:text(error?.code||error?.message)});
      return lastResult;
    }

    const refreshed=buildEnvelope({
      username:text(row.username).toLowerCase(),
      authMode:mode,
      firebaseUid:(persistedUser||auth.currentUser())?.uid||'',
      savedAt:finiteTs(row.savedAt)||currentTs,
      validatedAt:currentTs
    });
    store.write(refreshed);
    startLiveGuard(refreshed.username,user.role);
    lastResult=Object.freeze({restored:true,mode,username:refreshed.username,shiftKey:refreshed.shiftKey,shiftSessionId:refreshed.shiftSessionId});
    return lastResult;
  }

  function snapshot(){return Object.freeze({envelope:store.read(),lastResult,prepared})}

  return Object.freeze({prepareAuth,saveAfterLogin,restore,invalidate,startLiveGuard,stopLiveGuard,snapshot});
}
