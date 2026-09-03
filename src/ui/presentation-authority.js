export const PRESENTATION_AUTHORITIES=Object.freeze({
  dashboard:Object.freeze({owner:'owner-dashboard/ref01-convergence',selector:'#view5'}),
  sales:Object.freeze({owner:'production-sales-stability',selector:'#view1'}),
  cart:Object.freeze({owner:'sales-shift-ux-refinement',selector:'#modal-cart'}),
  checkout:Object.freeze({owner:'sales-shift-ux-refinement',selector:'#modal-cart'}),
  receipt:Object.freeze({owner:'transaction-detail-refinement',selector:'#modal-struk-fs'}),
  operational:Object.freeze({owner:'critical-operational-refinement',selector:'#view2'}),
  reports:Object.freeze({owner:'report-refinement',selector:'#view3'}),
  settings:Object.freeze({owner:'ref01-settings-refinement',selector:'#view4'}),
  notifications:Object.freeze({owner:'notification-refinement',selector:'#modal-sjx-notif'}),
  profile:Object.freeze({owner:'media-lifecycle/ref01-profile',selector:'[data-ref01-profile],.sjvc01-avatar,.sjui02-avatar'})
});

const WRAP_MARK='__sjV30PresentationLifecycle';

export function createPresentationLifecycle(runtime=globalThis,{document=runtime?.document??null,reconcile=()=>{}}={}){
  let installed=false,stopped=false,pending=false,lastReason='manual';
  const originals=[];
  const listeners=[];
  const raf=fn=>typeof runtime?.requestAnimationFrame==='function'?runtime.requestAnimationFrame(fn):runtime?.setTimeout?.(fn,0)??setTimeout(fn,0);
  function schedule(reason='manual'){
    if(stopped)return false;lastReason=String(reason||'manual');if(pending)return true;pending=true;
    raf(()=>{pending=false;if(stopped)return;try{reconcile(lastReason)}catch(error){runtime?.console?.warn?.('[SJ/v3 presentation reconcile]',error)}});return true;
  }
  function wrap(name,reason){
    const original=runtime?.[name];if(typeof original!=='function'||original?.[WRAP_MARK])return false;
    function wrapped(...args){const out=original.apply(this,args);schedule(typeof reason==='function'?reason(args):reason);return out}
    try{Object.defineProperty(wrapped,WRAP_MARK,{value:true,enumerable:false})}catch(_){wrapped[WRAP_MARK]=true}
    originals.push([name,original]);runtime[name]=wrapped;return true;
  }
  function on(target,event,fn){if(typeof target?.addEventListener!=='function')return;target.addEventListener(event,fn);listeners.push([target,event,fn])}
  function install(){
    if(installed)return true;installed=true;stopped=false;
    wrap('showView',args=>`route:${Number(args?.[0])||0}`);
    wrap('clsModal',args=>`modal:${String(args?.[0]||'unknown')}`);
    wrap('buildScreenReceipt','receipt');
    wrap('showTxDay','transaction-detail');
    const online=()=>schedule('connectivity:online'),offline=()=>schedule('connectivity:offline');
    on(runtime,'online',online);on(runtime,'offline',offline);
    schedule('install');return true;
  }
  function stop(){
    if(stopped)return;stopped=true;for(const [target,event,fn] of listeners.splice(0))try{target.removeEventListener?.(event,fn)}catch(_){}
    for(const [name,original] of originals.splice(0)){try{if(runtime?.[name]?.[WRAP_MARK])runtime[name]=original}catch(_){}}
  }
  return Object.freeze({install,schedule,stop,snapshot:()=>Object.freeze({installed,observer:'none',wrapped:originals.map(([name])=>name),authorityCount:Object.keys(PRESENTATION_AUTHORITIES).length,documentAvailable:!!document})});
}
