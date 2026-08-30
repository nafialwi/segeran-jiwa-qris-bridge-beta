/**
 * SC-04 Firebase Auth persistence adapter.
 * Uses the already-loaded compat SDK; never initializes a second Firebase app.
 */
export function createFirebaseAuthSession({runtime=globalThis,authInitTimeoutMs=1500}={}){
  const client=()=>{
    try{return typeof runtime?.firebase?.auth==='function'?runtime.firebase.auth():null}catch(_){return null}
  };
  const persistence=()=>runtime?.firebase?.auth?.Auth?.Persistence?.LOCAL??null;

  async function ensureLocalPersistence(){
    const auth=client();
    if(!auth || typeof auth.setPersistence!=='function') return false;
    const local=persistence();
    if(local==null) return false;
    await auth.setPersistence(local);
    return true;
  }

  function currentUser(){return client()?.currentUser??null}

  async function waitForInitialUser(){
    const auth=client();
    if(!auth) return null;
    if(auth.currentUser) return auth.currentUser;
    if(typeof auth.onAuthStateChanged!=='function') return null;
    return await new Promise(resolve=>{
      let settled=false,unsubscribe=()=>{};
      const finish=value=>{
        if(settled) return;
        settled=true;
        try{unsubscribe()}catch(_){}
        resolve(value??null);
      };
      try{unsubscribe=auth.onAuthStateChanged(user=>finish(user),()=>finish(null))||(()=>{})}catch(_){finish(null);return}
      setTimeout(()=>finish(auth.currentUser??null),Math.max(0,Number(authInitTimeoutMs)||0));
    });
  }

  async function signOut(){
    const auth=client();
    if(!auth || typeof auth.signOut!=='function') return false;
    await auth.signOut();
    return true;
  }

  return Object.freeze({ensureLocalPersistence,currentUser,waitForInitialUser,signOut});
}
