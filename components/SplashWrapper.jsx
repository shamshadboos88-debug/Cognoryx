"use client";
import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";

export default function SplashWrapper({ children }) {
  const [splashDone, setSplashDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait until client is mounted before showing splash
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until client is ready
  if (!mounted) {
    return <>{children}</>;
  }

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  return <>{children}</>;
}
