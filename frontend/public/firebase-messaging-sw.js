// firebase-messaging-sw.js

// Import Firebase scripts (your versions are fine)
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js');

// --- CRITICAL FIX ---1. Add your real Firebase config here.This MUST be hardcoded.
const firebaseConfig = {
  apiKey: "AIzaSyBH_IpUH6iDqVEcUinUw6pgzDkgVPBBtxc",
  authDomain: "sa-do-9c91e.firebaseapp.com",
  projectId: "sa-do-9c91e",
  storageBucket: "sa-do-9c91e.appspot.com",
  messagingSenderId: "362095722321",
  appId: "1:362095722321:web:2126ab124ade004082c60b"
};

// --- CRITICAL FIX --- 2. Initialize Firebase immediately when the worker starts.Do NOT wait for a message from the main app.
try {
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging(firebaseApp);

  console.log('[firebase-messaging-sw.js] Firebase initialized immediately.');

  // Set up background message handler
  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Get the title and options from the payload
    // This handles both "notification" and "data" payloads
    const notificationTitle = payload.notification ? payload.notification.title : (payload.data ? payload.data.title : 'New Message');
    
    const notificationOptions = {
      body: payload.notification ? payload.notification.body : (payload.data ? payload.data.body : 'You have a new update.'),
      icon: payload.notification ? payload.notification.icon : (payload.data ? payload.data.icon : '/default-icon.png'),
      data: payload.data // Pass along data for click handling
    };

    // Show the notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

} catch (error) {
  console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
}

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received', event);
  event.notification.close();

  // Get the URL to open from the notification's data (if it exists)
  const clickUrl = event.notification.data ? event.notification.data.url : '/';

  // Open or focus the window
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        // If a window is already open at the target URL, focus it
        if (client.url === clickUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});

// Note: You don't need a separate 'push' event listener.
// The `messaging.onBackgroundMessage` handles it for you.