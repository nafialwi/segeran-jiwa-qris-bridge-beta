(function(g){
'use strict';
if(g.SJP0BW02BandwidthHardening)return;
var refundRef=null,loginKey='',installing=false;
function text(v){return String(v==null?'':v).trim()}
function save(code,error){try{if(typeof g.sjSaveError==='function')g.sjSaveError(code,error)}catch(_){}}
async function recoverNewRefund(snapshot){
  try{
    var V=g.SJCostingV1,row=snapshot&&snapshot.val?snapshot.val():null,id=text(snapshot&&snapshot.key);
    if(!id||!row||!V||typeof V._recoverOneRefundCosting!=='function')return false;
    if(row.costing&&typeof row.costing==='object')return true;
    return await V._recoverOneRefundCosting(id,row);
  }catch(error){save('P0_BW02_REFUND_EVENT_RECOVERY',error);return false}
}
function stopRefundListener(){
  if(refundRef){try{refundRef.off('child_added',recoverNewRefund)}catch(_){}}
  refundRef=null;
}
function startRefundListener(){
  if(refundRef||g.currentUserRole!=='manajemen'||!g.db||!g.DB_PATH)return false;
  try{
    var since=Date.now()-120000;
    refundRef=g.db.ref(g.DB_PATH+'/global/refunds').orderByChild('ts').startAt(since).limitToLast(5);
    refundRef.on('child_added',recoverNewRefund,function(error){save('P0_BW02_REFUND_EVENT_LISTENER',error)});
    return true;
  }catch(error){save('P0_BW02_REFUND_EVENT_INSTALL',error);return false}
}
async function runLoginRecovery(){
  var id=text(g.currentLoginId),role=text(g.currentUserRole);if(!id)return false;
  var key=id+'|'+role;if(loginKey===key)return true;
  var V=g.SJCostingV1;if(!V)return false;loginKey=key;
  if(typeof V.recoverCostingReservations==='function')try{await V.recoverCostingReservations()}catch(error){save('P0_BW02_COSTING_LOGIN_RECOVERY',error)}
  if(role==='manajemen'&&typeof V.recoverRefundCosting==='function')try{await V.recoverRefundCosting()}catch(error){save('P0_BW02_REFUND_LOGIN_RECOVERY',error)}
  startRefundListener();return true;
}
function install(){
  if(installing)return;installing=true;
  try{
    var R=g.SJReliability;
    if(R&&typeof R.afterLoginLifecycle==='function'&&!R.__sjP0Bw02LoginRecovery){
      var base=R.afterLoginLifecycle.bind(R);
      R.afterLoginLifecycle=async function(){var value=await base();await runLoginRecovery();return value};
      try{Object.defineProperty(R,'__sjP0Bw02LoginRecovery',{value:true,enumerable:false})}catch(_){R.__sjP0Bw02LoginRecovery=true}
    }
    if(g.currentLoginId)Promise.resolve().then(runLoginRecovery);
    if(g.addEventListener)g.addEventListener('online',function(){if(g.currentLoginId)Promise.resolve().then(runLoginRecovery)},{passive:true});
  }finally{installing=false}
}
g.SJP0BW02BandwidthHardening=Object.freeze({version:'P0-BW02.1',install:install,runLoginRecovery:runLoginRecovery,startRefundListener:startRefundListener,stopRefundListener:stopRefundListener,recoverNewRefund:recoverNewRefund});
install();
})(window);
