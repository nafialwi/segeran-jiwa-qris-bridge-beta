import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'cashier-dashboard',
    family:'dashboard',
    method:'openHome',
    args:[],
    authority:'SJX.openDashboard',
    note:'Role-specific rendering remains legacy authority.'
  });
}
