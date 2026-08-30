import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'employees',
    family:'settings',
    method:'openSettings',
    args:[10],
    authority:'openMst(10)',
    note:null
  });
}
