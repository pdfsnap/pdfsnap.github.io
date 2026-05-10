// PDFSnap Service Worker — Optimized v11
// Only caches essential shell assets at install.
// All other pages cache lazily on first visit.

const CACHE_NAME = 'pdfsnap-v12';

// Only cache the critical shell — not all 54 blog posts
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/favicon.svg'
];

// Install — cache only the shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('PDFSnap SW: Caching shell assets');
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — remove old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) {
            console.log('PDFSnap SW: Removing old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first for shell, network-first for everything else
self.addEventListener('fetch', function(event) {
  // Skip non-GET and cross-origin ad/analytics requests
  if (event.request.method !== 'GET') return;
  var url = event.request.url;
  if (url.includes('googlesyndication') || url.includes('googletagmanager') ||
      url.includes('profitablecpmratenetwork') || url.includes('adsbygoogle')) {
    return; // Let ads always hit the network
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Only cache successful same-origin responses
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback for HTML pages
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
