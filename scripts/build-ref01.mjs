import { closeSync, cpSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const BASE=join(ROOT,'baseline','legacy-v1.0.40.html');
const SOURCE=join(ROOT,'src');
const OUT=join(ROOT,'dist-ref01');
const LOCK=join(ROOT,'.ref01-build.lock');
const STAMP=join(OUT,'.ref01-build-fingerprint');
const PWA_SOURCE=join(SOURCE,'pwa');
const S10A1_EARLY_ENTRY='<script src="./src/compat/rc01-qris-event-sync-shield.js" data-sj-rc01-s10a1-event-shield="true"></script>';
const S10C_R2_EARLY_ENTRY='<script src="./src/compat/rc01-qris-evaluation-convergence.js" data-sj-rc01-s10c-r2-qris-convergence="true"></script>';
const CLASSIC_ENTRY='<script src="./src/compat/ref01-production-sales-compat.js" data-sj-ref01-production-sales-compat="true"></script>';
const S10C_SYNC_ENTRY='<script src="./src/compat/rc01-sync-authority.js" data-sj-rc01-s10c-sync-authority="true"></script>';
const R6C_NOTIFICATION_ENTRY='<script src="./src/compat/rc01-notification-permission-hygiene.js" data-sj-rc01-s10c-r6c-notification-hygiene="true"></script>';
const R6D_SALES_RECURSION_ENTRY='<script src="./src/compat/rc01-sales-render-recursion-hardening.js" data-sj-rc01-s10c-r6d-sales-recursion="true"></script>';
const STOCK_COMPONENT_CONTEXT_ENTRY='<script src="./src/compat/legacy-stock-components-context.js" data-sj-r10-stock-component-context="true"></script>';
const R6C_NOTIFICATION_BOOTSTRAP_MARKER='SJX.init();';
const S10C_INSTALL_MARKER='try{SJMobileUX.install();';
const QRIS_BETA_MARKER='if(window.SJQrisSignalBeta)return;';
const QRIS_MANUAL_ONLY_GUARD="if(window.SJQrisSignalBeta)return;window.SJQrisSignalBeta=Object.freeze({version:'QRIS-MANUAL-ONLY',disabled:true,status:function(){return{started:false,activePendingId:'',signals:0,pending:0}},ensureWaitingPending:async function(){throw new Error('QRIS_AUTOMATIC_BRIDGE_DISABLED_MANUAL_ONLY')},renderCommercialQrisState:function(){return false},cancelWaiting:async function(){return true}});window.SJRC01S10AQrisCompat=Object.freeze({version:'QRIS-MANUAL-ONLY',disabled:true,refreshEvidence:async function(){return false},getParked:function(){return[]},getLateReview:function(){return[]}});return;";
const S10A_CLASSIC_ENTRY='<script src="./src/compat/rc01-qris-deferred-settlement-compat.js" data-sj-rc01-s10a-qris="true"></script>';
const QRIS_MANUAL_ENTRY='<script src="./src/compat/rc01-qris-manual-bypass.js" data-sj-rc01-qris-manual="true"></script>';
const BW02_ENTRY='<script src="./src/compat/p0-bw02-bandwidth-hardening.js" data-sj-p0-bw02-bandwidth="true"></script>';
const PRODUCT_CUP_UI_ENTRY='<script src="./src/compat/legacy-cup-01b-product-cup-ui.js" data-sj-legacy-cup-01b-product-ui="true"></script>';
const R9_CLOSING_ENTRY='<script src="./src/compat/r9-closing-reliability.js" data-sj-r9-closing-reliability="true"></script>';
const DASHBOARD_FAST_P1_ENTRY='<script src="./src/compat/emg-d1-p1-dashboard-fast.js" data-sj-emg-d1-p1-dashboard-fast="true"></script>';
const EMG_D1_P1_CONFIG_ENTRY='<script src="./src/compat/emg-d1-p1-config.js" data-sj-emg-d1-p1-config="true"></script>';
const EMG_D1_P1_ENTRY='<script src="./src/compat/emg-d1-p1-emergency.js" data-sj-emg-d1-p1="true"></script>';
const ENTRY='<script type="module" src="./src/ref01-entry.js" data-sj-ref01-entry="true"></script>';
const PWA_HEAD='\n<link rel="manifest" href="./pwa/manifest.webmanifest">\n<link rel="icon" href="./pwa/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="./pwa/icon.svg">\n<meta name="application-name" content="Segeran Jiwa POS">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n';
const PWA_REGISTER='<script src="./pwa/register-pwa.js" defer data-sj-pwa-register="true"></script>';
const NATIVE_BACK_ENTRY='<script src="./pwa/native-back.js" defer data-sj-native-back="true"></script>';

function injectBeforeQrisBeta(legacy){
  const marker=legacy.indexOf(QRIS_BETA_MARKER);if(marker<0)throw new Error('REF01_QRIS_BETA_MARKER_MISSING');
  const scriptStart=legacy.lastIndexOf('<script>',marker);if(scriptStart<0)throw new Error('REF01_QRIS_BETA_SCRIPT_START_MISSING');
  return legacy.slice(0,scriptStart)+S10C_R2_EARLY_ENTRY+'\n'+S10A1_EARLY_ENTRY+'\n'+legacy.slice(scriptStart);
}

function disableAutomaticQrisBridge(legacy){
  if(!legacy.includes(QRIS_BETA_MARKER))throw new Error('QRIS_AUTOMATIC_BRIDGE_MARKER_MISSING');
  return legacy.replace(QRIS_BETA_MARKER,QRIS_MANUAL_ONLY_GUARD);
}

function patchQrisEvaluationConvergence(legacy){
  const originalAll="function evaluateAllSignals(){eligibleSignals().forEach(function(s){setTimeout(function(){evaluateSignal(s)},100)})}";
  const patchedAll="function evaluateAllSignals(){var gate=window.SJRC01S10CR2QrisConvergence;eligibleSignals().forEach(function(s){var id=String(s&&((s._key||s.providerTransactionId)||''));if(gate&&typeof gate.schedule==='function'&&id){gate.schedule(id,function(){return evaluateSignal(s)},100);return}setTimeout(function(){evaluateSignal(s)},100)})}";
  const ambiguous="try{await qrisRef('signals/'+id).transaction(function(cur){if(!cur||cur.matchedTransactionId||String(cur.status)==='CONFIRMED'||!Core.eligibleSignalStatus(cur.status))return;cur.status='AMBIGUOUS';return cur})}catch(e){sjSaveError('QRIS_MATCH_STATE',e)}";
  const ambiguousPatched="if(!(window.SJRC01S10CR2QrisConvergence&&window.SJRC01S10CR2QrisConvergence.shouldSkipSignalState(s,'AMBIGUOUS'))){"+ambiguous+"}";
  const unmatched="try{await qrisRef('signals/'+id).transaction(function(cur){if(!cur||cur.matchedTransactionId||String(cur.status)==='CONFIRMED'||!Core.eligibleSignalStatus(cur.status))return;cur.status='UNMATCHED';return cur})}catch(e){sjSaveError('QRIS_MATCH_STATE',e)}";
  const unmatchedPatched="if(!(window.SJRC01S10CR2QrisConvergence&&window.SJRC01S10CR2QrisConvergence.shouldSkipSignalState(s,'UNMATCHED'))){"+unmatched+"}";
  if(!legacy.includes(originalAll))throw new Error('RC01_S10C_R2_EVALUATE_ALL_ANCHOR_MISSING');
  if(!legacy.includes(ambiguous)||!legacy.includes(unmatched))throw new Error('RC01_S10C_R2_MATCH_STATE_ANCHOR_MISSING');
  return legacy.replace(originalAll,patchedAll).replace(ambiguous,ambiguousPatched).replace(unmatched,unmatchedPatched);
}

function injectR6CNotificationHygiene(legacy){
  const marker=legacy.indexOf(R6C_NOTIFICATION_BOOTSTRAP_MARKER);if(marker<0)throw new Error('RC01_S10C_R6C_NOTIFICATION_BOOTSTRAP_MARKER_MISSING');
  const scriptStart=legacy.lastIndexOf('<script>',marker),scriptEnd=legacy.indexOf('</script>',marker);
  if(scriptStart<0||scriptEnd<0)throw new Error('RC01_S10C_R6C_NOTIFICATION_SCRIPT_BOUNDARY_INVALID');
  return legacy.slice(0,marker)+'</script>\n'+R6C_NOTIFICATION_ENTRY+'\n<script>\n'+legacy.slice(marker);
}

function injectS10CSyncAuthority(legacy){
  const marker=legacy.indexOf(S10C_INSTALL_MARKER);if(marker<0)throw new Error('RC01_S10C_INSTALL_MARKER_MISSING');
  const scriptStart=legacy.lastIndexOf('<script>',marker),scriptEnd=legacy.indexOf('</script>',marker);
  if(scriptStart<0||scriptEnd<0)throw new Error('RC01_S10C_SCRIPT_BOUNDARY_INVALID');
  return legacy.slice(0,marker)+'</script>\n'+S10C_SYNC_ENTRY+'\n<script>\n'+legacy.slice(marker);
}

const PRODUCT_CUP_SELECT_OPTIONS='<option value="">Per produk / tanpa cup</option><option value="c10">Cup 10 Oz</option><option value="c10p">Cup Paper 10 Oz</option><option value="c16">Cup 16 Oz</option><option value="c22p">Cup 22 Oz Datar Polos</option><option value="c22d">Cup 22 Oz Datar</option><option value="c22o">Cup 22 Oz Oval</option>';
function patchLegacyProductCupSelects(legacy){
  let count=0;
  const patched=legacy.replace(/(<select id="(?:new-cp|edit-m-cp)"[^>]*>)[\s\S]*?(<\/select>)/g,(full,start,end)=>{count++;return `${start}\n${PRODUCT_CUP_SELECT_OPTIONS}\n${end}`});
  if(count!==2)throw new Error(`LEGACY_CUP_01B_PRODUCT_SELECT_ANCHOR_DRIFT:${count}`);
  return patched;
}

function replaceOnce(source,original,replacement,code){
  const first=source.indexOf(original);if(first<0)throw new Error(code+'_ANCHOR_MISSING');
  if(source.indexOf(original,first+1)>=0)throw new Error(code+'_ANCHOR_DUPLICATE');
  return source.slice(0,first)+replacement+source.slice(first+original.length);
}
function replaceCount(source,original,replacement,count,code){
  const hits=source.split(original).length-1;if(hits!==count)throw new Error(code+'_ANCHOR_COUNT_'+hits);
  return source.split(original).join(replacement);
}
function replaceBetween(source,startMarker,endMarker,replacement,code){
  const start=source.indexOf(startMarker);if(start<0)throw new Error(code+'_START_MISSING');
  const end=source.indexOf(endMarker,start);if(end<0)throw new Error(code+'_END_MISSING');
  return source.slice(0,start)+replacement+source.slice(end);
}
function patchBw02TransactionPayload(legacy){
  legacy=replaceCount(legacy,
    "cartData:cart.map(i=>({id:i.id,n:i.n,q:sjNum(i.q),p:sjNum(i.p),note:i.note||'',img:i.savedImg||'',cp:i.cp||''}))",
    "cartData:cart.map(i=>({id:i.id,n:i.n,q:sjNum(i.q),p:sjNum(i.p),note:i.note||'',cp:i.cp||''}))",
    2,'P0_BW02_TX_CART_MEDIA');
  legacy=replaceOnce(legacy,
    "cartData:rows.map(function(i){var x={id:i.id,n:i.n,q:n(i.q),p:n(i.p),note:i.note||'',img:i.savedImg||i.img||'',cp:i.cp||''};",
    "cartData:rows.map(function(i){var x={id:i.id,n:i.n,q:n(i.q),p:n(i.p),note:i.note||'',cp:i.cp||''};",
    'P0_BW02_RECIPE_CART_MEDIA');
  legacy=replaceOnce(legacy,
    "var ps=sjGetPrinterSettings();if(ps.auto)setTimeout(()=>sjPrintReceiptObject(tx),250)\n    }catch(e)",
    "var ps=sjGetPrinterSettings();if(ps.auto)setTimeout(()=>sjPrintReceiptObject(tx),250);return txId\n    }catch(e)",
    'P0_BW02_TX_ID_RETURN');
  legacy=replaceOnce(legacy,
    "      }catch(uiErr){\n        sjSaveError('TX_POST_COMMIT_UI',uiErr);cart=[];if(window.SJPrice)SJPrice.resetSession();updateCartUI();showToast('Transaksi '+txId+' sudah tersimpan. Tampilan struk mengalami gangguan kecil.','warning')\n      }\n    }catch(e){",
    "      }catch(uiErr){\n        sjSaveError('TX_POST_COMMIT_UI',uiErr);cart=[];if(window.SJPrice)SJPrice.resetSession();updateCartUI();showToast('Transaksi '+txId+' sudah tersimpan. Tampilan struk mengalami gangguan kecil.','warning')\n      }\n      return txId\n    }catch(e){",
    'P0_BW02_PROCESS_SALE_TX_ID_RETURN');
  return legacy;
}
function patchBw02RecipeSaleIdentity(legacy){
  const start="function patchSale(){window.processTransaction=async function(){var has=(cart||[]).some(function(x){return x.inventoryMode==='RECIPE'});";
  const end="async function recoverVoidTransactions(){";
  const replacement=`function patchSale(){window.processTransaction=async function(){var has=(cart||[]).some(function(x){return x.inventoryMode==='RECIPE'});if(!has)return BASE_PROCESS.apply(this,arguments);var btn=document.querySelector('#modal-bayar .btn-pay[onclick="processTransaction()"]'),snapshot=null,shift='',res=null;sjSetBusy(btn,true,'⏳ MEMPROSES...');try{if(window.SJReliability&&SJReliability.revalidateCart)await SJReliability.revalidateCart();snapshot=cart.map(function(x){return Object.assign({},x)});shift=activeDate;if(!shift)throw Object.assign(new Error('Shift aktif tidak ditemukan.'),{code:'INVENTORY_SHIFT_MISSING'});res=await reserveRecipeConsumption(snapshot);var v=await BASE_PROCESS.apply(this,arguments),txId=String(v||'');if(/^SJ-/.test(txId)){await commitRecipeReservation(res,txId,shift,snapshot);return v}await rollbackRecipeReservation(res,'BW02_EXACT_TX_ID_REQUIRED');return v}catch(e){if(res){try{await rollbackRecipeReservation(res,e&&e.code||e&&e.message||'BW02_EXACT_TX_ID_REQUIRED')}catch(rb){sjSaveError('INVENTORY_RECIPE_ROLLBACK',rb)}}sjSaveError('INVENTORY_RECIPE_SALE',e);alert('❌ '+(e.message||sjFriendlyError(e)));return false}finally{sjSetBusy(btn,false)}};try{processTransaction=window.processTransaction}catch(_){}}
`;
  return replaceBetween(legacy,start,end,replacement,'P0_BW02_RECIPE_SALE');
}
function patchBw02CostingSaleIdentity(legacy){
  const start="function installSaleWrapper(){if(window.__SJ_F03_SALE_WRAPPED)return;";
  const end="Object.assign(V,{quoteCartCosting:";
  const replacement=`function installSaleWrapper(){if(window.__SJ_F03_SALE_WRAPPED)return;var BASE_PROCESS=window.processTransaction;if(typeof BASE_PROCESS!=='function')return;window.__SJ_F03_SALE_WRAPPED=true;window.processTransaction=async function(){if(!Array.isArray(cart)||!cart.length)return BASE_PROCESS.apply(this,arguments);var hasCup=(cart||[]).some(function(x){return String(x&&x.cp||'').trim()!==''});if(hasCup&&window.__SJ_V34_CUP_SALE_READY){try{await window.__SJ_V34_CUP_SALE_READY}catch(_){}}var cartSnapshot=cart.map(function(x){var p=(cloudData.global.menu||[]).find(function(m){return String(m.id)===String(x.baseProductId!=null?x.baseProductId:x.id)}),cp=String(x.cp||(p&&p.cp)||'').trim().toLowerCase(),cup=cp&&typeof window.__SJ_V34_CUP_COST_FOR_CODE==='function'?window.__SJ_V34_CUP_COST_FOR_CODE(cp):null;return Object.assign({},x,{cp:cp,trackStock:String(x.inventoryMode||'').toUpperCase()==='RECIPE'?false:!!(x.trackStock||(p&&p.trackStock)),cupUnitCost:cup&&cup.known?Number(cup.unitCost)||0:0,cupCostKnown:!cp||!!(cup&&cup.known),cupCostSource:cup&&cup.source||null})}),pricingQuote=window.SJPrice?SJPrice.quote(cartSnapshot):{netSubtotal:cartSnapshot.reduce(function(s,x){return s+n(x.p)*n(x.q)},0),total:cartSnapshot.reduce(function(s,x){return s+n(x.p)*n(x.q)},0),lines:[]},reservation=null;try{reservation=await createCostingReservation(cartSnapshot,pricingQuote,{})}catch(e){sjSaveError('COST_PREPARE',e);alert('HPP transaksi belum dapat disiapkan. Periksa koneksi lalu coba lagi.');return false}var result=await BASE_PROCESS.apply(this,arguments);try{var txId=String(result||'');if(/^SJ-/.test(txId))await attachReservationCosting(reservation,txId);else await db.ref(INV+'/costingReservations/'+reservation.id).update({status:'PREPARED',recoveryReason:'BW02_EXACT_TX_ID_REQUIRED',lastRecoveryAt:sjNowIso(),lastRecoveryTs:Date.now()})}catch(e){sjSaveError('COST_ATTACH',e)}return result};try{processTransaction=window.processTransaction}catch(_){}}
`;
  return replaceBetween(legacy,start,end,replacement,'P0_BW02_COST_SALE');
}
function patchBw02RefundRecovery(legacy){
  const start="async function findOriginalTransaction(refund){";
  const end="async function persistRefundCosting(refundId,costing){";
  const replacement=`async function findOriginalTransaction(refund){
  var shift=String(refund&&refund.shift||''),needle=String(refund&&refund.originalTxId||'');if(!shift||!needle)return null;
  var direct=await sjTimeout(db.ref(DB_PATH+'/'+shift+'/tx/'+needle).once('value'),5000,'REFUND_COST_TX_DIRECT_TIMEOUT');if(direct&&direct.exists&&direct.exists())return{key:needle,tx:direct.val()||{},shift:shift};
  var sn=await sjTimeout(db.ref(DB_PATH+'/'+shift+'/tx').orderByChild('id').equalTo(needle).limitToFirst(1).once('value'),6000,'REFUND_COST_TX_ID_TIMEOUT'),rows=sn.val()||{},keys=Object.keys(rows);if(keys.length===1)return{key:keys[0],tx:rows[keys[0]]||{},shift:shift};return null
}
`;
  legacy=replaceBetween(legacy,start,end,replacement,'P0_BW02_REFUND_LOOKUP');
  legacy=replaceOnce(legacy,"limitToLast(80).once('value')","limitToLast(12).once('value')",'P0_BW02_REFUND_RECOVERY_LIMIT');
  legacy=replaceOnce(legacy,"setInterval(function(){try{recoverRefundCosting()}catch(_){}},3000);","window.__SJ_BW02_REFUND_RECOVERY_TIMER_DISABLED=true;",'P0_BW02_REFUND_TIMER');
  return legacy;
}
function patchBw02CostingRecoveryTimer(legacy){
  legacy=replaceOnce(legacy,"limitToLast(60).once('value')","limitToLast(12).once('value')",'P0_BW02_COST_RECOVERY_LIMIT');
  legacy=replaceOnce(legacy,"installSaleWrapper();setInterval(function(){try{installSaleWrapper();recoverCostingReservations()}catch(_){}},2500);","installSaleWrapper();window.__SJ_BW02_COST_RECOVERY_TIMER_DISABLED=true;",'P0_BW02_COST_TIMER');
  return legacy;
}
function patchBw02(legacy){
  legacy=patchBw02TransactionPayload(legacy);
  legacy=patchBw02RecipeSaleIdentity(legacy);
  legacy=patchBw02CostingSaleIdentity(legacy);
  legacy=patchBw02RefundRecovery(legacy);
  legacy=patchBw02CostingRecoveryTimer(legacy);
  return legacy;
}
function patchPu02CupConvergence(legacy){
  legacy=replaceOnce(
    legacy,
    "function sjRenderStockModule(tab){SJ_STOCK_TAB=tab||SJ_STOCK_TAB;",
    "function sjRenderStockModule(tab){/* PU02_CUP_CONVERGENCE */if(tab==='gelas'){showToast('Cup dikelola melalui Buka/Tutup Shift.','info');tab='produk'}if(SJ_STOCK_TAB==='gelas')SJ_STOCK_TAB='produk';SJ_STOCK_TAB=tab||SJ_STOCK_TAB;",
    'PU02_LEGACY_GELAS_REDIRECT'
  );

  const gelasLabel='🥤 GELAS</button>',gelasEnd=legacy.indexOf(gelasLabel);
  if(gelasEnd<0)throw new Error('PU02_LEGACY_GELAS_TAB_ANCHOR_MISSING');
  const gelasStart=legacy.lastIndexOf('<button',gelasEnd);
  if(gelasStart<0)throw new Error('PU02_LEGACY_GELAS_TAB_START_MISSING');
  legacy=legacy.slice(0,gelasStart)+legacy.slice(gelasEnd+gelasLabel.length);

  const refundLedger=legacy.lastIndexOf("type:'REFUND',refId:refid");
  if(refundLedger<0)throw new Error('PU02_REFUND_LEDGER_ANCHOR_MISSING');
  const refundCounters=legacy.lastIndexOf("Object.keys(sdAgg).forEach",refundLedger);
  const refundStock=legacy.indexOf("Object.values(stockAgg).forEach",refundCounters);
  if(refundCounters<0||refundStock<0||refundStock>refundLedger)throw new Error('PU02_REFUND_CUP_CONSUMED_ANCHOR_MISSING');
  const refundCounterReplacement="Object.keys(sdAgg).forEach(id=>u[activeDate+'/sd/'+id+'/q']=sjServerInc(-sdAgg[id]));/* PU02_REFUND_CUP_CONSUMED: refunded Cup tetap dianggap terpakai; CUP-CONTROL-V1 derives physical usage from transaction snapshots. */";
  legacy=legacy.slice(0,refundCounters)+refundCounterReplacement+legacy.slice(refundStock);
  return legacy;
}

function patchPu03DataBandwidthConvergence(legacy){
  /* PU03_DATA_BANDWIDTH_CONVERGENCE:
     Keep Recipe's canonical Inventory live authority, but remove duplicate
     Costing ingredient/purchase subscriptions and high-frequency purchase UI polling. */
  legacy=replaceOnce(
    legacy,
    "window.SJInventoryV2={version:'0.5.0',open:open,recipeForProduct:recipeForProduct,openVariantPicker:openVariantPicker,reserveRecipeConsumption:reserveRecipeConsumption,rollbackRecipeReservation:rollbackRecipeReservation,commitRecipeReservation:commitRecipeReservation,normalizeCommittedRecipeSale:normalizeCommittedRecipeSale,restoreVoidedRecipeTx:restoreVoidedRecipeTx,recoverVoidTransactions:recoverVoidTransactions,renderDashboardTiles:renderDashboardTiles,status:function(){return{started:started,ingredients:Object.keys(ingredients()).length,recipes:Object.keys(recipes()).length}}};",
    "window.SJInventoryV2={version:'0.5.0',open:open,recipeForProduct:recipeForProduct,openVariantPicker:openVariantPicker,reserveRecipeConsumption:reserveRecipeConsumption,rollbackRecipeReservation:rollbackRecipeReservation,commitRecipeReservation:commitRecipeReservation,normalizeCommittedRecipeSale:normalizeCommittedRecipeSale,restoreVoidedRecipeTx:restoreVoidedRecipeTx,recoverVoidTransactions:recoverVoidTransactions,renderDashboardTiles:renderDashboardTiles,sharedSnapshot:function(){return{ingredients:ingredients(),balances:{ingredients:balances()},productWarehouse:obj(data.productWarehouse),recipes:recipes()}},status:function(){return{started:started,ingredients:Object.keys(ingredients()).length,recipes:Object.keys(recipes()).length}}};",
    'PU03_INVENTORY_SHARED_SNAPSHOT'
  );

  legacy=replaceOnce(
    legacy,
    "function allCostChoices(){",
    "function sharedIngredients(){try{var s=window.SJInventoryV2&&SJInventoryV2.sharedSnapshot?SJInventoryV2.sharedSnapshot():null;return obj(s&&s.ingredients)}catch(_){return obj(state.ingredients)}}function allCostChoices(){state.ingredients=sharedIngredients();/* PU03_COSTING_SHARED_INGREDIENTS */",
    'PU03_COSTING_SHARED_INGREDIENTS'
  );

  legacy=replaceOnce(
    legacy,
    "function start(){if(started||!currentLoginId||typeof db==='undefined')return;started=true;listen('costs/ingredients',function(v){state.costs.ingredients=v});listen('costs/products',function(v){state.costs.products=v});listen('ingredients',function(v){state.ingredients=v});listen('purchases',function(v){state.purchases=v});ensureInitialModal();setTimeout(injectInitialButton,700)}",
    "function start(){if(started||!currentLoginId||typeof db==='undefined')return;started=true;listen('costs/ingredients',function(v){state.costs.ingredients=v});listen('costs/products',function(v){state.costs.products=v});state.ingredients=sharedIngredients();/* PU03_COSTING_NO_PURCHASE_LISTENER */ensureInitialModal();setTimeout(injectInitialButton,700)}",
    'PU03_COSTING_LISTENER_DEDUP'
  );

  legacy=replaceOnce(
    legacy,
    "var ing=obj(V.state&&V.state.ingredients);Object.keys(obj(costs.ingredients)).forEach(function(id){costs.ingredients[id]=Object.assign({},costs.ingredients[id],{name:(ing[id]||{}).name||id,unit:(ing[id]||{}).unit||''})});return{costs:costs,recipes:recipes}",
    "var shared=window.SJInventoryV2&&SJInventoryV2.sharedSnapshot?SJInventoryV2.sharedSnapshot():{},ing=obj(shared.ingredients||V.state&&V.state.ingredients);Object.keys(obj(costs.ingredients)).forEach(function(id){costs.ingredients[id]=Object.assign({},costs.ingredients[id],{name:(ing[id]||{}).name||id,unit:(ing[id]||{}).unit||''})});return{costs:costs,recipes:recipes}",
    'PU03_COSTING_SALE_SHARED_INGREDIENTS'
  );

  legacy=replaceOnce(
    legacy,
    "installPurchaseUi();\nsetInterval(function(){try{installPurchaseUi();renderPurchaseCosting()}catch(_){}},1000);",
    "installPurchaseUi();window.__SJ_PU03_PURCHASE_UI_TIMER_1000=true;",
    'PU03_PURCHASE_UI_TIMER_1000'
  );

  legacy=replaceOnce(
    legacy,
    "patchExpenseDelete();setInterval(patchExpenseDelete,2000);",
    "patchExpenseDelete();window.__SJ_PU03_PURCHASE_GUARD_TIMER_2000=true;",
    'PU03_PURCHASE_GUARD_TIMER_2000'
  );

  legacy=replaceOnce(
    legacy,
    "var V=window.SJCostingV1,recoveryBusy=false,lastAttempt={};",
    "var V=window.SJCostingV1,INV=DB_PATH+'/global/inventoryV2',recoveryBusy=false,lastAttempt={};",
    'PU03_PURCHASE_RECOVERY_PATH'
  );

  legacy=replaceOnce(
    legacy,
    "var now=Date.now(),rows=obj(V.state&&V.state.purchases),ids=pendingRecoveryIds(rows,now).filter(function(id){return now-n(lastAttempt[id])>=15000});",
    "var now=Date.now(),sn=await db.ref(INV+'/purchases').orderByChild('createdTs').limitToLast(20).once('value'),rows=obj(sn.val()),ids=pendingRecoveryIds(rows,now).filter(function(id){return now-n(lastAttempt[id])>=15000});",
    'PU03_PURCHASE_RECOVERY_BOUNDED_READ'
  );

  legacy=replaceOnce(
    legacy,
    "setInterval(function(){try{var p=recoverPendingPurchases();if(p&&typeof p.catch==='function')p.catch(function(e){if(typeof sjSaveError==='function')sjSaveError('WP_F03_PURCHASE_RECOVERY_SCAN',e)})}catch(e){if(typeof sjSaveError==='function')sjSaveError('WP_F03_PURCHASE_RECOVERY_SCAN',e)}},5000);",
    "var pu03PriorPurchaseRecovery=SJReliability.afterLoginLifecycle.bind(SJReliability);SJReliability.afterLoginLifecycle=async()=>{await pu03PriorPurchaseRecovery();try{await recoverPendingPurchases()}catch(e){if(typeof sjSaveError==='function')sjSaveError('WP_F03_PURCHASE_RECOVERY_LOGIN',e)}};window.__SJ_PU03_PURCHASE_RECOVERY_TIMER_5000=true;",
    'PU03_PURCHASE_RECOVERY_TIMER_5000'
  );

  legacy=replaceOnce(
    legacy,
    "function rows(){",
    "async function rows(){",
    'PU03_PURCHASE_HISTORY_ASYNC_ROWS'
  );

  legacy=replaceOnce(
    legacy,
    "var p=V.state&&V.state.purchases||{};",
    "var sn=await db.ref(DB_PATH+'/global/inventoryV2/purchases').orderByChild('createdTs').limitToLast(30).once('value'),p=sn.val()||{};",
    'PU03_PURCHASE_HISTORY_BOUNDED_READ'
  );

  legacy=replaceOnce(
    legacy,
    "function renderPurchaseHistory(){",
    "async function renderPurchaseHistory(){",
    'PU03_PURCHASE_HISTORY_ASYNC'
  );

  legacy=replaceOnce(
    legacy,
    "  var list=rows();",
    "  var list=await rows();",
    'PU03_PURCHASE_HISTORY_AWAIT'
  );

  legacy=replaceOnce(
    legacy,
    "setInterval(function(){try{renderPurchaseHistory()}catch(_){}},1200);",
    "window.__SJ_PU03_PURCHASE_HISTORY_TIMER_1200=true;",
    'PU03_PURCHASE_HISTORY_TIMER_1200'
  );

  legacy=replaceOnce(
    legacy,
    "  paintPurchasePreview();",
    "  paintPurchasePreview();if(typeof V.renderPurchaseHistory==='function')setTimeout(function(){Promise.resolve(V.renderPurchaseHistory()).catch(function(e){if(typeof sjSaveError==='function')sjSaveError('PURCHASE_HISTORY_ON_OPEN',e)})},0);",
    'PU03_PURCHASE_HISTORY_ON_OPEN'
  );

  return legacy;
}

function patchR9Lic01Uat7(legacy){
  /* R10_UAT_CLOSE_SHIFT_AUTHORITY: the visible final drawer/shift difference is the close-note authority. */
  legacy=replaceOnce(legacy,
    "if((sessionDiff!==0||shiftDiff!==0)&&!note)throw Object.assign(new Error('Ada selisih kas. Catatan wajib diisi.'),{code:'SHIFT_NOTE_REQUIRED'});",
    "if(shiftDiff!==0&&!note)throw Object.assign(new Error('Ada selisih kas. Catatan wajib diisi.'),{code:'SHIFT_NOTE_REQUIRED'});",
    'R10_UAT_CLOSE_SHIFT_AUTHORITY');
  legacy=replaceOnce(legacy,
    "}catch(e){if(reserved){try{await controlRef.transaction(cur=>{if(cur&&String(cur.currentSessionId||'')===String(sid)&&String(cur.status||'')==='CLOSING')return oldControl;return})}catch(_){}}sjSaveError('SHIFT_SESSION_CLOSE',e);if(e.code==='SHIFT_NOTE_REQUIRED')alert(e.message);else alert(sjFriendlyError(e))}finally{this.busy=false;sjSetBusy(btn,false)}",
    "}catch(e){if(reserved&&e.code!=='UNKNOWN_COMMIT_STATE'){try{await controlRef.transaction(cur=>{if(cur&&String(cur.currentSessionId||'')===String(sid)&&String(cur.status||'')==='CLOSING')return oldControl;return})}catch(_){}}sjSaveError('SHIFT_SESSION_CLOSE',e);if(e.code==='SHIFT_NOTE_REQUIRED')alert(e.message);else if(e.code==='UNKNOWN_COMMIT_STATE')alert('Status penutupan belum dapat dipastikan. Jangan menutup ulang shift sampai status terverifikasi.');else alert(sjFriendlyError(e))}finally{this.busy=false;sjSetBusy(btn,false)}",
    'R9_LIC01_SHIFT_UNKNOWN_COMMIT');
  legacy=replaceOnce(legacy,
    "async function reserveRecipeConsumption(cartSnapshot){var requested=Core.recipeConsumption(cartSnapshot,recipes());",
    "async function reserveRecipeConsumption(cartSnapshot,cupUsage){var requested=Core.recipeConsumption(cartSnapshot,recipes());/* CUP-CONTROL-V1: cupUsage is operational evidence only; never merge into Inventory V2 reservation. */",
    'R9_LIC01_CUP_RESERVATION');
  legacy=replaceOnce(legacy,
    "footer.style.display='none';ov.style.display='flex'",
    "footer.style.setProperty('display','none','important');ov.style.display='flex'",
    'R9_LIC01_RECEIPT_HIDE');
  legacy=replaceOnce(legacy,
    "if(footer)footer.style.display='';try{clsModal('modal-struk-fs')}",
    "if(footer)footer.style.removeProperty('display');try{clsModal('modal-struk-fs')}",
    'R9_LIC01_RECEIPT_RESTORE');
  legacy=replaceOnce(legacy,
    "var cogs=lineKnown?Core.money(unit*qty):0;cogsTotal+=cogs;items.push(Object.assign(base,{costingMode:'RECIPE',recipeVariantId:vid,variantName:String(variant.name||''),unitCost:Core.money(unit),cogs:cogs,costKnown:lineKnown,costSource:'WAC_RECIPE',estimatedRecipeCost:Core.money(unit),recipeCostBreakdown:breakdown,grossProfit:lineKnown?Core.money(netRevenue-cogs):0}))",
    "var cupMapped=String(x.cp||'').trim()!=='',cupKnown=!cupMapped||x.cupCostKnown===true,cupUnit=Math.max(0,n(x.cupUnitCost));if(cupMapped&&!cupKnown){lineKnown=false;missing.push({type:'packaging',id:String(x.cp),name:'Cup '+String(x.cp),reason:'MISSING_CUP_COST'})}if(cupMapped&&cupKnown){unit+=cupUnit;breakdown.push({ingredientId:null,ingredientName:'Kemasan '+String(x.cp),recipeQty:1,unit:'pcs',ingredientWac:cupUnit,componentUnitCost:cupUnit,componentCost:Core.money(cupUnit*qty),costKnown:true,operationalConsumable:true})}var cogs=lineKnown?Core.money(unit*qty):0;cogsTotal+=cogs;items.push(Object.assign(base,{costingMode:'RECIPE',recipeVariantId:vid,variantName:String(variant.name||''),unitCost:Core.money(unit),cogs:cogs,costKnown:lineKnown,costSource:cupMapped?'WAC_RECIPE_PLUS_CUP':'WAC_RECIPE',estimatedRecipeCost:Core.money(unit),packagingCost:cupMapped?Core.money(cupUnit*qty):0,recipeCostBreakdown:breakdown,grossProfit:lineKnown?Core.money(netRevenue-cogs):0}))",
    'CUP_CONTROL_RECIPE_COST');
  legacy=replaceOnce(legacy,
    "var id=String(x.id),rec=obj(costs.products[id]),known=hasCost(rec),w=Math.max(0,n(rec.wac)),cogs=known?Core.stockLineCost(qty,w):0;if(!known)missing.push({type:'product',id:id,name:x.n||id,reason:'MISSING_COST'});cogsTotal+=cogs;items.push(Object.assign(base,{productId:id,costingMode:'STOCK',unitCost:w,cogs:cogs,costKnown:known,costSource:String(rec.source||'WAC'),grossProfit:known?Core.money(netRevenue-cogs):0}))",
    "var id=String(x.id),rec=obj(costs.products[id]),known=hasCost(rec),w=Math.max(0,n(rec.wac)),cupMapped=String(x.cp||'').trim()!=='',cupKnown=!cupMapped||x.cupCostKnown===true,cupUnit=Math.max(0,n(x.cupUnitCost));if(!known)missing.push({type:'product',id:id,name:x.n||id,reason:'MISSING_COST'});if(cupMapped&&!cupKnown){known=false;missing.push({type:'packaging',id:String(x.cp),name:'Cup '+String(x.cp),reason:'MISSING_CUP_COST'})}var unit=w+(cupMapped&&cupKnown?cupUnit:0),cogs=known?Core.stockLineCost(qty,unit):0;cogsTotal+=cogs;items.push(Object.assign(base,{productId:id,costingMode:'STOCK',unitCost:unit,cogs:cogs,costKnown:known,costSource:cupMapped?String(rec.source||'WAC')+'_PLUS_CUP':String(rec.source||'WAC'),packagingCost:cupMapped?Core.money(cupUnit*qty):0,grossProfit:known?Core.money(netRevenue-cogs):0}))",
    'CUP_CONTROL_STOCK_COST');
  return legacy;
}
function sleep(ms){Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms)}
function acquireLock(){
  const deadline=Date.now()+30000;
  while(true){
    try{const fd=openSync(LOCK,'wx');writeFileSync(fd,String(process.pid));closeSync(fd);return}
    catch(error){
      if(error?.code!=='EEXIST')throw error;
      try{if(Date.now()-statSync(LOCK).mtimeMs>120000)unlinkSync(LOCK)}catch(_){}
      if(Date.now()>deadline)throw new Error('REF01_BUILD_LOCK_TIMEOUT');
      sleep(40);
    }
  }
}
function sourceFiles(dir){
  const out=[];
  for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const full=join(dir,entry.name);
    if(entry.isDirectory())out.push(...sourceFiles(full));
    else if(entry.isFile())out.push(full);
  }
  return out;
}
function fingerprint(){
  const hash=createHash('sha256');
  hash.update('REF01-BUILD-V4-R9-LIC01-UAT7\0');
  hash.update(readFileSync(fileURLToPath(import.meta.url)));
  hash.update(readFileSync(BASE));
  for(const file of sourceFiles(SOURCE)){
    hash.update(relative(ROOT,file));hash.update('\0');hash.update(readFileSync(file));hash.update('\0');
  }
  return hash.digest('hex');
}
function outputReady(fp){
  if(!existsSync(join(OUT,'index.html'))||!existsSync(join(OUT,'src','ref01-entry.js'))||!existsSync(STAMP))return false;
  try{return readFileSync(STAMP,'utf8').trim()===fp}catch(_){return false}
}

acquireLock();
let staging=null;
try{
  const fp=fingerprint();
  if(outputReady(fp)){
    const existing=readFileSync(join(OUT,'index.html'));
    console.log(`REF-01 candidate build: dist-ref01/index.html ${createHash('sha256').update(existing).digest('hex')} (cached)`);
  }else{
    staging=join(ROOT,`.dist-ref01-build-${process.pid}-${Date.now()}`);
    rmSync(staging,{recursive:true,force:true});
    mkdirSync(staging,{recursive:true});
    cpSync(SOURCE,join(staging,'src'),{recursive:true});
    cpSync(PWA_SOURCE,join(staging,'pwa'),{recursive:true});
    cpSync(join(PWA_SOURCE,'sw.js'),join(staging,'sw.js'));
    const legacy=readFileSync(BASE,'utf8');
    if((legacy.match(/<\/body>/gi)||[]).length!==1)throw new Error('REF01_BUILD_BODY_ANCHOR_INVALID');
    const converged=patchQrisEvaluationConvergence(legacy);
    const early=injectBeforeQrisBeta(converged);
    const manualOnly=disableAutomaticQrisBridge(early);
    const notificationSafe=injectR6CNotificationHygiene(manualOnly);
    const withSync=injectS10CSyncAuthority(notificationSafe);
    const withProductCup=patchLegacyProductCupSelects(withSync);
    const withBw02=patchBw02(withProductCup);
    const withR9=patchR9Lic01Uat7(withBw02);
    const withPu02=patchPu02CupConvergence(withR9);
    const withPu03=patchPu03DataBandwidthConvergence(withPu02);
    const withPwaHead=withPu03.replace(/<\/head>/i,`${PWA_HEAD}</head>`);
    const candidate=withPwaHead.replace(/<\/body>/i,`${PRODUCT_CUP_UI_ENTRY}\n${R9_CLOSING_ENTRY}\n${DASHBOARD_FAST_P1_ENTRY}\n${R6D_SALES_RECURSION_ENTRY}\n${STOCK_COMPONENT_CONTEXT_ENTRY}\n${CLASSIC_ENTRY}\n${S10A_CLASSIC_ENTRY}\n${QRIS_MANUAL_ENTRY}\n${ENTRY}\n${BW02_ENTRY}\n${EMG_D1_P1_CONFIG_ENTRY}\n${EMG_D1_P1_ENTRY}\n${NATIVE_BACK_ENTRY}\n${PWA_REGISTER}\n</body>`);
    writeFileSync(join(staging,'index.html'),candidate);
    writeFileSync(join(staging,'.ref01-build-fingerprint'),`${fp}\n`);
    rmSync(OUT,{recursive:true,force:true});
    renameSync(staging,OUT);staging=null;
    const sha=createHash('sha256').update(candidate).digest('hex');
    console.log(`REF-01 candidate build: dist-ref01/index.html ${sha}`);
  }
}finally{
  if(staging)rmSync(staging,{recursive:true,force:true});
  try{unlinkSync(LOCK)}catch(_){}
}
