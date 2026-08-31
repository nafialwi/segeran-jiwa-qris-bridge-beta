import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'restock',
    family:'operational',
    method:'openOperational',
    args:[9],
    authority:'openOpr(9) / SJX.renderRestockPage',
    note:null,
    domain:services.inventory??null
  });
}
