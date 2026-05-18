"use client";
import { useState } from "react";
import SplashScreen from "./SplashScreen";

export default function SplashWrapper({ children }) {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  return <>{children}</>;
}
