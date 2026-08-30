import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'refund-void',
    family:'operational',
    method:'openOperational',
    args:[12],
    authority:'openOpr(12) / SJOperationalHardening',
    note:null,
    domain:services.refundVoid??null
  });
}
