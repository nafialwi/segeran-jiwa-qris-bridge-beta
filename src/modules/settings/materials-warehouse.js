import { createCommandFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createCommandFeature(router,{
    id:'materials-warehouse',
    family:'settings',
    command:'inventory.open',
    args:['summary'],
    authority:'SJInventoryV2.open'
  });
}
