import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'operational-home',
    family:'operational',
    method:'openPrimary',
    args:['operational'],
    authority:'showView(2)',
    note:null
  });
}
