import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'qris',
    family:'payments',
    method:'openPayment',
    args:['QRIS'],
    authority:'SJCommercialFinalV5961.openPayment -> SJQrisSignalBeta',
    note:null,
    domain:services.qris??null
  });
}
