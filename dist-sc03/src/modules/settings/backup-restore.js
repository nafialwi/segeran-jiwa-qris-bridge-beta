import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'backup-restore',
    family:'settings',
    method:'openPrimary',
    args:['settings'],
    authority:'legacy backup/restore controls',
    note:'Opening this boundary is non-destructive; legacy backup/restore actions stay separately owned.'
  });
}
