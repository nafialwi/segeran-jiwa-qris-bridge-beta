function callable(obj,name){return obj&&typeof obj[name]==='function'?obj[name].bind(obj):null}
export function createRefundVoidService({bridge}={}){
  if(!bridge)throw new Error('REFUND_VOID_BRIDGE_REQUIRED');
  const hardening=()=>bridge.get('SJOperationalHardening');
  const sjx=()=>bridge.get('SJX');
  function choose(name,globalName){
    return callable(hardening(),name)||callable(sjx(),name)||(globalName&&typeof bridge.get(globalName)==='function'?bridge.get(globalName).bind(bridge.runtime):null);
  }
  return Object.freeze({
    searchRefund(...args){const fn=choose('searchRefund');if(!fn)throw new Error('REFUND_AUTHORITY_MISSING:searchRefund');return fn(...args)},
    async processRefund(...args){const fn=choose('processRefund');if(!fn)throw new Error('REFUND_AUTHORITY_MISSING:processRefund');return await fn(...args)},
    async voidTransaction(index){const fn=choose('voidTx','voidTx');if(!fn)throw new Error('VOID_AUTHORITY_MISSING:voidTx');return await fn(index)}
  });
}
