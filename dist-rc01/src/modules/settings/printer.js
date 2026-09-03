import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'printer',
    family:'settings',
    method:'openSettings',
    args:[6],
    authority:'openMst(6)',
    note:'Dedicated existing printer surface; device sessions use legacy id 13.'
  });
}
