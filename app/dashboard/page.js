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

const MODES = [
  { id: 'chat',  icon: '💬', label: 'Chat',       desc: 'General AI assistant' },
  { id: 'code',  icon: '💻', label: 'Code',       desc: 'Expert coding agent' },
  { id: 'agent', icon: '🤖', label: 'Agent',      desc: 'Multi-step task agent' },
  { id: 'video', icon: '🎥', label: 'Video',      desc: 'Analyze videos & screens' },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser]             = useState(null);
  const [activeTool, setActive]     = useState('chat');
  const [input, setInput]           = useState('');
  const [messages, setMessages]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showLive, setShowLive]     = useState(false);
  const [speaking, setSpeaking]     = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [showPopup, setShowPopup]   = useState(false);
  const [savedMsgs, setSavedMsgs]   = useState([]);
  const [reactions, setReactions]   = useState({});
  const [copied, setCopied]         = useState(null);
  const [mode, setMode]             = useState('chat');
  const [streamEnabled]             = useState(true);
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) router.push('/login'); else setUser(u);
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSignOut = async () => { await signOut(auth); router.push('/login'); };

  const handleNewChat = () => {
    if (messages.length > 0) { setSavedMsgs(messages); setShowPopup(true); }
    else { setMessages([]); setAttachment(null); setActive('chat'); }
  };

  const copyMessage = (text, i) => {
    navigator.clipboard.writeText(text.replace(/<[^>]+>/g, ''));
    setCopied(i); setTimeout(() => setCopied(null), 2000);
  };

  const react = (i, type) => setReactions(r => ({ ...r, [i]: r[i] === type ? null : type }));

  const retry = async (i) => {
    const prev = messages[i - 1];
    if (!prev || prev.role !== 'user') return;
    setMessages(m => m.slice(0, i));
    await sendMessage(prev.content, null);
  };

  const speak = (text, i) => {
    window.speechSynthesis.cancel();
    if (speaking === i) { setSpeaking(null); return; }
    const clean = text.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    const utt = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Microsoft Zira')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voice) utt.voice = voice;
    utt.rate = 1.0; utt.pitch = 1.1; utt.lang = 'en-US';
    utt.onstart = () => setSpeaking(i);
    utt.onend = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utt);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert('File too large. Max 20MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setAttachment({ name: file.name, base64: ev.target.result.split(',')[1], type: file.type });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Core send with streaming support ──────────────────────
  const sendMessage = async (text, att) => {
    setLoading(true);
    try {
      const body = { message: text || 'Analyze this file', uid: user?.uid, mode, stream: streamEnabled };
      if (att) body.attachment = { base64: att.base64, type: att.type, name: att.name };

      // STREAMING
      if (streamEnabled && !att) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.headers.get('content-type')?.includes('text/event-stream')) {
          // Add empty AI message to stream into
          setMessages(m => [...m, { role: 'ai', content: '', streaming: true }]);
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.done) {
                    setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, streaming: false } : msg));
                  } else if (data.text) {
                    setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, content: msg.content + data.text } : msg));
                  }
                } catch {}
              }
            }
          }
          return;
        }

        // Non-stream fallback
        const data = await res.json();
        setMessages(m => [...m, { role: 'ai', content: data.reply || '⚠️ No response', provider: data.provider }]);

      } else {
        // Non-streaming (files/images/video)
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, stream: false }),
        });
        const data = await res.json();
        setMessages(m => [...m, { role: 'ai', content: data.reply || '⚠️ No response', provider: data.provider }]);
      }

    } catch {
      setMessages(m => [...m, { role: 'ai', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !attachment) || loading) return;
    const att = attachment;
    const userContent = text + (att ? `\n\n📎 ${att.name}` : '');
    setMessages(m => [...m, { role: 'user', content: userContent }]);
    setInput('');
    setAttachment(null);
    await sendMessage(text, att);
  };

  const formatText = (text) => text
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px;overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.6;margin:8px 0"><code>$2</code></pre>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace">$1</code>')
    .replace(/^### (.+)$/gm, '<h4 style="margin:10px 0 4px;font-size:15px;color:#e8e8f0">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin:12px 0 6px;color:#e8e8f0">$1</h3>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, s => `<ul style="padding-left:20px;margin:6px 0">${s}</ul>`)
    .replace(/\n/g, '<br>');

  if (!user) return null;

  const TOOLS = [
    { id:'image',     label:'Image Generator', icon:'🎨' },
    { id:'video',     label:'Image → Video',   icon:'🎬' },
    { id:'animation', label:'AI Animation',    icon:'✨' },
    { id:'talk',      label:'Live Camera',     icon:'📹' },
  ];

  const CHIPS = [
    { icon:'💡', label:'Explain quantum computing' },
    { icon:'🐍', label:'Write a Python function' },
    { icon:'✏️', label:'Give me startup ideas' },
    { icon:'🖼️', label:'Analyze an image' },
  ];

  const AGENT_CHIPS = [
    { icon:'🌐', label:'Research a topic and write a report' },
    { icon:'💻', label:'Build a full landing page' },
    { icon:'📊', label:'Analyze data and create insights' },
    { icon:'📧', label:'Write and refine a marketing email' },
  ];

  const CODE_CHIPS = [
    { icon:'🐛', label:'Debug this code' },
    { icon:'⚡', label:'Optimize my function' },
    { icon:'🔄', label:'Refactor this component' },
    { icon:'📝', label:'Explain this code' },
  ];

  const chips = mode === 'agent' ? AGENT_CHIPS : mode === 'code' ? CODE_CHIPS : CHIPS;

  const modeColors = { chat: '#00c6ff', code: '#56d364', agent: '#f0883e', video: '#a78bfa' };
  const currentColor = modeColors[mode];

  const actionBtn = (active, color) => ({
    display:'flex', alignItems:'center', justifyContent:'center', gap:4,
    padding:'4px 9px', borderRadius:20,
    background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
    border: `0.5px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
    color: active ? color : 'rgba(255,255,255,0.4)',
    cursor:'pointer', fontSize:12, transition:'all 0.15s', fontFamily:'inherit',
  });

  const modeBtn = (m) => ({
    display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
    borderRadius:8, border:'none', cursor:'pointer', fontSize:12,
    fontFamily:'inherit', transition:'all 0.15s',
    background: mode===m.id ? `${modeColors[m.id]}15` : 'rgba(255,255,255,0.04)',
    color: mode===m.id ? modeColors[m.id] : 'rgba(255,255,255,0.5)',
    outline: mode===m.id ? `1px solid ${modeColors[m.id]}40` : '1px solid rgba(255,255,255,0.08)',
  });

  return (
    <div style={{display:'flex',height:'100vh',background:'#0f0f13',color:'#e8e8f0',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden'}}>

      {showPopup && (
        <NewChatPopup
          hasHistory={savedMsgs.length > 0}
          onNewChat={() => { setMessages([]); setAttachment(null); setActive('chat'); setShowPopup(false); }}
          onContinue={() => { setMessages(savedMsgs); setActive('chat'); setShowPopup(false); }}
          onCancel={() => setShowPopup(false)}
        />
      )}

      {showLive && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:'100%',maxWidth:580,height:'88vh',background:'#0d0d16',borderRadius:20,border:'1px solid rgba(255,255,255,0.1)',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
            <button onClick={() => setShowLive(false)} style={{position:'absolute',top:14,right:16,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:22,cursor:'pointer',zIndex:10}}>✕</button>
            <LiveTool />
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{width:210,background:'#0d0d14',borderRight:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',flexShrink:0,padding:'12px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 14px 12px'}}>
          <div style={{width:28,height:28,borderRadius:6,background:'linear-gradient(135deg,#00c6ff,#8a2be2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>CX</div>
          <span style={{fontWeight:600,fontSize:15,letterSpacing:'0.5px'}}>COGNORYX</span>
        </div>

        <div style={{padding:'0 10px 8px'}}>
          <button onClick={handleNewChat} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:8,background:activeTool==='chat'?'rgba(255,255,255,0.08)':'transparent',border:'none',color:'#e8e8f0',cursor:'pointer',fontSize:13}}>
            <span>✏️</span> New Chat
          </button>
        </div>

        <div style={{padding:'4px 14px 6px',fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px'}}>RECENT</div>
        {['Getting started','Image generation tips'].map(r => (
          <button key={r} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',background:'transparent',border:'none',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:12,textAlign:'left',width:'100%'}}>
            <span style={{fontSize:11}}>💬</span>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r}</span>
          </button>
        ))}

        <div style={{padding:'12px 14px 6px',fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'1px'}}>TOOLS</div>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => t.id==='talk' ? setShowLive(true) : setActive(t.id)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',background:activeTool===t.id?'rgba(255,255,255,0.07)':'transparent',border:'none',color:activeTool===t.id?'#e8e8f0':'rgba(255,255,255,0.55)',cursor:'pointer',fontSize:12,textAlign:'left',width:'100%',borderRadius:6,margin:'1px 0'}}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}

        <div style={{flex:1}}/>

        <div style={{padding:'10px 14px 6px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#00c6ff,#8a2be2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:'#fff',flexShrink:0}}>
              {user.displayName?.[0]?.toUpperCase()||user.email?.[0]?.toUpperCase()||'U'}
            </div>
            <div style={{overflow:'hidden'}}>
              <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.displayName||user.email?.split('@')[0]}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>Free Plan</div>
            </div>
          </div>
          <button style={{width:'100%',padding:'8px',borderRadius:8,background:'linear-gradient(135deg,#00c6ff,#8a2be2)',border:'none',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',marginBottom:6}}>⚡ Upgrade to Pro</button>
          <button onClick={handleSignOut} style={{width:'100%',padding:'6px',borderRadius:8,background:'transparent',border:'none',color:'rgba(255,255,255,0.35)',fontSize:11,cursor:'pointer'}}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Top bar with mode selector */}
        <div style={{padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.7)'}}>
            {activeTool==='chat' ? 'New Chat' : TOOLS.find(t=>t.id===activeTool)?.label||'New Chat'}
          </div>

          {/* Mode selector - only show for chat */}
          {activeTool === 'chat' && (
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={modeBtn(m)} title={m.desc}>
                  <span>{m.icon}</span><span>{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mode banner */}
        {activeTool === 'chat' && mode !== 'chat' && (
          <div style={{padding:'10px 20px',background:`${currentColor}08`,borderBottom:`1px solid ${currentColor}20`,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:18}}>{MODES.find(m=>m.id===mode)?.icon}</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:currentColor}}>{MODES.find(m=>m.id===mode)?.label} Mode Active</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{MODES.find(m=>m.id===mode)?.desc}</div>
            </div>
            {mode==='video' && <div style={{marginLeft:'auto',fontSize:11,color:'rgba(255,255,255,0.4)'}}>📎 Attach a video file to analyze</div>}
          </div>
        )}

        {activeTool === 'image' ? (
          <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}><ImageTool /></div>
        ) : activeTool !== 'chat' ? (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.3)'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>{TOOLS.find(t=>t.id===activeTool)?.icon}</div>
              <div style={{fontSize:16}}>{TOOLS.find(t=>t.id===activeTool)?.label}</div>
              <div style={{fontSize:13,marginTop:6,opacity:0.5}}>Coming soon</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{flex:1,overflowY:'auto',padding:'20px'}}>
              {messages.length === 0 && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,textAlign:'center'}}>
                  <div style={{width:64,height:64,borderRadius:16,background:`linear-gradient(135deg,${currentColor}22,rgba(138,43,226,0.15))`,border:`1px solid ${currentColor}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>
                    {MODES.find(m=>m.id===mode)?.icon||'🧠'}
                  </div>
                  <h2 style={{fontSize:26,fontWeight:600,color:'#e8e8f0',margin:0}}>
                    {mode==='agent' ? 'COGNORYX Agents' : mode==='code' ? 'Code Agent' : mode==='video' ? 'Video Analysis' : 'How can I help you?'}
                  </h2>
                  <p style={{fontSize:14,color:'rgba(255,255,255,0.4)',margin:0,maxWidth:460}}>
                    {mode==='agent' ? 'Give me a complex task and I\'ll break it down and execute it step by step autonomously.' :
                     mode==='code'  ? 'Paste your code, describe bugs, or ask me to write, refactor, or optimize anything.' :
                     mode==='video' ? 'Attach a video or screen recording and I\'ll analyze what\'s happening in detail.' :
                     'Ask anything, upload images or documents, or use the tools on the left.'}
                  </p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8,width:'100%',maxWidth:520}}>
                    {chips.map(c => (
                      <button key={c.label} onClick={() => { setInput(c.label); inputRef.current?.focus(); }}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:`1px solid rgba(255,255,255,0.08)`,color:'rgba(255,255,255,0.7)',cursor:'pointer',fontSize:13,textAlign:'left',transition:'all 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background=`${currentColor}10`}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
                        <span style={{fontSize:18}}>{c.icon}</span><span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{display:'flex',gap:10,marginBottom:20,flexDirection:m.role==='user'?'row-reverse':'row'}}>
                  <div style={{width:30,height:30,borderRadius:'50%',background:m.role==='user'?'linear-gradient(135deg,#00c6ff,#8a2be2)':'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0}}>
                    {m.role==='user'?(user.email?.[0]?.toUpperCase()||'U'):'CX'}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:6,maxWidth:'78%',alignItems:m.role==='user'?'flex-end':'flex-start'}}>
                    <div style={{padding:'12px 16px',borderRadius:12,background:m.role==='user'?'linear-gradient(135deg,rgba(0,198,255,0.15),rgba(138,43,226,0.15))':'rgba(255,255,255,0.05)',border:'1px solid',borderColor:m.role==='user'?'rgba(0,198,255,0.2)':'rgba(255,255,255,0.07)',fontSize:14,lineHeight:1.7}}
                      dangerouslySetInnerHTML={{__html:formatText(m.content)}}/>

                    {/* Streaming indicator */}
                    {m.streaming && (
                      <div style={{width:8,height:8,borderRadius:'50%',background:currentColor,animation:'blink 0.8s ease-in-out infinite',marginTop:-4}}/>
                    )}

                    {/* Provider badge */}
                    {m.role==='ai' && m.provider && !m.streaming && (
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',letterSpacing:'0.5px'}}>via {m.provider}</div>
                    )}

                    {/* Action buttons */}
                    {m.role==='ai' && !m.streaming && (
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:2}}>
                        <button onClick={() => retry(i)} style={actionBtn(false,'#00c6ff')}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,198,255,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
                          🔄 <span style={{fontSize:11}}>Retry</span>
                        </button>
                        <button onClick={() => react(i,'like')} style={actionBtn(reactions[i]==='like','#56d364')}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(86,211,100,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background=reactions[i]==='like'?'rgba(86,211,100,0.1)':'rgba(255,255,255,0.04)'}>
                          👍
                        </button>
                        <button onClick={() => react(i,'dislike')} style={actionBtn(reactions[i]==='dislike','#f85149')}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(248,81,73,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background=reactions[i]==='dislike'?'rgba(248,81,73,0.1)':'rgba(255,255,255,0.04)'}>
                          👎
                        </button>
                        <button onClick={() => copyMessage(m.content,i)} style={actionBtn(copied===i,'#8a2be2')}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(138,43,226,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background=copied===i?'rgba(138,43,226,0.1)':'rgba(255,255,255,0.04)'}>
                          {copied===i?'✅':'📋'} <span style={{fontSize:11}}>{copied===i?'Copied!':'Copy'}</span>
                        </button>
                        <button onClick={() => speak(m.content,i)} style={actionBtn(speaking===i,'#00c6ff')}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,198,255,0.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background=speaking===i?'rgba(0,198,255,0.1)':'rgba(255,255,255,0.04)'}>
                          {speaking===i?'⏹':'🔊'} <span style={{fontSize:11}}>{speaking===i?'Stop':'Listen'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{display:'flex',gap:10,marginBottom:16}}>
                  <CognoryxThinking />
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {attachment && (
              <div style={{margin:'0 20px 8px',padding:'8px 12px',borderRadius:10,background:'rgba(0,198,255,0.08)',border:'1px solid rgba(0,198,255,0.2)',display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(255,255,255,0.7)'}}>
                <span style={{fontSize:18}}>{attachment.type.startsWith('image')?'🖼️':attachment.type.startsWith('video')?'🎥':attachment.type.includes('pdf')?'📄':'📎'}</span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{attachment.name}</span>
                <button onClick={() => setAttachment(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16,padding:0}}>✕</button>
              </div>
            )}

            <div style={{padding:'12px 20px 16px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
              <input ref={fileRef} type="file"
                accept={mode==='video' ? 'video/*,image/*,.pdf,.txt,.doc,.docx,.csv,.json,.md' : 'image/*,.pdf,.txt,.doc,.docx,.csv,.json,.md'}
                onChange={handleFile} style={{display:'none'}}/>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:14,background:'rgba(255,255,255,0.04)',border:`1px solid ${loading?currentColor+'40':'rgba(255,255,255,0.09)'}`,transition:'border 0.3s'}}>
                <button onClick={() => fileRef.current?.click()} title="Attach file"
                  style={{width:34,height:34,borderRadius:'50%',background:attachment?'rgba(0,198,255,0.15)':'rgba(255,255,255,0.07)',border:attachment?'1px solid rgba(0,198,255,0.4)':'1px solid rgba(255,255,255,0.12)',cursor:'pointer',fontSize:17,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:attachment?'#00c6ff':'rgba(255,255,255,0.5)',transition:'all 0.2s'}}>
                  {mode==='video'?'🎥':'📎'}
                </button>
                <textarea ref={inputRef} value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
                  onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,140)+'px';}}
                  placeholder={
                    mode==='agent' ? 'Describe a complex task for COGNORYX Agents...' :
                    mode==='code'  ? 'Paste code or describe what you need...' :
                    mode==='video' ? 'Attach a video and ask anything about it...' :
                    'Message COGNORYX...'}
                  rows={1}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8e8f0',fontSize:14,resize:'none',lineHeight:1.5,fontFamily:'inherit'}}/>
                <button onClick={() => setShowLive(true)} title="Live AI"
                  style={{width:34,height:34,borderRadius:'50%',background:'rgba(138,43,226,0.15)',border:'1px solid rgba(138,43,226,0.35)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(138,43,226,0.3)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(138,43,226,0.15)'}>
                  📹
                </button>
                <button onClick={send} disabled={loading||(!input.trim()&&!attachment)}
                  style={{width:34,height:34,borderRadius:'50%',background:(input.trim()||attachment)?`linear-gradient(135deg,${currentColor},#8a2be2)`:'rgba(255,255,255,0.08)',border:'none',cursor:(input.trim()||attachment)?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.2s'}}>
                  <svg viewBox="0 0 24 24" fill="white" width="15" height="15"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
              <p style={{textAlign:'center',fontSize:11,color:'rgba(255,255,255,0.2)',marginTop:8}}>COGNORYX can make mistakes. Verify important information.</p>
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
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        pre{white-space:pre-wrap;word-break:break-all}
      `}</style>
    </div>
  );
}