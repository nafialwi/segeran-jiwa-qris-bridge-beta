/**
 * SC-02 QRIS adapter.
 * Existing SJQrisSignalBeta remains the only QRIS state/matching/finalization authority.
 */
function method(engine,name){
  const fn=engine?.[name];
  if(typeof fn!=='function') throw new Error(`QRIS_ENGINE_METHOD_MISSING:${name}`);
  return fn.bind(engine);
}

export function createQrisAdapter({engine,bridge}={}){
  const resolveEngine=()=>engine||(bridge?bridge.engine('qris'):null);
  return Object.freeze({
    status(){return method(resolveEngine(),'status')()},
    async ensureWaitingPending(){return await method(resolveEngine(),'ensureWaitingPending')()},
    async cancelWaiting(safe=true){return await method(resolveEngine(),'cancelWaiting')(safe)},
    async resolveAmbiguous(eventId){return await method(resolveEngine(),'resolveAmbiguous')(eventId)},
    renderCommercialState(){return method(resolveEngine(),'renderCommercialQrisState')()}
  });
}
