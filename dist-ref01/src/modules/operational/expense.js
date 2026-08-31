import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'expense',
    family:'operational',
    method:'openOperational',
    args:[7],
    authority:'openOpr(7)',
    note:null
  });
}
