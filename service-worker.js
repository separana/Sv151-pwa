// rebuildconst VERSION = 'sv151-pwa-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(APP_SHELL.map(u => new URL(u, self.registration.scope)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// Network-first met cache fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req);
    try {
      const res = await fetch(req);
      // Cache TCG API responses en afbeeldingen
      const url = new URL(req.url);
      if (url.hostname.includes('pokemontcg.io') || url.pathname.endsWith('.png') || url.pathname.endsWith('.json')) {
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      if (cached) return cached;
      throw e;
    }
  })());
});

// Handmatige prefetch (lijst URLs)
self.addEventListener('message', async (event) => {
  const { type, urls } = event.data || {};
  if (type === 'PREFETCH' && Array.isArray(urls)) {
    const cache = await caches.open(VERSION);
    await Promise.all(urls.map(async (u) => {
      try {
        const req = new Request(u, { mode: 'no-cors' });
        const res = await fetch(req);
        if (res) await cache.put(req, res.clone());
      } catch (e) { /* negeren */ }
    }));
    event.ports[0]?.postMessage({ ok: true });
  }
});
