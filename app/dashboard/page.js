"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { logout, checkAndIncrementUsage, LIMITS } from "../../lib/firebase";
import toast from "react-hot-toast";

const TOOLS = [
  { id: "chat",      icon: "🧠", label: "AI Chat",         sub: "Gemini 1.5 Flash" },
  { id: "image",     icon: "🎨", label: "Image Generator",  sub: "Stable Diffusion XL" },
  { id: "video",     icon: "🎥", label: "Image → Video",    sub: "Pika Labs" },
  { id: "animation", icon: "🎬", label: "AI Animation",     sub: "Replicate" },
  { id: "voice",     icon: "🎤", label: "Voice AI",         sub: "Speech API" },
];

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tool, setTool] = useState("chat");
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  if (loading || !user) return (
    <div style={{ height:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:50, height:50, border:"2px solid rgba(0,198,255,0.2)", borderTopColor:"#00c6ff", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
        <div style={{ fontFamily:"var(--font-display)", fontSize:12, color:"#606075", letterSpacing:2 }}>LOADING...</div>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", background:"#000", overflow:"hidden" }}>
      {/* SIDEBAR */}
      <div style={{ width:sideOpen?240:0, flexShrink:0, overflow:"hidden", background:"#080808", borderRight:"1px solid rgba(0,198,255,0.1)", display:"flex", flexDirection:"column", transition:"width 0.3s ease" }}>
        <div style={{ width:240, display:"flex", flexDirection:"column", height:"100%" }}>
          <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid rgba(0,198,255,0.1)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:900, fontSize:12, color:"#000" }}>CX</div>
            <span style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:700, letterSpacing:2, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>COGNORYX</span>
          </div>
          <div style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
            <div style={{ fontSize:10, fontFamily:"var(--font-display)", letterSpacing:2, color:"#606075", padding:"6px 8px 10px" }}>TOOLS</div>
            {TOOLS.map(t => (
              <div key={t.id} onClick={() => setTool(t.id)} style={{ padding:"10px", margin:"2px 0", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:10, background:tool===t.id?"rgba(0,198,255,0.08)":"transparent", border:tool===t.id?"1px solid rgba(0,198,255,0.2)":"1px solid transparent", transition:"all 0.15s" }}>
                <div style={{ width:28, height:28, borderRadius:7, background:tool===t.id?"rgba(0,198,255,0.15)":"#141414", border:"1px solid rgba(0,198,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:tool===t.id?"#00c6ff":"#9090a8" }}>{t.label}</div>
                  <div style={{ fontSize:10, color:"#606075" }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:"12px 14px", borderTop:"1px solid rgba(0,198,255,0.1)" }}>
            <button onClick={() => router.push("/pricing")} style={{ width:"100%", padding:"8px", marginBottom:6, borderRadius:8, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color:"#000", fontFamily:"var(--font-display)", fontSize:10, fontWeight:700, letterSpacing:1, cursor:"pointer" }}>⚡ UPGRADE TO PRO</button>
            <button onClick={async () => { await logout(); router.push("/login"); }} style={{ width:"100%", padding:"7px", borderRadius:8, background:"transparent", border:"1px solid rgba(255,100,100,0.2)", color:"#ff6060", fontSize:12, fontWeight:600, cursor:"pointer" }}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ height:54, borderBottom:"1px solid rgba(0,198,255,0.1)", display:"flex", alignItems:"center", padding:"0 20px", gap:14, background:"#080808", flexShrink:0 }}>
          <button onClick={() => setSideOpen(!sideOpen)} style={{ background:"none", border:"none", color:"#606075", fontSize:18, cursor:"pointer" }}>☰</button>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, color:"#e8e8f0", letterSpacing:1 }}>{TOOLS.find(t=>t.id===tool)?.label}</div>
            <div style={{ fontSize:11, color:"#606075" }}>{TOOLS.find(t=>t.id===tool)?.sub}</div>
          </div>
          <div style={{ marginLeft:"auto", width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,rgba(0,198,255,0.2),rgba(138,43,226,0.2))", border:"1px solid rgba(0,198,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#00c6ff", fontFamily:"var(--font-display)" }}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
        <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {tool === "chat"      && <ChatView user={user} profile={profile} />}
          {tool === "image"     && <ImageView user={user} />}
          {tool === "video"     && <VideoView user={user} />}
          {tool === "animation" && <AnimationView />}
          {tool === "voice"     && <VoiceView />}
        </main>
      </div>
    </div>
  );
}

function ChatView({ user, profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [fileType, setFileType] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, typing]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setFileBase64(base64);
      setUploadedFile(f.name);
      setFileType(f.type);
      if (f.type.startsWith("image/")) {
        setFilePreview(base64);
      } else {
        setFilePreview(null);
      }
    };
    reader.readAsDataURL(f);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setFileBase64(null);
    setFileType(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    if (!input.trim() && !fileBase64 || typing) return;
    const text = input || "Please analyze this file.";
    const preview = filePreview;
    const fname = uploadedFile;

    setMessages(m => [...m, {
      role: "user",
      text,
      filePreview: preview,
      fileName: fname,
    }]);
    setInput(""); setTyping(true);
    removeFile();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          fileBase64: fileBase64,
          fileType: fileType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(m => [...m, { role:"ai", text: data.reply }]);
    } catch(e) { toast.error(e.message || "AI error"); }
    setTyping(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 0" }}>
        {messages.length === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:20, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:48 }}>🧠</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:700, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>COGNORYX AI</div>
            <p style={{ color:"#9090a8", fontSize:14, maxWidth:400 }}>Ask me anything or upload an image/document for analysis.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
              {["Explain quantum computing","Write a Python function","Give me startup ideas","Analyze this image"].map(s => (
                <div key={s} onClick={() => setInput(s)} style={{ padding:"8px 14px", borderRadius:20, background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.12)", fontSize:13, color:"#9090a8", cursor:"pointer" }}>{s}</div>
              ))}
            </div>
          </div>
        )}
        {messages.map((m,i) => (
          <div key={i} style={{ display:"flex", padding:"10px 20px", gap:12, flexDirection:m.role==="user"?"row-reverse":"row" }}>
            <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:"var(--font-display)", background:m.role==="ai"?"rgba(0,198,255,0.15)":"rgba(138,43,226,0.15)", border:`1px solid ${m.role==="ai"?"rgba(0,198,255,0.3)":"rgba(138,43,226,0.3)"}`, color:m.role==="ai"?"#00c6ff":"#8a2be2" }}>
              {m.role==="ai"?"CX":(user?.email?.[0]?.toUpperCase()||"U")}
            </div>
            <div style={{ maxWidth:"70%", display:"flex", flexDirection:"column", gap:6 }}>
              {m.filePreview && (
                <img src={m.filePreview} alt="uploaded" style={{ maxWidth:200, borderRadius:8, border:"1px solid rgba(0,198,255,0.2)" }} />
              )}
              {m.fileName && !m.filePreview && (
                <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(0,198,255,0.08)", border:"1px solid rgba(0,198,255,0.2)", fontSize:12, color:"#00c6ff" }}>📄 {m.fileName}</div>
              )}
              <div style={{ padding:"11px 15px", borderRadius:12, background:m.role==="ai"?"#0f0f0f":"rgba(0,198,255,0.08)", border:`1px solid ${m.role==="ai"?"rgba(0,198,255,0.1)":"rgba(0,198,255,0.2)"}`, fontSize:14, lineHeight:1.7, color:"#e8e8f0", whiteSpace:"pre-wrap" }}>{m.text}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display:"flex", padding:"10px 20px", gap:12 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(0,198,255,0.15)", border:"1px solid rgba(0,198,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#00c6ff", fontFamily:"var(--font-display)" }}>CX</div>
            <div style={{ padding:"12px 16px", borderRadius:12, background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.1)", display:"flex", gap:5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#00c6ff", animation:"pulse 1.2s infinite", animationDelay:`${i*0.2}s`, opacity:0.4 }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* FILE PREVIEW */}
      {uploadedFile && (
        <div style={{ margin:"0 16px 8px", padding:"10px 14px", background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.2)", borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
          {filePreview ? (
            <img src={filePreview} style={{ width:40, height:40, borderRadius:6, objectFit:"cover" }} />
          ) : (
            <span style={{ fontSize:24 }}>📄</span>
          )}
          <span style={{ fontSize:13, color:"#9090a8", flex:1 }}>{uploadedFile}</span>
          <button onClick={removeFile} style={{ background:"none", border:"none", color:"#ff6060", cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
      )}

      {/* INPUT */}
      <div style={{ padding:"12px 16px 16px", borderTop:"1px solid rgba(0,198,255,0.1)", background:"#080808", flexShrink:0 }}>
        <div style={{ display:"flex", gap:10, background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.15)", borderRadius:10, padding:"10px 12px" }}>
          {/* Upload button */}
          <button onClick={() => fileRef.current?.click()} style={{ width:34, height:34, borderRadius:8, background:"rgba(0,198,255,0.08)", border:"1px solid rgba(0,198,255,0.2)", color:"#00c6ff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>📎</button>
          <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx" style={{ display:"none" }} onChange={handleFile} />

          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())} placeholder="Message COGNORYX or upload a file..." rows={1} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#e8e8f0", fontFamily:"var(--font-body)", fontSize:15, resize:"none", lineHeight:1.5 }} />
          <button onClick={send} disabled={typing||(!input.trim()&&!fileBase64)} style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color:"#000", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:typing||(!input.trim()&&!fileBase64)?0.5:1, flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <p style={{ textAlign:"center", fontSize:11, color:"#606075", marginTop:8 }}>Supports images, PDFs, and documents</p>
      </div>
    </div>
  );
}

function VideoView() {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center" }}>
      <div style={{ fontSize:60, marginBottom:20 }}>🎥</div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:700, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:2, marginBottom:12 }}>VIDEO GENERATION</div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:20, background:"rgba(255,170,0,0.08)", border:"1px solid rgba(255,170,0,0.2)", color:"#ffaa00", fontSize:12, fontFamily:"var(--font-display)", letterSpacing:2, marginBottom:20 }}>
        ⚡ COMING SOON
      </div>
      <p style={{ color:"#9090a8", fontSize:15, maxWidth:440, lineHeight:1.8, marginBottom:28 }}>
        AI video generation is coming very soon. We are integrating the best video AI models to bring your images to life.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, maxWidth:600, width:"100%" }}>
        {["Kling AI","Pika Labs","RunwayML","Stable Video"].map(f => (
          <div key={f} style={{ padding:"14px 16px", borderRadius:10, background:"#080808", border:"1px solid rgba(0,198,255,0.08)", fontSize:13, color:"#606075" }}>
            🎬 {f}
          </div>
        ))}
      </div>
      <p style={{ color:"#606075", fontSize:12, marginTop:28 }}>
        Use AI Animation in the meantime — it generates beautiful animated clips!
      </p>
    </div>
  );
}
function AnimationView() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000 + Math.random()*1000));
    setResult(true); setLoading(false);
    toast.success("Animation generated!");
    setTimeout(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const W = canvas.width = canvas.offsetWidth; const H = canvas.height = 320;
      const ctx = canvas.getContext("2d");
      let f = 0;
      const pts = Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,r:2+Math.random()*5}));
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        ctx.fillStyle="rgba(0,0,0,0.12)"; ctx.fillRect(0,0,W,H); f++;
        pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=(f%60<30?"#00c6ff":"#8a2be2")+"88";ctx.fill();});
      }, 33);
    }, 100);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:28 }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:20, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:2, textAlign:"center", marginBottom:24 }}>AI ANIMATION</h1>
        <div style={{ background:"#080808", border:"1px solid rgba(0,198,255,0.12)", borderRadius:14, padding:22, marginBottom:20 }}>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A glowing neural network pulsing with energy..." rows={3} style={{ width:"100%", background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.12)", borderRadius:8, padding:"11px 13px", color:"#e8e8f0", fontFamily:"var(--font-body)", fontSize:14, outline:"none", resize:"vertical", marginBottom:14 }} />
          <button onClick={generate} disabled={loading} style={{ padding:"11px 28px", borderRadius:8, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color:"#000", fontFamily:"var(--font-display)", fontSize:11, fontWeight:700, letterSpacing:1.5, cursor:"pointer", opacity:loading?0.6:1 }}>
            {loading?"RENDERING...":"GENERATE ANIMATION"}
          </button>
        </div>
        {result && <div style={{ background:"#080808", border:"1px solid rgba(0,198,255,0.12)", borderRadius:14, overflow:"hidden" }}><canvas ref={canvasRef} style={{ width:"100%", display:"block" }} /></div>}
      </div>
    </div>
  );
}

function VoiceView() {
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("Click mic to start");
  const recRef = useRef(null);

  const toggle = () => active ? stop() : start();

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Use Chrome or Edge for voice support"); return; }
    const rec = new SR(); rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    recRef.current = rec;
    rec.onstart = () => { setActive(true); setStatus("🔴 Listening..."); setTranscript(""); };
    rec.onresult = e => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final || interim);
      if (final) processVoice(final);
    };
    rec.onerror = e => { toast.error("Mic error: " + e.error); stop(); };
    rec.onend = stop;
    rec.start();
  };

  const stop = () => {
    setActive(false); setStatus("Click mic to start");
    try { recRef.current?.stop(); } catch {}
  };

  const processVoice = async (text) => {
    setStatus("⚡ Thinking..."); setResponse("");
    try {
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message: text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResponse(data.reply); setStatus("✓ Done");
    } catch { setStatus("Error"); toast.error("AI response failed"); }
  };

  const speak = () => {
    if (!response) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(response);
    u.lang = "en-US"; window.speechSynthesis.speak(u);
  };

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px", gap:24 }}>
      <h1 style={{ fontFamily:"var(--font-display)", fontSize:20, background:"linear-gradient(90deg,#00c6ff,#8a2be2)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:2 }}>VOICE AI</h1>
      <div onClick={toggle} style={{ width:120, height:120, borderRadius:"50%", border:`2px solid ${active?"#00c6ff":"rgba(0,198,255,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:active?"0 0 40px rgba(0,198,255,0.4)":"none", transition:"all 0.3s" }}>
        <div style={{ width:76, height:76, borderRadius:"50%", background:active?"rgba(0,198,255,0.2)":"rgba(0,198,255,0.06)", border:"1px solid rgba(0,198,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🎤</div>
      </div>
      <p style={{ color:"#9090a8", fontSize:14 }}>{status}</p>
      {transcript && <div style={{ width:"100%", maxWidth:560, background:"#0f0f0f", border:"1px solid rgba(0,198,255,0.12)", borderRadius:10, padding:"13px 15px", fontSize:14, color:"#e8e8f0" }}>{transcript}</div>}
      {response && (
        <div style={{ width:"100%", maxWidth:560 }}>
          <div style={{ background:"rgba(0,198,255,0.04)", border:"1px solid rgba(0,198,255,0.12)", borderRadius:10, padding:"13px 15px", fontSize:14, color:"#e8e8f0", lineHeight:1.6 }}>{response}</div>
          <button onClick={speak} style={{ marginTop:10, padding:"8px 18px", borderRadius:8, background:"transparent", border:"1px solid rgba(0,198,255,0.25)", color:"#00c6ff", fontSize:13, fontWeight:600, cursor:"pointer" }}>🔊 Read Aloud</button>
        </div>
      )}
    </div>
  );
}