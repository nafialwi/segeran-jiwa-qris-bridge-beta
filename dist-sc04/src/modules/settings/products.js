import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'products',
    family:'settings',
    method:'openSettings',
    args:[1],
    authority:'openMst(1)',
    note:null
  });
}
