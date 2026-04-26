const CACHE = 'finbot-v6';

// Cache only local files - never external URLs
const LOCAL_FILES = [
  '/finbot/',
  '/finbot/index.html',
  '/finbot/manifest.json',
  '/finbot/icons/icon-192.png',
  '/finbot/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(LOCAL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Handle navigation requests for PWA scope
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/finbot/index.html')
        .then(cached => cached || fetch(e.request))
    );
    return;
  }
  
  // Only handle same-origin requests within finbot scope
  if (!e.request.url.includes('/finbot/')) return;
  
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/finbot/index.html'))
      )
  );
});
