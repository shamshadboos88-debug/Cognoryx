'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import CognoryxThinking from '@/components/CognoryxThinking';
import NewChatPopup from '@/components/NewChatPopup';

const LiveTool  = dynamic(() => import('@/components/LiveTool'),  { ssr: false });
const ImageTool = dynamic(() => import('@/components/ImageTool'), { ssr: false });

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser]                   = useState(null);
  const [activeTool, setActive]           = useState('chat');
  const [input, setInput]                 = useState('');
  const [messages, setMessages]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [showLive, setShowLive]           = useState(false);
  const [speaking, setSpeaking]           = useState(null);
  const [attachment, setAttachment]       = useState(null);
  const [showNewChatPopup, setShowPopup]  = useState(false);
  const [savedMessages, setSaved]         = useState([]);
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      setSaved(messages);
      setShowPopup(true);
    } else {
      setActive('chat');
      setMessages([]);
      setAttachment(null);
    }
  };

  const speak = (text, index) => {
    window.speechSynthesis.cancel();
    if (speaking === index) { setSpeaking(null); return; }
    const clean = text.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    const utt   = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find(v =>
      v.name.includes('Google UK English Female') ||
      v.name.includes('Samantha') || v.name.includes('Microsoft Zira') ||
      v.name.includes('Karen') || v.name.includes('Moira') || v.name.includes('Female')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (female) utt.voice = female;
    utt.rate = 1.0; utt.pitch = 1.1; utt.lang = 'en-US';
    utt.onstart = () => setSpeaking(index);
    utt.onend   = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utt);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({ name: file.name, base64: ev.target.result.split(',')[1], type: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !attachment) return;
    if (loading) return;
    const userContent = text + (attachment ? `\n\n📎 ${attachment.name}` : '');
    setMessages(m => [...m, { role: 'user', content: userContent }]);
    setInput('');
    const att = attachment;
    setAttachment(null);
    setLoading(true);
    try {
      const body = { message: text || 'Analyze this file', uid: user?.uid };
      if (att) body.attachment = { base64: att.base64, type: att.type, name: att.name };
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'ai', content: data.reply || data.error || '⚠️ No response' }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', content: '⚠️ Something went wrong.' }]);
    } finally { setLoading(false); }
  };

  const formatText = (text) => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;font-size:14px">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin:8px 0 4px">$1</h3>')
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0">$1</li>')
    .replace(/\n/g, '<br>');

  if (!user) return null;

  const TOOLS = [
    { id:'image',     label:'Image Generator',   icon:'🎨' },
    { id:'video',     label:'Image → Video',      icon:'🎬' },
    { id:'animation', label:'AI Animation',       icon:'✨' },
    { id:'talk',      label:'Talk with COGNORYX', icon:'🎤' },
  ];

  const CHIPS = [
    { icon:'💡', label:'Explain quantum computing' },
    { icon:'🐍', label:'Write a Python function' },
    { icon:'✏️', label:'Give me startup ideas' },
    { icon:'🖼️', label:'Analyze an image' },
  ];

  const RECENT = ['Getting started', 'Image generation tips'];

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0f0f13', color:'#e8e8f0', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>

      {/* ── New Chat Popup ── */}
      {showNewChatPopup && (
        <NewChatPopup
          hasHistory={savedMessages.length > 0}
          onNewChat={() => {
            setMessages([]);
            setAttachment(null);
            setActive('chat');
            setShowPopup(false);
          }}
          onContinue={() => {
            setMessages(savedMessages);
            setActive('chat');
            setShowPopup(false);
          }}
          onCancel={() => setShowPopup(false)}
        />
      )}

      {/* ── Live AI Overlay ── */}
      {showLive && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'100%', maxWidth:580, height:'88vh', background:'#0d0d16', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
            <button onClick={() => setShowLive(false)} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:22, cursor:'pointer', zIndex:10 }}>✕</button>
            <LiveTool />
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={{ width:200, background:'#0d0d14', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0, padding:'12px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 14px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,#00c6ff,#8a2be2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>CX</div>
            <span style={{ fontWeight:600, fontSize:15, letterSpacing:'0.5px' }}>COGNORYX</span>
          </div>
        </div>

        <div style={{ padding:'0 10px 8px' }}>
          <button onClick={handleNewChat}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, background:activeTool==='chat'?'rgba(255,255,255,0.08)':'transparent', border:'none', color:'#e8e8f0', cursor:'pointer', fontSize:13 }}>
            <span>✏️</span> New Chat
          </button>
        </div>

        <div style={{ padding:'4px 14px 6px', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'1px' }}>RECENT</div>
        {RECENT.map(r => (
          <button key={r} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:12, textAlign:'left', width:'100%' }}>
            <span style={{ fontSize:11 }}>💬</span>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r}</span>
          </button>
        ))}

        <div style={{ padding:'12px 14px 6px', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'1px' }}>TOOLS</div>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => t.id==='talk' ? setShowLive(true) : setActive(t.id)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', background:activeTool===t.id?'rgba(255,255,255,0.07)':'transparent', border:'none', color:activeTool===t.id?'#e8e8f0':'rgba(255,255,255,0.55)', cursor:'pointer', fontSize:12, textAlign:'left', width:'100%', borderRadius:6, margin:'1px 0' }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}

        <div style={{ flex:1 }} />

        <div style={{ padding:'10px 14px 6px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#00c6ff,#8a2be2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#fff', flexShrink:0 }}>
              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.displayName || user.email?.split('@')[0]}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Free Plan</div>
            </div>
          </div>
          <button style={{ width:'100%', padding:'8px', borderRadius:8, background:'linear-gradient(135deg,#00c6ff,#8a2be2)', border:'none', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', marginBottom:6 }}>⚡ Upgrade to Pro</button>
          <button onClick={handleSignOut} style={{ width:'100%', padding:'6px', borderRadius:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.35)', fontSize:11, cursor:'pointer' }}>Sign Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:14, color:'rgba(255,255,255,0.7)' }}>
          {activeTool==='chat' ? 'New Chat' : TOOLS.find(t=>t.id===activeTool)?.label || 'New Chat'}
        </div>

        {activeTool === 'image' ? (
          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <ImageTool />
          </div>
        ) : activeTool !== 'chat' ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>{TOOLS.find(t=>t.id===activeTool)?.icon}</div>
              <div style={{ fontSize:16 }}>{TOOLS.find(t=>t.id===activeTool)?.label}</div>
              <div style={{ fontSize:13, marginTop:6, opacity:0.5 }}>Coming soon</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
              {messages.length === 0 && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16, textAlign:'center' }}>
                  <div style={{ width:64, height:64, borderRadius:16, background:'linear-gradient(135deg,#1a0533,#001a33)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🧠</div>
                  <h2 style={{ fontSize:28, fontWeight:600, color:'#e8e8f0', margin:0 }}>How can I help you?</h2>
                  <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>Ask anything, upload images or documents, or use the tools on the left.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8, width:'100%', maxWidth:520 }}>
                    {CHIPS.map(c => (
                      <button key={c.label} onClick={() => { setInput(c.label); inputRef.current?.focus(); }}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'16px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:13, textAlign:'left' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
                        <span style={{ fontSize:20 }}>{c.icon}</span><span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:16, flexDirection:m.role==='user'?'row-reverse':'row' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:m.role==='user'?'linear-gradient(135deg,#00c6ff,#8a2be2)':'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, flexShrink:0 }}>
                    {m.role==='user'?(user.email?.[0]?.toUpperCase()||'U'):'CX'}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, maxWidth:'75%', alignItems:m.role==='user'?'flex-end':'flex-start' }}>
                    <div style={{ padding:'12px 16px', borderRadius:12, background:m.role==='user'?'linear-gradient(135deg,rgba(0,198,255,0.15),rgba(138,43,226,0.15))':'rgba(255,255,255,0.05)', border:'1px solid', borderColor:m.role==='user'?'rgba(0,198,255,0.2)':'rgba(255,255,255,0.07)', fontSize:14, lineHeight:1.6 }}
                      dangerouslySetInnerHTML={{ __html: formatText(m.content) }} />
                    {m.role === 'ai' && (
                      <button onClick={() => speak(m.content, i)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:speaking===i?'rgba(0,198,255,0.15)':'rgba(255,255,255,0.05)', border:speaking===i?'1px solid rgba(0,198,255,0.4)':'1px solid rgba(255,255,255,0.1)', color:speaking===i?'#00c6ff':'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:11, transition:'all 0.2s' }}>
                        {speaking===i ? '⏹ Stop' : '🔊 Listen'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  <CognoryxThinking />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {attachment && (
              <div style={{ margin:'0 20px 8px', padding:'8px 12px', borderRadius:10, background:'rgba(0,198,255,0.08)', border:'1px solid rgba(0,198,255,0.2)', display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                <span style={{ fontSize:18 }}>{attachment.type.startsWith('image')?'🖼️':attachment.type.includes('pdf')?'📄':'📎'}</span>
                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachment.name}</span>
                <button onClick={() => setAttachment(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:16, padding:0 }}>✕</button>
              </div>
            )}

            <div style={{ padding:'12px 20px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json,.md" onChange={handleFile} style={{ display:'none' }} />
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)' }}>
                <button onClick={() => fileRef.current?.click()} title="Attach file"
                  style={{ width:34, height:34, borderRadius:'50%', background:attachment?'rgba(0,198,255,0.15)':'rgba(255,255,255,0.07)', border:attachment?'1px solid rgba(0,198,255,0.4)':'1px solid rgba(255,255,255,0.12)', cursor:'pointer', fontSize:17, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:attachment?'#00c6ff':'rgba(255,255,255,0.5)', transition:'all 0.2s' }}>
                  📎
                </button>
                <textarea ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send(); } }}
                  onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,140)+'px'; }}
                  placeholder="Message COGNORYX..."
                  rows={1}
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e8e8f0', fontSize:14, resize:'none', lineHeight:1.5, fontFamily:'inherit' }}
                />
                <button onClick={() => setShowLive(true)} title="Live AI Call"
                  style={{ width:34, height:34, borderRadius:'50%', background:'rgba(138,43,226,0.15)', border:'1px solid rgba(138,43,226,0.35)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(138,43,226,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(138,43,226,0.15)'}>
                  📹
                </button>
                <button onClick={send} disabled={loading||(!input.trim()&&!attachment)}
                  style={{ width:34, height:34, borderRadius:'50%', background:(input.trim()||attachment)?'linear-gradient(135deg,#00c6ff,#8a2be2)':'rgba(255,255,255,0.08)', border:'none', cursor:(input.trim()||attachment)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.2s' }}>
                  <svg viewBox="0 0 24 24" fill="white" width="15" height="15"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
              <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:8 }}>COGNORYX can make mistakes. Verify important information.</p>
            </div>
          </>
        )}
      </main>

      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        textarea{scrollbar-width:none}
      `}</style>
    </div>
  );
}