import { createDeferredFeature } from '../legacy-feature.js';

export function createFeature(){
  return createDeferredFeature({
    id:'appearance',
    family:'settings',
    reason:'REF-01 visual refinement only; no separate v1.0.40 runtime route is created in SC-03.'
  });
}
