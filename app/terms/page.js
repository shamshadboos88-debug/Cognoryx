import Link from "next/link";
export default function Terms() {
  const sections = [["Acceptance","By using COGNORYX, you agree to these terms."],["Use of Service","Use COGNORYX for lawful purposes only. Do not generate harmful or illegal content."],["Account","You are responsible for your account security and all activity under it."],["Plans & Billing","Free plan limits may change. Pro plan is billed monthly. Refunds are case-by-case."],["Intellectual Property","Content you generate belongs to you. COGNORYX retains rights to the platform."],["Limitation of Liability","COGNORYX is provided as-is without warranties."],["Contact","Questions? Email legal@cognoryx.ai"]];
  return (
    <div style={{ minHeight:"100vh",background:"#000",color:"#e8e8f0",padding:"80px 20px" }}>
      <div style={{ maxWidth:700,margin:"0 auto" }}>
        <Link href="/" style={{ color:"#00c6ff",fontSize:13,fontFamily:"var(--font-display)",letterSpacing:1 }}>← BACK</Link>
        <h1 style={{ fontFamily:"var(--font-display)",fontSize:32,marginTop:24,marginBottom:8,background:"linear-gradient(90deg,#00c6ff,#8a2be2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>TERMS OF SERVICE</h1>
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
