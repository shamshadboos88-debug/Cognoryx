"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import Link from "next/link";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user]);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#e8e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900, background: "linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 4, marginBottom: 16 }}>COGNORYX</div>
      <p style={{ color: "#9090a8", fontSize: 18, marginBottom: 40 }}>Your all-in-one AI Intelligence Platform</p>
      <div style={{ display: "flex", gap: 14 }}>
        <Link href="/login" style={{ padding: "14px 36px", borderRadius: 10, background: "linear-gradient(135deg,#00c6ff,#8a2be2)", color: "#000", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>GET STARTED →</Link>
        <Link href="/pricing" style={{ padding: "14px 36px", borderRadius: 10, border: "1px solid rgba(0,198,255,0.3)", color: "#00c6ff", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700 }}>PRICING</Link>
      </div>
    </div>
  );
}