'use client';
// app/admin/page.js
// Only YOU (KisanKumar) can see this — protected by your email

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// ✅ YOUR EMAIL — only this email can access admin
const ADMIN_EMAIL = 'kisankumarsahu@gmail.com'; // ← change to your real email

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading]     = useState(true);
  const [feedback, setFeedback]   = useState([]);
  const [chats, setChats]         = useState([]);
  const [stats, setStats]         = useState({});
  const [tab, setTab]             = useState('overview');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        router.push('/dashboard'); // kick out non-admins
        return;
      }
      setAuthorized(true);
      await loadAll();
      setLoading(false);
    });
    return unsub;
  }, []);

  const loadAll = async () => {
    try {
      // Load feedback
      const fbSnap = await getDocs(query(
        collection(db, 'feedback'),
        orderBy('createdAt', 'desc'),
        limit(100)
      ));
      const fbData = fbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFeedback(fbData);

      // Load all user chats count
      // We query top-level users collection
      const usersSnap = await getDocs(collection(db, 'users'));
      let totalChats = 0;
      let allChats = [];
      for (const userDoc of usersSnap.docs) {
        const chatsSnap = await getDocs(
          query(collection(db, 'users', userDoc.id, 'chats'), orderBy('updatedAt', 'desc'), limit(5))
        );
        totalChats += chatsSnap.size;
        chatsSnap.docs.forEach(c => allChats.push({
          id: c.id,
          userId: userDoc.id,
          ...c.data(),
        }));
      }
      setChats(allChats.slice(0, 50));

      // Stats
      const likes    = fbData.filter(f => f.reaction === 'like').length;
      const dislikes = fbData.filter(f => f.reaction === 'dislike').length;
      setStats({
        totalUsers:    usersSnap.size,
        totalChats,
        totalFeedback: fbData.length,
        likes,
        dislikes,
        satisfaction:  fbData.length > 0 ? Math.round((likes / fbData.length) * 100) : 0,
      });

    } catch (err) {
      console.error('[Admin] load error:', err);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a0a0f', color:'#00c6ff', fontSize:16 }}>
      Loading admin...
    </div>
  );

  if (!authorized) return null;

  const BG   = '#0a0a0f';
  const CARD = '#0d0d1a';
  const NEON = '#00c6ff';
  const PUR  = '#8a2be2';
  const GRN  = '#56d364';
  const RED  = '#f85149';

  const statCards = [
    { label: 'Total Users',    value: stats.totalUsers    || 0, color: NEON,  icon: '👥' },
    { label: 'Total Chats',    value: stats.totalChats    || 0, color: PUR,   icon: '💬' },
    { label: 'Total Feedback', value: stats.totalFeedback || 0, color: '#f0883e', icon: '📊' },
    { label: '👍 Likes',       value: stats.likes         || 0, color: GRN,   icon: '👍' },
    { label: '👎 Dislikes',    value: stats.dislikes      || 0, color: RED,   icon: '👎' },
    { label: 'Satisfaction',   value: `${stats.satisfaction || 0}%`, color: NEON, icon: '⭐' },
  ];

  const tabStyle = (t) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    background: tab === t ? `${NEON}18` : 'rgba(255,255,255,0.05)',
    color: tab === t ? NEON : 'rgba(255,255,255,0.5)',
    outline: tab === t ? `1px solid ${NEON}40` : '1px solid rgba(255,255,255,0.08)',
  });

  return (
    <div style={{ minHeight:'100vh', background: BG, color:'#e8e8f0', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', padding:'24px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img src="/cognoryx-logo.svg" alt="COGNORYX" style={{ width:36, height:36 }}/>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:'#e8e8f0' }}>COGNORYX Admin</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>Welcome, KisanKumar 👋</div>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')}
          style={{ padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
          ← Back to App
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: CARD, borderRadius:14, padding:'18px 16px', border:`1px solid ${s.color}22` }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:28, fontWeight:700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <button style={tabStyle('overview')} onClick={() => setTab('overview')}>📊 Overview</button>
        <button style={tabStyle('feedback')} onClick={() => setTab('feedback')}>💬 Feedback</button>
        <button style={tabStyle('chats')}    onClick={() => setTab('chats')}>🗂️ Recent Chats</button>
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div style={{ background: CARD, borderRadius:14, padding:20, border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:16, color:'#e8e8f0' }}>Satisfaction Breakdown</div>
          {/* Like/Dislike bar */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>
              <span>👍 {stats.likes} likes</span>
              <span>👎 {stats.dislikes} dislikes</span>
            </div>
            <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
              <div style={{ height:'100%', width: `${stats.satisfaction}%`, background:`linear-gradient(90deg,${GRN},${NEON})`, borderRadius:4, transition:'width 0.5s' }}/>
            </div>
            <div style={{ textAlign:'center', fontSize:13, color: NEON, marginTop:6, fontWeight:600 }}>{stats.satisfaction}% positive</div>
          </div>

          {/* Recent feedback preview */}
          <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:12, marginTop:20 }}>Latest Feedback</div>
          {feedback.slice(0, 5).map(f => (
            <div key={f.id} style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{f.reaction === 'like' ? '👍' : '👎'}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{f.userEmail}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginLeft:'auto' }}>{f.mode} mode</span>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>
                <span style={{ color:NEON }}>User: </span>{f.userMsg?.slice(0,100) || '—'}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
                <span style={{ color:PUR }}>AI: </span>{f.aiReply?.slice(0,120) || '—'}
              </div>
            </div>
          ))}
          {feedback.length === 0 && <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', textAlign:'center', padding:20 }}>No feedback yet — users haven't liked/disliked any messages</div>}
        </div>
      )}

      {/* Feedback tab */}
      {tab === 'feedback' && (
        <div style={{ background: CARD, borderRadius:14, padding:20, border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>All Feedback ({feedback.length})</div>
          {feedback.length === 0 && <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', textAlign:'center', padding:20 }}>No feedback yet</div>}
          {feedback.map(f => (
            <div key={f.id} style={{ padding:'14px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:`1px solid ${f.reaction==='like'?GRN+'22':RED+'22'}`, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>{f.reaction === 'like' ? '👍' : '👎'}</span>
                <div>
                  <div style={{ fontSize:13, color:'#e8e8f0', fontWeight:500 }}>{f.userEmail}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                    {f.mode} mode · {f.createdAt?.toDate?.()?.toLocaleString?.() || 'just now'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:6, padding:'8px 10px', background:'rgba(0,198,255,0.05)', borderRadius:8, borderLeft:`2px solid ${NEON}` }}>
                <strong>User asked:</strong> {f.userMsg || '—'}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', padding:'8px 10px', background:'rgba(138,43,226,0.05)', borderRadius:8, borderLeft:`2px solid ${PUR}` }}>
                <strong>AI replied:</strong> {f.aiReply || '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chats tab */}
      {tab === 'chats' && (
        <div style={{ background: CARD, borderRadius:14, padding:20, border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Recent Chats ({chats.length})</div>
          {chats.length === 0 && <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', textAlign:'center', padding:20 }}>No chats yet</div>}
          {chats.map(c => (
            <div key={c.id} style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:13, color:'#e8e8f0', fontWeight:500 }}>💬 {c.title || 'Untitled'}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{c.messages?.length || 0} messages</div>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>User: {c.userId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
