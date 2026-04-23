'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const features = [
  {
    icon: '🤖',
    title: 'AI Mendengarmu',
    desc: 'IndoBERT memahami nuansa emosi Bahasa Indonesia, Claude AI merespons dengan hangat dan empatik — bukan bot biasa.',
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.08)',
  },
  {
    icon: '🔒',
    title: 'Privasi Penuh',
    desc: 'Tidak ada manusia yang membaca. Semua tersimpan lokal di perangkatmu. Kamu bisa mengunci dengan PIN 4 digit.',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
  },
  {
    icon: '📊',
    title: 'Lacak Emosimu',
    desc: 'Grafik distribusi emosi harian, kalender jejak perasaan, dan AI Insight mingguan berbasis riwayat curhatan.',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
  },
  {
    icon: '🎵',
    title: 'Suara Ambient',
    desc: 'Pilih suara latar: hujan sore, api unggun, atau alam terbuka — untuk menemanimu bercerita lebih nyaman.',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
  },
  {
    icon: '🎭',
    title: 'Pilih Persona AI',
    desc: 'Butuh teman ngobrol? Pilih Sahabat. Mau saran profesional? Pilih Psikolog. Refleksi mendalam? Filsuf Zen.',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
  },
  {
    icon: '🫁',
    title: 'Latihan Pernapasan',
    desc: 'Animasi pernapasan 4-4 untuk menenangkan pikiran sebelum atau sesudah bercerita — langsung di dalam app.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
  },
]

const steps = [
  { n: '01', title: 'Ceritakan Perasaanmu', desc: 'Ketik atau gunakan fitur suara (speech-to-text) untuk bercerita bebas dalam Bahasa Indonesia.' },
  { n: '02', title: 'AI Mendeteksi Emosimu', desc: 'IndoBERT menganalisis teks dan mengenali emosi dominan: senang, sedih, marah, takut, atau cinta.' },
  { n: '03', title: 'Respons yang Hangat', desc: 'Claude AI merespons dengan empati, sesuai persona yang kamu pilih dan konteks percakapanmu.' },
  { n: '04', title: 'Tumbuh Bersama Data', desc: 'Lihat grafik emosimu dari waktu ke waktu, dan minta AI Insight untuk refleksi mingguan.' },
]

const emotions = [
  { emoji: '😄', label: 'Senang', color: '#f59e0b' },
  { emoji: '🥰', label: 'Cinta', color: '#f43f5e' },
  { emoji: '😡', label: 'Marah', color: '#ef4444' },
  { emoji: '😨', label: 'Takut', color: '#8b5cf6' },
  { emoji: '😢', label: 'Sedih', color: '#3b82f6' },
]

const testimonials = [
  { text: 'Akhirnya ada tempat curhat yang nggak bakal judge aku. Kenopia benar-benar bikin lega.', name: 'R.A.', tag: 'Mahasiswa Tingkat Akhir' },
  { text: 'Fitur grafik emosinya membantu aku sadar kalau mood-ku sangat dipengaruhi cuaca dan deadline.', name: 'Bima S.', tag: 'Software Engineer' },
  { text: 'Persona "Filsuf Zen"-nya sering kasih perspektif yang bikin aku mikir ulang masalah dengan kepala dingin.', name: 'Dinda K.', tag: 'Guru SMA' },
]

const stats = [
  { val: '5', unit: 'Emosi', label: 'terdeteksi akurat oleh IndoBERT' },
  { val: '3', unit: 'Persona', label: 'AI yang bisa kamu pilih' },
  { val: '100%', unit: 'Lokal', label: 'data tersimpan di perangkatmu' },
  { val: '24/7', unit: 'Tersedia', label: 'kapan pun kamu butuh' },
]

export default function HomePage() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('kenopia-theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    setMounted(true)

    const timer = setInterval(() => setActiveStep(s => (s + 1) % 4), 2800)
    return () => clearInterval(timer)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('kenopia-theme', next ? 'dark' : 'light')
  }

  if (!mounted) return null

  const isDark = dark

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .kn-page * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
        .kn-serif { font-family: 'Instrument Serif', Georgia, serif !important; }

        .pill-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 30px; border-radius: 100px;
          font-weight: 500; font-size: 15px;
          background: linear-gradient(135deg, #7c3aed, #c026d3);
          color: #fff !important; border: none; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 36px rgba(124,58,237,0.4);
          text-decoration: none !important;
        }
        .pill-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 50px rgba(62, 8, 156, 0.55); }

        @keyframes float-a { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes float-b { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes float-c { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.6); opacity: 0; } }

        .float-a { animation: float-a 5s ease-in-out infinite; }
        .float-b { animation: float-b 7s ease-in-out 0.8s infinite; }
        .float-c { animation: float-c 6s ease-in-out 0.4s infinite; }

        .fade-up-1 { animation: fade-up 0.6s ease 0.05s both; }
        .fade-up-2 { animation: fade-up 0.6s ease 0.15s both; }
        .fade-up-3 { animation: fade-up 0.6s ease 0.25s both; }
        .fade-up-4 { animation: fade-up 0.6s ease 0.35s both; }
        .fade-up-5 { animation: fade-up 0.6s ease 0.45s both; }

        .gradient-text {
          background: linear-gradient(135deg, #e879f9 0%, #818cf8 50%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .step-dot {
          height: 8px; border-radius: 4px; cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1); flex-shrink: 0;
        }

        .feature-card-kn {
          padding: 28px; border-radius: 20px;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .feature-card-kn:hover { transform: translateY(-5px); }

        .online-dot { animation: pulse-ring 1.5s ease-out infinite; }
      `}</style>

      <div
        className="kn-page min-h-screen relative overflow-x-hidden"
        style={{ background: isDark ? '#080810' : '#f4f2ee' }}
      >
        {/* Mesh background */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          background: isDark
            ? 'radial-gradient(ellipse 55% 45% at 15% 15%, rgba(109,40,217,0.2) 0%, transparent 70%), radial-gradient(ellipse 45% 55% at 85% 75%, rgba(251,146,60,0.1) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 60% 5%, rgba(56,189,248,0.07) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 55% 45% at 15% 15%, rgba(109,40,217,0.07) 0%, transparent 70%), radial-gradient(ellipse 45% 55% at 85% 75%, rgba(251,146,60,0.06) 0%, transparent 70%)',
        }} />

        {/* Navbar */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'rgba(8,8,16,0.8)' : 'rgba(244,242,238,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💜</div>
            <span className="kn-serif" style={{ fontSize: 21, color: isDark ? '#f1f0ef' : '#1a1918', letterSpacing: '-0.01em' }}>Kenopia</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/curhat" style={{ display: 'none', fontSize: 14, fontWeight: 500, color: isDark ? 'rgba(241,240,239,0.55)' : 'rgba(26,25,24,0.55)', textDecoration: 'none', padding: '8px 16px' }} className="sm:block">
              Mulai Curhat
            </Link>
            <button onClick={toggleTheme} style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.25)',
              background: 'rgba(124,58,237,0.12)', color: '#a78bfa', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              transition: 'transform 0.2s',
            }}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </nav>

        <div style={{ position: 'relative', zIndex: 10, paddingTop: 128, paddingBottom: 96, paddingLeft: 24, paddingRight: 24, maxWidth: 1100, margin: '0 auto' }}>

          {/* ── Hero ── */}
          <div className="fade-up-1" style={{ textAlign: 'center', marginBottom: 96 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 18px', borderRadius: 100, fontSize: 13, fontWeight: 500,
              background: 'rgba(124,58,237,0.12)', color: '#a78bfa',
              border: '1px solid rgba(124,58,237,0.25)', marginBottom: 32,
            }}>
              ✨ AI Empati untuk Bahasa Indonesia
            </div>

            <h1 className="kn-serif" style={{
              fontSize: 'clamp(2.6rem, 6.5vw, 5.5rem)', lineHeight: 1.05,
              letterSpacing: '-0.025em', marginBottom: 24,
              color: isDark ? '#f1f0ef' : '#1a1918',
            }}>
              Tempat Curhat<br />
              <em className="gradient-text">yang Benar-Benar Mengerti</em>
            </h1>

            <p style={{
              fontSize: 17, maxWidth: 500, margin: '0 auto 40px',
              color: isDark ? 'rgba(241,240,239,0.55)' : 'rgba(26,25,24,0.55)',
              lineHeight: 1.7,
            }}>
              Luapkan emosimu ke AI yang memahami nuansa Bahasa Indonesia — hangat, empatik, dan menjaga rahasiamu.
            </p>

            <div className="fade-up-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
              <Link href="/curhat" className="pill-btn">Mulai Curhat Sekarang <span>→</span></Link>
              <a href="#cara-kerja" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 100, fontSize: 15, fontWeight: 500,
                background: 'transparent', cursor: 'pointer', textDecoration: 'none',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                color: isDark ? '#f1f0ef' : '#1a1918',
                transition: 'all 0.2s',
              }}>
                Lihat Cara Kerja
              </a>
            </div>
          </div>

          {/* ── Chat Preview ── */}
          <div className="fade-up-3" style={{ display: 'flex', justifyContent: 'center', marginBottom: 100 }}>
            <div style={{
              width: '100%', maxWidth: 400,
              padding: 24, borderRadius: 24,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              backdropFilter: 'blur(16px)',
              boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.4)' : '0 32px 80px rgba(0,0,0,0.1)',
            }}>
              {/* Chat header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>K</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#f1f0ef' : '#1a1918' }}>Kenopia AI</div>
                  <div style={{ fontSize: 11, color: isDark ? 'rgba(241,240,239,0.4)' : 'rgba(26,25,24,0.4)' }}>IndoBERT × Claude</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ position: 'relative', width: 8, height: 8 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                    <div className="online-dot" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
                  </div>
                  <span style={{ fontSize: 11, color: isDark ? 'rgba(241,240,239,0.35)' : 'rgba(26,25,24,0.35)' }}>Online</span>
                </div>
              </div>
              {/* Bubbles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 130 }}>
                <div className="float-a" style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', fontSize: 13, lineHeight: 1.55, maxWidth: '85%', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(241,240,239,0.9)' : 'rgba(26,25,24,0.85)' }}>
                  💙 Halo! Ceritakan apa yang sedang kamu rasakan hari ini...
                </div>
                <div className="float-b" style={{ padding: '12px 16px', borderRadius: '16px 16px 4px 16px', fontSize: 13, lineHeight: 1.55, maxWidth: '85%', alignSelf: 'flex-end', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: 'white' }}>
                  Aku lagi overwhelmed sama deadline tugas akhir 😭
                </div>
                <div className="float-c" style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', fontSize: 13, lineHeight: 1.55, maxWidth: '90%', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(241,240,239,0.9)' : 'rgba(26,25,24,0.85)' }}>
                  😔 <strong>Sedih</strong> terdeteksi — Deadline memang berat. Aku di sini bersamamu, yuk cerita lebih...
                </div>
              </div>
              {/* Emotion pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
                {emotions.map(e => (
                  <span key={e.label} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 100,
                    background: `${e.color}18`, color: e.color, border: `1px solid ${e.color}35`,
                    fontWeight: 500,
                  }}>
                    {e.emoji} {e.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="fade-up-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 100 }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '28px 20px', borderRadius: 20,
                background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              }}>
                <div className="kn-serif gradient-text" style={{ fontSize: '2.4rem', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#f1f0ef' : '#1a1918', marginTop: 4 }}>{s.unit}</div>
                <div style={{ fontSize: 12, color: isDark ? 'rgba(241,240,239,0.3)' : 'rgba(26,25,24,0.35)', marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── How it works ── */}
          <section id="cara-kerja" style={{ marginBottom: 100 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="kn-serif" style={{ fontSize: 'clamp(1.7rem,4vw,2.8rem)', color: isDark ? '#f1f0ef' : '#1a1918', letterSpacing: '-0.02em', marginBottom: 12 }}>Cara Kerjanya Sederhana</h2>
              <p style={{ color: isDark ? 'rgba(241,240,239,0.5)' : 'rgba(26,25,24,0.5)', fontSize: 16 }}>Empat langkah menuju pemahaman diri yang lebih baik</p>
            </div>

            <div style={{
              maxWidth: 680, margin: '0 auto', padding: '32px 36px', borderRadius: 24,
              background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.85)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              backdropFilter: 'blur(16px)',
            }}>
              {/* Dots */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="step-dot"
                    onClick={() => setActiveStep(i)}
                    style={{
                      width: activeStep === i ? 28 : 8,
                      background: activeStep === i ? '#7c3aed' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                    }}
                  />
                ))}
              </div>
              {/* Content */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, minHeight: 90 }}>
                <div className="kn-serif gradient-text" style={{ fontSize: '4rem', lineHeight: 1, opacity: 0.45, flexShrink: 0 }}>
                  {steps[activeStep].n}
                </div>
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 600, color: isDark ? '#f1f0ef' : '#1a1918', marginBottom: 8 }}>{steps[activeStep].title}</h3>
                  <p style={{ fontSize: 15, color: isDark ? 'rgba(241,240,239,0.55)' : 'rgba(26,25,24,0.55)', lineHeight: 1.65 }}>{steps[activeStep].desc}</p>
                </div>
              </div>
              {/* Step buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
                {steps.map((s, i) => (
                  <button key={i} onClick={() => setActiveStep(i)} style={{
                    fontSize: 12, padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
                    background: activeStep === i ? 'rgba(124,58,237,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                    color: activeStep === i ? '#c084fc' : (isDark ? 'rgba(241,240,239,0.4)' : 'rgba(26,25,24,0.4)'),
                    border: `1px solid ${activeStep === i ? 'rgba(124,58,237,0.4)' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)')}`,
                    transition: 'all 0.2s',
                  }}>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ── */}
          <section id="fitur" style={{ marginBottom: 100 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="kn-serif" style={{ fontSize: 'clamp(1.7rem,4vw,2.8rem)', color: isDark ? '#f1f0ef' : '#1a1918', letterSpacing: '-0.02em', marginBottom: 12 }}>Kenapa Kenopia?</h2>
              <p style={{ color: isDark ? 'rgba(241,240,239,0.5)' : 'rgba(26,25,24,0.5)', fontSize: 16 }}>Lebih dari sekadar bot — ekosistem perawatan emosi</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {features.map((f, i) => (
                <div key={i} className="feature-card-kn" style={{
                  background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.85)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                  boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, marginBottom: 18, background: f.bg, border: `1px solid ${f.color}20`,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: isDark ? '#f1f0ef' : '#1a1918', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: isDark ? 'rgba(241,240,239,0.5)' : 'rgba(26,25,24,0.5)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Testimonials ── */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 className="kn-serif" style={{ fontSize: 'clamp(1.7rem,4vw,2.8rem)', color: isDark ? '#f1f0ef' : '#1a1918', letterSpacing: '-0.02em', marginBottom: 12 }}>Kata Mereka</h2>
              <p style={{ color: isDark ? 'rgba(241,240,239,0.5)' : 'rgba(26,25,24,0.5)', fontSize: 16 }}>Pengalaman nyata pengguna Kenopia</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {testimonials.map((t, i) => (
                <div key={i} style={{
                  padding: '28px', borderRadius: 20,
                  background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.85)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 16, color: isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.3)' }}>❝</div>
                  <p style={{ fontSize: 15, color: isDark ? 'rgba(241,240,239,0.85)' : 'rgba(26,25,24,0.8)', lineHeight: 1.65, marginBottom: 20 }}>{t.text}</p>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#f1f0ef' : '#1a1918' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: isDark ? 'rgba(241,240,239,0.35)' : 'rgba(26,25,24,0.35)', marginTop: 2 }}>{t.tag}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <div style={{
            textAlign: 'center', padding: '64px 40px', borderRadius: 32,
            background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.85)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(124,58,237,0.1), transparent)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>💙</div>
              <h2 className="kn-serif" style={{ fontSize: 'clamp(1.7rem,4vw,2.6rem)', color: isDark ? '#f1f0ef' : '#1a1918', letterSpacing: '-0.02em', marginBottom: 16 }}>
                Siap untuk berbagi cerita?
              </h2>
              <p style={{ fontSize: 16, color: isDark ? 'rgba(241,240,239,0.5)' : 'rgba(26,25,24,0.5)', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.65 }}>
                Kenopia mendengar 24 jam, tanpa penilaian, tanpa kebocoran rahasia — hanya kamu dan AI yang peduli.
              </p>
              <Link href="/curhat" className="pill-btn" style={{ fontSize: 16, padding: '16px 36px' }}>
                💬 Mulai Curhat Gratis
              </Link>
            </div>
          </div>

          {/* ── Footer ── */}
          <footer style={{ marginTop: 80, textAlign: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
              {[['Beranda', '/'], ['Fitur', '#fitur'], ['Cara Kerja', '#cara-kerja'], ['Mulai Curhat', '/curhat']].map(([l, h]) => (
                <a key={l} href={h} style={{ fontSize: 14, color: isDark ? 'rgba(241,240,239,0.28)' : 'rgba(26,25,24,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}>
                  {l}
                </a>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`, paddingTop: 20 }}>
              <p style={{ fontSize: 12, color: isDark ? 'rgba(241,240,239,0.25)' : 'rgba(26,25,24,0.28)' }}>© 2026 Kenopia — Dibuat dengan ❤️ Oleh Dewa Sinar Surya, S,Kom.</p>
              <p style={{ fontSize: 12, color: isDark ? 'rgba(241,240,239,0.2)' : 'rgba(26,25,24,0.22)', marginTop: 4 }}>Powered by IndoBERT × AI </p>
            </div>
          </footer>

        </div>
      </div>
    </>
  )
}