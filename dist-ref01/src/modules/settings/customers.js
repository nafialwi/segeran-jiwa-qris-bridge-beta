import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'customers',
    family:'settings',
    method:'openSettings',
    args:[9],
    authority:'openMst(9)',
    note:null
  });
}
