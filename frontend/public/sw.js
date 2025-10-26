// Main Service Worker for the application

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);
    
    const title = data.notification?.title || 'New Notification';
    const options = {
      body: data.notification?.body || '',
      icon: data.notification?.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: data.data || {}
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

console.log('[Service Worker] Main service worker loaded and ready');