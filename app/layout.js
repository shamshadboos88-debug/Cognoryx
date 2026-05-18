// app/layout.js — optimized for performance
import './globals.css';

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
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#00c6ff' },
    { media: '(prefers-color-scheme: light)', color: '#00c6ff' },
  ],
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        <link rel="dns-prefetch" href="https://googleapis.com" />

        {/* PWA Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="COGNORYX" />

        {/* PWA iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="COGNORYX" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />

        {/* PWA Windows */}
        <meta name="msapplication-TileImage" content="/icons/icon-512x512.png" />
        <meta name="msapplication-TileColor" content="#00c6ff" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#00c6ff" />

        {/* Critical CSS inline for fast FCP */}
        <style dangerouslySetInnerHTML={{ __html: `
          *{box-sizing:border-box;margin:0;padding:0}
          html{background:#000;color:#e8e8f0}
          body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#000;color:#e8e8f0;min-height:100vh}
        `}} />
      </head>
      <body>
        {children}

        {/* Deferred SW registration — after page load */}
        <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function() {
              if ('serviceWorker' in navigator) {
                setTimeout(function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[SW] Registered');
                      setInterval(function() { reg.update(); }, 60000);
                    })
                    .catch(function(e) { console.log('[SW] Failed:', e); });
                }, 1000);
              }

              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window._installPrompt = e;
              });
            });
          `
        }} />
      </body>
    </html>
  );
}
