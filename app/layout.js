import { Orbitron, Rajdhani } from "next/font/google";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", weight: ["400","700","900"] });
const rajdhani = Rajdhani({ subsets: ["latin"], variable: "--font-rajdhani", weight: ["300","400","500","600","700"] });

export const metadata = {
  title: "COGNORYX — AI Intelligence Platform",
  description: "All-in-one AI platform: chat, generate images, create videos.",
  manifest: "/manifest.json",
  themeColor: "#00c6ff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "COGNORYX",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00c6ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="COGNORYX" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <AuthProvider>
          <script dangerouslySetInnerHTML={{__html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}} />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0f0f0f",
                color: "#e8e8f0",
                border: "1px solid rgba(0,198,255,0.2)",
                fontFamily: "var(--font-rajdhani)",
                fontSize: "14px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}