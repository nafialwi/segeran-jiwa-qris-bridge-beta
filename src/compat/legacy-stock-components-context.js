(function(g){
'use strict';
if(g.__SJ_LEGACY_STOCK_COMPONENT_CONTEXT)return;
function text(value){return String(value==null?'':value).trim()}
function clone(value){try{return value==null?value:JSON.parse(JSON.stringify(value))}catch(_){return value}}
function actor(){
  return Object.freeze({
    id:text(typeof currentLoginId!=='undefined'?currentLoginId:''),
    name:text(typeof currentUserName!=='undefined'?currentUserName:''),
    role:text(typeof currentUserRole!=='undefined'?currentUserRole:'')
  })
}
function snapshotSale(){
  var shift=text(typeof activeDate!=='undefined'?activeDate:'');
  var rows=(typeof cart!=='undefined'&&Array.isArray(cart))?cart:[];
  var day=(typeof cloudData!=='undefined'&&cloudData&&shift&&cloudData[shift])?cloudData[shift]:{};
  var txs=day&&day.tx&&typeof day.tx==='object'?day.tx:{};
  return Object.freeze({
    shiftKey:shift,
    cart:clone(rows),
    actor:actor(),
    preTxKeys:Object.freeze(Object.keys(txs||{}).map(String)),
    capturedAt:Date.now()
  })
}
Object.defineProperty(g,'__SJ_LEGACY_STOCK_COMPONENT_CONTEXT',{
  value:Object.freeze({version:'R10-A1',snapshotSale:snapshotSale,actor:actor}),
  writable:false,configurable:false,enumerable:false
});
})(window);
