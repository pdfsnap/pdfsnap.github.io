// PDFSnap Service Worker
// Version 4.0

const CACHE_NAME = 'pdfsnap-v10';
const ASSETS = [
  '/',
  '/index.html',
  '/blog.html',
  '/blog-1.html',
  '/blog-2.html',
  '/blog-3.html',
  '/blog-4.html',
  '/blog-5.html',
  '/blog-6.html',
  '/blog-7.html',
  '/blog-8.html',
  '/blog-9.html',
  '/blog-10.html',
  '/blog-11.html',
  '/blog-12.html',
  '/blog-13.html',
  '/blog-14.html',
  '/blog-15.html',
  '/blog-16.html',
  '/blog-17.html',
  '/blog-18.html',
  '/blog-19.html',
  '/blog-20.html',
  '/blog-21.html',
  '/blog-22.html',
  '/blog-23.html',
  '/blog-24.html',
  '/blog-25.html',
  '/blog-26.html',
  '/blog-27.html',
  '/blog-28.html',
  '/blog-29.html',
  '/blog-30.html',
  '/blog-31.html',
  '/blog-32.html',
  '/blog-33.html',
  '/blog-34.html',
  '/blog-35.html',
  '/blog-36.html',
  '/blog-37.html',
  '/blog-38.html',
  '/blog-39.html',
  '/blog-40.html',
  '/blog-41.html',
  '/blog-42.html',
  '/blog-43.html',
  '/blog-44.html',
  '/blog-45.html',
  '/blog-46.html',
  '/blog-47.html',
  '/blog-48.html',
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
      console.log('PDFSnap: Caching files...');
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
          console.log('PDFSnap: Deleting old cache:', name);
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
        return new Response('Not found', { status: 404 });
      });
    })
  );
});
