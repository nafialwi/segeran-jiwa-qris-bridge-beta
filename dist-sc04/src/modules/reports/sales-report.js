import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'sales-report',
    family:'reports',
    method:'openReport',
    args:[1],
    authority:'openLap(1)',
    note:null,
    domain:services.report??null
  });
}
