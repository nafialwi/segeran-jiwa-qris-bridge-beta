(function(){
  'use strict';
  var bound=false;
  function bind(){
    if(bound)return true;
    var app=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
    if(!app||typeof app.addListener!=='function')return false;
    bound=true;
    app.addListener('backButton',function(){
      try{
        var rel=window.SJReliability;
        if(rel&&typeof rel.handleBack==='function'&&rel.handleBack())return;
      }catch(err){
        console.error('[SJ-NATIVE-BACK]',err);
        return;
      }
      if(typeof app.exitApp==='function')app.exitApp();
    });
    return true;
  }
  if(!bind()){
    window.addEventListener('load',bind,{once:true});
    document.addEventListener('deviceready',bind,{once:true});
  }
  window.SJNativeBackBridge={bind:bind,isBound:function(){return bound}};
})();
