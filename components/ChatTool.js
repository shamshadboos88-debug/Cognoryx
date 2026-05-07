"use client";
// components/ChatTool.js
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import styles from "./tools.module.css";

export default function ChatTool({ user, userData, onUpgrade }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const plan   = userData?.plan || "free";
  const usage  = userData?.usage || {};
  const limit  = plan === "pro" ? 999 : 20;
  const atLimit = (usage.chats || 0) >= limit;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (atLimit) { onUpgrade(); return; }

    const userMsg = { role: "user", content: text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, uid: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      setMessages(m => [...m, { role: "ai", content: data.reply }]);
      // Save to history
      if (messages.length === 0) {
        setHistory(h => [{ id: Date.now(), title: text.slice(0, 36) + "…" }, ...h.slice(0, 9)]);
      }
    } catch (err) {
      toast.error(err.message || "Failed to get response");
      setMessages(m => [...m, { role: "ai", content: "⚠️ Error: " + (err.message || "Something went wrong.") }]);
    } finally { setLoading(false); }
  };

  const formatText = (text) => text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n/g, "<br>");

  return (
    <div className={styles.chatLayout}>
      {/* History sidebar */}
      <div className={styles.chatHistory}>
        <div className={styles.historyTitle}>HISTORY</div>
        {history.length === 0
          ? <div className={styles.historyEmpty}>No chats yet</div>
          : history.map(h => <div key={h.id} className={styles.historyItem}>{h.title}</div>)
        }
      </div>

      {/* Chat area */}
      <div className={styles.chatMain}>
        <div className={styles.chatTopbar}>
          <div>
            <div className={styles.toolTitle}>AI Chat</div>
            <div className={styles.toolSub}>Powered by Google Gemini 1.5 Flash</div>
          </div>
          {atLimit && (
            <button className={styles.limitBadge} onClick={onUpgrade}>⚠️ Limit reached — Upgrade</button>
          )}
        </div>

        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>🧠</div>
              <h2>What can I help you with?</h2>
              <p>Ask me anything — I can write code, explain concepts, help with ideas and more.</p>
              <div className={styles.chips}>
                {["Explain quantum computing", "Write a Python script", "Give me startup ideas", "What is the future of AI?"].map(s => (
                  <button key={s} className={styles.chip} onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`${styles.msgRow} ${m.role === "user" ? styles.msgUser : ""}`}>
              <div className={`${styles.avatar} ${m.role === "user" ? styles.avatarUser : styles.avatarAi}`}>
                {m.role === "user" ? (user?.email?.[0]?.toUpperCase() || "U") : "CX"}
              </div>
              <div className={`${styles.bubble} ${m.role === "user" ? styles.bubbleUser : styles.bubbleAi}`}
                dangerouslySetInnerHTML={{ __html: formatText(m.content) }} />
            </div>
          ))}

          {loading && (
            <div className={styles.msgRow}>
              <div className={`${styles.avatar} ${styles.avatarAi}`}>CX</div>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          <div className={styles.inputBox}>
            <textarea ref={inputRef} className={styles.inputField} placeholder="Message COGNORYX..."
              value={input} rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
            />
            <button className={styles.sendBtn} onClick={send} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <p className={styles.inputHint}>Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
