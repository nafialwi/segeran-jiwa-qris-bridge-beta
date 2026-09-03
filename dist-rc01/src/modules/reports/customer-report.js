import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'customer-report',
    family:'reports',
    method:'openPrimary',
    args:['reports'],
    authority:'showView(3)',
    note:'No distinct customer-report legacy child is invented in SC-03.',
    domain:services.report??null
  });
}
