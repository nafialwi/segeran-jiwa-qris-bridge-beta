import { createCommandFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createCommandFeature(router,{
    id:'account',
    family:'settings',
    command:'account.open',
    args:[],
    authority:'SJAccountV5964.open'
  });
}
