import { createDeferredFeature } from '../legacy-feature.js';

export function createFeature({services={}}={}){
  const session=services?.session;
  if(!session){
    return createDeferredFeature({
      id:'security-sync',
      family:'settings',
      reason:'SC-04 Session Manager service is not attached to this SC-03 runtime instance.'
    });
  }
  return Object.freeze({
    id:'security-sync',
    family:'settings',
    status:'active',
    authority:'sc04-session-manager',
    note:'Session/security lifecycle boundary; no independent legacy route is invented.',
    domain:session,
    open:()=>session.snapshot()
  });
}
