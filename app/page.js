'use client';
// app/page.js — optimized landing page, no Firebase import = fast load
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#e8e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: 'linear-gradient(135deg,#00c6ff,#8a2be2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24,
        letterSpacing: 1,
      }}>CX</div>

      {/* Title */}
      <h1 style={{
        fontSize: 48, fontWeight: 900, margin: '0 0 12px',
        background: 'linear-gradient(90deg,#00c6ff,#8a2be2)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', letterSpacing: 4,
      }}>COGNORYX</h1>

      {/* Subtitle */}
      <p style={{ color: '#9090a8', fontSize: 18, marginBottom: 16, maxWidth: 480 }}>
        Your all-in-one AI Intelligence Platform
      </p>

      {/* Features */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
        {['🤖 AI Chat', '🎨 Image Gen', '📹 Live Voice', '📎 File Analysis'].map(f => (
          <span key={f} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
        ))}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/login" style={{
          padding: '14px 36px', borderRadius: 10,
          background: 'linear-gradient(135deg,#00c6ff,#8a2be2)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          letterSpacing: 1.5, textDecoration: 'none', display: 'inline-block',
        }}>GET STARTED →</Link>
        <Link href="/pricing" style={{
          padding: '14px 36px', borderRadius: 10,
          border: '1px solid rgba(0,198,255,0.3)',
          color: '#00c6ff', fontSize: 14, fontWeight: 700,
          textDecoration: 'none', display: 'inline-block',
        }}>PRICING</Link>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 48, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        Powered by Google Gemini · Free to start
      </p>
    </div>
  );
}
