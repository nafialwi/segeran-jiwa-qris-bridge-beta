import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'categories',
    family:'settings',
    method:'openSettings',
    args:[2],
    authority:'openMst(2)',
    note:null
  });
}
