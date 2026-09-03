/* RC01-S10A.1 QRIS Late Event & Sync Convergence shield.
   Loaded before the frozen legacy QRIS Beta. QRIS events are notification-only:
   payment authority stays in pending/signals and existing POS writers. */
(function(){
'use strict';
if(window.SJRC01S10A1QrisEventShield)return;
var VERSION='RC01-S10A.1';
var QRIS_ROOT='segeranjiwa_qris_beta_v1';
var EVENT_SUFFIX_RE=/^([A-Za-z0-9_-]{1,180})__(RECEIVED|UNMATCHED|AMBIGUOUS|MATCHED|CONFIRMED|DISMISSED)$/;
var UNMATCHED_TOAST_RE=/^QRIS\s+Rp\s?([\d.]+)\s+masuk dan belum cocok dengan transaksi pending\.?$/i;
var LATE={LATE_AFTER_CANCEL:1,LATE_OR_NEW_AMBIGUOUS:1};
var TOAST_WINDOW_MS=8000;
var blocked={},eventChannel='ACTIVE',transactionPatched=false,toastPatched=false;
var baseTransaction=null,baseShowToast=null;
function text(v){return String(v==null?'':v).trim()}
function amount(v){v=Number(v);return Number.isFinite(v)?v:0}
function now(){return Date.now()}
function isPermissionDenied(error){return /permission[_ -]?denied/i.test(String(error&&((error.code||'')+' '+(error.message||''))||error||''))}
function isLateReview(row){return !!(row&&LATE[text(row.status)]&&text(row.resolutionState)==='REVIEW_REQUIRED'&&row.autoMatchBlocked===true)}
function syntheticTransaction(){return{committed:false,snapshot:{exists:function(){return false},val:function(){return null}}}}
function markBlocked(providerId,value){providerId=text(providerId);if(!/^[A-Za-z0-9_-]{1,180}$/.test(providerId))return false;blocked[providerId]={amount:amount(value),at:now()};return true}
function isBlocked(providerId){return !!blocked[text(providerId)]}
function providerFromEventRef(ref){
  try{
    var url=decodeURIComponent(String(ref&&ref.toString?ref.toString():''));
    var marker='/'+QRIS_ROOT+'/events/',idx=url.indexOf(marker);if(idx<0)return'';
    var eventId=url.slice(idx+marker.length).split(/[?#]/)[0],match=eventId.match(EVENT_SUFFIX_RE);return match?match[1]:'';
  }catch(_){return''}
}
async function durableLate(providerId){
  if(isBlocked(providerId))return true;
  try{
    if(typeof db==='undefined'||!db||typeof db.ref!=='function')return false;
    var snap=await db.ref(QRIS_ROOT+'/signals/'+providerId).once('value'),row=snap&&snap.val?snap.val():null;
    if(isLateReview(row)){markBlocked(providerId,row.amount);return true}
  }catch(_){}
  return false;
}
function patchEventTransactions(){
  if(transactionPatched)return true;
  try{
    if(typeof db==='undefined'||!db||typeof db.ref!=='function')return false;
    var proto=Object.getPrototypeOf(db.ref(QRIS_ROOT));if(!proto||typeof proto.transaction!=='function')return false;
    if(proto.transaction.__sjS10A1){transactionPatched=true;return true}
    baseTransaction=proto.transaction;
    function wrappedTransaction(){
      var providerId=providerFromEventRef(this);if(!providerId)return baseTransaction.apply(this,arguments);
      var ref=this,args=arguments;
      return Promise.resolve().then(async function(){
        if(eventChannel==='DENIED_DEGRADED'||await durableLate(providerId))return syntheticTransaction();
        try{return await baseTransaction.apply(ref,args)}
        catch(error){if(isPermissionDenied(error)){eventChannel='DENIED_DEGRADED';return syntheticTransaction()}throw error}
      });
    }
    wrappedTransaction.__sjS10A1=true;wrappedTransaction.__sjS10A1Base=baseTransaction;proto.transaction=wrappedTransaction;transactionPatched=true;return true;
  }catch(_){return false}
}
function shouldSuppressUnmatchedToast(message){
  var match=text(message).match(UNMATCHED_TOAST_RE);if(!match)return false;
  var wanted=amount(String(match[1]||'').replace(/\./g,'')),t=now(),keys=Object.keys(blocked);
  for(var i=0;i<keys.length;i++){var row=blocked[keys[i]];if(t-row.at>TOAST_WINDOW_MS){delete blocked[keys[i]];continue}if(row.amount===wanted)return true}
  return false;
}
function patchToast(){
  if(toastPatched)return true;
  try{
    if(typeof showToast!=='function')return false;baseShowToast=showToast;
    var wrapped=function(message,type){if(shouldSuppressUnmatchedToast(message))return false;return baseShowToast.apply(this,arguments)};
    wrapped.__sjS10A1=true;wrapped.__sjS10A1Base=baseShowToast;showToast=wrapped;try{window.showToast=wrapped}catch(_){}toastPatched=true;return true;
  }catch(_){return false}
}
function install(){patchEventTransactions();patchToast();return transactionPatched&&toastPatched}
window.SJRC01S10A1QrisEventShield=Object.freeze({version:VERSION,markBlocked:markBlocked,isBlocked:isBlocked,eventChannelState:function(){return eventChannel},retryInstall:install});
install();
})();
