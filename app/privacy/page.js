import Link from "next/link";
export default function Privacy() {
  const sections = [["Data We Collect","We collect your email, name, and usage data to provide our service."],["How We Use It","Your data powers authentication and usage tracking. We never sell your data."],["Firebase","We use Google Firebase for secure auth and database storage."],["AI Prompts","Prompts are processed by third-party APIs. Do not share sensitive personal info in prompts."],["Your Rights","Delete your account and data anytime by emailing privacy@cognoryx.ai."],["Contact","Privacy questions: privacy@cognoryx.ai"]];
  return (
    <div style={{ minHeight:"100vh",background:"#000",color:"#e8e8f0",padding:"80px 20px" }}>
      <div style={{ maxWidth:700,margin:"0 auto" }}>
        <Link href="/" style={{ color:"#00c6ff",fontSize:13,fontFamily:"var(--font-display)",letterSpacing:1 }}>← BACK</Link>
        <h1 style={{ fontFamily:"var(--font-display)",fontSize:32,marginTop:24,marginBottom:8,background:"linear-gradient(90deg,#00c6ff,#8a2be2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>PRIVACY POLICY</h1>
        <p style={{ color:"#606075",fontSize:13,marginBottom:40 }}>Last updated: January 2025</p>
        {sections.map(([t,b])=>(
          <div key={t} style={{ marginBottom:28 }}>
            <h2 style={{ fontFamily:"var(--font-display)",fontSize:13,color:"#00c6ff",letterSpacing:1,marginBottom:8 }}>{t.toUpperCase()}</h2>
            <p style={{ color:"#9090a8",fontSize:14,lineHeight:1.8 }}>{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
