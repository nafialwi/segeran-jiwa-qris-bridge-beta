import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'credit',
    family:'payments',
    method:'openPayment',
    args:['Kasbon'],
    authority:'SJCommercialFinalV5961.openPayment -> processTransaction',
    note:null,
    domain:services.transaction??null
  });
}
