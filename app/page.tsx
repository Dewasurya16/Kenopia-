'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const features = [
  { icon: '🤖', title: 'AI Mendengarmu', desc: 'IndoBERT memahami nuansa emosi Bahasa Indonesia secara mendalam.', color: '#6ee7b7' },
  { icon: '🔒', title: 'Privasi Penuh', desc: 'Data 100% lokal di perangkatmu. Zero server storage.', color: '#a5b4fc' },
  { icon: '📊', title: 'Lacak Emosimu', desc: 'Grafik distribusi emosi harian + AI Insight mingguan.', color: '#fca5a5' },
  { icon: '🎵', title: 'Suara Ambient', desc: 'Hujan, api unggun, atau alam terbuka menemanimu bercerita.', color: '#67e8f9' },
  { icon: '🎭', title: 'Pilih Persona AI', desc: 'Sahabat, Psikolog, atau Filsuf Zen — sesuai kebutuhanmu.', color: '#f9a8d4' },
  { icon: '🫁', title: 'Latihan Napas', desc: 'Animasi pernapasan 4-4 untuk menenangkan pikiran.', color: '#fcd34d' },
]

const marqueeItems = ['😄 Senang', '😢 Sedih', '😡 Marah', '🥰 Cinta', '😨 Takut', '🤗 Lega', '😤 Frustrasi', '✨ Damai', '💭 Bingung', '🌟 Bangga']

const steps = [
  { n: '01', title: 'Ceritakan Perasaan', desc: 'Ketik bebas dalam Bahasa Indonesia' },
  { n: '02', title: 'AI Mendeteksi', desc: 'IndoBERT menganalisis emosi dominan' },
  { n: '03', title: 'Respons Empatik', desc: 'AI merespons dengan super hangat' },
  { n: '04', title: 'Tumbuh Bersama', desc: 'Lihat grafik emosimu dari waktu ke waktu' },
]

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function KenopiaHome() {
  const [dark, setDark] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [typeIdx, setTypeIdx] = useState(0)
  const [typeTxt, setTypeTxt] = useState('')
  const [typing, setTyping] = useState(true)
  const [counters, setCounters] = useState([0, 0, 0, 0])
  const countersDone = useRef(false)
  
  // State untuk animasi urutan Chat Simulasi
  const [demoStep, setDemoStep] = useState(0)

  const phrases = [
    'yang Benar-Benar Mengerti',
    'Tanpa Penilaian',
    'Menjaga Rahasiamu',
    'Selalu Ada Untukmu',
  ]

  // Typewriter Effect
  useEffect(() => {
    const target = phrases[typeIdx]
    let i = typeTxt.length
    if (typing) {
      if (i < target.length) {
        const t = setTimeout(() => setTypeTxt(target.slice(0, i + 1)), 50)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setTyping(false), 2800)
        return () => clearTimeout(t)
      }
    } else {
      if (i > 0) {
        const t = setTimeout(() => setTypeTxt(target.slice(0, i - 1)), 20)
        return () => clearTimeout(t)
      } else {
        setTypeIdx(p => (p + 1) % phrases.length)
        setTyping(true)
      }
    }
  }, [typeTxt, typing, typeIdx])

  // Step auto-advance
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 4), 4500)
    return () => clearInterval(t)
  }, [])

  // Timer untuk Simulasi Chat Berurutan
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (demoStep === 0) t = setTimeout(() => setDemoStep(1), 2000) // Jeda sebelum user membalas
    if (demoStep === 1) t = setTimeout(() => setDemoStep(2), 800)  // Jeda sebelum AI mengetik
    if (demoStep === 2) t = setTimeout(() => setDemoStep(3), 2800) // Jeda lama mengetik (titik tiga)
    if (demoStep === 3) t = setTimeout(() => setDemoStep(0), 8000) // Tahan hasil akhir, lalu reset ulang
    return () => clearTimeout(t)
  }, [demoStep])

  // Setup Theme & Counter animation
  useEffect(() => {
    const saved = localStorage.getItem('kenopia-theme')
    const isDark = saved !== 'light'
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    setMounted(true)

    if (!countersDone.current) {
      countersDone.current = true
      const targets = [5, 3, 100, 24]
      const duration = 2400
      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        const p = Math.min(elapsed / duration, 1)
        const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) 
        setCounters(targets.map(t => Math.round(t * ease)))
        if (p < 1) requestAnimationFrame(tick)
      }
      setTimeout(() => requestAnimationFrame(tick), 800)
    }
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('kenopia-theme', next ? 'dark' : 'light')
  }

  if (!mounted) return null

  // Design Tokens
  const bg = dark ? '#030305' : '#fafafa'
  const surface = dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.75)'
  const border = dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'
  const txt = dark ? '#f8fafc' : '#0f172a'
  const muted = dark ? 'rgba(248, 250, 252, 0.55)' : 'rgba(15, 23, 42, 0.55)'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .kp * { font-family: 'Outfit', system-ui, sans-serif; }
        .kp-serif { font-family: 'Syne', sans-serif !important; }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(35px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn  { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:.5;} }
        @keyframes blob     { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%;} }
        @keyframes marquee  { from{ transform:translateX(0); } to{ transform:translateX(-50%); } }
        @keyframes floatCute { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
        @keyframes floatSlow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes shimmer  { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        @keyframes popInCute { 0% { opacity: 0; transform: scale(0.8) translateY(15px); } 60% { transform: scale(1.02) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

        .anim-fadeUp   { animation: fadeUp 1s cubic-bezier(0.25, 1, 0.5, 1) both; }
        .anim-scaleIn  { animation: scaleIn 1s cubic-bezier(0.25, 1, 0.5, 1) both; }
        .animate-float-cute { animation: floatCute 4.5s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 7s ease-in-out infinite; }
        .animate-pop-in-cute { animation: popInCute 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        
        .d1 { animation-delay: .05s; } .d2 { animation-delay: .15s; }
        .d3 { animation-delay: .25s; } .d4 { animation-delay: .35s; }
        .d5 { animation-delay: .45s; }

        .blob-1 { animation: blob 16s ease-in-out infinite; }
        .blob-2 { animation: blob 19s ease-in-out 2s infinite reverse; }

        .shimmer-text {
          background: linear-gradient(90deg, #c084fc 0%, #e879f9 20%, #818cf8 40%, #3b82f6 60%, #6ee7b7 80%, #c084fc 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 7s linear infinite;
        }

        .pill-cta {
          display: inline-flex; align-items: center; gap: 8px; justify-content: center;
          padding: 18px 44px; border-radius: 100px; font-weight: 700; font-size: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
          color: #fff !important; border: none; cursor: pointer; text-decoration: none;
          position: relative; overflow: hidden;
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          box-shadow: 0 8px 25px rgba(139,92,246,0.25);
        }
        .pill-cta::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%);
          border-radius: inherit;
        }
        .pill-cta:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 16px 40px rgba(139,92,246,0.4); }
        .pill-cta:active { transform: translateY(1px) scale(0.97); transition-duration: 0.2s; }

        .ghost-btn {
          display: inline-flex; align-items: center; gap: 8px; justify-content: center;
          padding: 16px 36px; border-radius: 100px; font-weight: 600; font-size: 15px;
          background: transparent; cursor: pointer; text-decoration: none;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); border: 1px solid var(--border);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .ghost-btn:hover { background: rgba(139,92,246,0.08); transform: translateY(-3px); border-color: rgba(139,92,246,0.3); }

        .card-hover { transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 24px 48px -12px rgba(0,0,0,0.1) !important; border-color: rgba(139,92,246,0.3) !important; }

        .marquee-track { display: flex; gap: 24px; white-space: nowrap; animation: marquee 35s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }

        .bubble-ai-cute { 
          background: var(--surface); 
          border-radius: 20px 20px 20px 6px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
          border: 1px solid var(--border);
        }
        .bubble-user-cute { 
          background: linear-gradient(135deg, #3b82f6, #0ea5e9); 
          color: white; 
          border-radius: 20px 20px 6px 20px; 
          box-shadow: 0 6px 20px rgba(59,130,246,0.2); 
        }

        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        
        .section-spacing { margin-bottom: 150px; }
        .glass-panel { 
           background: var(--surface); 
           backdrop-filter: blur(28px) saturate(140%); 
           -webkit-backdrop-filter: blur(28px) saturate(140%); 
           border: 1px solid var(--border); 
        }

        @media (max-width: 1024px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(2, 1fr); }
          .hero-title { font-size: 3.8rem !important; }
        }

        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
          .section-spacing { margin-bottom: 90px; }
          .hide-mobile { display: none !important; }
          .hero-buttons { flex-direction: column; width: 100%; gap: 14px !important; }
          .hero-buttons > * { width: 100%; }
          .hero-title { font-size: 2.8rem !important; }
          .nav-padding { padding: 0 20px !important; }
          .marquee-track { gap: 16px; animation: marquee 18s linear infinite; }
          .chat-card { padding: 28px 20px !important; }
          .step-card { padding: 28px 20px !important; }
        }
      `}</style>

      <div className="kp" style={{ minHeight: '100vh', background: bg, position: 'relative', overflowX: 'hidden', '--surface': surface, '--border': border } as React.CSSProperties}>

        {/* ── Background blobs ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div className="blob-1" style={{
            position: 'absolute', width: '85vw', height: '85vw', maxWidth: 850, maxHeight: 850, top: '-25%', left: '-15%',
            background: dark ? 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)' : 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }} />
          <div className="blob-2" style={{
            position: 'absolute', width: '75vw', height: '75vw', maxWidth: 750, maxHeight: 750, bottom: '-15%', right: '-15%',
            background: dark ? 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 60%)' : 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }} />
          {/* Subtle noise/grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: dark ? 0.25 : 0.4,
            backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 1.5px, transparent 1.5px)`,
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(circle at center, black 35%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 35%, transparent 100%)'
          }} />
        </div>

        {/* ── Navbar ── */}
        <nav className="nav-padding" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 36px', height: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: dark ? 'rgba(5,5,10,0.5)' : 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)',
          borderBottom: `1px solid ${border}`,
        }}>
          <Link href="/" className="animate-float-slow" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            
            {/* LOGO YANG SUDAH DIPERBAIKI */}
            <div style={{
               width: 48, height: 48, borderRadius: '50%',
               background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
               padding: 2.5,
               boxShadow: '0 4px 18px rgba(59,130,246,0.35)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ 
                position: 'relative', width: '100%', height: '100%', 
                borderRadius: '50%', overflow: 'hidden', background: '#fff' 
              }}>
                <Image 
                  src="/logo.png"
                  alt="Logo Kenopia" 
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="kp-serif" style={{ fontSize: 26, fontWeight: 800, color: txt, letterSpacing: '-0.02em' }}>Kenopia</span>
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontWeight: 800, letterSpacing: '0.06em', boxShadow: '0 2px 12px rgba(59,130,246,0.25)' }}>AI</span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[['✨ Fitur', '#fitur'], ['🔍 Cara Kerja', '#cara-kerja']].map(([l, h]) => (
              <a key={l} href={h} className="nav-link hide-mobile" style={{ color: muted, fontSize: 15, fontWeight: 600, textDecoration: 'none', padding: '8px 18px', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', borderRadius: 100 }} onMouseOver={e => {e.currentTarget.style.color = txt; e.currentTarget.style.background = surface}} onMouseOut={e => {e.currentTarget.style.color = muted; e.currentTarget.style.background = 'transparent'}}>
                {l}
              </a>
            ))}
            <Link href="/curhat" className="pill-cta hide-mobile" style={{ padding: '12px 26px', fontSize: 14, marginLeft: 16 }}>
              🚀 Mulai Curhat
            </Link>
            <button onClick={toggleTheme} aria-label="Toggle Theme" className="animate-float-cute" style={{
              width: 46, height: 46, borderRadius: '50%',
              border: `1px solid ${border}`, background: surface,
              color: txt, cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)', marginLeft: 8,
              boxShadow: '0 4px 18px rgba(0,0,0,0.04)'
            }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08) rotate(15deg)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <div style={{ position: 'relative', zIndex: 10, paddingTop: 170, paddingLeft: 24, paddingRight: 24, maxWidth: 1200, margin: '0 auto' }}>

          {/* ═══ HERO ═══ */}
          <section className="section-spacing" style={{ textAlign: 'center', position: 'relative' }}>
            
            <div className="absolute left-[8%] top-0 text-4xl animate-float-cute" style={{ opacity: 0.7, animationDelay: '0.5s' }}>🍃</div>
            <div className="absolute right-[12%] top-[25%] text-3xl animate-float-slow" style={{ opacity: 0.5, animationDelay: '1.2s' }}>✨</div>
            <div className="absolute left-[18%] bottom-[12%] text-2xl animate-float-cute" style={{ opacity: 0.4, animationDelay: '2s' }}>💭</div>

            <div className="anim-fadeUp d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
              <span style={{
                padding: '10px 26px', borderRadius: 100, fontSize: 13, fontWeight: 800,
                background: dark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)', color: '#3b82f6',
                border: '1.5px dashed rgba(59,130,246,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(59,130,246,0.1)'
              }}>🤖 Teman Cerita Virtualmu</span>
            </div>

            <h1 className="kp-serif anim-fadeUp d2 hero-title" style={{
              fontSize: '5rem', lineHeight: 1.15, letterSpacing: '-0.03em',
              color: txt, marginBottom: 30, fontWeight: 800,
            }}>
              Tempat Curhat
              <br />
              <span className="shimmer-text" style={{ display: 'inline-block', minHeight: '1.2em' }}>
                {typeTxt}<span style={{ animation: 'pulse 1s step-end infinite', borderRight: `3px solid #3b82f6`, paddingLeft: 6, borderRadius: 2 }} />
              </span>
            </h1>

            <p className="anim-fadeUp d3" style={{ fontSize: 19, color: muted, maxWidth: 620, margin: '0 auto 52px', lineHeight: 1.65, fontWeight: 500 }}>
              Luapkan emosimu ke AI yang memahami nuansa Bahasa Indonesia — hangat, empatik, dan menjaga rahasiamu sepenuhnya. 💙
            </p>

            <div className="anim-fadeUp d4 hero-buttons" style={{ display: 'flex', gap: 20, justifyContent: 'center', maxWidth: 520, margin: '0 auto' }}>
              <Link href="/curhat" className="pill-cta" style={{ fontSize: 17 }}>
                🚀 Mulai Curhat Sekarang
              </Link>
              <a href="#cara-kerja" className="ghost-btn glass-panel" style={{ color: txt }}>
                👀 Intip Cara Kerjanya
              </a>
            </div>

            <div className="anim-fadeUp d5 glass-panel hide-mobile animate-float-slow" style={{
              display: 'inline-flex', alignItems: 'center', gap: 36, flexWrap: 'wrap', justifyContent: 'center',
              marginTop: 70, padding: '22px 46px', borderRadius: 100,
              boxShadow: '0 12px 40px rgba(0,0,0,0.04)'
            }}>
              {[['🔒', 'Data Lokal 100%'], ['⚡', 'Respons Instan'], ['🧠', 'AI Super Empati']].map(([ic, lb]) => (
                <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: txt, fontWeight: 600 }}>
                  <span style={{ fontSize: 20 }}>{ic}</span><span>{lb}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ MARQUEE ═══ */}
          <div className="section-spacing anim-fadeUp d5" style={{ overflow: 'hidden', position: 'relative', margin: '0 -24px 110px -24px' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, zIndex: 2, background: `linear-gradient(to right, ${bg}, transparent)` }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, zIndex: 2, background: `linear-gradient(to left, ${bg}, transparent)` }} />
            <div style={{ display: 'flex', overflow: 'hidden', padding: '12px 0' }}>
              <div className="marquee-track">
                {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
                  <span key={i} className="glass-panel" style={{
                    fontSize: 15, fontWeight: 700, padding: '12px 28px', borderRadius: 100,
                    color: muted, flexShrink: 0, transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)', cursor: 'default'
                  }} onMouseOver={e => {e.currentTarget.style.color = txt; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.transform = 'scale(1.05)'}} onMouseOut={e => {e.currentTarget.style.color = muted; e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = 'scale(1)'}}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ CHAT PREVIEW + STATS ═══ */}
          <section className="grid-2 section-spacing" style={{ alignItems: 'start' }}>
            
            {/* Chat card ANIMASI */}
            <div className="anim-scaleIn d2 animate-float-slow glass-panel chat-card" style={{
              padding: 40, borderRadius: 36,
              boxShadow: dark ? '0 30px 80px rgba(0,0,0,0.3)' : '0 30px 80px rgba(59,130,246,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30, paddingBottom: 24, borderBottom: `1px solid ${border}` }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white',
                  boxShadow: '0 8px 25px rgba(59,130,246,0.35)', flexShrink: 0
                }}>💙</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Kenopia AI</div>
                  <div style={{ fontSize: 13, color: muted, marginTop: 4, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sahabat Virtualmu</div>
                </div>
                <div className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.12)', padding: '8px 16px', borderRadius: 100 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px rgba(74,222,128,0.5)' }} />
                  <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 800, letterSpacing: '0.06em' }}>ONLINE</span>
                </div>
              </div>

              {/* AREA ANIMASI CHAT SIMULASI */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 380 }}>
                {/* Bubble AI 1 (Selalu Tampil) */}
                <div className="animate-pop-in-cute bubble-ai-cute" style={{ padding: '16px 22px', fontSize: 15, lineHeight: 1.6, maxWidth: '88%', color: txt }}>
                  👋 Halo! Ceritakan apa yang sedang kamu rasakan hari ini...
                </div>

                {/* Bubble User (Muncul di Step 1) */}
                {demoStep >= 1 && (
                  <div className="animate-pop-in-cute bubble-user-cute" style={{ padding: '16px 22px', fontSize: 15, lineHeight: 1.6, maxWidth: '85%', alignSelf: 'flex-end' }}>
                    Aku lagi capek banget sama tugas kuliah, rasanya pengen nyerah aja 😭
                  </div>
                )}

                {/* Indikator AI Mengetik (Muncul di Step 2) */}
                {demoStep === 2 && (
                  <div className="animate-pop-in-cute bubble-ai-cute" style={{ padding: '14px 22px', width: 'fit-content' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '20px' }}>
                      <div className="typing-dot" style={{ background: '#3b82f6' }}></div>
                      <div className="typing-dot" style={{ background: '#3b82f6' }}></div>
                      <div className="typing-dot" style={{ background: '#3b82f6' }}></div>
                    </div>
                  </div>
                )}

                {/* Balasan AI & Deteksi Emosi (Muncul di Step 3) */}
                {demoStep >= 3 && (
                  <>
                    <div className="animate-pop-in-cute" style={{ margin: '0 auto' }}>
                      <div style={{ padding: '6px 16px', borderRadius: 100, background: 'rgba(59,130,246,0.08)', border: '1.5px dashed rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 12, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className="text-base">😢</span> Sedih Terdeteksi
                      </div>
                    </div>
                    <div className="animate-pop-in-cute bubble-ai-cute" style={{ padding: '16px 22px', fontSize: 15, lineHeight: 1.6, maxWidth: '92%', color: txt }}>
                      Pasti berat banget rasanya ya. Menangislah kalau itu bikin lega. Aku siap dengerin semua keluh kesahmu tanpa menghakimi. Yuk, keluarin semuanya... 💙
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right column: stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="grid-2" style={{ gap: 22 }}>
                {[
                  { val: counters[0], unit: '', suffix: ' Emosi Dasar', label: 'Dikenali Akurat', color: '#6ee7b7', icon: '🎭' },
                  { val: counters[1], unit: '', suffix: ' Pilihan Persona', label: 'Siap Mendengar', color: '#a5b4fc', icon: '🧠' },
                  { val: counters[2], unit: '%', suffix: ' Aman Terjaga', label: 'Data Tetap di HP', color: '#fca5a5', icon: '🔒' },
                  { val: counters[3], unit: '/7', suffix: ' Selalu Siap', label: 'Tanpa Istirahat', color: '#67e8f9', icon: '⏳' },
                ].map((s, i) => (
                  <div key={i} className="card-hover glass-panel animate-pop-in-cute" style={{ padding: '30px 24px', borderRadius: 32, animationDelay: `${0.2 * i}s` }}>
                    <div style={{ fontSize: 26, marginBottom: 14 }}>{s.icon}</div>
                    <div className="kp-serif" style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, color: s.color, textShadow: `0 0 25px ${s.color}35` }}>
                      {s.val}{s.unit}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: txt, marginTop: 14 }}>{s.suffix || ''}</div>
                    <div style={{ fontSize: 13, color: muted, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ HOW IT WORKS ═══ */}
          <section id="cara-kerja" className="section-spacing">
            <div style={{ textAlign: 'center', marginBottom: 76 }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 16 }}>— ✨ Sangat Mudah —</div>
              <h2 className="kp-serif" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: txt, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                4 Langkah Menuju<br /><span className="shimmer-text">Kelegaan Hati</span>
              </h2>
            </div>

            <div className="grid-4">
              {steps.map((s, i) => (
                <div
                  key={i} className="card-hover glass-panel step-card" onClick={() => setActiveStep(i)}
                  style={{
                    padding: '38px 28px', borderRadius: 32, cursor: 'pointer',
                    background: activeStep === i ? (dark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)') : surface,
                    borderColor: activeStep === i ? 'rgba(59,130,246,0.3)' : border,
                    position: 'relative', overflow: 'hidden',
                    transform: activeStep === i ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
                    boxShadow: activeStep === i ? '0 20px 40px rgba(59,130,246,0.12)' : 'none'
                  }}
                >
                  <div className="kp-serif" style={{
                    fontSize: '4rem', fontWeight: 800, lineHeight: 1,
                    color: activeStep === i ? '#3b82f6' : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    marginBottom: 28, transition: 'color 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}>{s.n}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: txt, marginBottom: 12, position: 'relative', zIndex: 2 }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: muted, lineHeight: 1.6, position: 'relative', zIndex: 2, fontWeight: 500 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ FEATURES BENTO ═══ */}
          <section id="fitur" className="section-spacing">
            <div style={{ textAlign: 'center', marginBottom: 76 }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ec4899', marginBottom: 16 }}>— Fitur Gemas —</div>
              <h2 className="kp-serif" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: txt, letterSpacing: '-0.02em' }}>
                Kenapa <span className="shimmer-text">Kenopia?</span>
              </h2>
              <p style={{ color: muted, fontSize: 18, marginTop: 20, fontWeight: 500 }}>Lebih dari sekadar bot, ini ruang aman pribadimu. 🍃</p>
            </div>

            <div className="grid-3">
              {features.map((f, i) => (
                <div key={i} className="card-hover glass-panel" style={{
                  padding: '42px 32px', borderRadius: 36, position: 'relative', overflow: 'hidden',
                }}>
                  <div className="animate-float-slow" style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `${f.color}15`, filter: 'blur(45px)', pointerEvents: 'none' }} />
                  <div className="animate-float-cute" style={{
                    width: 64, height: 64, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, marginBottom: 28, background: `${f.color}10`, border: `1.5px solid ${f.color}30`,
                    boxShadow: `0 10px 30px ${f.color}15`
                  }}>{f.icon}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: txt, marginBottom: 14 }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: muted, lineHeight: 1.7, fontWeight: 500 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ CTA AKHIR ═══ */}
          <section className="section-spacing anim-scaleIn" style={{ textAlign: 'center', padding: '80px 24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(236,72,153,0.08))', borderRadius: 48, border: `1px solid ${border}`, position: 'relative', overflow: 'hidden' }}>
            <div className="absolute top-10 left-10 text-4xl animate-float-cute" style={{ opacity: 0.4 }}>🌟</div>
            <div className="absolute bottom-10 right-10 text-5xl animate-float-slow" style={{ opacity: 0.4 }}>🤗</div>
            
            <h2 className="kp-serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: txt, marginBottom: 24 }}>Udah Siap Buat Cerita Hari Ini?</h2>
            <p style={{ fontSize: 18, color: muted, marginBottom: 44, fontWeight: 500, maxWidth: 500, margin: '0 auto' }}>Jangan dipendam sendiri ya. Yuk, keluarkan semuanya di ruang amanmu ini.</p>
            <Link href="/curhat" className="pill-cta animate-float-slow" style={{ fontSize: 18, padding: '20px 48px' }}>
              💬 Mulai Sesi Curhatmu
            </Link>
          </section>
        </div>

        {/* ── Footer ── */}
        <footer style={{
          padding: '80px 24px 40px', textAlign: 'center', borderTop: `1px solid ${border}`,
          background: dark ? 'rgba(5,5,10,0.7)' : 'rgba(248,250,252,0.7)', color: muted, fontSize: 15,
          backdropFilter: 'blur(24px)'
        }}>
          <div className="animate-float-slow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16 }}>💙</div>
            <span className="kp-serif" style={{ fontSize: 24, fontWeight: 800, color: txt }}>Kenopia</span>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 100, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontWeight: 800 }}>AI</span>
          </div>
          <p style={{ fontWeight: 500 }}>Dibuat dengan 💜 untuk kesehatan mentalmu.</p>
        </footer>
      </div>
    </>
  )
}