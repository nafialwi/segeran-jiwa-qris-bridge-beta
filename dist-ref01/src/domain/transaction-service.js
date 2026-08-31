import { quote as pricingQuote, authorize as authorizePricing } from './pricing-service.js';

export function createTransactionService({bridge}={}){
  if(!bridge)throw new Error('TRANSACTION_BRIDGE_REQUIRED');
  return Object.freeze({
    quote(items,opts){return pricingQuote(items,opts)},
    authorize(q,role){return authorizePricing(q,role)},
    async commitLegacy(...args){return await bridge.call('processTransaction',...args)}
  });
}
