// Cache-first con cache en ejecucion. El index.html registra y precarga los assets del dispositivo
// (movil o escritorio); aqui se cachea ademas todo lo que se pida del mismo origen.
// Para publicar una version nueva, cambia VERSION (y la misma cadena en index.html).
const VERSION = 'coprusa-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res.ok && res.status === 200) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      if (e.request.mode === 'navigate') { const page = await cache.match('./index.html'); if (page) return page; }
      return new Response('Sin conexion', { status: 503 });
    }
  })());
});
