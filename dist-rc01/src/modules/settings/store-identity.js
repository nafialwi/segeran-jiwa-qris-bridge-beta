import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'store-identity',
    family:'settings',
    method:'openSettings',
    args:[4],
    authority:'openMst(4)',
    note:null
  });
}
