import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'settings-home',
    family:'settings',
    method:'openPrimary',
    args:['settings'],
    authority:'showView(4)',
    note:null
  });
}
