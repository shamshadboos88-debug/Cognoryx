"use client";
// components/ChatTool.js

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import styles from "./tools.module.css";
import CognoryxThinking from "./CognoryxThinking";

export default function ChatTool({
  user,
  userData,
  onUpgrade,
  onLiveClick,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [speaking, setSpeaking] = useState(null);
  const [attachment, setAttachment] = useState(null);

  // ✅ AI Provider
  const [provider, setProvider] = useState("gemini");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const plan = userData?.plan || "free";
  const usage = userData?.usage || {};
  const limit = plan === "pro" ? 999 : 20;
  const atLimit = (usage.chats || 0) >= limit;

  // =========================
  // TEXT TO SPEECH
  // =========================
  const speak = (text, index) => {
    window.speechSynthesis.cancel();

    if (speaking === index) {
      setSpeaking(null);
      return;
    }

    const clean = text
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

    const utt = new SpeechSynthesisUtterance(clean);

    const voices = window.speechSynthesis.getVoices();

    const femaleVoice =
      voices.find(
        (v) =>
          v.name.includes("Female") ||
          v.name.includes("Samantha") ||
          v.name.includes("Google UK English Female") ||
          v.name.includes("Microsoft Zira")
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];

    if (femaleVoice) utt.voice = femaleVoice;

    utt.rate = 1;
    utt.pitch = 1.1;
    utt.lang = "en-US";
    utt.onstart = () => setSpeaking(index);
    utt.onend = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);

    window.speechSynthesis.speak(utt);
  };

  // =========================
  // FILE ATTACHMENT
  // =========================
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMB = 10;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setAttachment({ name: file.name, base64, type: file.type });
      toast.success(`📎 ${file.name} attached`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAttachment = () => setAttachment(null);

  // =========================
  // SEND MESSAGE
  // =========================
  const send = async () => {
    const text = input.trim();
    if ((!text && !attachment) || loading) return;

    if (atLimit) {
      onUpgrade?.();
      return;
    }

    const userContent =
      text + (attachment ? `\n\n📎 Attached: ${attachment.name}` : "");

    const userMsg = { role: "user", content: userContent };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const att = attachment;
    setAttachment(null);
    setLoading(true);

    try {
      const body = {
        message: text || "Analyze this file",
        uid: user?.uid,
        provider,
      };

      if (att) {
        body.attachment = {
          base64: att.base64,
          type: att.type,
          name: att.name,
        };
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");

      const aiMsg = { role: "ai", content: data.reply };
      setMessages((m) => [...m, aiMsg]);

      if (messages.length === 0) {
        setHistory((h) => [
          {
            id: Date.now(),
            title: (text || att?.name).slice(0, 36) + "…",
          },
          ...h.slice(0, 9),
        ]);
      }
    } catch (err) {
      toast.error(err.message || "Failed to get response");
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          content: "⚠️ Error: " + (err.message || "Something went wrong."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORMAT TEXT
  // =========================
  const formatText = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/^### (.+)$/gm, "<h4>$1</h4>")
      .replace(/^## (.+)$/gm, "<h3>$1</h3>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
      .replace(/\n/g, "<br>");

  return (
    <div className={styles.chatLayout}>
      <div className={styles.chatMain}>
        <div className={styles.chatTopbar}>
          <div>
            <div className={styles.toolTitle}>COGNORYX AI</div>
            <div className={styles.toolSub}>Multi AI Platform</div>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`${styles.msgRow} ${
                m.role === "user" ? styles.msgUser : ""
              }`}
            >
              <div
                className={`${styles.avatar} ${
                  m.role === "user" ? styles.avatarUser : styles.avatarAi
                }`}
              >
                {m.role === "user" ? "U" : "CX"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "75%" }}>
                <div
                  className={`${styles.bubble} ${
                    m.role === "user" ? styles.bubbleUser : styles.bubbleAi
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(m.content) }}
                />

                {m.role === "ai" && (
                  <button onClick={() => speak(m.content, i)}>
                    {speaking === i ? "⏹ Stop" : "🔊 Listen"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* ✅ COGNORYX HEARTBEAT ANIMATION — shows while AI is replying */}
          {loading && (
            <div className={styles.msgRow}>
              <CognoryxThinking />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Attachment Preview */}
        {attachment && (
          <div>
            📎 {attachment.name}
            <button onClick={removeAttachment}>✕</button>
          </div>
        )}

        {/* Input Area */}
        <div className={styles.inputArea}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json,.md"
            onChange={handleFile}
            style={{ display: "none" }}
          />

          <div className={styles.inputBox}>
            {/* AI SELECTOR */}
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                background: "#111",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              <option value="gemini">Gemini</option>
              <option value="deepseek">DeepSeek</option>
              <option value="groq">Groq</option>
            </select>

            {/* Attachment */}
            <button onClick={() => fileRef.current?.click()}>📎</button>

            {/* Input */}
            <textarea
              ref={inputRef}
              className={styles.inputField}
              placeholder="Message COGNORYX..."
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            {/* Live Call */}
            <button onClick={() => onLiveClick?.()}>📹</button>

            {/* Send */}
            <button
              className={styles.sendBtn}
              onClick={send}
              disabled={loading || (!input.trim() && !attachment)}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
