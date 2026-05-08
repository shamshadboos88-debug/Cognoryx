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
    setError(""); 

    // Validate inputs first
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (!pass.trim()) { setError("Please enter your password."); return; }
    if (pass.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (tab === "signup" && !name.trim()) { setError("Please enter your name."); return; }

    setLoading(true);
    try {
      if (tab === "login") {
        await loginWithEmail(email, pass);
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        await registerWithEmail(email, pass);
        toast.success("Welcome to COGNORYX! 🎉");
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Auth error:", e.code, e.message);
      const msg =
        e.code === "auth/invalid-credential"     ? "Wrong email or password. Try again." :
        e.code === "auth/user-not-found"         ? "No account found. Please sign up." :
        e.code === "auth/wrong-password"         ? "Wrong password. Try again." :
        e.code === "auth/email-already-in-use"   ? "Email already registered. Please sign in." :
        e.code === "auth/weak-password"          ? "Password must be at least 6 characters." :
        e.code === "auth/invalid-email"          ? "Please enter a valid email address." :
        e.code === "auth/network-request-failed" ? "Network error. Check your connection." :
        e.code === "auth/too-many-requests"      ? "Too many attempts. Please wait and try again." :
        e.code === "auth/operation-not-allowed"  ? "Email signup is not enabled. Contact support." :
        "Error: " + (e.message || "Something went wrong.");
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Welcome!");
      router.push("/dashboard");
    } catch (e) {
      console.error("Google error:", e.code, e.message);
      setError("Google sign-in failed: " + (e.code || e.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:420, background:"#222", border:"1px solid #2a2a2a", borderRadius:16, padding:40 }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <Link href="/" style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:900, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:3 }}>COGNORYX</Link>
          <p style={{ color:"#666", fontSize:13, marginTop:6 }}>AI Intelligence Platform</p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"#1a1a1a", borderRadius:8, padding:3, marginBottom:24 }}>
          <div onClick={() => { setTab("login"); setError(""); }} style={{ flex:1, padding:9, borderRadius:6, textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:600, color:tab==="login"?"#ececec":"#666", background:tab==="login"?"#2a2a2a":"transparent", transition:"all 0.2s" }}>Sign In</div>
          <div onClick={() => { setTab("signup"); setError(""); }} style={{ flex:1, padding:9, borderRadius:6, textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:600, color:tab==="signup"?"#ececec":"#666", background:tab==="signup"?"#2a2a2a":"transparent", transition:"all 0.2s" }}>Sign Up</div>
        </div>

        {/* Form */}
        {tab === "signup" && (
          <input style={{ width:"100%", background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:"11px 14px", color:"#ececec", fontSize:15, outline:"none", marginBottom:12, fontFamily:"var(--font-body)" }}
            placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input style={{ width:"100%", background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:"11px 14px", color:"#ececec", fontSize:15, outline:"none", marginBottom:12, fontFamily:"var(--font-body)" }}
          type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={{ width:"100%", background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:"11px 14px", color:"#ececec", fontSize:15, outline:"none", marginBottom:12, fontFamily:"var(--font-body)" }}
          type="password" placeholder="Password (min 6 characters)" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        {/* Error */}
        {error && (
          <div style={{ background:"rgba(255,77,109,0.1)", border:"1px solid rgba(255,77,109,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
            <p style={{ color:"#ff4d6d", fontSize:13, textAlign:"center" }}>⚠️ {error}</p>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width:"100%", padding:13, borderRadius:10, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color:"#fff", fontFamily:"var(--font-display)", fontSize:12, fontWeight:700, letterSpacing:1.5, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}>
          {loading ? "PLEASE WAIT..." : tab === "login" ? "SIGN IN →" : "CREATE ACCOUNT →"}
        </button>

        <div style={{ textAlign:"center", color:"#555", fontSize:12, margin:"16px 0" }}>— or continue with —</div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ width:"100%", padding:11, borderRadius:8, background:"#1a1a1a", border:"1px solid #333", color:"#ececec", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"var(--font-body)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign:"center", fontSize:12, color:"#555", marginTop:20 }}>
          By continuing you agree to our{" "}
          <Link href="/terms" style={{ color:"#00c6ff" }}>Terms</Link> &{" "}
          <Link href="/privacy" style={{ color:"#00c6ff" }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}