/* RC01-S10C-R2 QRIS Evaluation Convergence.
   Runtime-only scheduler/state guard. No Firebase writer authority. */
(function(g){
'use strict';
if(g.SJRC01S10CR2QrisConvergence)return;
var VERSION='RC01-S10C-R2';
var rows=Object.create(null);
function text(v){return String(v==null?'':v).trim()}
function validProviderId(v){return /^[A-Za-z0-9_-]{1,180}$/.test(text(v))}
function later(fn,ms){return g.setTimeout(fn,Math.max(0,Number(ms)||0))}
function arm(row,delay){
  if(row.timer||row.inFlight)return false;
  row.delay=Math.max(0,Number(delay)||0);
  row.timer=later(function(){row.timer=null;run(row)},row.delay);
  return true;
}
function run(row){
  if(!row||row.inFlight)return;
  var fn=row.fn;row.inFlight=true;row.dirty=false;
  Promise.resolve().then(function(){return fn()}).catch(function(error){
    try{if(g.console&&typeof g.console.error==='function')g.console.error('RC01_S10C_R2_EVALUATION',error)}catch(_){}
  }).then(function(){
    row.inFlight=false;
    if(row.dirty){arm(row,row.delay);return}
    delete rows[row.id];
  });
}
function schedule(providerId,fn,delay){
  var id=text(providerId);if(!validProviderId(id)||typeof fn!=='function')return false;
  var row=rows[id];
  if(!row)row=rows[id]={id:id,fn:fn,delay:Math.max(0,Number(delay)||0),timer:null,inFlight:false,dirty:false};
  else row.fn=fn;
  if(row.timer||row.inFlight){row.dirty=true;return false}
  row.dirty=false;return arm(row,delay);
}
function shouldSkipSignalState(signal,targetStatus){
  var target=text(targetStatus).toUpperCase();
  if(target!=='UNMATCHED'&&target!=='AMBIGUOUS')return false;
  if(!signal||text(signal.status).toUpperCase()!==target)return false;
  if(text(signal.matchedTransactionId)||text(signal.confirmedAt))return false;
  return true;
}
function snapshot(){return Object.keys(rows).map(function(id){var row=rows[id];return{id:id,pending:!!row.timer,inFlight:!!row.inFlight,dirty:!!row.dirty}})}
g.SJRC01S10CR2QrisConvergence=Object.freeze({version:VERSION,schedule:schedule,shouldSkipSignalState:shouldSkipSignalState,snapshot:snapshot});
})(typeof globalThis!=='undefined'?globalThis:window);
