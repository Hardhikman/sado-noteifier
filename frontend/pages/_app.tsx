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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </Head>
      <div className="min-h-screen w-full relative">
        {/* Ocean Breeze Fade Gradient */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(225deg, #B3E5FC 0%, #E0F2F1 25%, #F0F4C3 50%, #FFF8E1 75%, #FFECB3 100%)`,
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