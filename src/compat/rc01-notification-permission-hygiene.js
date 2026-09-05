(function(g){
'use strict';
if(!g||g.SJRC01S10CR6CNotificationHygiene)return;
var sjx=null;
try{sjx=(typeof SJX!=='undefined')?SJX:g.SJX}catch(_){sjx=g.SJX||null}
var state={installed:false,requestInFlight:null,originalAsk:null,originalOpen:null};
function permission(){var N=g.Notification;return N&&typeof N.permission==='string'?N.permission:'unsupported'}
function userActivated(){return g.navigator?.userActivation?.isActive===true}
function requestPermissionFromGesture(){
  var N=g.Notification;
  if(!userActivated()||!N||N.permission!=='default'||typeof N.requestPermission!=='function')return state.requestInFlight;
  if(state.requestInFlight)return state.requestInFlight;
  try{
    var request=N.requestPermission();
    state.requestInFlight=Promise.resolve(request).catch(function(){return permission()}).finally(function(){state.requestInFlight=null});
    return state.requestInFlight;
  }catch(_){return null}
}
function install(){
  if(state.installed)return true;
  if(!sjx||typeof sjx.openNotifications!=='function')return false;
  state.originalAsk=sjx.askNotification;
  state.originalOpen=sjx.openNotifications;
  sjx.askNotification=function(){return Promise.resolve(permission())};
  sjx.openNotifications=function(){requestPermissionFromGesture();return state.originalOpen.apply(this,arguments)};
  state.installed=true;
  return true;
}
var api={
  version:'RC01-S10C-R6C',
  install:install,
  requestPermissionFromGesture:requestPermissionFromGesture,
  snapshot:function(){return{installed:state.installed,permission:permission(),userActivated:userActivated(),requestInFlight:!!state.requestInFlight}}
};
g.SJRC01S10CR6CNotificationHygiene=api;
install();
})(window);
