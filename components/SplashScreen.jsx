"use client";
import { useEffect, useRef, useState } from "react";

export default function SplashScreen({ onDone }) {
  const cvRef = useRef(null);
  const [showBrand, setShowBrand] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    const CX = W / 2, CY = H / 2;
    const sp = 54;

    const nodes = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        nodes.push({
          lx: CX + (c - 1) * sp,
          ly: CY + (r - 1) * sp,
          isCenter: r === 1 && c === 1,
          isCorner: (r === 0 || r === 2) && (c === 0 || c === 2),
        });

    const edges = [
      [0,1],[1,2],[3,4],[4,5],[6,7],[7,8],
      [0,3],[3,6],[1,4],[4,7],[2,5],[5,8],
      [0,4],[2,4],[6,4],[8,4],
      [1,3],[1,5],[7,3],[7,5],
    ];

    function rp() {
      return {
        x: (Math.random() - 0.5) * W * 2.5 + CX,
        y: (Math.random() - 0.5) * H * 2.5 + CY,
      };
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    const parts = nodes.map((n, i) => {
      const s = rp();
      return { sx: s.x, sy: s.y, tx: n.lx, ty: n.ly, cx: s.x, cy: s.y,
        isCenter: n.isCenter, isCorner: n.isCorner, dl: i * 0.035 };
    });

    const CS = 0.15, CD = 1.5;
    let t0 = null, done = false;

    function drawEdge(a, b, alpha, pulse) {
      const pa = alpha * (0.6 + pulse * 0.3);
      ctx.beginPath();
      ctx.moveTo(parts[a].cx, parts[a].cy);
      ctx.lineTo(parts[b].cx, parts[b].cy);
      const g = ctx.createLinearGradient(parts[a].cx, parts[a].cy, parts[b].cx, parts[b].cy);
      g.addColorStop(0, `rgba(79,142,247,${pa})`);
      g.addColorStop(1, `rgba(167,139,250,${pa})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    function drawNode(p, glow, pulse) {
      const r = p.isCenter ? 8 : 6;
      const col = p.isCenter ? "rgba(196,181,253,1)" : "rgba(96,165,250,1)";
      if (glow > 0) {
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, r + 10 * glow * (1 + pulse * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = p.isCenter ? `rgba(167,139,250,${0.15*glow})` : `rgba(79,142,247,${0.12*glow})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.isCenter ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = p.isCenter ? "#e9d5ff" : col;
      ctx.fill();
    }

    function loop(ts) {
      if (!t0) t0 = ts;
      const el = (ts - t0) / 1000;
      const pulse = Math.sin(el * 2.5) * 0.5 + 0.5;
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, W * 0.7);
      grad.addColorStop(0, "rgba(79,50,180,0.18)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      let ct = 0;
      if (el > CS) ct = Math.min((el - CS) / CD, 1);
      const glow = ct >= 1 ? Math.min((el - CS - CD) / 0.5, 1) : 0;

      parts.forEach((p) => {
        const pd = Math.max(0, ct - p.dl);
        const pe = ease(Math.min(pd / 0.92, 1));
        p.cx = lerp(p.sx, p.tx, pe);
        p.cy = lerp(p.sy, p.ty, pe);
      });

      const ea = Math.max(0, (ct - 0.45) * 2.1);
      if (ea > 0) edges.forEach(([a, b]) => drawEdge(a, b, ea, pulse * glow));
      parts.forEach((p) => drawNode(p, glow, pulse));

      if (glow >= 0.9 && !done) {
        done = true;
        setShowBrand(true);
        setTimeout(() => onDone && onDone(), 2000);
      }
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#080f1c",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <canvas ref={cvRef} width={300} height={300} />
      <div style={{
        textAlign: "center", marginTop: 12,
        opacity: showBrand ? 1 : 0,
        transform: showBrand ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 1s ease, transform 1s ease",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img
            src="/cognoryx-logo.svg"
            alt="COGNORYX"
            style={{ height: 72, width: 72, objectFit:"contain" }}
          />
        </div>
        <div style={{ color:"#fff", fontSize:22, fontWeight:700, letterSpacing:6, marginTop:8, textAlign:"center" }}>
          COGNORYX
        </div>
        <div style={{ color:"#6b8fa8", fontSize:11, letterSpacing:3, marginTop:6 }}>
          THINK DEEPER · CREATE SMARTER
        </div>
      </div>
    </div>
  );
}
