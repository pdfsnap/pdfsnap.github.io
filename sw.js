// PDFSnap Service Worker v14 — network-first, so new uploads show up straight away.
// Offline still works: if the network fails, the last saved copy is used.
const CACHE_NAME = 'pdfsnap-v25';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/favicon.svg',
  '/blog.html',
  '/about.html',
  '/contact.html',
  '/privacy-policy.html',
  '/terms.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // ads, analytics, CDN libraries: not ours to cache
  if (url.pathname === '/sw.js') return;                       // always let the browser check for a new worker

  var accept = req.headers.get('accept') || '';
  var fresh = req.mode === 'navigate' || accept.includes('text/html') ||
              /\.(js|json|xml|txt|css)$/.test(url.pathname);

  if (fresh) {
    // network first, saved copy only if offline
    event.respondWith(
      fetch(req).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          if (cached) return cached;
          if (accept.includes('text/html')) return caches.match('/index.html');
          return new Response('Offline', { status: 503 });
        });
      })
    );
  } else {
    // images, icons, fonts: saved copy first, refreshed in the background
    event.respondWith(
      caches.match(req).then(function(cached) {
        var network = fetch(req).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
          }
          return response;
        }).catch(function() { return cached || new Response('Offline', { status: 503 }); });
        return cached || network;
      })
    );
  }
});
