import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'users',
    family:'settings',
    method:'openSettings',
    args:[5],
    authority:'openMst(5)',
    note:null
  });
}
