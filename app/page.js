"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Dynamically import auth only on client side
    import('@/lib/auth').then(({ useAuth }) => {
      setChecked(true);
    }).catch(() => setChecked(true));
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"#000", color:"#e8e8f0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:20 }}>
      <div style={{ fontSize:48, fontWeight:900, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:4, marginBottom:16 }}>COGNORYX</div>
      <p style={{ color:"#9090a8", fontSize:18, marginBottom:40 }}>Your all-in-one AI Intelligence Platform</p>
      <div style={{ display:"flex", gap:14 }}>
        <Link href="/login" style={{ padding:"14px 36px", borderRadius:10, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", color:"#fff", fontSize:13, fontWeight:700, letterSpacing:1.5, textDecoration:"none" }}>GET STARTED →</Link>
        <Link href="/pricing" style={{ padding:"14px 36px", borderRadius:10, border:"1px solid rgba(0,198,255,0.3)", color:"#00c6ff", fontSize:13, fontWeight:700, textDecoration:"none" }}>PRICING</Link>
      </div>
    </div>
  );
}