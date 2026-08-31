import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';

function watchValue(db,path,onValue,onError=()=>{}){
  if(!db||typeof db.ref!=='function') throw new Error('RTDB_READ_CLIENT_REQUIRED');
  if(typeof onValue!=='function') throw new TypeError('RTDB_WATCH_HANDLER_REQUIRED');
  const ref=db.ref(path);
  const cb=snap=>onValue(snap&&typeof snap.val==='function'?snap.val():null);
  ref.on('value',cb,onError);
  return ()=>{try{ref.off('value',cb)}catch(_){}};
}

/** Read-only SC-04 identity/session validation repository. */
export function createUserRepository({db}={}){
  return Object.freeze({
    readUser(username){return readValue(db,posPath('global','users',username))},
    readAuthUser(uid){return readValue(db,posPath('global','authUsers',uid))},
    readDevice(deviceId){return readValue(db,posPath('global','deviceSessions',deviceId))},
    readAuthMode(){return readValue(db,posPath('global','security','authMode'))},
    watchUser(username,onValue,onError){return watchValue(db,posPath('global','users',username),onValue,onError)},
    watchDevice(deviceId,onValue,onError){return watchValue(db,posPath('global','deviceSessions',deviceId),onValue,onError)}
  });
}
