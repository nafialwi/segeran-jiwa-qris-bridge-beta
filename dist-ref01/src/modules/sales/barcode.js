import { createCommandFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createCommandFeature(router,{
    id:'barcode',
    family:'sales',
    command:'scanner.open',
    args:[],
    authority:'openCameraScanner'
  });
}
