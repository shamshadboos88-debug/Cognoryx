// app/layout.js — replace your existing file with this
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'COGNORYX — AI Intelligence Platform',
  description: 'All-in-one AI platform: chat, generate images, create videos, and have live voice conversations with AI.',
  keywords: 'AI, artificial intelligence, chatbot, image generation, voice AI, COGNORYX',
  authors: [{ name: 'COGNORYX' }],
  creator: 'COGNORYX',
  publisher: 'COGNORYX',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'COGNORYX',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'COGNORYX — AI Intelligence Platform',
    description: 'All-in-one AI platform with chat, image generation, and live voice AI.',
    siteName: 'COGNORYX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COGNORYX — AI Intelligence Platform',
    description: 'All-in-one AI platform with chat, image generation, and live voice AI.',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport = {
  themeColor: '#00c6ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="COGNORYX" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="msapplication-TileImage" content="/icons/icon-192x192.png" />
        <meta name="msapplication-TileColor" content="#00c6ff" />
      </head>
      <body className={inter.className}>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(function(reg) {
                    console.log('[SW] Registered:', reg.scope);
                  })
                  .catch(function(err) {
                    console.log('[SW] Registration failed:', err);
                  });
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
