"use client";
// components/VideoTool.js
import { useState } from "react";
import toast from "react-hot-toast";
import styles from "./tools.module.css";

export default function VideoTool({ user, userData, onUpgrade }) {
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
    const steps = [[15,"Analyzing image..."],[35,"Extracting motion..."],[60,"Generating frames..."],[80,"Rendering video..."],[95,"Encoding..."],[100,"Complete!"]];
    for (const [pct, lbl] of steps) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setProgress(pct); setProgLabel(lbl);
    }
    try {
      const res = await fetch("/api/video", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
            <input id="imgUpload" type="file" accept="image/*" style={{ display:"none" }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div>
            <img src={preview} className={styles.preview} alt="Upload" />
            <button className={styles.clearBtn} onClick={() => { setPreview(null); setImgFile(null); }}>✕ Remove</button>
          </div>
        )}
        <label className={styles.label} style={{ marginTop:14 }}>MOTION PROMPT (optional)</label>
        <input className={styles.input} placeholder="Slow zoom in, waves moving, cinematic pan..."
          value={vPrompt} onChange={e => setVPrompt(e.target.value)} />
        <button className={styles.actionBtn} onClick={generate} disabled={loading || atLimit} style={{ marginTop:14 }}>
          {loading ? <span className={styles.spinner2} /> : "Generate Video"}
        </button>
        {loading && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width:`${progress}%` }} /></div>
            <div className={styles.progressLabel}>{progLabel}</div>
          </div>
        )}
        {atLimit && <div className={styles.limitWarn}>Limit reached. <button onClick={onUpgrade}>Upgrade →</button></div>}
      </div>
      {result && (
        <div className={styles.card} style={{ padding:0, overflow:"hidden" }}>
          <div className={styles.videoPlaceholder}>
            <img src={result} alt="Result" />
            <div className={styles.videoOverlay}>
              <div>🎬 Video Generated</div>
              <small>Connect Pika Labs API for real video output</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
