import { createCommandFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createCommandFeature(router,{
    id:'notifications',
    family:'settings',
    command:'notifications.open',
    args:[],
    authority:'SJX.openNotifications'
  });
}
