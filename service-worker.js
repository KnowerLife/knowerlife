const CACHE_NAME = 'knowerlife-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/icons/favicon-96x96.png',
  '/icons/apple-touch-icon.png',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn('Failed to cache:', url, err);
          });
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Пропускаем запросы к сторонним доменам без кеширования
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  } else {
    // Для внешних ресурсов просто выполняем сетевой запрос
    event.respondWith(fetch(event.request));
  }
});
