// Freepdfconverterr Service Worker
// Version 4.0

const CACHE_NAME = 'freepdfconverterr-v11';
const ASSETS = [
  '/',
  '/index.html',
  '/app.apk',
  '/blog.html',
  '/blog-1.html',
  '/blog-2.html',
  '/blog-3.html',
  '/blog-4.html',
  '/blog-5.html',
  '/blog-6.html',
  '/blog-7.html',
  '/about.html',
  '/contact.html',
  '/privacy-policy.html',
  '/terms.html',
  '/manifest.json',
  '/sitemap.xml',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'
];

// Install — cache all assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Freepdfconverterr: Caching files...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('Freepdfconverterr: Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        return caches.match('/index.html');
      });
    })
  );
});
