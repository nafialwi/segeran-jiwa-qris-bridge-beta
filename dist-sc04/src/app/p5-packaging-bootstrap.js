import { installCupShiftControlV34 } from '../ui/cup-shift-control-v34.js';
import { installCupProductCostingV34 } from '../ui/cup-product-costing-v34.js';

export function installP5PackagingV34(runtime=globalThis,{inventoryWorkspace=runtime?.__SJ_V32_INVENTORY_WORKSPACE}={}){
  if(runtime?.__SJ_P5_PACKAGING_V34)return runtime.__SJ_P5_PACKAGING_V34;
  const shiftControl=installCupShiftControlV34(runtime,{inventoryWorkspace});
  const productCosting=installCupProductCostingV34(runtime,{inventoryWorkspace});
  const api=Object.freeze({
    version:'3.4',phase:'P5-BATCH2',installed:!!(shiftControl?.installed||productCosting?.installed),shiftControl,productCosting,
    enhance(){try{productCosting?.enhance?.()}catch(_){}return true},
    refresh(){return Promise.allSettled([shiftControl?.refresh?.(),productCosting?.refresh?.()].filter(Boolean))}
  });
  try{Object.defineProperty(runtime,'__SJ_P5_PACKAGING_V34',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
