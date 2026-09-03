export const LOCAL_QA_GUARD_MARKER='SJ_LOCAL_QA_READ_ONLY_GUARD';

export const LOCAL_QA_GUARD_SCRIPT=String.raw`(()=>{
  const marker='SJ_LOCAL_QA_READ_ONLY_GUARD';
  window.__SJ_LOCAL_QA_READ_ONLY=true;
  const warn=name=>{try{console.warn('[LOCAL QA READ ONLY] blocked RTDB '+name)}catch(_){}};
  const noop=name=>function(){warn(name);return Promise.resolve({localQa:true,blocked:true})};
  const reject=name=>function(){warn(name);const error=new Error('LOCAL_QA_READ_ONLY: '+name+' is blocked');error.code='LOCAL_QA_READ_ONLY';return Promise.reject(error)};
  function install(){
    const Reference=window.firebase?.database?.Reference;
    const proto=Reference?.prototype;
    if(!proto)return false;
    if(proto.__sjLocalQaReadOnly===marker){window.__SJ_LOCAL_QA_GUARD_ACTIVE=true;return true}
    for(const name of ['set','update','remove','setPriority','setWithPriority']){
      if(typeof proto[name]==='function')proto[name]=noop(name);
    }
    if(typeof proto.transaction==='function')proto.transaction=reject('transaction');
    if(typeof proto.push==='function'){
      const originalPush=proto.push;
      proto.push=function(...args){
        if(args.length===0)return originalPush.call(this);
        warn('push(value)');
        return originalPush.call(this);
      };
    }
    if(typeof proto.onDisconnect==='function'){
      proto.onDisconnect=function(){
        warn('onDisconnect');
        return {set:noop('onDisconnect.set'),update:noop('onDisconnect.update'),remove:noop('onDisconnect.remove'),cancel:noop('onDisconnect.cancel')};
      };
    }
    try{Object.defineProperty(proto,'__sjLocalQaReadOnly',{value:marker,configurable:false})}catch(_){proto.__sjLocalQaReadOnly=marker}
    window.__SJ_LOCAL_QA_GUARD_ACTIVE=true;
    return true;
  }
  if(!install()){
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      if(install()||attempts>=250)clearInterval(timer);
    },20);
  }
})();`;

const badge='<div id="sj-local-qa-indicator" aria-label="Local QA read only candidate">LOCAL QA · READ ONLY</div><div id="sj-local-qa-state" aria-label="Local QA applied state">INV3? · P? / C? · O? · FG?</div><style>#sj-local-qa-indicator{position:fixed;z-index:2147483000;top:max(8px,env(safe-area-inset-top));left:8px;padding:5px 8px;border-radius:999px;background:#6f4e12;color:#fff;font:700 10px/1.2 system-ui,sans-serif;letter-spacing:.05em;box-shadow:0 3px 12px rgba(0,0,0,.18);pointer-events:none}#sj-local-qa-state{position:fixed;z-index:2147482999;top:max(37px,calc(env(safe-area-inset-top) + 37px));left:8px;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,.94);border:1px solid #d7caa8;color:#5d4a16;font:700 9px/1.2 system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.10);pointer-events:none}</style><script id="sj-local-qa-state-script">(()=>{const tracks=()=>{try{const g=document.querySelector?.(".sjvc01-grid,.sjui03a-grid");if(!g)return"?";const raw=getComputedStyle(g).gridTemplateColumns||"";const n=raw.trim()?raw.trim().split(/\s+/).length:"?";return n}catch(_){return"?"}};const paint=()=>{const el=document.getElementById("sj-local-qa-state");if(!el)return;const d=document.documentElement?.dataset||{};const fg=!!document.querySelector?.("[data-sj-finished-warehouse]");const inv3=!!window.__SJ_V32_INVENTORY_WORKSPACE?.installed;el.textContent=`V${d.sjV31==="true"?"31✓":"?"} · INV3${inv3?"✓":"–"} · P${d.sjProductCols||"?"} / C${tracks()} · O${d.sjOperationCols||"?"} · FG${fg?"✓":"–"}`};paint();setInterval(paint,250)})();</script>';
const guardTag=`<script id="sj-local-qa-write-guard">${LOCAL_QA_GUARD_SCRIPT}</script>`;

export function injectLocalQaHtml(html){
  let text=String(html??'');
  if(!text.includes(LOCAL_QA_GUARD_MARKER)){
    const firebaseStorage=/<script[^>]+firebase-storage-compat\.js[^>]*><\/script>/i;
    if(firebaseStorage.test(text))text=text.replace(firebaseStorage,match=>`${match}${guardTag}`);
    else if(/<\/head>/i.test(text))text=text.replace(/<\/head>/i,`${guardTag}</head>`);
    else text=guardTag+text;
  }
  if(!text.includes('sj-local-qa-indicator')){
    if(/<\/body>/i.test(text))text=text.replace(/<\/body>/i,`${badge}</body>`);
    else text+=badge;
  }
  return text;
}
