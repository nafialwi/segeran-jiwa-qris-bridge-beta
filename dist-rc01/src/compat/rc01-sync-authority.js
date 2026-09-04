/* RC01-S10C Sync Authority Consolidation & Startup Write Hygiene.
   Runtime-only write registry. Safe default is CRITICAL. Diagnostics never persist to Firebase. */
(function(g){
'use strict';
if(g.SJRC01S10CSyncAuthority)return;

var VERSION='RC01-S10C';
var ROOT='toko_segeranjiwa_v58';
var STUCK_MS=15000;
var nextId=1;
var active=new Map();
var wrappedProto=null;
var wrappedMethods={};
var migrations={};
var diagnosticsPatched=false;
var p3Bridged=false;
var timer=null;

function text(v){return String(v==null?'':v).trim()}
function now(){return Date.now()}
function plainObject(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function pathOf(ref){
  try{
    var raw=decodeURIComponent(text(ref&&ref.toString?ref.toString():''));
    raw=raw.split(/[?#]/)[0];
    var scheme=raw.indexOf('://');
    if(scheme>=0){var slash=raw.indexOf('/',scheme+3);raw=slash>=0?raw.slice(slash+1):''}
    return raw.replace(/^\/+|\/+$/g,'');
  }catch(_){return''}
}
function isNotificationAckPath(path){
  var p=text(path).replace(/^\/+|\/+$/g,'');
  var prefix=ROOT+'/global/notifications/';
  if(!p.startsWith(prefix))return false;
  var rest=p.slice(prefix.length).split('/');
  return rest.length===3&&!!rest[0]&&rest[1]==='readBy'&&!!rest[2];
}
function isNotificationAckMulti(path,payload){
  if(text(path).replace(/^\/+|\/+$/g,'')!==ROOT||!plainObject(payload))return false;
  var keys=Object.keys(payload);if(!keys.length)return false;
  return keys.every(function(k){return isNotificationAckPath(ROOT+'/'+text(k))&&payload[k]===true});
}
function isDeviceHeartbeat(path,payload){
  var p=text(path).replace(/^\/+|\/+$/g,'');
  var prefix=ROOT+'/global/deviceSessions/';
  if(!p.startsWith(prefix)||p.slice(prefix.length).indexOf('/')>=0||!plainObject(payload))return false;
  var keys=Object.keys(payload);if(!keys.length)return false;
  var allowed={online:1,lastSeenAt:1,lastSeenTs:1,shift:1,sessionId:1,build:1,authUid:1};
  if(!keys.every(function(k){return !!allowed[k]}))return false;
  if(!keys.includes('lastSeenTs'))return false;
  return keys.includes('lastSeenAt')||keys.includes('online');
}
function classify(method,path,payload){
  method=text(method).toLowerCase();path=text(path).replace(/^\/+|\/+$/g,'');
  if(method==='set'&&payload===true&&isNotificationAckPath(path))return{classification:'ADVISORY',reason:'NOTIFICATION_READ_ACK'};
  if(method==='update'&&isNotificationAckMulti(path,payload))return{classification:'ADVISORY',reason:'NOTIFICATION_READ_ACK_BATCH'};
  if(method==='update'&&isDeviceHeartbeat(path,payload))return{classification:'ADVISORY',reason:'DEVICE_PRESENCE_HEARTBEAT'};
  return{classification:'CRITICAL',reason:'DEFAULT_CRITICAL'};
}
function counts(){
  var critical=0,advisory=0;
  active.forEach(function(row){if(row.classification==='ADVISORY')advisory++;else critical++});
  return{criticalPending:critical,advisoryPending:advisory,tracedActive:critical+advisory};
}
function snapshot(at){
  var t=Number.isFinite(Number(at))?Number(at):now(),c=counts();
  return{version:VERSION,criticalPending:c.criticalPending,advisoryPending:c.advisoryPending,tracedActive:c.tracedActive,serverConnected:g.SJProductionArchitectureP3?g.SJProductionArchitectureP3.serverConnected!==false:null,active:Array.from(active.values()).map(function(row){return{id:row.id,method:row.method,path:row.path,startedAt:row.startedAt,ageMs:Math.max(0,t-row.startedAt),classification:row.classification,state:row.state,reason:row.reason,stuck:Math.max(0,t-row.startedAt)>=STUCK_MS}})};
}
function refresh(){
  try{if(g.SJProductionArchitectureP3&&typeof g.SJProductionArchitectureP3.updateSyncUI==='function')g.SJProductionArchitectureP3.updateSyncUI()}catch(_){}
  try{renderDiagnostics()}catch(_){}
}
function begin(method,ref,args){
  var path=pathOf(ref),payload=args&&args.length?args[0]:undefined,rule=classify(method,path,payload),id='S10C-'+(nextId++),row={id:id,method:method,path:path,startedAt:now(),classification:rule.classification,state:'PENDING',reason:rule.reason,stuckLogged:false};
  Map.prototype.set.call(active,id,row);refresh();return row;
}
function finish(row){if(row&&active.delete(row.id))refresh()}
function wrapResult(row,result){
  if(result&&typeof result.then==='function')return result.then(function(v){finish(row);return v},function(e){finish(row);throw e});
  finish(row);return result;
}
function wrapWrites(){
  try{
    if(!g.firebase||typeof g.firebase.database!=='function')return false;
    var database=g.firebase.database();if(!database||typeof database.ref!=='function')return false;
    var proto=Object.getPrototypeOf(database.ref(ROOT));if(!proto)return false;wrappedProto=proto;
    ['set','update','remove','transaction'].forEach(function(method){
      var current=proto[method];if(typeof current!=='function')return;
      if(current.__sjS10C===true){wrappedMethods[method]=true;return}
      if(wrappedMethods[method]===true&&(current.__sjp3===true||current.__sjS10A1===true))return;
      function wrapped(){var row=begin(method,this,arguments),result;try{result=current.apply(this,arguments)}catch(e){finish(row);throw e}return wrapResult(row,result)}
      wrapped.__sjS10C=true;wrapped.__sjS10CBase=current;proto[method]=wrapped;wrappedMethods[method]=true;
    });
    return true;
  }catch(_){return false}
}
function patchSchemaTarget(key,target){
  if(!target||typeof target.schemaMeta!=='function'||target.schemaMeta.__sjS10CStartupNoop)return false;
  var original=target.schemaMeta.bind(target);migrations[key]={target:target,original:original};
  async function startupNoop(){return{skipped:true,reason:'S10C_STARTUP_SCHEMA_WRITE_DISABLED',migrationKey:key}}
  startupNoop.__sjS10CStartupNoop=true;startupNoop.__sjS10COriginal=original;target.schemaMeta=startupNoop;return true;
}
function patchStartupSchemaWrites(){
  patchSchemaTarget('5940',g.SJMobileUX);
  patchSchemaTarget('5941',g.SJMobileProfessionalP1);
  patchSchemaTarget('5942',g.SJOwnerProfessionalP2);
  patchSchemaTarget('P3',g.SJProductionArchitectureP3);
  return Object.keys(migrations).length;
}
async function runExplicitSchemaMigration(key){
  key=text(key).toUpperCase();var row=migrations[key];
  if(!row)throw new Error('S10C_SCHEMA_MIGRATION_NOT_AVAILABLE '+key);
  return row.original();
}
function bridgeP3(){
  var p3=g.SJProductionArchitectureP3;if(!p3)return false;
  if(!p3.__sjS10CPendingBridge){
    var legacyPending=Number(p3.pendingWrites)||0;
    try{Object.defineProperty(p3,'pendingWrites',{configurable:true,enumerable:true,get:function(){return counts().criticalPending},set:function(v){legacyPending=Number(v)||0}})}catch(_){return false}
    Object.defineProperty(p3,'legacyPendingWrites',{configurable:true,enumerable:false,get:function(){return legacyPending}});
    p3.__sjS10CPendingBridge=true;
  }
  p3Bridged=true;return true;
}
function esc(v){return text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function renderDiagnostics(){
  if(!g.document||typeof g.document.getElementById!=='function')return false;
  var root=g.document.getElementById('sj-error-list');if(!root)return false;
  var panel=g.document.getElementById('sj-s10c-sync-diagnostics');
  if(!panel){
    if(typeof g.document.createElement!=='function'||!root.parentNode)return false;
    panel=g.document.createElement('div');panel.id='sj-s10c-sync-diagnostics';
    if(root.parentNode.insertBefore)root.parentNode.insertBefore(panel,root);
    else return false;
  }
  var s=snapshot(),server=s.serverConnected===null?'UNKNOWN':s.serverConnected?'CONNECTED':'DISCONNECTED';
  var rows=s.active.length?s.active.map(function(r){return '<div style="padding:6px 0;border-top:1px solid #edf1ee"><b>'+esc(r.classification)+(r.stuck?' • STUCK':'')+'</b><br><code>'+esc(r.method.toUpperCase())+' '+esc(r.path)+'</code><br><small>'+Math.round(r.ageMs/1000)+'s • '+esc(r.reason)+'</small></div>'}).join(''):'<div style="padding:6px 0">Tidak ada write aktif.</div>';
  panel.innerHTML='<div style="margin:10px 0;padding:10px;border:1px solid #dfe8e2;border-radius:10px;background:#fff"><b>FIREBASE WRITE AUTHORITY · S10C</b><div style="margin-top:6px">Critical Pending <b>'+s.criticalPending+'</b> • Advisory Pending <b>'+s.advisoryPending+'</b> • Active <b>'+s.tracedActive+'</b> • Server <b>'+server+'</b></div>'+rows+'</div>';
  return true;
}
function patchDiagnostics(){
  if(diagnosticsPatched)return true;
  var base=g.sjRenderDiagnostics;if(typeof base!=='function')return false;
  function wrapped(){var r=base.apply(this,arguments);try{renderDiagnostics()}catch(_){}return r}
  wrapped.__sjS10C=true;wrapped.__sjS10CBase=base;g.sjRenderDiagnostics=wrapped;diagnosticsPatched=true;return true;
}
function scanStuck(at){
  var t=Number.isFinite(Number(at))?Number(at):now();
  active.forEach(function(row){
    var age=Math.max(0,t-row.startedAt);if(age<STUCK_MS||row.stuckLogged)return;row.stuckLogged=true;
    try{if(typeof g.sjSaveError==='function'){var e=new Error(row.method.toUpperCase()+' '+row.path+' pending '+age+'ms ['+row.classification+']');e.code='SYNC_WRITE_STUCK';g.sjSaveError('SYNC_WRITE_STUCK',e)}}catch(_){}
  });
  refresh();return snapshot(t);
}
function retryInstall(){wrapWrites();patchStartupSchemaWrites();bridgeP3();patchDiagnostics();return{writes:!!wrappedProto,schema:Object.keys(migrations).length,p3:p3Bridged,diagnostics:diagnosticsPatched}}

var api={version:VERSION,classify:classify,snapshot:snapshot,scanStuck:scanStuck,retryInstall:retryInstall,runExplicitSchemaMigration:runExplicitSchemaMigration,renderDiagnostics:renderDiagnostics,criticalPending:function(){return counts().criticalPending},advisoryPending:function(){return counts().advisoryPending}};
g.SJRC01S10CSyncAuthority=Object.freeze(api);
retryInstall();
timer=g.setInterval?g.setInterval(function(){retryInstall();scanStuck()},1000):null;
})(typeof globalThis!=='undefined'?globalThis:window);
