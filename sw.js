/* Jamm — service worker (офлайн-кэш PWA).
   ВАЖНО: при публикации новой версии поднять VERSION здесь И APP_VERSION в index.html —
   имя кэша с версией, иначе телефон останется на старой. */
const VERSION = '0.0.2';
const CACHE = 'jamm-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192-jamm.png',
  './icons/icon-512-jamm.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // сам HTML — network-first: после публикации новой версии телефон получает обновление
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/index.html')){
    e.respondWith(
      fetch(e.request)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // иконки и манифест — cache-first (меняются только вместе с версией)
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp));
      return r;
    }))
  );
});
