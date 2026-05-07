import { Orbitron, Rajdhani } from "next/font/google";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", weight: ["400","700","900"] });
const rajdhani = Rajdhani({ subsets: ["latin"], variable: "--font-rajdhani", weight: ["300","400","500","600","700"] });

export const metadata = {
  title: "COGNORYX — AI Intelligence Platform",
  description: "All-in-one AI platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body>
        <AuthProvider>
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