
const CACHE_NAME = 'ds-maintenance-v1';
const ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './translations.ts',
  './constants.ts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Dawar Saada Notification';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icon-192x192.png', // Assuming you have an icon
    badge: data.badge || '/badge.png', // Assuming you have a badge
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
