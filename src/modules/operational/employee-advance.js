import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'employee-advance',
    family:'operational',
    method:'openOperational',
    args:[6],
    authority:'openOpr(6)',
    note:null,
    domain:services.debt??null
  });
}
