import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'cart',
    family:'sales',
    method:'openCart',
    args:[],
    authority:'openCartModal',
    note:null,
    domain:services.transaction??null
  });
}
