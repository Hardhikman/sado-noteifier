import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../hooks/useAuth';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('Service Worker is supported in this browser');
      window.addEventListener('load', () => {
        console.log('Registering Service Worker...');
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
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
            console.log('Service Worker registration failed:', error);
            console.error('Service Worker registration error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
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