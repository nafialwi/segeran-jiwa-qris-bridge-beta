import { landedCost, movingWac } from './costing-service.js';

function requiredMethod(engine,name){
  const fn=engine?.[name];if(typeof fn!=='function')throw new Error(`COSTING_ENGINE_METHOD_MISSING:${name}`);return fn.bind(engine);
}
export function createPurchaseWacService({bridge,engine}={}){
  const resolveEngine=()=>engine||(bridge?bridge.engine('costing'):null);
  return Object.freeze({
    preview(input={}){
      const total=landedCost(input.goodsCost,input.fees,input.supplierDiscount),w=movingWac(input.stockBefore,input.oldWac,input.qtyReceived,total);
      return{landedCost:total,...w};
    },
    async resumePurchase(purchaseId){return await requiredMethod(resolveEngine(),'resumePurchase')(purchaseId)}
  });
}
