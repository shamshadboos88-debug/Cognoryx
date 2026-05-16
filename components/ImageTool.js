'use client';
// components/ImageTool.js
import { useState, useRef } from 'react';

const STYLES = [
  { id: 'flux',           label: '✨ Flux (Best)',      desc: 'Highest quality' },
  { id: 'flux-realism',   label: '📷 Realism',          desc: 'Photorealistic' },
  { id: 'flux-anime',     label: '🎌 Anime',            desc: 'Anime style' },
  { id: 'flux-3d',        label: '🎮 3D Render',        desc: '3D CGI style' },
  { id: 'turbo',          label: '⚡ Fast',             desc: 'Quick generation' },
];

const SIZES = [
  { label: 'Square 1:1',    w: 1024, h: 1024 },
  { label: 'Portrait 2:3',  w: 768,  h: 1152 },
  { label: 'Landscape 3:2', w: 1152, h: 768  },
  { label: 'Wide 16:9',     w: 1280, h: 720  },
];

const EXAMPLE_PROMPTS = [
  'A futuristic AI city at night with neon lights and flying cars',
  'Portrait of a beautiful woman with galaxy hair, digital art',
  'A majestic dragon breathing fire over a medieval castle',
  'Minimalist logo design for a tech startup, clean and modern',
  'Underwater world with colorful coral reefs and exotic fish',
  'Cyberpunk street market in Tokyo, rain, neon reflections',
];

export default function ImageTool() {
  const [prompt, setPrompt]     = useState('');
  const [images, setImages]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [style, setStyle]       = useState('flux');
  const [size, setSize]         = useState(SIZES[0]);
  const [count, setCount]       = useState(1);
  const inputRef = useRef(null);

  const generate = async () => {
    const text = prompt.trim();
    if (!text) return;
    setLoading(true);
    setError('');

    try {
      const newImages = [];
      for (let i = 0; i < count; i++) {
        const res  = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text, width: size.w, height: size.h, model: style }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        newImages.push({ url: data.imageUrl, prompt: text, id: Date.now() + i });
      }
      setImages(prev => [...newImages, ...prev]);
    } catch (err) {
      setError('Failed to generate image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const download = async (url, index) => {
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `cognoryx-image-${index + 1}.jpg`;
      a.click();
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'transparent', color:'#e8e8f0', fontFamily:'inherit' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize:16, fontWeight:600, color:'#e8e8f0', marginBottom:2 }}>🎨 AI Image Generator</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Powered by Flux AI · Free · No limits</div>
      </div>

      {/* Controls */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Prompt input */}
        <div style={{ position:'relative' }}>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey && !loading) { e.preventDefault(); generate(); } }}
            placeholder="Describe the image you want to create..."
            rows={2}
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 14px', color:'#e8e8f0', fontSize:14, resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.5 }}
            onFocus={e => e.target.style.borderColor='rgba(0,198,255,0.4)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Style selector */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s.id)}
              style={{ padding:'6px 12px', borderRadius:20, border:'1px solid', fontSize:12, cursor:'pointer', transition:'all 0.2s',
                background: style===s.id ? 'rgba(0,198,255,0.15)' : 'rgba(255,255,255,0.05)',
                borderColor: style===s.id ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.1)',
                color: style===s.id ? '#00c6ff' : 'rgba(255,255,255,0.6)',
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Size + count + generate */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select value={size.label} onChange={e => setSize(SIZES.find(s=>s.label===e.target.value))}
            style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'7px 10px', color:'#e8e8f0', fontSize:12, cursor:'pointer', flex:1 }}>
            {SIZES.map(s => <option key={s.label} value={s.label}>{s.label} ({s.w}×{s.h})</option>)}
          </select>

          <select value={count} onChange={e => setCount(Number(e.target.value))}
            style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'7px 10px', color:'#e8e8f0', fontSize:12, cursor:'pointer', width:80 }}>
            {[1,2,3,4].map(n => <option key={n} value={n}>{n} image{n>1?'s':''}</option>)}
          </select>

          <button onClick={generate} disabled={loading || !prompt.trim()}
            style={{ padding:'8px 24px', borderRadius:10, background: prompt.trim() && !loading ? 'linear-gradient(135deg,#00c6ff,#8a2be2)' : 'rgba(255,255,255,0.1)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor: prompt.trim() && !loading ? 'pointer' : 'default', transition:'all 0.2s', whiteSpace:'nowrap' }}>
            {loading ? '⏳ Generating...' : '✨ Generate'}
          </button>
        </div>

        {/* Error */}
        {error && <div style={{ fontSize:12, color:'#ff7070', padding:'8px 12px', background:'rgba(255,80,80,0.08)', borderRadius:8, border:'1px solid rgba(255,80,80,0.2)' }}>{error}</div>}
      </div>

      {/* Content area */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:20 }}>
            {Array(count).fill(0).map((_,i) => (
              <div key={i} style={{ aspectRatio:'1', borderRadius:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid transparent', borderTopColor:'#00c6ff', animation:'spin 1s linear infinite' }} />
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Creating your image...</div>
              </div>
            ))}
          </div>
        )}

        {/* Generated images */}
        {images.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:20 }}>
            {images.map((img, i) => (
              <div key={img.id} style={{ borderRadius:14, overflow:'hidden', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', position:'relative', group:true }}
                onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity='1'}
                onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity='0'}
              >
                <img src={img.url} alt={img.prompt} loading="lazy"
                  style={{ width:'100%', display:'block', borderRadius:14 }}
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                />
                <div style={{ display:'none', alignItems:'center', justifyContent:'center', height:200, color:'rgba(255,255,255,0.3)', fontSize:13 }}>
                  Failed to load image
                </div>
                {/* Overlay with actions */}
                <div className="overlay" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', gap:10, opacity:0, transition:'opacity 0.2s', borderRadius:14 }}>
                  <button onClick={() => download(img.url, i)}
                    style={{ padding:'8px 16px', borderRadius:8, background:'linear-gradient(135deg,#00c6ff,#8a2be2)', border:'none', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    ⬇️ Download
                  </button>
                  <button onClick={() => window.open(img.url, '_blank')}
                    style={{ padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:12, cursor:'pointer' }}>
                    🔍 View Full
                  </button>
                </div>
                {/* Prompt tag */}
                <div style={{ padding:'8px 12px', fontSize:11, color:'rgba(255,255,255,0.4)', borderTop:'1px solid rgba(255,255,255,0.06)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {img.prompt}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state with example prompts */}
        {images.length === 0 && !loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, paddingTop:20 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🎨</div>
              <div style={{ fontSize:16, fontWeight:500, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>Create stunning AI images</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>Type a prompt above or try one of these examples</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10, width:'100%', maxWidth:600 }}>
              {EXAMPLE_PROMPTS.map(p => (
                <button key={p} onClick={() => { setPrompt(p); inputRef.current?.focus(); }}
                  style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:12, textAlign:'left', lineHeight:1.4, transition:'all 0.2s' }}
                  onMouseEnter={e => { e.target.style.background='rgba(255,255,255,0.08)'; e.target.style.borderColor='rgba(0,198,255,0.3)'; }}
                  onMouseLeave={e => { e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.borderColor='rgba(255,255,255,0.08)'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
