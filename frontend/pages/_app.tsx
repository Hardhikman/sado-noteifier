import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../hooks/useAuth';
import Head from 'next/head';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
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
