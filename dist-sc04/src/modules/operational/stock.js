import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'stock',
    family:'operational',
    method:'openOperational',
    args:[3],
    authority:'openOpr(3)',
    note:null,
    domain:services.inventory??null
  });
}
