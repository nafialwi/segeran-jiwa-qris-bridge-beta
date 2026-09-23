const VERSION='sj-pwa-shell-v1';

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil(self.clients.claim());
});

// Intentionally no fetch cache layer.
// Legacy POS data authority remains network/Firebase controlled;
// this worker exists only for installability and app-shell lifecycle.
