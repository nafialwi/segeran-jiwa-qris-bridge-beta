import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'printer',
    family:'settings',
    method:'openSettings',
    args:[6],
    authority:'openMst(6)',
    note:'Printer/device shares existing legacy menu id 6.'
  });
}
