/* RC01-S10C-R6D — Sales render recursion hardening.
   Classic script on purpose: it executes after the frozen legacy runtime has
   installed UI03A/UAT aliases, but before REF-01 module wrappers are applied.
   No Firebase, ledger, inventory, finance, or QRIS authority is changed. */
(function(){
'use strict';
if(window.SJRC01S10CR6DSalesRenderHardening)return;

function expose(api){
  try{Object.defineProperty(window,'SJRC01S10CR6DSalesRenderHardening',{value:api,writable:false,configurable:false,enumerable:false})}
  catch(_){window.SJRC01S10CR6DSalesRenderHardening=api}
  return api;
}

var sales=window.SJRefinementSalesV100;
var commercial=window.SJCommercialUIV5953;
if(!sales||typeof sales.renderSales!=='function'){
  expose(Object.freeze({installed:false,reason:'SALES_RENDERER_UNAVAILABLE'}));
  return;
}
if(!commercial||typeof commercial.baseRenderMenu!=='function'){
  expose(Object.freeze({installed:false,reason:'BASE_RENDERER_UNAVAILABLE'}));
  return;
}

var previousBase=sales._baseRenderMenu;
function stableDesktopBase(){return commercial.baseRenderMenu.apply(commercial,arguments)}
sales._baseRenderMenu=stableDesktopBase;

expose(Object.freeze({
  installed:true,
  reason:'LEGACY_NON_MOBILE_ALIAS_CYCLE_BROKEN',
  snapshot:function(){return Object.freeze({
    installed:true,
    previousBaseType:typeof previousBase,
    currentBaseStable:sales._baseRenderMenu===stableDesktopBase
  })}
}));
})();
