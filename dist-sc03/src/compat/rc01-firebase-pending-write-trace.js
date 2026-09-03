/* RC01-S10B Firebase Pending-Write Traceability.
   Observational only: records active RTDB writes in memory and local diagnostics.
   It never creates Firebase writes and never changes write outcomes. */
(function(){
'use strict';
if(window.SJRC01S10BPendingWriteTrace)return;
var VERSION='RC01-S10B';
var STUCK_MS=15000;
var MAX_PATH=240;
var active=Object.create(null),seq=0,installed=false,diagPatched=false,pollTimer=null;
function now(){return Date.now()}
function safeText(v){return String(v==null?'':v)}
function esc(v){return safeText(v).replace(/[&<>"']/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]})}
function refPath(ref){
  try{
    var raw=decodeURIComponent(safeText(ref&&ref.toString?ref.toString():''));
    raw=raw.replace(/[?#].*$/,'').replace(/^https?:\/\/[^/]+/i,'');
    if(!raw.startsWith('/'))raw='/'+raw;
    return raw.length>MAX_PATH?raw.slice(0,MAX_PATH-1)+'…':raw;
  }catch(_){return'/unknown'}
}
function begin(method,ref){
  var id='w'+(++seq),ts=now();
  active[id]={id:id,method:safeText(method).toLowerCase(),path:refPath(ref),startedAt:new Date(ts).toISOString(),startedTs:ts,warned:false};
  return id;
}
function finish(id){delete active[id]}
function rows(at){
  at=Number(at)||now();
  return Object.keys(active).map(function(id){var row=active[id];
    var age=Math.max(0,at-row.startedTs);
    return{id:row.id,method:row.method,path:row.path,startedAt:row.startedAt,startedTs:row.startedTs,ageMs:age,stuck:age>=STUCK_MS};
  }).sort(function(a,b){return a.startedTs-b.startedTs});
}
function p3(){try{return window.SJProductionArchitectureP3||null}catch(_){return null}}
function snapshot(at){
  var r=rows(at),state=p3(),pending=Number(state&&state.pendingWrites)||0;
  return{version:VERSION,pendingWrites:pending,tracedActive:r.length,untraced:Math.max(0,pending-r.length),serverConnected:!!(state&&state.serverConnected),rows:r};
}
function stuckError(row,age){var e=new Error(row.method+' '+row.path+' • '+Math.round(age/1000)+'s');e.code='SYNC_WRITE_STUCK';return e}
function scanStuck(at){
  at=Number(at)||now();var out=[];
  Object.keys(active).forEach(function(id){var row=active[id];
    var age=Math.max(0,at-row.startedTs);if(age<STUCK_MS)return;
    out.push({id:row.id,method:row.method,path:row.path,ageMs:age});
    if(row.warned)return;row.warned=true;
    try{if(typeof sjSaveError==='function')sjSaveError('SYNC_WRITE_STUCK',stuckError(row,age))}catch(_){}
  });
  return out;
}
function wrapWrites(){
  if(installed)return true;
  try{
    if(typeof db==='undefined'||!db||typeof db.ref!=='function')return false;
    var proto=Object.getPrototypeOf(db.ref('/'));if(!proto)return false;
    ['set','update','remove','transaction'].forEach(function(method){
      var base=proto[method];if(typeof base!=='function'||base.__sjS10B)return;
      function traced(){
        var id=begin(method,this),result;
        try{result=base.apply(this,arguments)}catch(error){finish(id);throw error}
        if(result&&typeof result.then==='function')return result.then(function(value){finish(id);return value},function(error){finish(id);throw error});
        finish(id);return result;
      }
      traced.__sjS10B=true;traced.__sjS10BBase=base;proto[method]=traced;
    });
    installed=true;return true;
  }catch(_){return false}
}
function renderDiagnostics(){
  try{
    if(typeof document==='undefined'||!document)return false;
    var root=document.getElementById('sj-error-list');if(!root||!root.parentNode)return false;
    var box=document.getElementById('sj-s10b-sync-trace');
    if(!box){box=document.createElement('div');box.id='sj-s10b-sync-trace';box.style.marginTop='16px';root.parentNode.insertBefore(box,root)}
    var s=snapshot(),status=s.pendingWrites?'#b42318':'#08783f';
    var summary='<div style="font-size:11px;font-weight:800;margin-bottom:7px;color:'+status+'">FIREBASE WRITE TRACE</div>'+
      '<div class="sj-note">P3 Pending <b>'+s.pendingWrites+'</b> • Traced <b>'+s.tracedActive+'</b> • Untraced <b>'+s.untraced+'</b> • '+(s.serverConnected?'server connected':'server disconnected')+'</div>';
    var detail=s.rows.length?s.rows.map(function(row){return '<div class="sj-diag-error"><b>'+esc(row.method.toUpperCase())+'</b> • '+Math.round(row.ageMs/1000)+'s'+(row.stuck?' • STUCK':'')+'<br>'+esc(row.path)+'<br><span>'+esc(row.startedAt)+'</span></div>'}).join(''):'<div class="sj-note">Tidak ada Firebase write aktif yang terlacak.</div>';
    box.innerHTML=summary+detail;return true;
  }catch(_){return false}
}
function patchDiagnostics(){
  if(diagPatched)return true;
  try{
    var base=window.sjRenderDiagnostics;if(typeof base!=='function')return false;
    function wrappedDiagnostics(){var value=base.apply(this,arguments);renderDiagnostics();return value}
    wrappedDiagnostics.__sjS10B=true;wrappedDiagnostics.__sjS10BBase=base;window.sjRenderDiagnostics=wrappedDiagnostics;diagPatched=true;return true;
  }catch(_){return false}
}
function poll(){scanStuck();try{if(typeof document!=='undefined'&&document.getElementById('sj-s10b-sync-trace'))renderDiagnostics()}catch(_){}}
function install(){wrapWrites();patchDiagnostics();if(!pollTimer&&typeof setInterval==='function')pollTimer=setInterval(poll,1000);return installed}
window.SJRC01S10BPendingWriteTrace=Object.freeze({version:VERSION,activeWrites:rows,snapshot:snapshot,scanStuck:scanStuck,renderDiagnostics:renderDiagnostics,retryInstall:install});
install();
})();
