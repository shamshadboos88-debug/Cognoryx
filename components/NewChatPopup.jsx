"use client";

export default function NewChatPopup({ onNewChat, onContinue, onCancel, hasHistory }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#0d0d16",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: "28px 24px",
        width: "100%", maxWidth: 400,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg,#00c6ff,#8a2be2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>CX</div>
          <div>
            <div style={{ color: "#e8e8f0", fontSize: 15, fontWeight: 600 }}>Start a new chat</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>How would you like to begin?</div>
          </div>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Fresh Start */}
          <button onClick={onNewChat} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "16px", borderRadius: 12,
            background: "rgba(0,198,255,0.05)",
            border: "0.5px solid rgba(0,198,255,0.3)",
            cursor: "pointer", textAlign: "left", width: "100%",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(0,198,255,0.1)",
              border: "0.5px solid rgba(0,198,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 20 }}>✨</span>
            </div>
            <div>
              <div style={{ color: "#e8e8f0", fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Fresh start</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Begin a brand new conversation</div>
            </div>
          </button>

          {/* Continue Previous */}
          <button onClick={onContinue} disabled={!hasHistory} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "16px", borderRadius: 12,
            background: hasHistory ? "rgba(138,43,226,0.05)" : "rgba(255,255,255,0.02)",
            border: hasHistory ? "0.5px solid rgba(138,43,226,0.3)" : "0.5px solid rgba(255,255,255,0.07)",
            cursor: hasHistory ? "pointer" : "not-allowed", textAlign: "left", width: "100%",
            opacity: hasHistory ? 1 : 0.5,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(138,43,226,0.1)",
              border: "0.5px solid rgba(138,43,226,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 20 }}>🕐</span>
            </div>
            <div>
              <div style={{ color: "#e8e8f0", fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Continue previous</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                {hasHistory ? "Pick up from where you left off" : "No previous chat found"}
              </div>
            </div>
          </button>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px", borderRadius: 10,
            background: "transparent", border: "0.5px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}