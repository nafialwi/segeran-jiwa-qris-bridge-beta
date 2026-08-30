function requireRouter(router){
  if(!router || typeof router!=='object') throw new TypeError('SC03_ROUTER_REQUIRED');
  return router;
}

function callRouter(router,method,args){
  const fn=router?.[method];
  if(typeof fn!=='function') throw new Error(`ROUTER_METHOD_UNAVAILABLE:${method}`);
  return fn(...args);
}

export function createRouterFeature(router,{
  id,
  family,
  method,
  args=[],
  closeMethod=null,
  authority='legacy-renderer',
  note=null,
  domain=null
}){
  requireRouter(router);
  return Object.freeze({
    id,
    family,
    status:'active',
    authority,
    note,
    domain,
    open:(...runtimeArgs)=>callRouter(router,method,runtimeArgs.length?runtimeArgs:args),
    close:closeMethod?()=>callRouter(router,closeMethod,[]):undefined
  });
}

export function createCommandFeature(router,{
  id,
  family,
  command,
  args=[],
  authority='legacy-command',
  note=null,
  domain=null
}){
  requireRouter(router);
  return Object.freeze({
    id,
    family,
    status:'active',
    authority,
    note,
    domain,
    open:(...runtimeArgs)=>callRouter(router,'invokeCommand',[command,...(runtimeArgs.length?runtimeArgs:args)])
  });
}

export function createDeferredFeature({id,family,reason,authority='future-authority'}){
  if(!reason) throw new TypeError('SC03_DEFERRED_REASON_REQUIRED');
  const fail=()=>{ throw new Error(`FEATURE_DEFERRED:${id}:${reason}`); };
  return Object.freeze({id,family,status:'deferred',authority,reason,domain:null,open:fail});
}
