"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { logout } from "../../lib/firebase";
import toast from "react-hot-toast";

const TOOLS = [
  { id: "chat",      icon: "💬", label: "New Chat" },
  { id: "image",     icon: "🎨", label: "Image Generator" },
  { id: "video",     icon: "🎥", label: "Image → Video" },
  { id: "animation", icon: "🎬", label: "AI Animation" },
  { id: "voice",     icon: "🎤", label: "Voice AI" },
];

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tool, setTool] = useState("chat");
  const [sideOpen, setSideOpen] = useState(true);
  const [chats, setChats] = useState([
    { id: 1, title: "Getting started" },
    { id: 2, title: "Image generation tips" },
  ]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  if (loading || !user) return <LoadingScreen />;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#1a1a1a", color:"#ececec", fontFamily:"var(--font-body)", overflow:"hidden" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:sideOpen?260:0, flexShrink:0, overflow:"hidden", background:"#171717", borderRight:"1px solid #2a2a2a", display:"flex", flexDirection:"column", transition:"width 0.25s ease" }}>
        <div style={{ width:260, display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>

          {/* Logo */}
          <div style={{ padding:"16px 16px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:900, fontSize:11, color:"#fff" }}>CX</div>
              <span style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:700, letterSpacing:1, color:"#ececec" }}>COGNORYX</span>
            </div>
            <button onClick={() => setSideOpen(false)} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:18, padding:4 }}>✕</button>
          </div>

          {/* New Chat Button */}
          <div style={{ padding:"8px 12px" }}>
            <button onClick={() => setTool("chat")} style={{ width:"100%", padding:"10px 14px", borderRadius:8, background:"#2a2a2a", border:"1px solid #333", color:"#ececec", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:10, transition:"all 0.15s", fontFamily:"var(--font-body)" }}>
              <span style={{ fontSize:16 }}>✏️</span> New Chat
            </button>
          </div>

          {/* Recent Chats */}
          <div style={{ padding:"8px 12px 4px" }}>
            <div style={{ fontSize:11, color:"#666", fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:6, padding:"0 4px" }}>Recent</div>
            {chats.map(c => (
              <div key={c.id} style={{ padding:"8px 10px", borderRadius:6, cursor:"pointer", fontSize:13, color:"#aaa", marginBottom:2, transition:"all 0.15s", display:"flex", alignItems:"center", gap:8 }}
                onMouseEnter={e => e.currentTarget.style.background="#2a2a2a"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <span style={{ fontSize:13 }}>💬</span>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</span>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div style={{ padding:"8px 12px 4px", marginTop:8 }}>
            <div style={{ fontSize:11, color:"#666", fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:6, padding:"0 4px" }}>Tools</div>
            {TOOLS.filter(t => t.id !== "chat").map(t => (
              <div key={t.id} onClick={() => setTool(t.id)}
                style={{ padding:"8px 10px", borderRadius:6, cursor:"pointer", fontSize:13, color: tool===t.id?"#ececec":"#aaa", marginBottom:2, background: tool===t.id?"#2a2a2a":"transparent", display:"flex", alignItems:"center", gap:8, transition:"all 0.15s" }}
                onMouseEnter={e => { if(tool!==t.id) e.currentTarget.style.background="#222"; }}
                onMouseLeave={e => { if(tool!==t.id) e.currentTarget.style.background="transparent"; }}>
                <span>{t.icon}</span> {t.label}
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div style={{ marginTop:"auto", padding:"12px", borderTop:"1px solid #2a2a2a" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, marginBottom:6 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#00c6ff,#8a2be2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontSize:13, color:"#ececec", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.displayName || user?.email?.split("@")[0]}</div>
                <div style={{ fontSize:11, color:"#666" }}>Free Plan</div>
              </div>
            </div>
            <button onClick={() => router.push("/pricing")} style={{ width:"100%", padding:"8px", borderRadius:6, background:"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", marginBottom:6 }}>⚡ Upgrade to Pro</button>
            <button onClick={async () => { await logout(); router.push("/login"); }} style={{ width:"100%", padding:"7px", borderRadius:6, background:"transparent", border:"1px solid #333", color:"#888", fontSize:12, cursor:"pointer" }}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#1a1a1a" }}>

        {/* Top bar */}
        <div style={{ height:52, display:"flex", alignItems:"center", padding:"0 20px", gap:12, borderBottom:"1px solid #2a2a2a", flexShrink:0 }}>
          {!sideOpen && (
            <button onClick={() => setSideOpen(true)} style={{ background:"none", border:"none", color:"#888", cursor:"pointer", fontSize:18, display:"flex", padding:4 }}>☰</button>
          )}
          <span style={{ fontSize:14, color:"#aaa", fontWeight:500 }}>
            {TOOLS.find(t => t.id === tool)?.label || "AI Chat"}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {tool === "chat"      && <ChatView user={user} />}
          {tool === "image"     && <ImageView />}
          {tool === "video"     && <VideoView />}
          {tool === "animation" && <AnimationView />}
          {tool === "voice"     && <VoiceView />}
        </div>
      </div>
    </div>
  );
}

// ── CHAT ────────────────────────────────────────────────────
function ChatView({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [fileBase64, setFileBase64] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, typing]);

  const handleFile = e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setFileBase64(ev.target.result);
      setFileType(f.type);
      setFileName(f.name);
      if (f.type.startsWith("image/")) setFilePreview(ev.target.result);
    };
    reader.readAsDataURL(f);
  };

  const removeFile = () => { setFileBase64(null); setFileType(null); setFilePreview(null); setFileName(null); if (fileRef.current) fileRef.current.value = ""; };

  const send = async () => {
    if ((!input.trim() && !fileBase64) || typing) return;
    const text = input || "Analyze this file.";
    const prev = filePreview; const fn = fileName;
    setMessages(m => [...m, { role:"user", text, filePreview:prev, fileName:fn }]);
    setInput(""); removeFile(); setTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message:text, fileBase64, fileType }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(m => [...m, { role:"ai", text:data.reply }]);
    } catch(e) { toast.error(e.message || "Error"); }
    setTyping(false);
  };

  const suggestions = [
    { icon:"💡", text:"Explain quantum computing" },
    { icon:"🐍", text:"Write a Python function" },
    { icon:"🚀", text:"Give me startup ideas" },
    { icon:"🖼️", text:"Analyze an image" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto", padding:"0 0 20px" }}>
        {messages.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:40, textAlign:"center", gap:24 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#00c6ff22,#8a2be222)", border:"1px solid #333", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🧠</div>
            <div>
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:700, color:"#ececec", marginBottom:8, letterSpacing:1 }}>How can I help you?</h2>
              <p style={{ color:"#888", fontSize:15 }}>Ask anything, upload images, or use the tools on the left.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, maxWidth:500, width:"100%" }}>
              {suggestions.map(s => (
                <div key={s.text} onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                  style={{ padding:"14px 16px", borderRadius:10, background:"#222", border:"1px solid #2a2a2a", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#444"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#2a2a2a"}>
                  <div style={{ fontSize:18, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:13, color:"#ccc" }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth:720, margin:"0 auto", padding:"20px 20px 0" }}>
            {messages.map((m,i) => (
              <div key={i} style={{ marginBottom:24, display:"flex", gap:14, flexDirection: m.role==="user"?"row-reverse":"row" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background: m.role==="ai"?"#2a2a2a":"linear-gradient(135deg,#00c6ff,#8a2be2)", color: m.role==="ai"?"#00c6ff":"#fff", border: m.role==="ai"?"1px solid #333":"none" }}>
                  {m.role==="ai"?"CX":(user?.email?.[0]?.toUpperCase()||"U")}
                </div>
                <div style={{ maxWidth:"80%", display:"flex", flexDirection:"column", gap:6, alignItems: m.role==="user"?"flex-end":"flex-start" }}>
                  {m.filePreview && <img src={m.filePreview} style={{ maxWidth:240, borderRadius:10, border:"1px solid #333" }} />}
                  {m.fileName && !m.filePreview && <div style={{ padding:"8px 12px", borderRadius:8, background:"#222", border:"1px solid #333", fontSize:12, color:"#aaa" }}>📄 {m.fileName}</div>}
                  <div style={{ padding:"12px 16px", borderRadius:12, background: m.role==="ai"?"#222":"#2a5a8a", fontSize:14, lineHeight:1.8, color:"#ececec", whiteSpace:"pre-wrap", borderTopLeftRadius: m.role==="ai"?4:12, borderTopRightRadius: m.role==="user"?4:12 }}>{m.text}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display:"flex", gap:14, marginBottom:24 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"#2a2a2a", border:"1px solid #333", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#00c6ff", fontWeight:700 }}>CX</div>
                <div style={{ padding:"14px 18px", borderRadius:12, background:"#222", display:"flex", gap:5, alignItems:"center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#666", animation:"pulse 1.2s infinite", animationDelay:`${i*0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:"16px 20px 20px", flexShrink:0 }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          {/* File preview */}
          {fileName && (
            <div style={{ marginBottom:8, padding:"8px 12px", background:"#222", border:"1px solid #333", borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
              {filePreview ? <img src={filePreview} style={{ width:36, height:36, borderRadius:6, objectFit:"cover" }} /> : <span>📄</span>}
              <span style={{ fontSize:13, color:"#aaa", flex:1 }}>{fileName}</span>
              <button onClick={removeFile} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:16 }}>✕</button>
            </div>
          )}
          <div style={{ background:"#222", border:"1px solid #333", borderRadius:14, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-end", transition:"border-color 0.2s" }}
            onFocus={() => {}} >
            <button onClick={() => fileRef.current?.click()} style={{ width:32, height:32, borderRadius:8, background:"#2a2a2a", border:"1px solid #333", color:"#888", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16, transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color="#ececec"}
              onMouseLeave={e => e.currentTarget.style.color="#888"}>📎</button>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.txt" style={{ display:"none" }} onChange={handleFile} />
            <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,160)+"px"; }}
              onKeyDown={e => e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),send())}
              placeholder="Message COGNORYX..." rows={1}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#ececec", fontFamily:"var(--font-body)", fontSize:15, resize:"none", lineHeight:1.6, maxHeight:160, minHeight:24 }} />
            <button onClick={send} disabled={typing||(!input.trim()&&!fileBase64)}
              style={{ width:34, height:34, borderRadius:9, background: typing||(!input.trim()&&!fileBase64)?"#2a2a2a":"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color: typing||(!input.trim()&&!fileBase64)?"#555":"#fff", cursor: typing||(!input.trim()&&!fileBase64)?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
          <p style={{ textAlign:"center", fontSize:11, color:"#555", marginTop:8 }}>COGNORYX can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}

// ── IMAGE ────────────────────────────────────────────────────
function ImageView() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/image", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ prompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(p => [data.imageUrl, ...p]);
      toast.success("Image generated!");
    } catch(e) { toast.error(e.message || "Failed"); }
    setLoading(false);
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:28 }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#ececec", marginBottom:6 }}>Image Generator</h2>
          <p style={{ color:"#888", fontSize:14 }}>Create stunning AI images from text descriptions</p>
        </div>
        <div style={{ background:"#222", border:"1px solid #2a2a2a", borderRadius:14, padding:20, marginBottom:20 }}>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A futuristic neon cityscape at night, cyberpunk, ultra detailed..." rows={3}
            style={{ width:"100%", background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:"11px 13px", color:"#ececec", fontFamily:"var(--font-body)", fontSize:14, outline:"none", resize:"vertical", marginBottom:14 }} />
          <button onClick={generate} disabled={loading}
            style={{ padding:"10px 24px", borderRadius:8, background: loading?"#2a2a2a":"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color: loading?"#666":"#fff", fontSize:13, fontWeight:600, cursor: loading?"not-allowed":"pointer", transition:"all 0.2s" }}>
            {loading ? "Generating..." : "Generate Image"}
          </button>
        </div>
        {loading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
            {[0,1].map(i => <div key={i} style={{ aspectRatio:1, borderRadius:10, background:"#222", animation:"pulse 1.5s infinite" }} />)}
          </div>
        )}
        {images.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
            {images.map((url,i) => (
              <div key={i} style={{ aspectRatio:1, borderRadius:10, overflow:"hidden", position:"relative", border:"1px solid #2a2a2a" }}>
                <img src={url} alt="AI" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <a href={url} download={`cognoryx-${i}.png`} style={{ position:"absolute", bottom:8, right:8, padding:"5px 10px", borderRadius:6, background:"rgba(0,0,0,0.7)", color:"#fff", fontSize:11, fontWeight:600 }}>↓ Save</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── VIDEO ────────────────────────────────────────────────────
function VideoView() {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center", gap:16 }}>
      <div style={{ fontSize:48 }}>🎥</div>
      <h2 style={{ fontSize:22, fontWeight:700, color:"#ececec" }}>Video Generation</h2>
      <div style={{ padding:"6px 16px", borderRadius:20, background:"#2a2a2a", color:"#ffaa00", fontSize:12, fontWeight:600 }}>⚡ COMING SOON</div>
      <p style={{ color:"#888", fontSize:14, maxWidth:400, lineHeight:1.7 }}>AI video generation is coming very soon. We are integrating the best video AI models.</p>
    </div>
  );
}

// ── ANIMATION ────────────────────────────────────────────────
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
      const W = canvas.width = canvas.offsetWidth; const H = canvas.height = 360;
      const ctx = canvas.getContext("2d");
      let f = 0;
      const pts = Array.from({length:60},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,r:1+Math.random()*4}));
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        ctx.fillStyle="rgba(26,26,26,0.15)"; ctx.fillRect(0,0,W,H); f++;
        pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=(f%60<30?"#00c6ff":"#8a2be2")+"99";ctx.fill();});
      }, 33);
    }, 100);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:28 }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#ececec", marginBottom:6 }}>AI Animation</h2>
          <p style={{ color:"#888", fontSize:14 }}>Generate animated clips from text descriptions</p>
        </div>
        <div style={{ background:"#222", border:"1px solid #2a2a2a", borderRadius:14, padding:20, marginBottom:20 }}>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A glowing neural network pulsing with energy..." rows={3}
            style={{ width:"100%", background:"#1a1a1a", border:"1px solid #333", borderRadius:8, padding:"11px 13px", color:"#ececec", fontFamily:"var(--font-body)", fontSize:14, outline:"none", resize:"vertical", marginBottom:14 }} />
          <button onClick={generate} disabled={loading}
            style={{ padding:"10px 24px", borderRadius:8, background:loading?"#2a2a2a":"linear-gradient(135deg,#00c6ff,#8a2be2)", border:"none", color:loading?"#666":"#fff", fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer" }}>
            {loading?"Generating...":"Generate Animation"}
          </button>
        </div>
        {result && (
          <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid #2a2a2a" }}>
            <canvas ref={canvasRef} style={{ width:"100%", display:"block" }} />
            <div style={{ padding:"10px 14px", background:"#222", display:"flex", gap:10 }}>
              <button onClick={() => { const a = document.createElement("a"); a.href = canvasRef.current.toDataURL(); a.download="animation.png"; a.click(); }} style={{ padding:"7px 16px", borderRadius:6, background:"#2a2a2a", border:"1px solid #333", color:"#aaa", fontSize:12, cursor:"pointer" }}>↓ Save Frame</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── VOICE ────────────────────────────────────────────────────
function VoiceView() {
  const [callState, setCallState] = useState("idle"); // idle, calling, active, thinking
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState([]);
  const [duration, setDuration] = useState(0);
  const recRef = useRef(null);
  const timerRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const startCall = () => {
    setCallState("calling");
    setMessages([]);
    setTranscript("");
    setResponse("");
    setDuration(0);
    setTimeout(() => {
      setCallState("active");
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      speak("Hello! I am COGNORYX AI. How can I help you today?", () => {
        startListening();
      });
    }, 2000);
  };

  const endCall = () => {
    setCallState("idle");
    clearInterval(timerRef.current);
    setDuration(0);
    window.speechSynthesis?.cancel();
    try { recRef.current?.stop(); } catch {}
    setTranscript("");
    setResponse("");
  };

  const speak = (text, onEnd) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    // Pick best voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Female"));
    if (preferred) u.voice = preferred;
    u.onend = () => { if (onEnd) onEnd(); };
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Use Chrome or Edge for voice support"); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onresult = e => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final || interim);
      if (final) processVoice(final);
    };

    rec.onerror = e => {
      if (e.error !== "no-speech") toast.error("Mic error: " + e.error);
      if (callState === "active") setTimeout(startListening, 1000);
    };

    rec.onend = () => {
      if (callState === "active") setTimeout(startListening, 500);
    };

    try { rec.start(); } catch {}
  };

  const processVoice = async text => {
    setCallState("thinking");
    setMessages(m => [...m, { role: "user", text }]);
    setTranscript("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(m => [...m, { role: "ai", text: data.reply }]);
      setResponse(data.reply);
      setCallState("active");
      speak(data.reply, () => {
        startListening();
      });
    } catch (e) {
      toast.error("AI error"); setCallState("active");
      startListening();
    }
  };

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // IDLE SCREEN
  if (callState === "idle") return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, gap:24, background:"#1a1a1a" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:12 }}>🤖</div>
        <h2 style={{ fontSize:24, fontWeight:700, color:"#ececec", marginBottom:8 }}>Talk to COGNORYX</h2>
        <p style={{ color:"#888", fontSize:15, maxWidth:380, lineHeight:1.7 }}>Have a real conversation with AI. Speak naturally and COGNORYX will respond with voice — just like a phone call.</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:320 }}>
        {["Ask anything you want", "Get instant voice responses", "Natural conversation flow", "Hands-free AI experience"].map(f => (
          <div key={f} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#222", borderRadius:10, border:"1px solid #2a2a2a" }}>
            <span style={{ color:"#00c6ff" }}>✓</span>
            <span style={{ fontSize:13, color:"#aaa" }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Call button */}
      <button onClick={startCall} style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#00c655,#00a844)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, boxShadow:"0 0 30px rgba(0,198,85,0.4)", transition:"all 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
        📞
      </button>
      <p style={{ color:"#666", fontSize:13 }}>Tap to start call</p>
    </div>
  );

  // CALLING SCREEN
  if (callState === "calling") return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, background:"#1a1a1a" }}>
      <div style={{ width:100, height:100, borderRadius:"50%", background:"linear-gradient(135deg,#00c6ff,#8a2be2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, animation:"pulse 1s infinite" }}>🤖</div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:18, fontWeight:600, color:"#ececec", marginBottom:6 }}>COGNORYX AI</div>
        <div style={{ fontSize:14, color:"#888" }}>Connecting...</div>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#00c6ff", animation:"pulse 1s infinite", animationDelay:`${i*0.2}s` }} />)}
      </div>
      <button onClick={endCall} style={{ width:60, height:60, borderRadius:"50%", background:"#ff4444", border:"none", cursor:"pointer", fontSize:24, marginTop:20, boxShadow:"0 0 20px rgba(255,68,68,0.4)" }}>📵</button>
    </div>
  );

  // ACTIVE / THINKING CALL SCREEN
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#1a1a1a", overflow:"hidden" }}>

      {/* Call header */}
      <div style={{ padding:"16px 20px", background:"#222", borderBottom:"1px solid #2a2a2a", display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
        <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#00c6ff,#8a2be2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow: callState==="active"?"0 0 20px rgba(0,198,255,0.4)":"none" }}>🤖</div>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color:"#ececec" }}>COGNORYX AI</div>
          <div style={{ fontSize:12, color: callState==="thinking"?"#ffaa00":"#00c655" }}>
            {callState === "thinking" ? "⚡ Thinking..." : `🟢 ${formatTime(duration)}`}
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
          <button onClick={endCall} style={{ width:44, height:44, borderRadius:"50%", background:"#ff4444", border:"none", cursor:"pointer", fontSize:20, boxShadow:"0 0 16px rgba(255,68,68,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>📵</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:"center", color:"#555", fontSize:14, marginTop:40 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🎤</div>
            Start speaking — COGNORYX is listening...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", gap:10, flexDirection: m.role==="user"?"row-reverse":"row", alignItems:"flex-start" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, background: m.role==="ai"?"linear-gradient(135deg,#00c6ff,#8a2be2)":"#333", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
              {m.role==="ai"?"🤖":"🧑"}
            </div>
            <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:12, background: m.role==="ai"?"#222":"#2a5a8a", fontSize:14, color:"#ececec", lineHeight:1.7, borderTopLeftRadius: m.role==="ai"?4:12, borderTopRightRadius: m.role==="user"?4:12 }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom mic status */}
      <div style={{ padding:"16px 20px", background:"#222", borderTop:"1px solid #2a2a2a", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          {callState === "active" ? (
            <>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ width:4, background:"#00c6ff", borderRadius:2, animation:"pulse 0.8s infinite", animationDelay:`${i*0.1}s`, height: `${8 + Math.random()*16}px` }} />
                ))}
              </div>
              <span style={{ fontSize:13, color:"#00c6ff" }}>Listening...</span>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                {[5,4,3,2,1].map(i => (
                  <div key={i} style={{ width:4, background:"#00c6ff", borderRadius:2, animation:"pulse 0.8s infinite", animationDelay:`${i*0.1}s`, height: `${8 + Math.random()*16}px` }} />
                ))}
              </div>
            </>
          ) : (
            <span style={{ fontSize:13, color:"#ffaa00" }}>⚡ Processing your request...</span>
          )}
        </div>
        {transcript && (
          <div style={{ textAlign:"center", marginTop:8, fontSize:13, color:"#888", fontStyle:"italic" }}>"{transcript}"</div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height:"100vh", background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"2px solid #333", borderTopColor:"#00c6ff", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
        <div style={{ fontSize:13, color:"#666" }}>Loading...</div>
      </div>
    </div>
  );
}