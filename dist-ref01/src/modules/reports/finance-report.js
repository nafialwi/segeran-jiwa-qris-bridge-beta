import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'finance-report',
    family:'reports',
    method:'openReport',
    args:[2],
    authority:'openLap(2)',
    note:null,
    domain:services.report??null
  });
}
