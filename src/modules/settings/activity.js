import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'activity',
    family:'settings',
    method:'openSettings',
    args:[8],
    authority:'openMst(8)',
    note:null
  });
}
