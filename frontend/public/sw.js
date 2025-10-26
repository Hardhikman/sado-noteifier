// Service Worker for Firebase Cloud Messaging

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// Handle background messages - FCM will automatically handle this
// We don't need to manually initialize Firebase in the service worker
// The client-side code handles FCM initialization

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received:', event);
  // FCM should handle this automatically, but we log it for debugging
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

// Firebase Cloud Messaging will automatically handle push events
// We don't need to manually handle the 'push' event when using FCM
console.log('[Service Worker] Loaded and ready to handle FCM messages');