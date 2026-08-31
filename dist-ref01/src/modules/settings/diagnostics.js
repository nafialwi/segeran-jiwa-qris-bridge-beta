import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'diagnostics',
    family:'settings',
    method:'openSettings',
    args:[7],
    authority:'openMst(7)',
    note:null
  });
}
