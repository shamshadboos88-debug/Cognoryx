'use client';
// components/LiveTool.js
// Uses Web Speech API for mic + Gemini via /api/chat for responses + TTS for Aria voice

import { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT = `You are Aria, the intelligent AI assistant for COGNORYX — a premium AI platform.
You are warm, friendly, and helpful. Speak in short natural sentences.
Keep replies to 1-2 sentences maximum for smooth voice conversation.`;

const S = {
  page: { display:'flex', flexDirection:'column', height:'100%', minHeight:'80vh', background:'transparent', color:'#e8e8f0', fontFamily:'inherit' },
  center: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', gap:20 },
  avatarWrap: { position:'relative', width:140, height:140 },
  ring: { position:'absolute', inset:-12, borderRadius:'50%', border:'1.5px solid transparent', background:'linear-gradient(#0a0a0f,#0a0a0f) padding-box, linear-gradient(135deg,#00c6ff,#8a2be2) border-box', animation:'cxSpin 3s linear infinite' },
  ring2: { position:'absolute', inset:-22, borderRadius:'50%', border:'1px solid rgba(138,43,226,0.15)', animation:'cxSpin 7s linear infinite reverse' },
  avatar: (s) => ({ width:140, height:140, borderRadius:'50%', background:'linear-gradient(135deg,#18052e,#021528)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: s==='speaking' ? '0 0 0 3px rgba(0,198,255,0.5),0 0 0 8px rgba(0,198,255,0.1)' : s==='listening' ? '0 0 0 3px rgba(138,43,226,0.4)' : 'none', transition:'box-shadow 0.3s' }),
  avatarInner: { width:86, height:86, borderRadius:'50%', background:'linear-gradient(135deg,rgba(0,198,255,0.08),rgba(138,43,226,0.12))', border:'1.5px solid rgba(0,198,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42 },
  nameBlock: { textAlign:'center' },
  aiName: { fontSize:22, fontWeight:600, background:'linear-gradient(90deg,#00c6ff,#8a2be2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  aiSub: { fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4 },
  statusRow: { display:'flex', alignItems:'center', gap:8 },
  dot: (a) => ({ width:7, height:7, borderRadius:'50%', background: a ? '#00c6ff' : 'rgba(255,255,255,0.18)', transition:'background 0.3s' }),
  statusText: { fontSize:13, color:'rgba(255,255,255,0.4)' },
  waveform: { display:'flex', alignItems:'center', gap:3, height:32 },
  bar: (h) => ({ width:3, height:h, borderRadius:2, background:'linear-gradient(to top,#00c6ff,#8a2be2)', transition:'height 0.11s ease', minHeight:4 }),
  transcript: { width:'100%', maxWidth:520, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px', minHeight:80, display:'flex', flexDirection:'column', gap:8, maxHeight:160, overflowY:'auto' },
  transcriptEmpty: { fontSize:13, color:'rgba(255,255,255,0.22)' },
  aiLine: { fontSize:13, color:'#a78bfa', lineHeight:1.5 },
  userLine: { fontSize:12, color:'rgba(255,255,255,0.38)', lineHeight:1.5 },
  lineLabel: { fontSize:10, fontWeight:700, letterSpacing:'0.5px', marginRight:6, opacity:0.6, textTransform:'uppercase' },
  errorBox: { fontSize:12, color:'#ff9f9f', padding:'10px 14px', background:'rgba(255,80,80,0.08)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:10, maxWidth:480, textAlign:'center', lineHeight:1.5 },
  controls: { display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(13,13,22,0.8)' },
  btn: (active, color) => ({ height:50, borderRadius:25, border:'1px solid', cursor:'pointer', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s', flex:1, background: active ? `rgba(${color},0.15)` : 'rgba(255,255,255,0.06)', borderColor: active ? `rgba(${color},0.4)` : 'rgba(255,255,255,0.1)', color: active ? `rgb(${color})` : 'rgba(255,255,255,0.6)' }),
  btnCall: (live) => ({ height:50, borderRadius:25, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s', flex:2, background: live ? 'linear-gradient(135deg,#00c6ff,#8a2be2)' : 'rgba(138,43,226,0.12)', color: live ? '#fff' : '#c4b5fd', borderColor:'rgba(138,43,226,0.3)' }),
  tip: { textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.15)', padding:'8px 16px 12px' },
};

if (typeof document !== 'undefined' && !document.getElementById('cx-kf')) {
  const s = document.createElement('style');
  s.id = 'cx-kf';
  s.textContent = `@keyframes cxSpin{to{transform:rotate(360deg)}} @keyframes cxBlink{0%,100%{opacity:1}50%{opacity:0.3}}`;
  document.head.appendChild(s);
}

export default function LiveTool() {
  const [phase, setPhase]     = useState('idle');
  const [isLive, setIsLive]   = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lines, setLines]     = useState([]);
  const [timer, setTimer]     = useState('00:00');
  const [bars, setBars]       = useState(Array(12).fill(4));
  const [error, setError]     = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const recognRef  = useRef(null);
  const timerRef   = useRef(null);
  const secsRef    = useRef(0);
  const waveRef    = useRef(null);
  const speakRef   = useRef(false);
  const isLiveRef  = useRef(false);
  const historyRef = useRef([]);

  useEffect(() => { isLiveRef.current = isLive; }, [isLive]);
  useEffect(() => { historyRef.current = chatHistory; }, [chatHistory]);

  // ── Timer ──────────────────────────────────────────
  const startTimer = () => {
    secsRef.current = 0;
    timerRef.current = setInterval(() => {
      secsRef.current++;
      const m = String(Math.floor(secsRef.current / 60)).padStart(2, '0');
      const s = String(secsRef.current % 60).padStart(2, '0');
      setTimer(`${m}:${s}`);
    }, 1000);
  };
  const stopTimer = () => { clearInterval(timerRef.current); setTimer('00:00'); };

  // ── Waveform ───────────────────────────────────────
  const startWave = () => {
    waveRef.current = setInterval(() => {
      setBars(Array(12).fill(0).map(() => 4 + Math.floor(Math.random() * 26)));
    }, 110);
  };
  const stopWave = () => { clearInterval(waveRef.current); setBars(Array(12).fill(4)); };

  // ── Speak ──────────────────────────────────────────
  const speak = (text, onDone) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find(v =>
      v.name.includes('Google UK English Female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Microsoft Zira') ||
      v.name.includes('Karen') ||
      v.name.includes('Moira') ||
      v.name.includes('Female')
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (female) utt.voice = female;
    utt.rate  = 1.0;
    utt.pitch = 1.1;
    utt.lang  = 'en-US';
    speakRef.current = true;
    setPhase('speaking');
    utt.onend = () => {
      speakRef.current = false;
      if (isLiveRef.current) { setPhase('listening'); startListening(); }
      onDone?.();
    };
    utt.onerror = () => {
      speakRef.current = false;
      if (isLiveRef.current) { setPhase('listening'); startListening(); }
    };
    window.speechSynthesis.speak(utt);
  };

  // ── Ask Aria via /api/chat (safe — key stays on server) ──
  const askAria = async (userText) => {
    setPhase('thinking');

    // Build messages array with history for context
    const msgs = [
      ...historyRef.current,
      { role: 'user', content: userText }
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs,
          message: userText,       // ✅ send both for compatibility
          mode: 'chat',
          systemPrompt: SYSTEM_PROMPT,
          stream: false,           // ✅ simple JSON response for voice
        }),
      });

      // ✅ Simple JSON parse — no streaming reader
      const data = await res.json();
      const reply = (data.reply || data.text || data.content || data.message || "I'm here to help!").trim();

      // Save to history
      const updatedHistory = [
        ...historyRef.current,
        { role: 'user', content: userText },
        { role: 'assistant', content: reply },
      ];
      historyRef.current = updatedHistory.slice(-10);
      setChatHistory(historyRef.current);

      addLine('ai', reply);
      speak(reply);

    } catch (err) {
      console.error('[Aria error]', err);
      const fallback = "Sorry, I had a connection issue. Please try again.";
      addLine('ai', fallback);
      speak(fallback);
      setError('⚠️ ' + err.message);
    }
  };

  // ── Speech Recognition ─────────────────────────────
  const startListening = () => {
    if (!isLiveRef.current || speakRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('❌ Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    const r = new SR();
    recognRef.current = r;
    r.continuous     = false;
    r.interimResults = false;
    r.lang           = 'en-US';

    setPhase('listening');

    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text && isLiveRef.current) {
        addLine('user', text);
        askAria(text);
      }
    };

    r.onerror = (e) => {
      if (e.error === 'no-speech' && isLiveRef.current) {
        setTimeout(() => startListening(), 500);
      } else if (e.error === 'not-allowed') {
        setError('❌ Microphone permission denied. Please allow mic access in your browser.');
        endCall();
      }
    };

    r.onend = () => {
      if (isLiveRef.current && !speakRef.current) {
        setTimeout(() => startListening(), 300);
      }
    };

    try { r.start(); } catch (e) { console.log('[SR error]', e); }
  };

  // ── Start Call ─────────────────────────────────────
  const startCall = () => {
    setError('');
    setLines([]);
    setChatHistory([]);
    historyRef.current = [];
    setIsLive(true);
    isLiveRef.current = true;
    startTimer();
    startWave();

    const greeting = "Hello! I'm Aria, your COGNORYX AI assistant. How can I help you today?";
    addLine('ai', greeting);

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speak(greeting);
      } else {
        window.speechSynthesis.onvoiceschanged = () => speak(greeting);
      }
    };
    trySpeak();
  };

  // ── End Call ───────────────────────────────────────
  const endCall = () => {
    window.speechSynthesis.cancel();
    recognRef.current?.stop();
    isLiveRef.current = false;
    setIsLive(false);
    setIsMuted(false);
    setPhase('ended');
    stopTimer();
    stopWave();
    speakRef.current = false;
  };

  const toggleMic = () => {
    if (!isLive) return;
    if (isMuted) {
      setIsMuted(false);
      setPhase('listening');
      startListening();
    } else {
      setIsMuted(true);
      setPhase('muted');
      recognRef.current?.stop();
      window.speechSynthesis.cancel();
    }
  };

  const addLine = (role, text) => setLines(p => [...p.slice(-10), { role, text }]);

  useEffect(() => () => { endCall(); }, []);

  const statusMap = {
    idle:      'Tap "Start live call" to begin',
    speaking:  'Aria is speaking...',
    listening: 'Listening — speak now...',
    thinking:  'Aria is thinking...',
    muted:     'Muted — tap mic to resume',
    ended:     'Session ended — tap to start again',
  };

  const emoji = phase === 'speaking' ? '🔊' : phase === 'listening' ? '🎤' : phase === 'thinking' ? '🧠' : '🤖';

  return (
    <div style={S.page}>
      <div style={S.center}>

        {/* Avatar */}
        <div style={S.avatarWrap}>
          <div style={S.ring} />
          <div style={S.ring2} />
          <div style={S.avatar(phase)}>
            <div style={S.avatarInner}>{emoji}</div>
          </div>
        </div>

        {/* Name */}
        <div style={S.nameBlock}>
          <div style={S.aiName}>Aria</div>
          <div style={S.aiSub}>COGNORYX AI · Live Voice</div>
        </div>

        {/* Status */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={S.statusRow}>
            <div style={{ ...S.dot(isLive && phase !== 'muted'), ...(isLive && phase !== 'muted' ? { animation:'cxBlink 1.1s ease-in-out infinite' } : {}) }} />
            <span style={S.statusText}>{statusMap[phase]}</span>
          </div>
          {isLive && <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontVariantNumeric:'tabular-nums' }}>{timer}</span>}
        </div>

        {/* Error */}
        {error && <div style={S.errorBox}>{error}</div>}

        {/* Waveform */}
        <div style={S.waveform}>
          {bars.map((h, i) => <div key={i} style={S.bar(h)} />)}
        </div>

        {/* Transcript */}
        <div style={S.transcript}>
          {lines.length === 0
            ? <span style={S.transcriptEmpty}>Your conversation will appear here...</span>
            : lines.map((l, i) => (
              <div key={i} style={l.role === 'ai' ? S.aiLine : S.userLine}>
                <span style={S.lineLabel}>{l.role === 'ai' ? 'Aria' : 'You'}</span>{l.text}
              </div>
            ))
          }
        </div>
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <button style={{ ...S.btn(isMuted, '255,80,80'), maxWidth:60 }} onClick={toggleMic}>
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button style={S.btnCall(isLive)} onClick={isLive ? endCall : startCall}>
          {isLive ? '📵  End session' : '📞  Start live call'}
        </button>
        <button style={{ ...S.btn(false, '138,43,226'), maxWidth:60 }}
          onClick={() => { window.speechSynthesis.cancel(); if (isLive) { setPhase('listening'); startListening(); } }}>
          ⏭️
        </button>
      </div>

      <div style={S.tip}>Uses Web Speech API · Works best on Chrome · Powered by COGNORYX AI</div>
    </div>
  );
}