import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'product-list',
    family:'sales',
    method:'openSales',
    args:[],
    authority:'showView(1)',
    note:null,
    domain:services.transaction??null
  });
}
