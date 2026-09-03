import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'checkout',
    family:'sales',
    method:'openCheckout',
    args:[],
    authority:'SJRefinementCheckoutV100.openCheckout',
    note:null,
    domain:services.transaction??null
  });
}
