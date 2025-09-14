const VERSION='sv151-masterset-v1';
const APP_SHELL=['./','./index.html','./manifest.json','./icon.png','./style.css','./script.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k))))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const req=e.request;e.respondWith((async()=>{const cache=await caches.open(VERSION);const hit=await cache.match(req);try{const res=await fetch(req);const url=new URL(req.url);if(url.hostname.includes('pokemontcg.io')||url.pathname.endsWith('.png')||url.pathname.endsWith('.json')){cache.put(req,res.clone()).catch(()=>{})}return res;}catch(err){if(hit) return hit; throw err;}})())});
