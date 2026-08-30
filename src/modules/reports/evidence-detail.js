import { createCommandFeature } from '../legacy-feature.js';

export function createFeature({router,services={}}){
  return createCommandFeature(router,{
    id:'evidence-detail',
    family:'reports',
    command:'report.fullscreen',
    args:[],
    authority:'showReportFullscreen',
    domain:services.report??null
  });
}
