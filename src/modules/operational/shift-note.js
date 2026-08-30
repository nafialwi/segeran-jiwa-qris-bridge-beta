import { createRouterFeature } from '../legacy-feature.js';

export function createFeature({router}){
  return createRouterFeature(router,{
    id:'shift-note',
    family:'operational',
    method:'openOperational',
    args:[10],
    authority:'openOpr(10) / SJX.renderShiftNotes',
    note:null
  });
}
