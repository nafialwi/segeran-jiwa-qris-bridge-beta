export const UAT_PROJECT_ID='demo-segeran-jiwa-uat';
export const UAT_DATABASE_NAMESPACE='demo-segeran-jiwa-uat-default-rtdb';
export const UAT_ROUTER_MARKER='SJ_UAT_EMULATOR_ROUTER';

export const UAT_ROUTER_SCRIPT=String.raw`(()=>{
  const marker='SJ_UAT_EMULATOR_ROUTER';
  const projectId='demo-segeran-jiwa-uat';
  const databaseNamespace='demo-segeran-jiwa-uat-default-rtdb';
  const host=String(globalThis.location?.hostname||'').toLowerCase();
  if(!['127.0.0.1','localhost','::1','[::1]'].includes(host))throw new Error('UAT_LOOPBACK_REQUIRED');
  const firebase=window.firebase;
  if(!firebase||typeof firebase.initializeApp!=='function')throw new Error('UAT_FIREBASE_SDK_REQUIRED');
  const original=firebase.initializeApp.bind(firebase);
  const routed=new WeakSet();
  const safeConfig=Object.freeze({
    apiKey:'fake-api-key-for-emulator',
    authDomain:projectId+'.firebaseapp.com',
    databaseURL:'https://'+databaseNamespace+'.firebaseio.com',
    projectId,
    storageBucket:projectId+'.appspot.com'
  });
  const originalFetch=typeof window.fetch==='function'?window.fetch.bind(window):null;
  if(originalFetch){
    window.fetch=function(input,options={}){
      const method=String(options?.method||'GET').toUpperCase();
      let target=null;
      try{target=new URL(typeof input==='string'?input:input?.url,globalThis.location?.href||'http://127.0.0.1/')}catch(_){}
      const loopback=target&&['127.0.0.1','localhost','::1','[::1]'].includes(String(target.hostname||'').toLowerCase());
      const safeMethod=['GET','HEAD','OPTIONS'].includes(method);
      if(target&&!loopback&&!safeMethod){
        const error=new Error('UAT_EXTERNAL_MUTATION_BLOCKED');
        error.code='UAT_EXTERNAL_MUTATION_BLOCKED';
        return Promise.reject(error);
      }
      if(target&&/workers\.dev$/i.test(String(target.hostname||''))&&/segeran-jiwa-emergency/i.test(String(target.hostname||''))){
        const error=new Error('UAT_EXTERNAL_BACKEND_BLOCKED');
        error.code='UAT_EXTERNAL_BACKEND_BLOCKED';
        return Promise.reject(error);
      }
      return originalFetch(input,options);
    };
  }
  function route(app){
    if(!app||routed.has(app))return app;
    const db=typeof app.database==='function'?app.database():null;
    if(!db||typeof db.useEmulator!=='function')throw new Error('UAT_DATABASE_EMULATOR_UNAVAILABLE');
    db.useEmulator('127.0.0.1',9000);
    const auth=typeof app.auth==='function'?app.auth():null;
    if(!auth||typeof auth.useEmulator!=='function')throw new Error('UAT_AUTH_EMULATOR_UNAVAILABLE');
    auth.useEmulator('http://127.0.0.1:9099',{disableWarnings:true});
    const storage=typeof app.storage==='function'?app.storage():null;
    if(!storage||typeof storage.useEmulator!=='function')throw new Error('UAT_STORAGE_EMULATOR_UNAVAILABLE');
    storage.useEmulator('127.0.0.1',9199);
    routed.add(app);
    return app;
  }
  firebase.initializeApp=function(_config,name){
    try{return route(original({...safeConfig},name))}
    catch(error){
      try{console.warn('[UAT ISOLATED] Firebase emulator routing failed',error)}catch(_){}
      if(String(error?.message||'').startsWith('UAT_'))throw error;
      throw Object.assign(new Error('UAT_EMULATOR_ROUTING_FAILED'),{cause:error});
    }
  };
  window.__SJ_UAT_BACKEND=Object.freeze({
    projectId,databaseNamespace,
    database:'127.0.0.1:9000',
    auth:'127.0.0.1:9099',
    storage:'127.0.0.1:9199'
  });
  window.__SJ_UAT_ISOLATED=true;
  window.__SJ_UAT_ROUTER_ACTIVE=true;
  window.__SJ_LOCAL_QA_READ_ONLY=false;
  if(document?.documentElement?.dataset)document.documentElement.dataset.sjUat='isolated';
})();`;

const routerTag=`<script id="sj-uat-emulator-router">${UAT_ROUTER_SCRIPT}</script>`;
const badge='<div id="sj-uat-isolated-indicator" role="status" aria-label="UAT terisolasi emulator lokal"><b>UAT TERISOLASI</b><span>EMULATOR LOCAL · BUKAN LIVE</span></div><style>#sj-uat-isolated-indicator{position:fixed;z-index:2147483000;top:max(8px,env(safe-area-inset-top));left:8px;display:flex;gap:6px;align-items:center;padding:6px 9px;border-radius:999px;background:#312e81;color:#fff;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.03em;box-shadow:0 3px 12px rgba(0,0,0,.2);pointer-events:none}#sj-uat-isolated-indicator span{font-weight:600;opacity:.88}@media(max-width:520px){#sj-uat-isolated-indicator{right:8px;left:8px;justify-content:center}}</style>';

export function injectUatHtml(html){
  let text=String(html??'');
  if(!text.includes(UAT_ROUTER_MARKER)){
    const firebaseStorage=/<script[^>]+firebase-storage-compat\.js[^>]*><\/script>/i;
    if(firebaseStorage.test(text))text=text.replace(firebaseStorage,match=>`${match}${routerTag}`);
    else if(/<\/head>/i.test(text))text=text.replace(/<\/head>/i,`${routerTag}</head>`);
    else text=routerTag+text;
  }
  if(!text.includes('sj-uat-isolated-indicator')){
    if(/<\/body>/i.test(text))text=text.replace(/<\/body>/i,`${badge}</body>`);
    else text+=badge;
  }
  return text;
}
