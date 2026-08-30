import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'devices',
    family:'settings',
    method:'openSettings',
    args:[6],
    authority:'openMst(6)',
    note:null
  });
}
