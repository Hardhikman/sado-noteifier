// Firebase Messaging Service Worker
// This file is required for Firebase Cloud Messaging to work properly

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js');

// Default Firebase configuration (will be overridden by messages from the main app)
let firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd1234",
  measurementId: "G-XXXXXXXXXX"
};

// Listen for configuration message from the main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    console.log('[firebase-messaging-sw.js] Received Firebase config from main app');
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

// Initialize Firebase with the provided configuration
let firebaseApp;
let messaging;

function initializeFirebase() {
  try {
    // Clean up existing app if it exists
    if (firebaseApp) {
      firebaseApp.delete().then(() => {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        messaging = firebase.messaging(firebaseApp);
        console.log('[firebase-messaging-sw.js] Firebase reinitialized with new config');
      });
    } else {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging(firebaseApp);
      console.log('[firebase-messaging-sw.js] Firebase initialized with config');
    }
    
    // Set up background message handler
    if (messaging) {
      messaging.onBackgroundMessage(function(payload) {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        
        // Customize notification here
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
          body: payload.notification.body,
          icon: payload.notification.icon,
          data: payload.data
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
  }
}

console.log('[firebase-messaging-sw.js] Service Worker loaded and waiting for config');

// Handle push events (in case the above doesn't catch them)
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push event received', event);
  // Firebase Messaging should handle this automatically
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received', event);
  event.notification.close();
  
  // Handle the click event
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});