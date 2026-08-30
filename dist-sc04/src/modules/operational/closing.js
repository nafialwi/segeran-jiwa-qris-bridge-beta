import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createRouterFeature(router,{
    id:'closing',
    family:'operational',
    method:'openOperational',
    args:[1],
    authority:'openOpr(1) / SJShift',
    note:'Entering closing stays non-mutating; close action remains SJShift authority.',
    domain:services.shift??null
  });
}
