import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'report-home',
    family:'reports',
    method:'openPrimary',
    args:['reports'],
    authority:'showView(3)',
    note:null,
    domain:services.report??null
  });
}
