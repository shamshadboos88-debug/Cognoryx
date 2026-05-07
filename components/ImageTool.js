"use client";
// components/ImageTool.js
import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./tools.module.css";

export function ImageTool({ user, userData, onUpgrade }) {
  const [prompt, setPrompt]   = useState("");
  const [style, setStyle]     = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages]   = useState([]);

  const plan    = userData?.plan || "free";
  const usage   = userData?.usage || {};
  const limit   = plan === "pro" ? 50 : 2;
  const atLimit = (usage.images || 0) >= limit;

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (atLimit) { onUpgrade(); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: style ? `${prompt}, ${style} style` : prompt, uid: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setImages(imgs => [{ url: data.url, prompt }, ...imgs]);
      toast.success("Image generated!");
    } catch (err) { toast.error(err.message || "Generation failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.toolPage}>
      <div className={styles.toolHeader}>
        <div className={styles.toolTitle}>Image Generator</div>
        <div className={styles.toolSub}>Create stunning AI visuals from text</div>
      </div>
      <div className={styles.card}>
        <label className={styles.label}>PROMPT</label>
        <textarea className={styles.textarea} rows={3} placeholder="A futuristic neon cityscape at night, cyberpunk aesthetic, ultra detailed..."
          value={prompt} onChange={e => setPrompt(e.target.value)} />
        <div className={styles.row}>
          <div style={{ flex: 1 }}>
            <label className={styles.label}>STYLE</label>
            <select className={styles.select} value={style} onChange={e => setStyle(e.target.value)}>
              <option value="">Realistic</option>
              <option value="anime">Anime</option>
              <option value="digital art">Digital Art</option>
              <option value="oil painting">Oil Painting</option>
              <option value="watercolor">Watercolor</option>
              <option value="cinematic">Cinematic</option>
            </select>
          </div>
          <button className={styles.actionBtn} onClick={generate} disabled={loading || atLimit}>
            {loading ? <span className={styles.spinner2} /> : "Generate"}
          </button>
        </div>
        {atLimit && <div className={styles.limitWarn}>Daily limit reached. <button onClick={onUpgrade}>Upgrade to Pro →</button></div>}
      </div>

      {images.length > 0 && (
        <div className={styles.imgGrid}>
          {images.map((img, i) => (
            <div key={i} className={styles.imgCard}>
              <img src={img.url} alt={img.prompt} />
              <div className={styles.imgOverlay}>
                <a href={img.url} download={`cognoryx-${i}.png`} className={styles.dlBtn}>↓ Download</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── VideoTool ─────────────────────────────────────────────────
export function VideoTool({ user, userData, onUpgrade }) {
  const [imgFile, setImgFile]     = useState(null);
  const [preview, setPreview]     = useState(null);
  const [vPrompt, setVPrompt]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [result, setResult]       = useState(null);

  const plan = userData?.plan || "free";
  const usage = userData?.usage || {};
  const atLimit = (usage.videos || 0) >= (plan === "pro" ? 10 : 1);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!imgFile) { toast.error("Please upload an image first"); return; }
    if (atLimit) { onUpgrade(); return; }
    setLoading(true); setResult(null);
    const steps = [
      [15, "Analyzing image..."], [35, "Extracting motion..."],
      [60, "Generating frames..."], [80, "Rendering video..."],
      [95, "Encoding..."], [100, "Complete!"],
    ];
    for (const [pct, lbl] of steps) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setProgress(pct); setProgLabel(lbl);
    }
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: preview, prompt: vPrompt, uid: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.url || preview);
      toast.success("Video ready!");
    } catch (err) { toast.error(err.message || "Video generation failed"); }
    finally { setLoading(false); setProgress(0); }
  };

  return (
    <div className={styles.toolPage}>
      <div className={styles.toolHeader}>
        <div className={styles.toolTitle}>Image → Video</div>
        <div className={styles.toolSub}>Transform images into dynamic AI videos</div>
      </div>
      <div className={styles.card}>
        {!preview ? (
          <div className={styles.uploadZone}
            onClick={() => document.getElementById("imgUpload").click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
            <div className={styles.uploadIcon}>📁</div>
            <p>Drop image or click to upload</p>
            <small>PNG, JPG, WEBP — max 10MB</small>
            <input id="imgUpload" type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div>
            <img src={preview} className={styles.preview} alt="Upload preview" />
            <button className={styles.clearBtn} onClick={() => { setPreview(null); setImgFile(null); }}>✕ Remove</button>
          </div>
        )}
        <label className={styles.label} style={{ marginTop: 14 }}>MOTION PROMPT (optional)</label>
        <input className={styles.input} placeholder="Slow zoom in, waves moving, cinematic pan..."
          value={vPrompt} onChange={e => setVPrompt(e.target.value)} />
        <button className={styles.actionBtn} onClick={generate} disabled={loading || atLimit} style={{ marginTop: 14 }}>
          {loading ? <span className={styles.spinner2} /> : "Generate Video"}
        </button>
        {loading && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.progressLabel}>{progLabel}</div>
          </div>
        )}
        {atLimit && <div className={styles.limitWarn}>Daily limit reached. <button onClick={onUpgrade}>Upgrade →</button></div>}
      </div>
      {result && (
        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          <div className={styles.videoPlaceholder}>
            <img src={result} alt="Video frame" />
            <div className={styles.videoOverlay}>
              <div>🎬 Video Generated</div>
              <small>Connect Pika Labs / Replicate API for real videos</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AnimTool ──────────────────────────────────────────────────
export function AnimTool({ user, userData, onUpgrade }) {
  const [prompt, setPrompt]   = useState("");
  const [style, setStyle]     = useState("Abstract");
  const [loading, setLoading] = useState(false);
  const [ready, setReady]     = useState(false);
  const canvasRef = React.useRef(null);
  const timerRef  = React.useRef(null);

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    setLoading(true); setReady(false);
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
    setReady(true); setLoading(false);
    startAnim();
    toast.success("Animation ready!");
  };

  const startAnim = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = 340;
    let c1 = "#00c6ff", c2 = "#8a2be2", c3 = "#00ff80";
    if (/fire|warm|orange/.test(prompt.toLowerCase())) { c1 = "#ff6b35"; c2 = "#ff4d6d"; c3 = "#ffaa00"; }
    let frame = 0;
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
      r: 2 + Math.random() * 5,
    }));
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, W, H);
      frame++;
      const gx = W / 2 + Math.sin(frame / 40) * 80;
      const gy = H / 2 + Math.cos(frame / 50) * 40;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, H * 0.5);
      g.addColorStop(0, c1 + "18"); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = (frame % 60 < 30 ? c1 : c2) + "aa";
        ctx.fill();
      });
      for (let r = 0; r < 3; r++) {
        const a = frame / (25 + r * 8);
        const rx = W / 2 + Math.cos(a + r * 2.1) * (70 + r * 35);
        const ry = H / 2 + Math.sin(a + r * 2.1) * (44 + r * 22);
        ctx.beginPath();
        ctx.arc(rx, ry, 12 + Math.sin(frame / 18 + r) * 7, 0, Math.PI * 2);
        ctx.fillStyle = [c1, c2, c3][r] + "99"; ctx.fill();
      }
    }, 1000 / 30);
  };

  React.useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className={styles.toolPage}>
      <div className={styles.toolHeader}>
        <div className={styles.toolTitle}>AI Animation</div>
        <div className={styles.toolSub}>Generate animated clips from text descriptions</div>
      </div>
      <div className={styles.card}>
        <label className={styles.label}>ANIMATION PROMPT</label>
        <textarea className={styles.textarea} rows={3}
          placeholder="A glowing neural network pulsing with energy, abstract, neon blue and purple..."
          value={prompt} onChange={e => setPrompt(e.target.value)} />
        <div className={styles.row}>
          <div style={{ flex: 1 }}>
            <label className={styles.label}>STYLE</label>
            <select className={styles.select} value={style} onChange={e => setStyle(e.target.value)}>
              {["Abstract", "Cartoon", "Cinematic", "Sci-Fi", "Nature"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button className={styles.actionBtn} onClick={generate} disabled={loading}>
            {loading ? <span className={styles.spinner2} /> : "Generate"}
          </button>
        </div>
      </div>
      {ready && (
        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />
          <div style={{ padding: "12px 16px", display: "flex", gap: 10 }}>
            <button className={styles.outlineBtn} onClick={() => {
              const a = document.createElement("a");
              a.href = canvasRef.current.toDataURL("image/png");
              a.download = "cognoryx-anim.png"; a.click();
            }}>↓ Save Frame</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── VoiceTool ─────────────────────────────────────────────────
export function VoiceTool({ user, userData, onUpgrade }) {
  const [recording, setRecording]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse]     = useState("");
  const [status, setStatus]         = useState("Click the mic to start speaking");
  const [loading, setLoading]       = useState(false);
  const recRef = React.useRef(null);

  const toggle = () => { if (recording) stop(); else start(); };

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported. Use Chrome or Edge."); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onstart  = () => { setRecording(true); setStatus("🔴 Listening..."); setTranscript(""); };
    rec.onresult = e => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        (e.results[i].isFinal ? (final += e.results[i][0].transcript) : (interim += e.results[i][0].transcript));
      }
      setTranscript(final || interim);
      if (final) processVoice(final);
    };
    rec.onerror = e => { stop(); toast.error("Mic error: " + e.error); };
    rec.onend   = () => setRecording(false);
    recRef.current = rec;
    rec.start();
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false); setStatus("Click to start speaking");
  };

  const processVoice = async (text) => {
    setLoading(true); setStatus("⚡ Processing...");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, uid: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResponse(data.reply);
      setStatus("✓ Response ready");
    } catch { setStatus("Error — try again"); toast.error("Failed to get response"); }
    finally { setLoading(false); }
  };

  const speak = () => {
    if (!response) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(response);
    u.lang = "en-US"; u.rate = 1; u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className={styles.toolPage}>
      <div className={styles.toolHeader}>
        <div className={styles.toolTitle}>Talk with COGNORYX</div>
        <div className={styles.toolSub}>Speak naturally — AI listens and responds</div>
      </div>
      <div className={styles.voiceCenter}>
        <div className={`${styles.micRing} ${recording ? styles.micActive : ""}`} onClick={toggle}>
          <div className={styles.micInner}>🎤</div>
        </div>
        <div className={styles.voiceStatus}>{status}</div>
        <div className={styles.card} style={{ width: "100%", maxWidth: 560 }}>
          <label className={styles.label}>YOU SAID</label>
          <div className={styles.transcript}>{transcript || "Your speech will appear here..."}</div>
        </div>
        {response && (
          <div className={styles.card} style={{ width: "100%", maxWidth: 560 }}>
            <label className={styles.label}>COGNORYX RESPONDS</label>
            <div className={styles.voiceResp}>{response}</div>
            <button className={styles.outlineBtn} style={{ marginTop: 12 }} onClick={speak}>🔊 Read Aloud</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Default export for dashboard import compatibility
import React from "react";
export default ImageTool;
