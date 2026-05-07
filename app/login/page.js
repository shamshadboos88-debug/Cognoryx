"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { loginWithEmail, registerWithEmail, signInWithGoogle } from "../../lib/firebase";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab]     = useState("login");
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (user) router.push("/dashboard"); }, [user]);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (tab === "login") {
        await loginWithEmail(email, pass);
        toast.success("Welcome back!");
      } else {
        if (!name.trim()) { setError("Name is required."); setLoading(false); return; }
        await registerWithEmail(email, pass);
        toast.success("Welcome to COGNORYX!");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(
        e.code === "auth/invalid-credential" ? "Invalid email or password." :
        e.code === "auth/email-already-in-use" ? "Email already in use." :
        e.code === "auth/weak-password" ? "Password must be at least 6 characters." :
        "Something went wrong. Try again."
      );
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (e) {
      setError("Google sign-in failed.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:420, background:"#080808", border:"1px solid rgba(0,198,255,0.15)", borderRadius:20, padding:40 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <Link href="/" style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:900, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:3 }}>COGNORYX</Link>
          <p style={{ color:"#606075", fontSize:13, marginTop:6 }}>AI Intelligence Platform</p>
        </div>

        <div style={{ display:"flex", background:"#0f0f0f", borderRadius:8, padding:3, marginBottom:24 }}>
          <div onClick={() => setTab("login")} style={{ flex:1, padding:9, borderRadius:6, textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:600, color:tab==="login"?"#00c6ff":"#606075", background:tab==="login"?"#141414":"transparent" }}>Sign In</div>
          <div onClick={() => setTab("signup")} style={{ flex:1, padding:9, borderRadius:6, textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:600, color:tab==="signup"?"#00c6ff":"#606075", background:tab==="signup"?"#141414":"transparent" }}>Sign Up</div>
        </div>

        {tab === "signup" && <input style={{ width:"100%", background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.15)", borderRadius:8, padding:"11px 14px", color:"#e8e8f0", fontSize:15, outline:"none", marginBottom:12, fontFamily:"var(--font-body)" }} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />}
        <input style={{ width:"100%", background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.15)", borderRadius:8, padding:"11px 14px", color:"#e8e8f0", fontSize:15, outline:"none", marginBottom:12, fontFamily:"var(--font-body)" }} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={{ width:"100%", background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.15)", borderRadius:8, padding:"11px 14px", color:"#e8e8f0", fontSize:15, outline:"none", marginBottom:12, fontFamily:"var(--font-body)" }} type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        {error && <p style={{ color:"#ff4d6d", fontSize:13, marginBottom:10, textAlign:"center" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:13, borderRadius:10, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color:"#000", fontFamily:"var(--font-display)", fontSize:12, fontWeight:700, letterSpacing:1.5, cursor:"pointer", opacity:loading?0.7:1 }}>
          {loading ? "PLEASE WAIT..." : tab === "login" ? "SIGN IN →" : "CREATE ACCOUNT →"}
        </button>

        <div style={{ textAlign:"center", color:"#606075", fontSize:12, margin:"16px 0" }}>— or —</div>

        <button onClick={handleGoogle} disabled={loading} style={{ width:"100%", padding:11, borderRadius:8, background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.15)", color:"#e8e8f0", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"var(--font-body)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}