(function(){
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(function(err){
      console.warn('[Segeran Jiwa PWA] service worker gagal didaftarkan',err);
    });
  });
})();
