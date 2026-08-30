import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'shift',
    family:'operational',
    method:'openOperational',
    args:[1],
    authority:'openOpr(1) / SJShift',
    note:null,
    domain:services.shift??null
  });
}
