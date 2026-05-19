"use client";
import { useEffect, useRef } from "react";

export default function CognoryxThinking() {
  const cvRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    const CX = W / 2, CY = H / 2;
    const sp = 18;

    const nodes = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        nodes.push({
          x: CX + (c - 1) * sp,
          y: CY + (r - 1) * sp,
          isCenter: r === 1 && c === 1,
          isCorner: (r === 0 || r === 2) && (c === 0 || c === 2),
        });

    const edges = [
      [0,1],[1,2],[3,4],[4,5],[6,7],[7,8],
      [0,3],[3,6],[1,4],[4,7],[2,5],[5,8],
      [0,4],[2,4],[6,4],[8,4],
      [1,3],[1,5],[7,3],[7,5],
    ];

    let t0 = null;

    function loop(ts) {
      if (!t0) t0 = ts;
      const el = (ts - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      const beat = heartbeat(el);
      const scale = 1 + beat * 0.35;
      const glowAmt = 0.4 + beat * 0.6;

      ctx.save();
      ctx.translate(CX, CY);
      ctx.scale(scale, scale);
      ctx.translate(-CX, -CY);

      edges.forEach(([a, b]) => {
        const na = nodes[a], nb = nodes[b];
        const g = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
        const alpha = 0.4 + glowAmt * 0.4;
        g.addColorStop(0, `rgba(79,142,247,${alpha})`);
        g.addColorStop(1, `rgba(167,139,250,${alpha})`);
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      nodes.forEach((n) => {
        const r = n.isCenter ? 3.5 : 2.5;
        const col = n.isCenter ? "rgba(196,181,253,1)" : "rgba(96,165,250,1)";
        if (glowAmt > 0) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 4 * glowAmt, 0, Math.PI * 2);
          ctx.fillStyle = n.isCenter
            ? `rgba(167,139,250,${0.2 * glowAmt})`
            : `rgba(79,142,247,${0.15 * glowAmt})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.isCenter ? 1.8 : 1, 0, Math.PI * 2);
        ctx.fillStyle = n.isCenter ? "#e9d5ff" : col;
        ctx.fill();
      });

      ctx.restore();
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 14px",
      background: "rgba(255,255,255,0.04)",
      border: "0.5px solid rgba(79,142,247,0.2)",
      borderRadius: "18px 18px 18px 4px",
      width: "fit-content",
    }}>
      <canvas ref={cvRef} width={52} height={52} style={{ display: "block" }} />
      <span style={{ color: "#6b8fa8", fontSize: 13, fontFamily: "sans-serif" }}>
        Thinking...
      </span>
    </div>
  );
}

function heartbeat(t) {
  const cycle = t % 1.2;
  if (cycle < 0.1) return cycle / 0.1;
  if (cycle < 0.2) return 1 - (cycle - 0.1) / 0.1;
  if (cycle < 0.3) return (cycle - 0.2) / 0.1 * 0.6;
  if (cycle < 0.4) return 0.6 - (cycle - 0.3) / 0.1 * 0.6;
  return 0;
}
