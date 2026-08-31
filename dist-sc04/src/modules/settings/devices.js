import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'devices',
    family:'settings',
    method:'openSettingsSurface',
    args:[13,'devices'],
    authority:'openMst(13)',
    note:null
  });
}
