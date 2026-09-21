export const UAT_PROJECT_ID='demo-segeran-jiwa-uat';
export const UAT_DATABASE_NAMESPACE='demo-segeran-jiwa-uat-default-rtdb';
export const UAT_ROUTER_MARKER='SJ_UAT_EMULATOR_ROUTER';

const LOOPBACK_HOSTS=new Set(['127.0.0.1','localhost','::1','[::1]']);

function normalizeHost(value){
  let host=String(value??'').trim().toLowerCase();
  if(host.startsWith('[')&&host.endsWith(']'))host=host.slice(1,-1);
  return host;
}
function isPrivateIpv4(host){
  const parts=String(host||'').trim().split('.');
  if(parts.length!==4)return false;
  const oct=parts.map(Number);
  if(oct.some(n=>!Number.isInteger(n)||n<0||n>255))return false;
  return oct[0]===10
    ||(oct[0]===172&&oct[1]>=16&&oct[1]<=31)
    ||(oct[0]===192&&oct[1]===168);
}
export function normalizeUatBrowserHost(value='127.0.0.1'){
  const host=normalizeHost(value);
  if(LOOPBACK_HOSTS.has(host))return host;
  if(isPrivateIpv4(host))return host;
  throw new Error('UAT_BROWSER_HOST_NOT_PRIVATE');
}

export function buildUatRouterScript(browserHost='127.0.0.1'){
  const emulatorHost=normalizeUatBrowserHost(browserHost);
  const mobileLan=!LOOPBACK_HOSTS.has(emulatorHost);
  return [
    '(()=>{',
    "  const marker='SJ_UAT_EMULATOR_ROUTER';",
    "  const projectId='demo-segeran-jiwa-uat';",
    "  const databaseNamespace='demo-segeran-jiwa-uat-default-rtdb';",
    '  const emulatorHost='+JSON.stringify(emulatorHost)+';',
    '  const mobileLan='+(mobileLan?'true':'false')+';',
    "  const normalizeHost=value=>{let host=String(value||'').trim().toLowerCase();if(host.startsWith('[')&&host.endsWith(']'))host=host.slice(1,-1);return host};",
    "  const pageHost=normalizeHost(globalThis.location?.hostname||'');",
    "  if(pageHost!==normalizeHost(emulatorHost))throw new Error(mobileLan?'UAT_HOST_NOT_ALLOWED':'UAT_LOOPBACK_REQUIRED');",
    '  const firebase=window.firebase;',
    "  if(!firebase||typeof firebase.initializeApp!=='function')throw new Error('UAT_FIREBASE_SDK_REQUIRED');",
    '  const original=firebase.initializeApp.bind(firebase);',
    '  const routed=new WeakSet();',
    '  const safeConfig=Object.freeze({',
    "    apiKey:'fake-api-key-for-emulator',",
    "    authDomain:projectId+'.firebaseapp.com',",
    "    databaseURL:'https://'+databaseNamespace+'.firebaseio.com',",
    '    projectId,',
    "    storageBucket:projectId+'.appspot.com'",
    '  });',
    "  const originalFetch=typeof window.fetch==='function'?window.fetch.bind(window):null;",
    '  if(originalFetch){',
    '    window.fetch=function(input,options={}){',
    "      const method=String(options?.method||'GET').toUpperCase();",
    '      let target=null;',
    "      try{target=new URL(typeof input==='string'?input:input?.url,globalThis.location?.href||('http://'+emulatorHost+'/'))}catch(_){}",
    '      const approved=target&&normalizeHost(target.hostname)===normalizeHost(emulatorHost);',
    "      const safeMethod=['GET','HEAD','OPTIONS'].includes(method);",
    "      if(target&&/workers\.dev$/i.test(String(target.hostname||''))&&/segeran-jiwa-emergency/i.test(String(target.hostname||''))){",
    "        const error=new Error('UAT_EXTERNAL_BACKEND_BLOCKED');",
    "        error.code='UAT_EXTERNAL_BACKEND_BLOCKED';",
    '        return Promise.reject(error);',
    '      }',
    '      if(target&&!approved&&!safeMethod){',
    "        const error=new Error('UAT_EXTERNAL_MUTATION_BLOCKED');",
    "        error.code='UAT_EXTERNAL_MUTATION_BLOCKED';",
    '        return Promise.reject(error);',
    '      }',
    '      return originalFetch(input,options);',
    '    };',
    '  }',
    '  function route(app){',
    '    if(!app||routed.has(app))return app;',
    "    const db=typeof app.database==='function'?app.database():null;",
    "    if(!db||typeof db.useEmulator!=='function')throw new Error('UAT_DATABASE_EMULATOR_UNAVAILABLE');",
    '    db.useEmulator(emulatorHost,9000);',
    "    const auth=typeof app.auth==='function'?app.auth():null;",
    "    if(!auth||typeof auth.useEmulator!=='function')throw new Error('UAT_AUTH_EMULATOR_UNAVAILABLE');",
    "    auth.useEmulator('http://'+emulatorHost+':9099',{disableWarnings:true});",
    "    const storage=typeof app.storage==='function'?app.storage():null;",
    "    if(!storage||typeof storage.useEmulator!=='function')throw new Error('UAT_STORAGE_EMULATOR_UNAVAILABLE');",
    '    storage.useEmulator(emulatorHost,9199);',
    '    routed.add(app);',
    '    return app;',
    '  }',
    '  firebase.initializeApp=function(_config,name){',
    '    try{return route(original({...safeConfig},name))}',
    '    catch(error){',
    "      try{console.warn('[UAT ISOLATED] Firebase emulator routing failed',error)}catch(_){}",
    "      if(String(error?.message||'').startsWith('UAT_'))throw error;",
    "      throw Object.assign(new Error('UAT_EMULATOR_ROUTING_FAILED'),{cause:error});",
    '    }',
    '  };',
    '  window.__SJ_UAT_BACKEND=Object.freeze({',
    '    projectId,databaseNamespace,host:emulatorHost,',
    "    database:emulatorHost+':9000',",
    "    auth:emulatorHost+':9099',",
    "    storage:emulatorHost+':9199'",
    '  });',
    '  window.__SJ_UAT_ISOLATED=true;',
    '  window.__SJ_UAT_ROUTER_ACTIVE=true;',
    '  window.__SJ_UAT_MOBILE_LAN=mobileLan;',
    '  window.__SJ_LOCAL_QA_READ_ONLY=false;',
    '  if(document?.documentElement?.dataset){',
    "    document.documentElement.dataset.sjUat='isolated';",
    "    document.documentElement.dataset.sjUatTransport=mobileLan?'mobile-lan':'loopback';",
    '  }',
    '})();'
  ].join(String.fromCharCode(10));
}

export const UAT_ROUTER_SCRIPT=buildUatRouterScript('127.0.0.1');

function indicator(browserHost){
  const host=normalizeUatBrowserHost(browserHost);
  const mobile=!LOOPBACK_HOSTS.has(host);
  const detail=mobile?'MOBILE LAN PRIVATE · BUKAN LIVE':'EMULATOR LOCAL · BUKAN LIVE';
  return '<div id="sj-uat-isolated-indicator" role="status" aria-label="UAT terisolasi emulator lokal"><b>UAT TERISOLASI</b><span>'+detail+'</span></div><style>#sj-uat-isolated-indicator{position:fixed;z-index:2147483000;top:max(8px,env(safe-area-inset-top));left:8px;display:flex;gap:6px;align-items:center;padding:6px 9px;border-radius:999px;background:#312e81;color:#fff;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.03em;box-shadow:0 3px 12px rgba(0,0,0,.2);pointer-events:none}#sj-uat-isolated-indicator span{font-weight:600;opacity:.88}@media(max-width:520px){#sj-uat-isolated-indicator{right:8px;left:8px;justify-content:center}}</style>';
}

export function injectUatHtml(html,{browserHost='127.0.0.1'}={}){
  const safeHost=normalizeUatBrowserHost(browserHost);
  const routerTag='<script id="sj-uat-emulator-router">'+buildUatRouterScript(safeHost)+'</script>';
  const badge=indicator(safeHost);
  let text=String(html??'');
  if(!text.includes(UAT_ROUTER_MARKER)){
    const firebaseStorage=new RegExp('<script[^>]+firebase-storage-compat[.]js[^>]*><'+String.fromCharCode(47)+'script>','i');
    if(firebaseStorage.test(text))text=text.replace(firebaseStorage,match=>match+routerTag);
    else if(text.toLowerCase().includes('</head>'))text=text.replace(new RegExp('<'+String.fromCharCode(47)+'head>','i'),routerTag+'</head>');
    else text=routerTag+text;
  }
  if(!text.includes('sj-uat-isolated-indicator')){
    if(text.toLowerCase().includes('</body>'))text=text.replace(new RegExp('<'+String.fromCharCode(47)+'body>','i'),badge+'</body>');
    else text+=badge;
  }
  return text;
}
