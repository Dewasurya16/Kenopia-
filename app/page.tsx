'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'

// ─── Types ──────────────────────────────────────────────────────────────────
interface Feature { icon: string; title: string; desc: string; color: string; colSpan: string }
interface Step { n: string; title: string; desc: string; icon: string }

// ─── Static Data ────────────────────────────────────────────────────────────
const FEATURES: Feature[] = [
  { icon: '💬', title: 'Curhat Tanpa Batas', desc: 'Luapkan semua beban pikiranmu kapan saja. AI siap mendengarkan 24/7 tanpa menghakimi.', color: '#6ee7b7', colSpan: 'md:col-span-2 lg:col-span-2' },
  { icon: '🧠', title: 'Deteksi Emosi Cerdas', desc: 'Secara otomatis menganalisis sentimen dan mengenali emosi dominan dari setiap ceritamu.', color: '#a5b4fc', colSpan: 'md:col-span-1 lg:col-span-1' },
  { icon: '💙', title: 'Respons Empatik', desc: 'Balasan yang hangat, menenangkan, dan disesuaikan secara personal dengan kondisimu.', color: '#fca5a5', colSpan: 'md:col-span-1 lg:col-span-1' },
  { icon: '🎭', title: 'Persona Adaptif', desc: 'Pilih lawan bicaramu: Sahabat yang pengertian, Psikolog logis, atau Filsuf yang tenang.', color: '#f9a8d4', colSpan: 'md:col-span-2 lg:col-span-2' },
  { icon: '🔒', title: 'Privasi Terjamin', desc: 'Semua percakapan 100% aman tersimpan lokal di perangkatmu. Zero server storage.', color: '#67e8f9', colSpan: 'md:col-span-2 lg:col-span-2' },
  { icon: '📈', title: 'Jurnal & Rekap Mood', desc: 'Pantau perkembangan emosimu dari waktu ke waktu melalui histori percakapan.', color: '#fcd34d', colSpan: 'md:col-span-1 lg:col-span-1' },
]

const MARQUEE_ITEMS = ['😄 Senang', '😢 Sedih', '😡 Marah', '🥰 Cinta', '😨 Takut', '🤗 Lega', '😤 Frustrasi', '✨ Damai', '💭 Bingung', '🌟 Bangga']
const TECH_STACK = ['⚡ Powered by Next.js', '🧠 LLaMA 3.3 70B', '🇮🇩 IndoBERT NLP', '✨ Framer Motion', '🎨 Tailwind CSS', '🔒 Local-First Storage']

const STEPS: Step[] = [
  { n: '01', title: 'Buka Hati', desc: 'Ketik bebas semua bebanmu hari ini', icon: '💬' },
  { n: '02', title: 'AI Mendeteksi', desc: 'Analisis sentimen dan emosi dominan', icon: '🧠' },
  { n: '03', title: 'Respons Empatik', desc: 'Balasan hangat dan menenangkan', icon: '💙' },
  { n: '04', title: 'Tumbuh Bersama', desc: 'Grafik emosi untuk pantau mentalmu', icon: '📈' },
]

const PHRASES = ['yang Benar-Benar Mengerti.', 'Tanpa Adanya Penilaian.', 'Menjaga Semua Rahasiamu.', 'Selalu Ada 24/7.']
const DEMO_DELAYS: Record<number, number> = { 0: 2000, 1: 1500, 2: 2500, 3: 6000 }

// ─── Sub-Components (State Isolation) ────────────────────────────────────────

// 1. Navbar Navbar dipisah agar event scroll tidak merender ulang seluruh halaman
const FloatingNav = ({ dark, toggleTheme }: { dark: boolean, toggleTheme: () => void }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 glass-panel ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className={`flex items-center justify-between mx-auto rounded-full transition-colors duration-300 ${scrolled ? (dark ? 'bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-md shadow-xl px-4 md:px-6 py-2.5 md:py-3' : 'bg-white/95 border border-black/5 backdrop-blur-md shadow-lg px-4 md:px-6 py-2.5 md:py-3') : 'bg-transparent px-2 py-2'}`}>
            
            <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px] shadow-md flex-shrink-0">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                  <Image src="/logo.png" alt="Kenopia Logo" fill style={{ objectFit: 'cover' }} priority />
                </div>
              </div>
              <span className="font-extrabold text-lg md:text-xl tracking-tight">Kenopia</span>
            </Link>

            <div className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-full border transition-colors duration-300 ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
              <a href="#fitur" className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${dark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-black'}`}>Fitur</a>
              <a href="#cara-kerja" className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${dark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-black'}`}>Cara Kerja</a>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/curhat" className="relative group overflow-hidden rounded-full p-[1px] hidden sm:inline-flex">
                <span className={`inline-flex h-full w-full items-center justify-center rounded-full px-5 py-2 text-sm font-bold transition-colors ${dark ? 'bg-[#0a0a0a] text-white hover:bg-zinc-900 border border-white/10' : 'bg-white text-indigo-600 hover:bg-slate-50 border border-indigo-100'}`}>
                  Mulai Curhat
                </span>
              </Link>
              
              <button onClick={toggleTheme} aria-label="Toggle Theme" className={`w-10 h-10 rounded-full flex items-center justify-center text-base border transition-colors ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                {dark ? '☀️' : '🌙'}
              </button>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`md:hidden w-10 h-10 rounded-full flex flex-col items-center justify-center gap-1 border ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <span className={`block w-4 h-[2px] rounded-full transition-transform ${dark ? 'bg-white' : 'bg-slate-800'} ${mobileMenuOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
                <span className={`block w-4 h-[2px] rounded-full transition-opacity ${dark ? 'bg-white' : 'bg-slate-800'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-4 h-[2px] rounded-full transition-transform ${dark ? 'bg-white' : 'bg-slate-800'} ${mobileMenuOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed inset-0 z-[40] pt-28 px-5 flex flex-col gap-4 backdrop-blur-lg ${dark ? 'bg-[#000000]/95' : 'bg-[#ffffff]/95'}`}>
            <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className={`p-5 rounded-2xl font-bold text-center border ${dark ? 'bg-white/5 text-white border-white/10' : 'bg-slate-100 text-slate-900 border-slate-200'}`}>✨ Fitur Unggulan</a>
            <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)} className={`p-5 rounded-2xl font-bold text-center border ${dark ? 'bg-white/5 text-white border-white/10' : 'bg-slate-100 text-slate-900 border-slate-200'}`}>🔍 Cara Kerja</a>
            <div className="mt-auto pb-12">
              <Link href="/curhat" onClick={() => setMobileMenuOpen(false)} className="w-full p-5 rounded-full font-bold text-center text-white bg-indigo-600 flex justify-center text-lg shadow-lg">
                🚀 Mulai Curhat Sekarang
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// 2. Typewriter Effect
const TypewriterText = ({ dark }: { dark: boolean }) => {
  const [typeIdx, setTypeIdx] = useState(0)
  const [typeTxt, setTypeTxt] = useState('')
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    const target = PHRASES[typeIdx]; const i = typeTxt.length
    if (typing) {
      if (i < target.length) { const t = setTimeout(() => setTypeTxt(target.slice(0, i + 1)), 60); return () => clearTimeout(t) }
      const t = setTimeout(() => setTyping(false), 2500); return () => clearTimeout(t)
    }
    if (i > 0) { const t = setTimeout(() => setTypeTxt(target.slice(0, i - 1)), 20); return () => clearTimeout(t) }
    setTypeIdx(p => (p + 1) % PHRASES.length); setTyping(true)
  }, [typeTxt, typing, typeIdx])

  return (
    <span className="kp-gradient inline-block min-h-[1.2em] relative pr-1">
      {typeTxt}
      <span className={`absolute right-[-4px] md:right-[-8px] top-[15%] w-[3px] md:w-[4px] h-[70%] ${dark ? 'bg-white' : 'bg-slate-900'}`} style={{ animation: 'cursorBlink 1s step-end infinite' }} />
    </span>
  )
}

// 3. Animated Counter
const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const duration = 2400; const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setCount(Math.round(target * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => requestAnimationFrame(tick), 800)
    return () => clearTimeout(timer)
  }, [target])

  return <>{count}</>
}

// 4. Chat Demo Component
const ChatDemo = ({ dark }: { dark: boolean }) => {
  const [demoStep, setDemoStep] = useState(0)

  useEffect(() => {
    const delay = DEMO_DELAYS[demoStep]; if (delay == null) return
    const t = setTimeout(() => setDemoStep(s => (s + 1) % 4), delay)
    return () => clearTimeout(t)
  }, [demoStep])

  return (
    <div className={`relative rounded-[1.5rem] md:rounded-[2rem] border overflow-hidden shadow-2xl transition-colors duration-300 ${dark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
      <div className={`flex items-center gap-2 px-4 md:px-6 py-3 border-b ${dark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        <div className={`ml-3 text-[10px] md:text-xs font-bold tracking-widest uppercase ${dark ? 'text-zinc-500' : 'text-slate-400'}`}>Kenopia.app</div>
      </div>

      <div className="p-5 md:p-8 flex flex-col gap-4 md:gap-5 min-h-[300px] md:min-h-[350px]">
        <div className={`p-4 md:p-5 rounded-2xl rounded-tl-sm text-sm md:text-base w-[90%] md:w-[85%] font-medium leading-relaxed shadow-sm ${dark ? 'bg-white/5 border border-white/10 text-zinc-200' : 'bg-slate-50 border border-slate-100 text-slate-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[1px] flex-shrink-0">
              <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                <Image src="/logo.png" alt="Kenopia" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <span className="font-bold text-[10px] md:text-xs opacity-50 uppercase tracking-wider">Kenopia</span>
          </div>
          Halo Sinar! Ruang amanmu sudah siap. Ceritakan apa yang mengganjal di hatimu hari ini...
        </div>

        <AnimatePresence mode="popLayout">
          {demoStep >= 1 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 md:p-5 rounded-2xl rounded-tr-sm text-sm md:text-base w-[90%] md:w-[85%] self-end bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md">
              Aku ngerasa stuck banget sama kerjaan, kayak nggak ada progress dan pengen nyerah aja rasanya 😭
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {demoStep === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-3.5 md:p-4 rounded-2xl rounded-tl-sm w-fit flex gap-1.5 items-center border ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }} />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150" style={{ animationDuration: '0.8s' }} />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300" style={{ animationDuration: '0.8s' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {demoStep >= 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2.5 w-[95%] md:w-[90%]">
              <div className="flex">
                <span className={`text-[10px] md:text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${dark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                  Lelah & Frustrasi
                </span>
              </div>
              <div className={`p-4 md:p-5 rounded-2xl rounded-tl-sm text-sm md:text-base font-medium shadow-sm border ${dark ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                Wajar kok kalau kamu merasa lelah, Sinar. Tarik napas pelan-pelan dulu ya. Kamu sudah berjuang keras sejauh ini. Menangislah kalau itu bikin lega, aku dengerin... 💙
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// 5. How It Works (Step Interactive)
const HowItWorksSteps = ({ dark }: { dark: boolean }) => {
  const [activeStep, setActiveStep] = useState(0)
  
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % 4), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative">
      <div className={`hidden md:block absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 rounded-full ${dark ? 'bg-white/5' : 'bg-slate-200'}`} />

      {STEPS.map((step, idx) => {
        const isActive = activeStep === idx;
        return (
          <div 
            key={idx} onClick={() => setActiveStep(idx)}
            className={`cursor-pointer glass-panel p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-300 relative flex flex-row md:flex-col items-center gap-4 md:gap-0 ${isActive ? (dark ? 'bg-[#1a1a2e] border-indigo-500/40 md:-translate-y-2 shadow-lg z-10' : 'bg-indigo-50 border-indigo-300 md:-translate-y-2 shadow-md z-10') : (dark ? 'bg-[#0a0a0a] border-white/10 hover:bg-white/5' : 'bg-white border-slate-200 hover:bg-slate-50')}`}
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full flex items-center justify-center text-xl md:text-2xl md:mb-5 border shadow-inner relative z-10 ${isActive ? 'bg-indigo-600 border-indigo-500 text-white' : (dark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200')}`}>
              {isActive ? <span className="text-white font-bold text-base md:text-lg">{step.n}</span> : step.icon}
            </div>
            <div className="text-left md:text-center mt-2">
              <h3 className="font-extrabold text-base md:text-lg mb-1.5">{step.title}</h3>
              <p className={`text-xs md:text-sm font-medium ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>{step.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function KenopiaHome() {
  const [dark, setDark] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])

  useEffect(() => {
    const saved = localStorage.getItem('kenopia-theme'); const isDark = saved !== 'light'
    setDark(isDark); document.documentElement.classList.toggle('dark', isDark); setMounted(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setDark(prev => {
      const next = !prev; document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('kenopia-theme', next ? 'dark' : 'light'); return next
    })
  }, [])

  if (!mounted) return null

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden selection:bg-indigo-500/30 ${dark ? 'bg-[#030303] text-[#ededed]' : 'bg-[#fafbfc] text-[#171717]'}`}>
      
      {/* ─── OPTIMIZED CSS (Flicker & Performance Fixes) ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
        
        /* Menggunakan will-change dan 3D transform untuk membantu GPU */
        @keyframes scroll { to { transform: translate3d(calc(-50% - 1rem), 0, 0); } }
        .animate-scroll { animation: scroll 35s linear infinite; will-change: transform; }
        .animate-scroll-slow { animation: scroll 60s linear infinite; will-change: transform; }
        .pause-on-hover:hover { animation-play-state: paused; }
        
        .kp-gradient { background: linear-gradient(135deg, #6366f1 0%, #db2777 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        /* Aurora dioptimasi tanpa merotasi blur yang berat */
        @keyframes kenopiaAurora { 
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.6; } 
          50% { transform: translate3d(2%, 2%, 0) scale(1.05); opacity: 1; } 
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.6; } 
        }
        .animate-aurora { animation: kenopiaAurora 15s ease-in-out infinite; will-change: transform, opacity; }

        @keyframes moveGrid {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-36px, -36px, 0); }
        }
        .bg-animated-lines {
          background-size: 36px 36px;
          will-change: transform;
        }
        .dark .bg-animated-lines { background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px); }
        .light .bg-animated-lines { background-image: linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px); }

        .glass-panel { transform: translateZ(0); backface-visibility: hidden; }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}} />

      {/* ─── OPTIMIZED BACKGROUND (No Heavy Blurs) ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-[72px] w-[calc(100%+144px)] h-[calc(100%+144px)] bg-animated-lines animate-[moveGrid_15s_linear_infinite]" />
        
        {/* FIX: Dihapus blur-3xl dan menggunakan pure CSS Radial Gradient agar sangat ringan di HP */}
        <div className={`absolute inset-0 w-full h-full animate-aurora ${dark ? 'opacity-80' : 'opacity-30'}`} 
          style={{
            background: dark 
              ? 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.1) 25%, transparent 60%)'
              : 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.08) 25%, transparent 60%)',
          }} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] hidden md:block opacity-40" />
      </div>

      <FloatingNav dark={dark} toggleTheme={toggleTheme} />

      <main className="relative z-10 pt-28 md:pt-32">

        {/* ─── HERO SECTION ─── */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-16 md:pb-20 text-center flex flex-col items-center justify-center min-h-[65vh] md:min-h-[80vh] relative overflow-hidden">
          <motion.div style={{ y: heroY }} className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center opacity-30 glass-panel">
             {/* FIX: CSS Blur dihilangkan diganti radial gradient halus */}
             <div className="w-[150vw] md:w-[700px] h-[150vw] md:h-[700px] rounded-full" 
                  style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.15) 30%, rgba(236,72,153,0.1) 50%, transparent 70%)' }} />
          </motion.div>

          <div className="relative z-10 w-full glass-panel">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 md:py-2 rounded-full border mb-6 md:mb-8 transition-colors ${dark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Teman Cerita Virtualmu</span>
            </div>

            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold tracking-tight leading-[1.1] mb-5 md:mb-6 px-2">
              Ruang Aman <br className="hidden sm:block"/>
              <TypewriterText dark={dark} />
            </h1>

            <p className={`text-base md:text-lg max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed font-medium px-4 md:px-0 ${dark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Luapkan emosimu ke AI yang memahami nuansa Bahasa Indonesia — didengar tanpa dihakimi, dan amankan rahasiamu sepenuhnya di perangkatmu.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <Link href="/curhat" className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-base md:text-lg text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-transform flex items-center justify-center gap-2">
                <span>Mulai Curhat Gratis</span> <span>➔</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── MARQUEE ─── */}
        <section className="mb-20 md:mb-28 relative overflow-hidden flex flex-col gap-4 glass-panel">
          <div className="flex w-full">
            <ul className="flex min-w-full shrink-0 gap-3 md:gap-4 py-2 w-max flex-nowrap animate-scroll pause-on-hover">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
                <li key={idx} className={`w-fit rounded-xl md:rounded-2xl border px-5 py-2.5 md:px-6 md:py-3.5 font-semibold text-sm md:text-base cursor-default ${dark ? 'bg-[#111]/90 border-white/5 text-zinc-300' : 'bg-white/90 border-slate-200 text-slate-600'}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── APP MOCKUP & STATS ─── */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 mb-20 md:mb-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            
            <div className="lg:col-span-7 relative group glass-panel">
              <ChatDemo dark={dark} />
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4 md:gap-6 relative">
              {[
                { target: 5, unit: '', suffix: 'Emosi', label: 'Dikenali Akurat', color: '#34d399', icon: '🎭' },
                { target: 3, unit: '', suffix: 'Persona', label: 'Siap Mendengar', color: '#818cf8', icon: '🧠' },
                { target: 100, unit: '%', suffix: 'Aman', label: 'Data di HP', color: '#fb7185', icon: '🔒' },
                { target: 24, unit: '/7', suffix: 'Standby', label: 'Tanpa Istirahat', color: '#2dd4bf', icon: '⏳' },
              ].map((stat, i) => (
                <div key={i} className={`glass-panel p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border flex flex-col justify-center items-start ${dark ? 'bg-[#111]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
                  <div className={`text-2xl md:text-3xl mb-3 md:mb-4 p-2.5 md:p-3 rounded-2xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>{stat.icon}</div>
                  <div className="text-3xl md:text-5xl font-black mb-1 tracking-tighter" style={{ color: stat.color }}>
                    <AnimatedCounter target={stat.target} />{stat.unit}
                  </div>
                  <div className={`text-xs md:text-sm font-bold mt-1 ${dark ? 'text-zinc-300' : 'text-slate-700'}`}>{stat.suffix}</div>
                  <div className={`text-[10px] md:text-xs font-semibold mt-1 leading-tight ${dark ? 'text-zinc-500' : 'text-slate-400'}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="cara-kerja" className="max-w-6xl mx-auto px-4 md:px-6 mb-20 md:mb-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 md:mb-4">Mulai Perjalananmu</h2>
            <p className={`text-base md:text-lg font-medium ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>Empat langkah sederhana menuju ketenangan.</p>
          </div>
          <HowItWorksSteps dark={dark} />
        </section>

        {/* ─── FITUR ─── */}
        <section id="fitur" className="max-w-6xl mx-auto px-4 md:px-6 mb-20 md:mb-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 md:mb-4">Sistem Cerdas Kenopia</h2>
            <p className={`text-base md:text-lg font-medium ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>Dirancang khusus dengan privasi dan empati tinggi.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className={`${feature.colSpan} glass-panel relative group p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border overflow-hidden ${dark ? 'bg-[#0a0a0a]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
                {/* Diganti menjadi radial gradient ringan tanpa blur css */}
                <div className="absolute -top-10 -right-10 md:-top-16 md:-right-16 w-32 h-32 md:w-48 md:h-48 rounded-full opacity-10 md:opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle, ${feature.color} 0%, transparent 70%)` }} />
                
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-5 shadow-inner border ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                  {feature.icon}
                </div>
                <h3 className="font-extrabold text-xl md:text-2xl mb-2 md:mb-3 relative z-10">{feature.title}</h3>
                <p className={`font-medium leading-relaxed text-sm md:text-base max-w-sm relative z-10 ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA BOX ─── */}
        <section className="max-w-5xl mx-auto px-4 md:px-6 mb-20 md:mb-32">
          <div className={`text-center p-10 md:p-20 rounded-[2rem] md:rounded-[3rem] border relative overflow-hidden shadow-xl glass-panel ${dark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-slate-200'}`}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.1) 40%, transparent 70%)' }} />
            
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 relative z-10 leading-[1.2] tracking-tight">
              Pikiranmu Terlalu Berharga <br /> Untuk <span className="kp-gradient">Ditanggung Sendiri.</span>
            </h2>
            <p className={`text-sm md:text-base font-medium mb-8 md:mb-10 relative z-10 max-w-md mx-auto ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Kenopia siap mendengarkan tanpa batas waktu, tanpa biaya, dan tanpa penghakiman.
            </p>
            <Link href="/curhat" className="inline-flex w-full sm:w-auto items-center justify-center relative z-10 px-10 py-4 md:px-12 md:py-4 rounded-full font-bold text-base md:text-lg text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-transform shadow-[0_0_25px_rgba(79,70,229,0.4)]">
              Mulai Sesi Curhatmu
            </Link>
          </div>
        </section>

      </main>

      {/* ─── TECH STACK ─── */}
      <section className={`border-t relative z-10 py-6 md:py-8 overflow-hidden glass-panel ${dark ? 'bg-[#030303] border-white/5' : 'bg-[#fafbfc] border-slate-200'}`}>
        <div className="flex w-full">
          <ul className="flex min-w-full shrink-0 gap-6 md:gap-10 py-1 w-max flex-nowrap animate-scroll-slow opacity-60 hover:opacity-100 transition-opacity">
            {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((tech, idx) => (
              <li key={idx} className={`kp-gradient font-bold text-sm md:text-base tracking-wide whitespace-nowrap`}>
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className={`relative z-10 py-12 md:py-16 px-4 md:px-6 text-center border-t glass-panel ${dark ? 'bg-[#000]/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
        <div className="flex flex-col items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px] shadow-lg flex-shrink-0">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
              <Image src="/logo.png" alt="Kenopia Logo" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-2xl md:text-3xl tracking-tight">Kenopia</span>
            <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold uppercase tracking-wider">AI</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 px-4">
          <a href="#" className={`text-[11px] md:text-sm font-semibold hover:text-indigo-500 ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>Kebijakan Privasi</a>
          <a href="#" className={`text-[11px] md:text-sm font-semibold hover:text-indigo-500 ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>Syarat & Ketentuan</a>
        </div>
        <p className={`text-[11px] md:text-sm font-medium mb-1.5 ${dark ? 'text-zinc-500' : 'text-slate-400'}`}>© {new Date().getFullYear()} Kenopia AI. Dirancang untuk ketenangan mentalmu.</p>
        <p className={`text-[9px] md:text-[11px] font-medium ${dark ? 'text-zinc-600' : 'text-slate-400'}`}>Dibuat oleh Dewa Sinar Surya, S,Kom. 💜 Pranata Komputer Kejaksaan Republik Indonesia.</p>
      </footer>
    </div>
  )
}