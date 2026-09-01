/* REF-01 production sales compatibility bridge.
   Classic script on purpose: it must share the legacy global lexical environment
   for cart/cloudData without changing the frozen baseline file. */
(function(){
'use strict';
if(window.SJRef01ProductionSalesCompat)return;
function n(v){v=Number(v);return Number.isFinite(v)?v:0}
function activeProducts(){
  var rows=[];try{rows=(cloudData.global.menu||[]).map(function(p,i){return{p:p,i:i}}).filter(function(x){return SJHarden.isActiveProduct(x.p)}).sort(function(a,b){return SJHarden.orderValue(a.p,a.i)-SJHarden.orderValue(b.p,b.i)||String(a.p.n||'').localeCompare(String(b.p.n||''),'id')}).map(function(x){return x.p})}catch(_){}
  return rows;
}
function productQty(id){try{return(cart||[]).filter(function(x){return String(x.baseProductId||x.id)===String(id)}).reduce(function(s,x){return s+n(x.q)},0)}catch(_){return 0}}
function productById(id){try{return(cloudData.global.menu||[]).find(function(x){return String(x.id)===String(id)})||null}catch(_){return null}}
function outletStock(id){try{var key=String(id),inv=cloudData.global.inventory||{};if(Object.prototype.hasOwnProperty.call(inv,key))return Math.max(0,n(inv[key]));var p=productById(key);return Math.max(0,n(p&&p.stok))}catch(_){return 0}}
function hasNormalCartLine(id){try{return(cart||[]).some(function(x){return String(x.id)===String(id)&&String(x.inventoryMode||'').toUpperCase()!=='RECIPE'})}catch(_){return false}}
function normalLine(id){try{return(cart||[]).find(function(x){return String(x.id)===String(id)&&String(x.inventoryMode||'').toUpperCase()!=='RECIPE'})||null}catch(_){return null}}
function syncCartPresentation(){
  try{if(typeof updateCartUI==='function')updateCartUI()}catch(_){}
  try{var modal=document.getElementById('modal-cart');if(modal&&modal.style.display==='flex'&&window.SJFinalRefinementVC01A2&&typeof SJFinalRefinementVC01A2.openCart==='function')SJFinalRefinementVC01A2.openCart()}catch(_){}
  try{if(document.getElementById('view1')&&document.getElementById('view1').classList.contains('active')&&window.SJRefinementSalesV100&&typeof SJRefinementSalesV100.renderSales==='function')setTimeout(function(){SJRefinementSalesV100.renderSales()},0)}catch(_){}
}
function addNormalProduct(id){
  try{
    if(window.SJShift&&typeof SJShift.guardTransaction==='function'&&!SJShift.guardTransaction())return false;
    if(typeof isDayLocked==='function'&&isDayLocked()){
      try{alert(isRecapMode?'MODE REKAP: pilih shift spesifik untuk transaksi.':'SHIFT INI SUDAH DIKUNCI!')}catch(_){}
      return false;
    }
    var m=(cloudData.global.menu||[]).find(function(x){return String(x.id)===String(id)});if(!m)return false;
    if(m.unavailableDate===activeDateOnly){try{showToast(m.n+' tidak tersedia hari ini.','warning')}catch(_){}return false}
    var idx=(cart||[]).findIndex(function(x){return String(x.id)===String(id)&&String(x.inventoryMode||'').toUpperCase()!=='RECIPE'}),want=(idx>-1?n(cart[idx].q):0)+1;
    if(typeof sjTrackStock==='function'&&sjTrackStock(m)&&want>sjStockQty(m)){try{showToast('Stok '+m.n+' tidak mencukupi.','error')}catch(_){}return false}
    if(idx>-1)cart[idx].q=n(cart[idx].q)+1;else cart.push(Object.assign({},m,{q:1,note:'',savedImg:(window.SJX?SJX.imageFor(m):m.i)||m.img||'📦'}));
    try{var card=document.getElementById('menu-card-'+m.id),ready=document.getElementById('ready-'+m.id);if(card){card.classList.toggle('sj-pulse',false);void card.offsetWidth;card.classList.add('sj-pulse');setTimeout(function(){card.classList.toggle('sj-pulse',false)},420)}if(ready){ready.classList.add('show');setTimeout(function(){ready.classList.toggle('show',false)},390)}}catch(_){}
    try{if(navigator.vibrate)navigator.vibrate(18)}catch(_){}try{playBeep()}catch(_){}syncCartPresentation()
    return true;
  }catch(error){try{showToast('Produk belum dapat ditambahkan. Coba sinkronkan lalu ulangi.','error')}catch(_){}return false}
}
function adjustNormalProduct(id,delta){
  id=String(id);delta=n(delta);var line=normalLine(id);if(!line)return false;
  try{
    var idx=cart.indexOf(line);if(idx<0)return false;if(delta>0){var p=(cloudData.global.menu||[]).find(function(x){return String(x.id)===id});if(p&&sjTrackStock(p)&&n(line.q)+1>sjStockQty(p)){showToast('Stok tidak mencukupi.','error');return false}line.q=n(line.q)+1}else{line.q=n(line.q)-1;if(line.q<=0)cart.splice(idx,1)}try{playBeep()}catch(_){}syncCartPresentation();
    return true;
  }catch(_){return false}
}
function unreadNotificationCount(){
  try{return (cloudData.global.notifications||[]).filter(function(x){return SJHarden.notificationVisible(x)&&!SJHarden.notificationRead(x)}).length}catch(_){return 0}
}
function syncUnreadBadge(){
  var count=unreadNotificationCount();try{document.querySelectorAll('.sjx-badge').forEach(function(el){el.textContent=count;el.style.display=count?'flex':'none'})}catch(_){}return count
}
function selectedShiftKey(){try{return String(activeDate||'')}catch(_){return''}}
async function refreshNow(){
  try{
    if(window.firebase&&firebase.database){try{firebase.database().goOnline()}catch(_){}var dbi=firebase.database(),globalSnap=await dbi.ref(DB_PATH+'/global').once('value'),globalValue=globalSnap&&globalSnap.val?globalSnap.val():null;if(globalValue&&typeof globalValue==='object')cloudData.global=globalValue;var key=selectedShiftKey();if(key){var shiftSnap=await dbi.ref(DB_PATH+'/'+key).once('value');cloudData[key]=shiftSnap&&shiftSnap.val?shiftSnap.val()||{}:{}}
    }
    try{if(window.SJReportFoundationV010&&typeof SJReportFoundationV010.refresh==='function')await SJReportFoundationV010.refresh(true)}catch(_){}
    try{if(window.SJRefinementSalesV100&&document.getElementById('view1')?.classList.contains('active'))SJRefinementSalesV100.renderSales()}catch(_){}
    try{if(window.SJRefinementShellV100&&typeof SJRefinementShellV100.refresh==='function')SJRefinementShellV100.refresh()}catch(_){}
    return{ok:true};
  }catch(error){return{ok:false,error:error}}
}
window.SJRef01ProductionSalesCompat={version:'2.9.0',activeProducts:activeProducts,productById:productById,outletStock:outletStock,productQty:productQty,hasNormalCartLine:hasNormalCartLine,addNormalProduct:addNormalProduct,adjustNormalProduct:adjustNormalProduct,unreadNotificationCount:unreadNotificationCount,syncUnreadBadge:syncUnreadBadge,refreshNow:refreshNow};
window.quickAddCart=function(id){return window.SJRef01ProductionSalesCompat.addNormalProduct(id)};try{quickAddCart=window.quickAddCart}catch(_){}
})();
