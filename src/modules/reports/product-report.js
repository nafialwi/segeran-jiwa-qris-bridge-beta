import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'product-report',
    family:'reports',
    method:'openReport',
    args:[5],
    authority:'openLap(5)',
    note:null,
    domain:services.report??null
  });
}
