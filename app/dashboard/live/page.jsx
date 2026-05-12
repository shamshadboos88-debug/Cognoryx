'use client';
// ─────────────────────────────────────────────────────────────────
//  COGNORYX — Live AI Call page
//  Place this file at:  app/dashboard/live/page.jsx
//  Place CSS at:        app/dashboard/live/live.module.css
// ─────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './live.module.css';

const VOICE_NAME  = 'Aoede';   // Best lady voice. Options: Aoede, Kore, Charon, Fenrir, Puck
const SYSTEM_PROMPT = `You are Aria, the intelligent female AI assistant for COGNORYX — 
a premium AI platform. You are warm, sharp, and helpful. Speak naturally in short 
conversational sentences. You can see the user's camera when they share it. 
Keep every reply under 3 sentences unless the user asks for more detail.`;

export default function LivePage() {
  const [phase, setPhase]       = useState('idle');   // idle|connecting|listening|speaking|muted|ended
  const [isLive, setIsLive]     = useState(false);
  const [isMuted, setIsMuted]   = useState(false);
  const [isCamOn, setIsCamOn]   = useState(false);
  const [transcript, setTrans]  = useState([]);
  const [timer, setTimer]       = useState('00:00');
  const [bars, setBars]         = useState(Array(12).fill(4));

  const wsRef        = useRef(null);
  const audioCtxRef  = useRef(null);
  const micSrcRef    = useRef(null);
  const processorRef = useRef(null);
  const streamRef    = useRef(null);
  const camStreamRef = useRef(null);
  const videoRef     = useRef(null);
  const queueRef     = useRef([]);
  const playingRef   = useRef(false);
  const timerRef     = useRef(null);
  const secsRef      = useRef(0);
  const waveRef      = useRef(null);
  const camIntRef    = useRef(null);
  const mutedRef     = useRef(false);   // stable ref for audio processor closure

  // keep mutedRef in sync
  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);

  // ── TIMER ────────────────────────────────────────────────────
  const startTimer = () => {
    secsRef.current = 0;
    timerRef.current = setInterval(() => {
      secsRef.current += 1;
      const m = String(Math.floor(secsRef.current / 60)).padStart(2, '0');
      const s = String(secsRef.current % 60).padStart(2, '0');
      setTimer(`${m}:${s}`);
    }, 1000);
  };
  const stopTimer = () => { clearInterval(timerRef.current); setTimer('00:00'); };

  // ── WAVEFORM ─────────────────────────────────────────────────
  const startWave = () => {
    waveRef.current = setInterval(() => {
      setBars(Array(12).fill(0).map(() => 4 + Math.floor(Math.random() * 26)));
    }, 110);
  };
  const stopWave = () => { clearInterval(waveRef.current); setBars(Array(12).fill(4)); };

  // ── AUDIO PLAYBACK QUEUE ──────────────────────────────────────
  const playNext = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return;
    playingRef.current = true;
    setPhase('speaking');
    const ctx   = audioCtxRef.current;
    const bytes = queueRef.current.shift();
    try {
      const buf    = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => {
        playingRef.current = false;
        if (queueRef.current.length > 0) playNext();
        else setPhase('listening');
      };
    } catch {
      playingRef.current = false;
      playNext();
    }
  }, []);

  // ── GEMINI LIVE WEBSOCKET ─────────────────────────────────────
  const connect = useCallback(async () => {
    setPhase('connecting');
    const key    = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const wsUrl  = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`;
    const ws     = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        setup: {
          model: 'models/gemini-2.0-flash-exp',
          generation_config: {
            response_modalities: ['AUDIO'],
            speech_config: {
              voice_config: { prebuilt_voice_config: { voice_name: VOICE_NAME } }
            }
          },
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] }
        }
      }));
    };

    ws.onmessage = async (evt) => {
      const raw  = evt.data instanceof Blob ? await evt.data.text() : evt.data;
      const data = JSON.parse(raw);

      // Setup complete → start mic, timer, waveform
      if (data.setupComplete) {
        setIsLive(true);
        setPhase('listening');
        startTimer();
        startWave();
        startMic();
        // Trigger Aria greeting
        ws.send(JSON.stringify({
          client_content: {
            turns: [{ role: 'user', parts: [{ text: 'Say a short welcome greeting as Aria.' }] }],
            turn_complete: true
          }
        }));
        return;
      }

      // Incoming audio from Aria
      const parts = data.serverContent?.modelTurn?.parts ?? [];
      for (const p of parts) {
        if (p.inlineData?.mimeType?.startsWith('audio/')) {
          const bin   = atob(p.inlineData.data);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          queueRef.current.push(bytes);
          playNext();
        }
        if (p.text) addLine('ai', p.text);
      }

      // User speech transcription
      if (data.serverContent?.inputTranscription) addLine('user', data.serverContent.inputTranscription);
    };

    ws.onerror = () => { setPhase('idle'); cleanup(); };
    ws.onclose = () => { if (isLive) endCall(); };

    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  }, [playNext]);

  // ── MICROPHONE ────────────────────────────────────────────────
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx  = audioCtxRef.current;
      const src  = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      micSrcRef.current    = src;
      processorRef.current = proc;

      proc.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== 1 || mutedRef.current) return;
        const raw  = e.inputBuffer.getChannelData(0);
        const pcm  = new Int16Array(raw.length);
        for (let i = 0; i < raw.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, raw[i] * 32768));
        const b64  = btoa(String.fromCharCode(...new Uint8Array(pcm.buffer)));
        wsRef.current.send(JSON.stringify({
          realtime_input: { media_chunks: [{ mime_type: 'audio/pcm', data: b64 }] }
        }));
      };

      src.connect(proc);
      proc.connect(ctx.destination);
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  // ── CAMERA ────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      camStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 240;
      const ctx2d  = canvas.getContext('2d');

      camIntRef.current = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== 1) return;
        if (videoRef.current) ctx2d.drawImage(videoRef.current, 0, 0, 320, 240);
        const b64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        wsRef.current.send(JSON.stringify({
          realtime_input: { media_chunks: [{ mime_type: 'image/jpeg', data: b64 }] }
        }));
      }, 1000);

      setIsCamOn(true);
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    clearInterval(camIntRef.current);
    camStreamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCamOn(false);
  };

  // ── CLEANUP ───────────────────────────────────────────────────
  const cleanup = () => {
    processorRef.current?.disconnect();
    micSrcRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    stopCamera();
    stopTimer();
    stopWave();
    queueRef.current  = [];
    playingRef.current = false;
  };

  // ── CALL CONTROLS ─────────────────────────────────────────────
  const startCall = () => connect();

  const endCall = () => {
    wsRef.current?.close();
    cleanup();
    setIsLive(false);
    setIsMuted(false);
    setPhase('ended');
    setTrans([]);
  };

  const toggleMic = () => {
    if (!isLive) return;
    setIsMuted(m => {
      const next = !m;
      setPhase(next ? 'muted' : 'listening');
      return next;
    });
  };

  const toggleCam = () => { isCamOn ? stopCamera() : startCamera(); };

  const addLine = (role, text) => setTrans(p => [...p.slice(-8), { role, text }]);

  useEffect(() => () => cleanup(), []);

  // ── STATUS LABEL ─────────────────────────────────────────────
  const statusMap = {
    idle:       'Tap "Start live call" to begin',
    connecting: 'Connecting to Aria...',
    listening:  'Aria is listening...',
    speaking:   'Aria is speaking...',
    muted:      'You are muted — Aria is waiting',
    ended:      'Session ended'
  };

  return (
    <div className={styles.page}>
      {/* ── Topbar ── */}
      <div className={styles.topbar}>
        <div className={styles.topLeft}>
          <span className={styles.pageTitle}>Live AI Call</span>
          {isLive && <span className={styles.liveDot} />}
        </div>
        <span className={`${styles.badge} ${isLive ? styles.badgeLive : ''}`}>
          {isLive ? '● Live' : 'Live AI'}
        </span>
        <span className={styles.timer}>{timer}</span>
      </div>

      {/* ── Main ── */}
      <div className={styles.main}>

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <div className={styles.ring} />
          <div className={styles.ring2} />
          <div className={`${styles.avatar} ${phase === 'speaking' ? styles.avatarSpeaking : ''}`}>
            <div className={styles.avatarInner}>
              {/* Aria face SVG */}
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="26" fill="url(#bg)" />
                <defs>
                  <radialGradient id="bg" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#2a0a4a"/>
                    <stop offset="100%" stopColor="#0a1a33"/>
                  </radialGradient>
                </defs>
                {/* Eyes */}
                <ellipse cx="19" cy="22" rx="3" ry="3.5" fill="#00c6ff" opacity="0.9"/>
                <ellipse cx="33" cy="22" rx="3" ry="3.5" fill="#00c6ff" opacity="0.9"/>
                <circle cx="19" cy="21" r="1.2" fill="white"/>
                <circle cx="33" cy="21" r="1.2" fill="white"/>
                {/* Smile */}
                <path d="M19 33 Q26 39 33 33" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none"/>
                {/* Crown glow */}
                <ellipse cx="26" cy="10" rx="10" ry="4" fill="#8a2be2" opacity="0.3"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className={styles.nameBlock}>
          <div className={styles.aiName}>Aria</div>
          <div className={styles.aiSub}>COGNORYX AI · Lady Voice</div>
        </div>

        {/* Status */}
        <div className={styles.statusRow}>
          <div className={`${styles.statusDot} ${isLive && phase !== 'muted' ? styles.statusDotActive : ''}`} />
          <span className={styles.statusText}>{statusMap[phase]}</span>
        </div>

        {/* Waveform */}
        <div className={styles.waveform} aria-hidden="true">
          {bars.map((h, i) => (
            <div key={i} className={styles.bar} style={{ height: `${h}px` }} />
          ))}
        </div>

        {/* Transcript */}
        <div className={styles.transcript}>
          {transcript.length === 0
            ? <span className={styles.transcriptEmpty}>Your conversation will appear here...</span>
            : transcript.map((t, i) => (
              <div key={i} className={t.role === 'ai' ? styles.aiLine : styles.userLine}>
                <span className={styles.lineLabel}>{t.role === 'ai' ? 'Aria' : 'You'}</span>
                {t.text}
              </div>
            ))
          }
        </div>

        {/* Camera */}
        <div className={`${styles.camBox} ${isCamOn ? styles.camBoxOn : ''}`}>
          {isCamOn
            ? <>
                <span className={styles.camLabel}>Your camera</span>
                <video ref={videoRef} autoPlay muted playsInline className={styles.camVideo} />
              </>
            : <span className={styles.camOffText}>
                <span style={{ fontSize: 20, marginRight: 8 }}>📹</span>
                Camera off — tap camera icon to enable
              </span>
          }
        </div>
      </div>

      {/* ── Controls ── */}
      <div className={styles.controls}>
        <button
          className={`${styles.btn} ${styles.btnMic} ${isMuted ? styles.btnMuted : isLive ? styles.btnMicOn : ''}`}
          onClick={toggleMic}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button
          className={`${styles.btn} ${styles.btnCall} ${isLive ? styles.btnCallLive : ''}`}
          onClick={isLive ? endCall : startCall}
        >
          {isLive ? '📵  End session' : '📞  Start live call'}
        </button>

        <button
          className={`${styles.btn} ${styles.btnCam} ${isCamOn ? styles.btnCamOn : ''}`}
          onClick={toggleCam}
          aria-label={isCamOn ? 'Turn camera off' : 'Turn camera on'}
          title={isCamOn ? 'Camera off' : 'Camera on'}
        >
          {isCamOn ? '📷' : '📸'}
        </button>
      </div>

      {/* ── Tip ── */}
      <div className={styles.tip}>
        COGNORYX uses Gemini 2.0 Multimodal Live for real-time voice · Lady voice: Aoede
      </div>
    </div>
  );
}