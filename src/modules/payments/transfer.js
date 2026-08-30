import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'transfer',
    family:'payments',
    method:'openPayment',
    args:['Transfer'],
    authority:'SJCommercialFinalV5961.openPayment',
    note:null,
    domain:services.transaction??null
  });
}
