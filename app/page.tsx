'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
  { n: '01', title: 'Ceritakan Perasaan', desc: 'Ketik bebas dalam Bahasa Indonesia', icon: '💬' },
  { n: '02', title: 'AI Mendeteksi', desc: 'IndoBERT menganalisis emosi dominan', icon: '🧠' },
  { n: '03', title: 'Respons Empatik', desc: 'AI merespons dengan super hangat', icon: '💙' },
  { n: '04', title: 'Tumbuh Bersama', desc: 'Lihat grafik emosimu dari waktu ke waktu', icon: '📈' },
]

export default function KenopiaHome() {
  const [dark, setDark] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [typeIdx, setTypeIdx] = useState(0)
  const [typeTxt, setTypeTxt] = useState('')
  const [typing, setTyping] = useState(true)
  const [counters, setCounters] = useState([0, 0, 0, 0])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const countersDone = useRef(false)

  const phrases = [
    'yang Benar-Benar Mengerti',
    'Tanpa Penilaian',
    'Menjaga Rahasiamu',
    'Selalu Ada Untukmu',
  ]

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

  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 4), 4500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (demoStep === 0) t = setTimeout(() => setDemoStep(1), 2000)
    if (demoStep === 1) t = setTimeout(() => setDemoStep(2), 800)
    if (demoStep === 2) t = setTimeout(() => setDemoStep(3), 2800)
    if (demoStep === 3) t = setTimeout(() => setDemoStep(0), 8000)
    return () => clearTimeout(t)
  }, [demoStep])

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

  const bg = dark ? '#030305' : '#f7f8fc'
  const surface = dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.85)'
  const surfaceHover = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,1)'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const txt = dark ? '#f0f4ff' : '#0d1117'
  const muted = dark ? 'rgba(240,244,255,0.5)' : 'rgba(13,17,23,0.5)'
  const accent = '#6366f1'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body { overscroll-behavior: none; }

        .kp * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .kp-serif { font-family: 'Syne', sans-serif !important; }

        /* ── Keyframes ── */
        @keyframes fadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn  { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:.4;} }
        @keyframes blobA    { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%;} }
        @keyframes blobB    { 0%,100%{border-radius:45% 55% 65% 35%/55% 45% 35% 65%;} 50%{border-radius:65% 35% 45% 55%/35% 65% 55% 45%;} }
        @keyframes marquee  { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes floatA   { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-14px) rotate(4deg);} }
        @keyframes floatB   { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        @keyframes shimmer  { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        @keyframes popIn    { 0%{opacity:0;transform:scale(0.82) translateY(14px);} 65%{transform:scale(1.03) translateY(-2px);} 100%{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes slideDown{ from{opacity:0;transform:translateY(-16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spinGlow { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes ripple   { 0%{transform:scale(0.8);opacity:0.7;} 100%{transform:scale(2.2);opacity:0;} }
        @keyframes cursorBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }

        .anim-fadeUp  { animation: fadeUp  0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-scaleIn { animation: scaleIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .float-a      { animation: floatA  5s ease-in-out infinite; }
        .float-b      { animation: floatB  7s ease-in-out infinite; }
        .pop-in       { animation: popIn   0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        .d0{animation-delay:0s;}   .d1{animation-delay:.08s;}
        .d2{animation-delay:.17s;} .d3{animation-delay:.26s;}
        .d4{animation-delay:.35s;} .d5{animation-delay:.44s;}

        .blob-a { animation: blobA 17s ease-in-out infinite; }
        .blob-b { animation: blobB 21s ease-in-out 2s infinite reverse; }

        /* ── Shimmer text ── */
        .shimmer-text {
          background: linear-gradient(90deg,#818cf8 0%,#c084fc 20%,#e879f9 40%,#38bdf8 60%,#6ee7b7 80%,#818cf8 100%);
          background-size: 220% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 6s linear infinite;
        }

        /* ── Buttons ── */
        .pill-primary {
          display: inline-flex; align-items: center; gap: 8px; justify-content: center;
          padding: 16px 40px; border-radius: 100px; font-weight: 700; font-size: 15px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);
          color: #fff !important; border: none; cursor: pointer; text-decoration: none;
          position: relative; overflow: hidden; white-space: nowrap;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 6px 24px rgba(99,102,241,0.3), 0 2px 8px rgba(99,102,241,0.2);
          -webkit-tap-highlight-color: transparent;
        }
        .pill-primary::before {
          content:''; position:absolute; inset:0; border-radius:inherit;
          background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 60%);
        }
        .pill-primary:hover  { transform:translateY(-3px) scale(1.02); box-shadow:0 14px 40px rgba(99,102,241,0.42); }
        .pill-primary:active { transform:translateY(1px) scale(0.98); transition-duration:0.15s; }

        .pill-ghost {
          display: inline-flex; align-items: center; gap: 8px; justify-content: center;
          padding: 15px 32px; border-radius: 100px; font-weight: 600; font-size: 15px;
          background: ${surface}; cursor: pointer; text-decoration: none; white-space: nowrap;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          border: 1px solid ${border}; color: ${txt};
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          -webkit-tap-highlight-color: transparent;
        }
        .pill-ghost:hover { background:${surfaceHover}; transform:translateY(-3px); border-color:rgba(99,102,241,0.35); }

        /* ── Cards ── */
        .card {
          background: ${surface};
          border: 1px solid ${border};
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                      background 0.55s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .card:hover {
          transform: translateY(-5px);
          border-color: rgba(99,102,241,0.28);
          box-shadow: 0 20px 50px -12px ${dark ? 'rgba(0,0,0,0.35)' : 'rgba(99,102,241,0.1)'};
          background: ${surfaceHover};
        }

        /* ── Marquee ── */
        .marquee-wrap { display:flex; overflow:hidden; padding:12px 0; cursor:default; }
        .marquee-track {
          display:flex; gap:16px; white-space:nowrap; flex-shrink:0;
          animation: marquee 32s linear infinite;
        }
        .marquee-wrap:hover .marquee-track { animation-play-state:paused; }

        /* ── Chat bubbles ── */
        .bubble-ai {
          background: ${surface}; border: 1px solid ${border};
          border-radius: 20px 20px 20px 5px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .bubble-user {
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
          color: white;
          border-radius: 20px 20px 5px 20px;
          box-shadow: 0 6px 20px rgba(79,70,229,0.25);
        }

        /* ── Typing dots ── */
        .dot { width:6px; height:6px; border-radius:50%; background:#4f46e5; }
        .dot:nth-child(1){animation:pulse 1.1s 0s   ease-in-out infinite;}
        .dot:nth-child(2){animation:pulse 1.1s 0.18s ease-in-out infinite;}
        .dot:nth-child(3){animation:pulse 1.1s 0.36s ease-in-out infinite;}

        /* ── Mobile menu ── */
        .mob-menu {
          position:fixed; top:68px; left:0; right:0; z-index:200;
          animation: slideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          background: ${dark ? 'rgba(4,4,10,0.97)' : 'rgba(250,251,255,0.98)'};
          backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
          border-bottom: 1px solid ${border};
          padding: 16px; display: flex; flex-direction: column; gap: 8px;
        }
        .mob-menu a {
          display:flex; align-items:center; gap:10px; padding:14px 16px;
          border-radius:16px; font-size:15px; font-weight:600;
          text-decoration:none; color:${txt};
          background:${surface}; border:1px solid ${border};
          transition:all 0.25s ease;
        }
        .mob-menu a:active { transform:scale(0.98); }
        .mob-menu .mob-cta {
          background: linear-gradient(135deg,#4f46e5,#7c3aed,#db2777);
          color:white !important; border:none; border-radius:100px;
          justify-content:center; font-weight:700; font-size:15px;
          padding: 16px;
        }

        /* ── Hamburger ── */
        .ham {
          display:none; flex-direction:column; gap:5px;
          width:44px; height:44px; align-items:center; justify-content:center;
          border-radius:14px; cursor:pointer;
          background:${surface}; border:1px solid ${border};
          -webkit-tap-highlight-color:transparent;
        }
        .ham span {
          display:block; width:20px; height:1.8px; border-radius:2px;
          background:${txt}; transition:all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin:center;
        }
        .ham.open span:nth-child(1){transform:translateY(6.8px) rotate(45deg);}
        .ham.open span:nth-child(2){opacity:0;transform:scaleX(0);}
        .ham.open span:nth-child(3){transform:translateY(-6.8px) rotate(-45deg);}

        /* ── Layout ── */
        .section-gap { margin-bottom: 140px; }
        .inner { max-width: 1180px; margin: 0 auto; padding: 0 28px; }

        /* ── Responsive Breakpoints ── */
        @media (max-width: 1024px) {
          .feat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 768px) {
          .ham { display: flex; }
          .nav-links { display: none !important; }
          .nav-cta-desktop { display: none !important; }

          .hero-grid { flex-direction: column !important; gap: 16px !important; }
          .hero-grid > * { width: 100% !important; }
          .hero-title { font-size: clamp(2rem, 7.5vw, 3rem) !important; }
          .hero-sub { font-size: 15px !important; }
          .hero-badge { font-size: 10px !important; padding: 7px 16px !important; }
          .trust-bar { display: none !important; }

          .hero-floats { display: none !important; }
          .cta-floats { display: none !important; }

          .preview-stats-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .stats-2x2 { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }

          .feat-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }

          .section-gap { margin-bottom: 80px; }
          .inner { padding: 0 16px; }

          .marquee-outer { margin: 0 -16px 80px !important; }
          .marquee-track { animation-duration: 20s !important; }

          .cta-box { padding: 44px 20px !important; border-radius: 28px !important; }
          .cta-title { font-size: clamp(1.7rem, 6vw, 2.4rem) !important; }

          .section-title { font-size: clamp(1.9rem, 6.5vw, 3rem) !important; }
          .stat-num { font-size: 2rem !important; }

          .content-top { padding-top: 100px !important; }

          .footer-inner { padding: 48px 16px 32px !important; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: clamp(1.75rem, 8vw, 2.4rem) !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .pill-primary { padding: 15px 28px !important; font-size: 14px !important; }
          .pill-ghost { padding: 14px 22px !important; font-size: 14px !important; }
          .stat-num { font-size: 1.8rem !important; }
          .chat-card-inner { padding: 22px 16px !important; }
          .feat-card-inner { padding: 28px 20px !important; }
          .step-card-inner { padding: 26px 18px !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="kp" style={{ minHeight: '100vh', background: bg, position: 'relative', overflowX: 'hidden' }}>

        {/* ── Background ── */}
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div className="blob-a" style={{
            position: 'absolute', width: '80vmax', height: '80vmax', top: '-25%', left: '-20%',
            background: dark
              ? 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 62%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 62%)',
            filter: 'blur(70px)',
          }} />
          <div className="blob-b" style={{
            position: 'absolute', width: '70vmax', height: '70vmax', bottom: '-20%', right: '-18%',
            background: dark
              ? 'radial-gradient(circle, rgba(219,39,119,0.1) 0%, transparent 62%)'
              : 'radial-gradient(circle, rgba(219,39,119,0.05) 0%, transparent 62%)',
            filter: 'blur(70px)',
          }} />
          {/* Dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.055)'} 1.5px, transparent 1.5px)`,
            backgroundSize: '34px 34px',
            opacity: dark ? 0.5 : 0.7,
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 100%)'
          }} />
        </div>

        {/* ── Navbar ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
          height: 68,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          background: dark ? 'rgba(3,3,5,0.6)' : 'rgba(247,248,252,0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: `1px solid ${border}`,
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #db2777)',
              padding: 2, boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fff' }}>
                <Image src="/logo.png" alt="Kenopia" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="kp-serif" style={{ fontSize: 20, fontWeight: 800, color: txt, letterSpacing: '-0.02em' }}>Kenopia</span>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 800, letterSpacing: '0.04em' }}>AI</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[['✨ Fitur', '#fitur'], ['🔍 Cara Kerja', '#cara-kerja']].map(([l, h]) => (
              <a key={l as string} href={h as string} style={{
                color: muted, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                padding: '7px 15px', transition: 'all 0.3s', borderRadius: 100,
              }}
                onMouseOver={e => { e.currentTarget.style.color = txt; e.currentTarget.style.background = surface }}
                onMouseOut={e => { e.currentTarget.style.color = muted; e.currentTarget.style.background = 'transparent' }}>
                {l}
              </a>
            ))}
          </div>

          {/* Right side controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/curhat" className="pill-primary nav-cta-desktop" style={{ padding: '10px 22px', fontSize: 13 }}>
              🚀 Mulai Curhat
            </Link>
            <button onClick={toggleTheme} aria-label="Toggle theme" style={{
              width: 42, height: 42, borderRadius: '50%',
              border: `1px solid ${border}`, background: surface,
              color: txt, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
              flexShrink: 0,
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.12) rotate(18deg)'; e.currentTarget.style.borderColor = accent }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.borderColor = border }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              className={`ham ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <>
            <div className="mob-menu">
              <a href="#fitur" onClick={() => setMobileMenuOpen(false)}>✨ Fitur</a>
              <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)}>🔍 Cara Kerja</a>
              <Link href="/curhat" className="mob-cta" onClick={() => setMobileMenuOpen(false)}
                style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
                🚀 Mulai Curhat Sekarang
              </Link>
            </div>
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{ position:'fixed', inset:0, zIndex:199, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)' }}
            />
          </>
        )}

        {/* ── Main content ── */}
        <div className="content-top" style={{ position:'relative', zIndex:10, paddingTop: 130 }}>

          {/* ═══════ HERO ═══════ */}
          <section className="inner section-gap" style={{ textAlign:'center', position:'relative' }}>

            {/* Floating deco */}
            <div className="hero-floats" aria-hidden="true">
              <div className="float-a" style={{ position:'absolute', left:'6%', top:'-2%', fontSize:32, opacity:0.55, pointerEvents:'none' }}>🍃</div>
              <div className="float-b" style={{ position:'absolute', right:'10%', top:'20%', fontSize:26, opacity:0.4, pointerEvents:'none' }}>✨</div>
              <div className="float-a" style={{ position:'absolute', left:'16%', bottom:'8%', fontSize:22, opacity:0.35, pointerEvents:'none', animationDelay:'1.5s' }}>💭</div>
            </div>

            {/* Badge */}
            <div className="anim-fadeUp d0" style={{ marginBottom:28 }}>
              <span className="hero-badge" style={{
                display:'inline-block', padding:'9px 22px', borderRadius:100,
                fontSize:11, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase',
                background: dark ? 'rgba(79,70,229,0.12)' : 'rgba(79,70,229,0.07)',
                color: '#6366f1', border:'1.5px dashed rgba(99,102,241,0.3)',
                boxShadow: '0 4px 18px rgba(99,102,241,0.1)'
              }}>🤖 Teman Cerita Virtualmu</span>
            </div>

            {/* Headline */}
            <h1 className="kp-serif anim-fadeUp d2 hero-title" style={{
              fontSize:'clamp(2.6rem, 6vw, 5rem)', lineHeight:1.14,
              letterSpacing:'-0.03em', color:txt, marginBottom:24, fontWeight:800,
            }}>
              Tempat Curhat
              <br />
              <span className="shimmer-text" style={{ display:'inline-block', minHeight:'1.2em' }}>
                {typeTxt}<span style={{
                  animation:'cursorBlink 1s step-end infinite',
                  borderRight:`3px solid #4f46e5`, paddingLeft:5, borderRadius:2,
                  display:'inline-block', verticalAlign:'baseline',
                  height:'0.85em', marginBottom:'-0.05em'
                }} />
              </span>
            </h1>

            {/* Sub */}
            <p className="anim-fadeUp d3 hero-sub" style={{
              fontSize:17, color:muted, maxWidth:560, margin:'0 auto 36px',
              lineHeight:1.7, fontWeight:500,
            }}>
              Luapkan emosimu ke AI yang memahami nuansa Bahasa Indonesia —
              hangat, empatik, dan menjaga rahasiamu sepenuhnya. 💙
            </p>

            {/* Buttons */}
            <div className="anim-fadeUp d4 hero-grid" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
              <Link href="/curhat" className="pill-primary">
                🚀 Mulai Curhat Sekarang
              </Link>
              <a href="#cara-kerja" className="pill-ghost">
                👀 Cara Kerjanya
              </a>
            </div>

            {/* Trust bar */}
            <div className="anim-fadeUp d5 trust-bar card" style={{
              display:'inline-flex', alignItems:'center', gap:28, flexWrap:'wrap',
              justifyContent:'center', padding:'16px 36px', borderRadius:100,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 8px 32px rgba(99,102,241,0.06)'
            }}>
              {[['🔒','Data Lokal 100%'],['⚡','Respons Instan'],['🧠','AI Super Empati']].map(([ic,lb]) => (
                <div key={lb} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:txt, fontWeight:600 }}>
                  <span style={{ fontSize:17 }}>{ic}</span><span>{lb}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════ MARQUEE ═══════ */}
          <div className="marquee-outer" style={{ overflow:'hidden', position:'relative', margin:'0 0 100px 0' }}>
            <div aria-hidden="true" style={{ position:'absolute', left:0, top:0, bottom:0, width:100, zIndex:2, background:`linear-gradient(to right, ${bg}, transparent)`, pointerEvents:'none' }} />
            <div aria-hidden="true" style={{ position:'absolute', right:0, top:0, bottom:0, width:100, zIndex:2, background:`linear-gradient(to left, ${bg}, transparent)`, pointerEvents:'none' }} />
            <div className="marquee-wrap">
              <div className="marquee-track">
                {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
                  <span key={i} className="card" style={{
                    fontSize:13, fontWeight:700, padding:'9px 20px', borderRadius:100,
                    color:muted, flexShrink:0, transition:'all 0.35s ease', cursor:'default',
                    display:'inline-block'
                  }}
                    onMouseOver={e => { e.currentTarget.style.color = txt; e.currentTarget.style.transform = 'scale(1.06)' }}
                    onMouseOut={e => { e.currentTarget.style.color = muted; e.currentTarget.style.transform = 'scale(1)' }}>
                    {item}
                  </span>
                ))}
              </div>
              {/* Duplicate for seamless scroll */}
              <div className="marquee-track" aria-hidden="true">
                {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
                  <span key={i} className="card" style={{
                    fontSize:13, fontWeight:700, padding:'9px 20px', borderRadius:100,
                    color:muted, flexShrink:0, display:'inline-block'
                  }}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════ CHAT PREVIEW + STATS ═══════ */}
          <section className="inner section-gap">
            <div className="preview-stats-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

              {/* Chat Card */}
              <div className="anim-scaleIn d1 card chat-card-inner" style={{
                padding:32, borderRadius:32,
                boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.35)' : '0 32px 80px rgba(99,102,241,0.07)',
              }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22, paddingBottom:18, borderBottom:`1px solid ${border}` }}>
                  <div style={{
                    width:46, height:46, borderRadius:'50%',
                    background:'linear-gradient(135deg,#4f46e5,#db2777)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20, color:'white', flexShrink:0,
                    boxShadow:'0 8px 24px rgba(79,70,229,0.35)'
                  }}>💙</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:txt }}>Kenopia AI</div>
                    <div style={{ fontSize:11.5, color:muted, marginTop:2, fontWeight:500 }}>Sahabat Virtualmu</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.1)', padding:'6px 13px', borderRadius:100, border:'1px solid rgba(74,222,128,0.2)', flexShrink:0 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px rgba(74,222,128,0.6)' }} />
                    <span style={{ fontSize:10, color:'#4ade80', fontWeight:800, letterSpacing:'0.05em' }}>ONLINE</span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ display:'flex', flexDirection:'column', gap:16, minHeight:280 }}>
                  <div className="pop-in bubble-ai d0" style={{ padding:'13px 18px', fontSize:13.5, lineHeight:1.65, maxWidth:'90%', color:txt }}>
                    👋 Halo! Ceritakan apa yang sedang kamu rasakan hari ini...
                  </div>
                  {demoStep >= 1 && (
                    <div className="pop-in bubble-user" style={{ padding:'13px 18px', fontSize:13.5, lineHeight:1.65, maxWidth:'88%', alignSelf:'flex-end' }}>
                      Aku lagi capek banget sama tugas kuliah, rasanya pengen nyerah aja 😭
                    </div>
                  )}
                  {demoStep === 2 && (
                    <div className="pop-in bubble-ai" style={{ padding:'12px 18px', width:'fit-content' }}>
                      <div style={{ display:'flex', gap:5, alignItems:'center', height:16 }}>
                        <div className="dot" /><div className="dot" /><div className="dot" />
                      </div>
                    </div>
                  )}
                  {demoStep >= 3 && (
                    <>
                      <div className="pop-in" style={{ alignSelf:'center' }}>
                        <div style={{ padding:'5px 14px', borderRadius:100, background:'rgba(79,70,229,0.08)', border:'1.5px dashed rgba(99,102,241,0.35)', color:'#818cf8', fontSize:11, fontWeight:800, display:'flex', gap:5, alignItems:'center' }}>
                          <span>😢</span> Sedih Terdeteksi
                        </div>
                      </div>
                      <div className="pop-in bubble-ai" style={{ padding:'13px 18px', fontSize:13.5, lineHeight:1.65, maxWidth:'92%', color:txt }}>
                        Pasti berat banget rasanya ya. Menangislah kalau itu bikin lega. Aku siap dengerin semua keluh kesahmu tanpa menghakimi. Yuk, keluarkan semuanya... 💙
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stats 2×2 */}
              <div className="stats-2x2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
                {[
                  { val:counters[0], unit:'', suffix:' Emosi', label:'Dikenali Akurat', color:'#6ee7b7', icon:'🎭' },
                  { val:counters[1], unit:'', suffix:' Persona', label:'Siap Mendengar', color:'#a5b4fc', icon:'🧠' },
                  { val:counters[2], unit:'%', suffix:' Aman', label:'Data di HP-mu', color:'#fca5a5', icon:'🔒' },
                  { val:counters[3], unit:'/7', suffix:' Tersedia', label:'Tanpa Istirahat', color:'#67e8f9', icon:'⏳' },
                ].map((s, i) => (
                  <div key={i} className="pop-in card" style={{ padding:'24px 18px', borderRadius:26, animationDelay:`${0.15*i}s` }}>
                    <div style={{ fontSize:22, marginBottom:10 }}>{s.icon}</div>
                    <div className="kp-serif stat-num" style={{
                      fontSize:'2.3rem', fontWeight:800, lineHeight:1,
                      color:s.color, textShadow:`0 0 28px ${s.color}30`
                    }}>
                      {s.val}{s.unit}
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color:txt, marginTop:10 }}>{s.suffix}</div>
                    <div style={{ fontSize:11.5, color:muted, marginTop:3, fontWeight:500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════ HOW IT WORKS ═══════ */}
          <section id="cara-kerja" className="inner section-gap">
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <div style={{ fontSize:11, fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase', color:'#6366f1', marginBottom:14 }}>— ✨ Sangat Mudah —</div>
              <h2 className="kp-serif section-title" style={{ fontSize:'clamp(2rem, 5vw, 3.6rem)', fontWeight:800, color:txt, letterSpacing:'-0.025em', lineHeight:1.12 }}>
                4 Langkah Menuju<br /><span className="shimmer-text">Kelegaan Hati</span>
              </h2>
            </div>

            <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="card step-card-inner"
                  onClick={() => setActiveStep(i)}
                  style={{
                    padding:'30px 22px', borderRadius:26, cursor:'pointer',
                    background: activeStep===i ? (dark?'rgba(79,70,229,0.13)':'rgba(79,70,229,0.07)') : surface,
                    borderColor: activeStep===i ? 'rgba(99,102,241,0.35)' : border,
                    transform: activeStep===i ? 'scale(1.04) translateY(-5px)' : 'scale(1)',
                    boxShadow: activeStep===i ? `0 18px 40px rgba(99,102,241,0.15)` : 'none',
                    transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    position:'relative', overflow:'hidden',
                  }}
                >
                  {/* Step number watermark */}
                  <div className="kp-serif" style={{
                    fontSize:'3rem', fontWeight:800, lineHeight:1, marginBottom:18,
                    color: activeStep===i ? '#4f46e5' : (dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)'),
                    transition:'color 0.45s',
                    userSelect:'none',
                  }}>{s.n}</div>
                  <div style={{ fontSize:22, marginBottom:12 }}>{s.icon}</div>
                  <h3 style={{ fontSize:15, fontWeight:800, color:txt, marginBottom:8, lineHeight:1.3 }}>{s.title}</h3>
                  <p style={{ fontSize:13, color:muted, lineHeight:1.6, fontWeight:500 }}>{s.desc}</p>
                  {/* Active indicator dot */}
                  {activeStep===i && (
                    <div style={{ position:'absolute', bottom:14, right:14, width:8, height:8, borderRadius:'50%', background:'#4f46e5', boxShadow:'0 0 12px rgba(79,70,229,0.6)' }} />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ═══════ FEATURES GRID ═══════ */}
          <section id="fitur" className="inner section-gap">
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <div style={{ fontSize:11, fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase', color:'#db2777', marginBottom:14 }}>— Fitur Unggulan —</div>
              <h2 className="kp-serif section-title" style={{ fontSize:'clamp(2rem, 5vw, 3.6rem)', fontWeight:800, color:txt, letterSpacing:'-0.025em' }}>
                Kenapa <span className="shimmer-text">Kenopia?</span>
              </h2>
              <p style={{ color:muted, fontSize:16, marginTop:14, fontWeight:500, maxWidth:440, margin:'14px auto 0' }}>
                Lebih dari sekadar bot — ini ruang aman pribadimu. 🍃
              </p>
            </div>

            <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
              {features.map((f, i) => (
                <div key={i} className="card feat-card-inner" style={{ padding:'34px 26px', borderRadius:28, position:'relative', overflow:'hidden' }}>
                  {/* Glow bg */}
                  <div aria-hidden style={{ position:'absolute', top:-50, right:-50, width:160, height:160, borderRadius:'50%', background:`${f.color}18`, filter:'blur(50px)', pointerEvents:'none' }} />
                  {/* Icon */}
                  <div className="float-b" style={{
                    width:56, height:56, borderRadius:20, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:28, marginBottom:20,
                    background:`${f.color}12`, border:`1.5px solid ${f.color}28`,
                    boxShadow:`0 8px 26px ${f.color}14`,
                    animationDelay:`${i*0.4}s`
                  }}>{f.icon}</div>
                  <h3 style={{ fontSize:16, fontWeight:800, color:txt, marginBottom:10 }}>{f.title}</h3>
                  <p style={{ fontSize:13.5, color:muted, lineHeight:1.7, fontWeight:500 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════ CTA ═══════ */}
          <section className="inner section-gap">
            <div className="cta-box anim-scaleIn" style={{
              textAlign:'center', padding:'68px 32px', borderRadius:40,
              background: dark
                ? 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(219,39,119,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(219,39,119,0.05) 100%)',
              border:`1px solid ${dark?'rgba(99,102,241,0.15)':'rgba(99,102,241,0.1)'}`,
              position:'relative', overflow:'hidden',
            }}>
              <div className="cta-floats" aria-hidden="true">
                <div className="float-a" style={{ position:'absolute', top:24, left:32, fontSize:36, opacity:0.35 }}>🌟</div>
                <div className="float-b" style={{ position:'absolute', bottom:24, right:32, fontSize:36, opacity:0.35 }}>🤗</div>
              </div>
              {/* Inner glow */}
              <div aria-hidden style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'60%', height:'60%', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

              <h2 className="kp-serif cta-title" style={{ fontSize:'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight:800, color:txt, marginBottom:16, position:'relative' }}>
                Udah Siap Buat Cerita Hari Ini?
              </h2>
              <p style={{ fontSize:15, color:muted, marginBottom:36, fontWeight:500, maxWidth:420, margin:'0 auto 36px', lineHeight:1.65, position:'relative' }}>
                Jangan dipendam sendiri ya. Yuk, keluarkan semuanya di ruang amanmu ini.
              </p>
              <Link href="/curhat" className="pill-primary float-b" style={{ fontSize:16, padding:'17px 42px', position:'relative' }}>
                💬 Mulai Sesi Curhatmu
              </Link>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <footer className="footer-inner" style={{
          padding:'64px 28px 36px', textAlign:'center',
          borderTop:`1px solid ${border}`,
          background: dark ? 'rgba(3,3,5,0.75)' : 'rgba(245,246,250,0.75)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        }}>
          <div className="float-b" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#db2777)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:15 }}>💙</div>
            <span className="kp-serif" style={{ fontSize:21, fontWeight:800, color:txt }}>Kenopia</span>
            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:100, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', fontWeight:800 }}>AI</span>
          </div>
          <p style={{ fontSize:13.5, color:muted, fontWeight:500 }}>Dibuat dengan 💜 untuk kesehatan mentalmu.</p>
        </footer>
      </div>
    </>
  )
}