import { createSessionManager } from '../core/session-manager.js';
import { createFirebaseAuthSession } from '../data/firebase-auth-session.js';
import { createBrowserJsonStore } from '../data/local-store.js';
import { createUserRepository } from '../data/repositories/user-repository.js';

const OWNER='sc04-session-manager';
const SESSION_KEY='sj_session_envelope_v1';

function resolveLegacyDb(runtime){
  if(runtime?.__SC04_DB) return runtime.__SC04_DB;
  try{
    return runtime?.Function
      ? runtime.Function('try{return typeof db!=="undefined"?db:null}catch(_){return null}')()
      : null;
  }catch(_){return null}
}

function memoryStore(){
  let value=null;
  return Object.freeze({
    key:'memory-only',
    read:()=>value,
    write:v=>(value=v),
    clear:()=>{value=null}
  });
}

function createDefaultStore(runtime){
  try{return createBrowserJsonStore({runtime,key:SESSION_KEY})}
  catch(_){return memoryStore()}
}

function readShiftHint(runtime){
  let shiftKey='';
  try{
    shiftKey=runtime?.Function
      ? String(runtime.Function('try{return typeof activeDate!=="undefined"?activeDate:""}catch(_){return ""}')()||'')
      : '';
  }catch(_){}
  let sessionId='';
  try{sessionId=String(runtime?.SJShift?.currentSessionId?.()||'')}catch(_){}
  return {shiftKey,sessionId};
}

function createDefaultManager(runtime,commands){
  const auth=createFirebaseAuthSession({runtime});
  const repository=createUserRepository({db:resolveLegacyDb(runtime)});
  const store=createDefaultStore(runtime);
  return createSessionManager({
    store,
    auth,
    repository,
    legacy:{completeLogin:(...args)=>commands.invoke('sc04.legacy.completeLogin',...args)},
    readDeviceId:()=>{
      try{return String(runtime?.SJOwnerProfessionalP2?.deviceId?.()||'')}catch(_){return''}
    },
    readOnline:()=>runtime?.navigator?.onLine!==false,
    readShiftHint:()=>readShiftHint(runtime),
    onForcedLogout:async()=>commands.invoke('sc04.legacy.logout')
  });
}

export function installSc04Runtime(runtime=globalThis,{sc03=runtime?.__SJ_SC03_RUNTIME,manager=null,autoRestore=true}={}){
  if(runtime?.__SJ_SC04_RUNTIME) return runtime.__SJ_SC04_RUNTIME;
  const commands=sc03?.commands;
  if(!commands) throw new Error('SC04_SC03_COMMAND_REGISTRY_REQUIRED');

  const authOwner=typeof runtime?.SJProductionArchitectureP3?.login==='function'
    ?'SJProductionArchitectureP3'
    :'SJSecureRulesCompat';
  commands.captureMethod(authOwner,'login','sc04.legacy.login');
  commands.captureMethod(authOwner,'completeLogin','sc04.legacy.completeLogin');
  commands.captureMethod(authOwner,'logout','sc04.legacy.logout');

  const session=manager??createDefaultManager(runtime,commands);
  let ready=Promise.resolve({restored:false,reason:'NOT_STARTED'});

  commands.installMethod(authOwner,'login',async(...args)=>{
    try{await ready}catch(_){}
    await session.prepareAuth();
    return commands.invoke('sc04.legacy.login',...args);
  },OWNER);

  commands.installMethod(authOwner,'completeLogin',async(...args)=>{
    const result=await commands.invoke('sc04.legacy.completeLogin',...args);
    const username=String(args[0]??'').trim().toLowerCase();
    const user=args[2]&&typeof args[2]==='object'?args[2]:{};
    let authMode='';
    try{authMode=String(runtime?.[authOwner]?.authMode?.()||'')}catch(_){}
    try{await session.saveAfterLogin({username,authMode,role:String(user.role||'')})}
    catch(error){try{runtime?.console?.warn?.('[SC04] session envelope save skipped',error)}catch(_){}}
    return result;
  },OWNER);

  commands.installMethod(authOwner,'logout',async(...args)=>{
    try{await session.invalidate('MANUAL_LOGOUT',{signOut:false})}catch(_){}
    return commands.invoke('sc04.legacy.logout',...args);
  },OWNER);

  ready=Promise.resolve()
    .then(()=>session.prepareAuth())
    .then(()=>autoRestore?session.restore():({restored:false,reason:'AUTO_RESTORE_DISABLED'}))
    .catch(error=>({restored:false,reason:'RESTORE_BOOTSTRAP_ERROR',errorCode:String(error?.code||error?.message||error)}));

  const api=Object.freeze({phase:'SC-04',session,ready,sc03});
  Object.defineProperty(runtime,'__SJ_SC04_RUNTIME',{value:api,writable:false,configurable:false,enumerable:false});
  return api;
}
