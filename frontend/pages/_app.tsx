import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../hooks/useAuth';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('Service Worker is supported in this browser');
      
      // Register main service worker
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Main Service Worker registered with scope:', registration.scope);
          console.log('Service Worker registration object:', registration);
          
          // Check for updates
          registration.onupdatefound = () => {
            console.log('Service Worker update found');
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                console.log('Service Worker state changed:', installingWorker.state);
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New Service Worker is available, please refresh');
                  } else {
                    console.log('Service Worker is installed and ready to handle fetches');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.log('Main Service Worker registration failed:', error);
          console.error('Service Worker registration error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        });
      
      // Register Firebase Messaging service worker and pass configuration
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Firebase Messaging Service Worker registered with scope:', registration.scope);
          
          // Wait for the service worker to be ready, then send Firebase config
          if (registration.active) {
            // Send Firebase configuration to the service worker
            registration.active.postMessage({
              type: 'FIREBASE_CONFIG',
              config: {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
              }
            });
            console.log('Firebase configuration sent to service worker');
          } else {
            // If not active yet, wait for it to become active
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'activated') {
                    newWorker.postMessage({
                      type: 'FIREBASE_CONFIG',
                      config: {
                        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
                      }
                    });
                    console.log('Firebase configuration sent to newly activated service worker');
                  }
                });
              }
            });
          }
        })
        .catch((error) => {
          console.log('Firebase Messaging Service Worker registration failed:', error);
          console.error('Firebase Messaging Service Worker registration error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        });
    } else {
      console.log('Service Worker is not supported in this browser');
    }
  }, []);

  return (
    <>
      <Head>
        <title>SaDo Noteifier</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#493129" />
      </Head>
      <div className="min-h-screen w-full relative">
        {/* Solid background color */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `#ffeedb`,
          }}
        />
        <div className="relative z-10">
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
        </div>
      </div>
    </>
  );
}