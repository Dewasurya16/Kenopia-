'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ChatMessage, EMOTIONS, EmotionKey, AnalyzeResponse } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'
import html2canvas from 'html2canvas'

const EmotionChart = dynamic(() => import('@/components/EmotionChart'), { ssr: false })

const SESSION_STORAGE_KEY = 'kenopia_sessions_v2'
const PIN_KEY = 'kenopia_pin'
const GRATITUDE_KEY = 'kenopia_gratitude'
const NAME_KEY = 'kenopia_username'
const STREAK_KEY = 'kenopia_streak_v1'
const MOOD_KEY = 'kenopia_daily_mood'
const THEME_KEY = 'kenopia_bg_theme'
const CAPSULE_KEY = 'kenopia_time_capsules'

// ── Daily Affirmations ────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  { text: 'Kamu sudah melakukan yang terbaik hari ini. Itu sudah lebih dari cukup.', emoji: '💙' },
  { text: 'Perasaanmu valid. Tidak ada yang salah dengan merasakan emosi.', emoji: '🌸' },
  { text: 'Setiap hari adalah kesempatan baru untuk memulai lagi.', emoji: '🌅' },
  { text: 'Kamu lebih kuat dari yang kamu bayangkan.', emoji: '💪' },
  { text: 'Tidak apa-apa untuk tidak selalu baik-baik saja.', emoji: '🤍' },
  { text: 'Kamu berhak untuk merasa bahagia dan dicintai.', emoji: '✨' },
  { text: 'Langkah kecil sekalipun tetaplah sebuah kemajuan yang nyata.', emoji: '🌱' },
  { text: 'Kamu tidak sendirian. Aku selalu ada di sini untukmu.', emoji: '🫂' },
  { text: 'Percayalah, badai pasti berlalu dan kamu akan lebih tangguh.', emoji: '🌈' },
  { text: 'Jadilah sebaik mungkin untuk dirimu sendiri hari ini.', emoji: '🌻' },
  { text: 'Kelelahan yang kamu rasakan adalah bukti betapa keras kamu berjuang.', emoji: '🔥' },
  { text: 'Kesehatan mentalmu sama pentingnya dengan kesehatan fisikmu.', emoji: '🧠' },
  { text: 'Kamu sudah sampai sejauh ini — itu sesuatu yang luar biasa.', emoji: '🏆' },
  { text: 'Hari-hari yang berat mengajarkan hal yang tidak bisa dipelajari di tempat lain.', emoji: '📚' },
  { text: 'Tubuhmu mengingatmu untuk beristirahat. Dengarkan pesannya.', emoji: '🌙' },
  { text: 'Setiap nafas yang kamu hirup adalah bukti kamu masih berjuang.', emoji: '🌬️' },
  { text: 'Kamu berhak mendapatkan ruang untuk tumbuh dan berubah.', emoji: '🦋' },
  { text: 'Cintai dirimu seperti kamu mencintai orang yang paling kamu sayang.', emoji: '❤️' },
  { text: 'Mimpimu layak untuk diperjuangkan, sebesar apapun tantangannya.', emoji: '⭐' },
  { text: 'Setiap hal kecil yang kamu syukuri akan memperbesar kebahagiaanmu.', emoji: '🙏' },
]

const REFLECTIONS = [
  "Apa satu hal kecil yang berjalan lancar hari ini?",
  "Jika perasaanmu saat ini adalah cuaca, cuaca apakah itu?",
  "Apa yang sedang sangat membebanimu akhir-akhir ini?",
  "Hal apa yang paling ingin kamu dengar dari seseorang saat ini?",
  "Apa satu hal yang ingin kamu maafkan dari dirimu sendiri?",
  "Sebutkan 3 hal yang bisa kamu kendalikan saat ini.",
  "Apa yang membuatmu tersenyum dalam 24 jam terakhir?",
  "Jika kamu bisa memeluk masa lalumu, apa yang akan kamu katakan padanya?",
]

const QUICK_REPLIES: Record<EmotionKey, string[]> = {
  senang: ['Ceritakan lebih lanjut! 😄', 'Apa yang paling membuatku bahagia?', 'Bagaimana cara menjaga mood ini?'],
  cinta: ['Siapa yang membuatku merasa spesial?', 'Bagaimana cara mengungkapkan perasaan ini?', 'Aku ingin cerita lebih banyak 💕'],
  marah: ['Apa yang paling membuatku kesal?', 'Bagaimana cara terbaik menghadapinya?', 'Aku butuh cara melepas amarah ini'],
  takut: ['Apa yang paling aku takutkan?', 'Bagaimana cara menghadapi ketakutan ini?', 'Bantu aku berpikir lebih jernih'],
  sedih: ['Aku butuh semangat hari ini 🤍', 'Bantu aku menemukan hal positif', 'Aku ingin cerita lebih banyak'],
}

type BgTheme = 'default' | 'senja' | 'aurora' | 'sakura' | 'kosmos'
const BG_THEMES: Record<BgTheme, { label: string; icon: string; lightBg: string; darkBg: string; orb1: string; orb2: string; orb3: string }> = {
  default: { label: 'Default', icon: '✨', lightBg: '#f8faff', darkBg: '#030308', orb1: 'rgba(59,130,246,0.15)', orb2: 'rgba(14,165,233,0.15)', orb3: 'rgba(236,72,153,0.15)' },
  senja: { label: 'Senja', icon: '🌅', lightBg: '#fff5f0', darkBg: '#1e100a', orb1: 'rgba(249,115,22,0.3)', orb2: 'rgba(244,63,94,0.3)', orb3: 'rgba(250,204,21,0.2)' },
  aurora: { label: 'Aurora', icon: '🌌', lightBg: '#f0fdfa', darkBg: '#021c17', orb1: 'rgba(16,185,129,0.3)', orb2: 'rgba(6,182,212,0.3)', orb3: 'rgba(59,130,246,0.2)' },
  sakura: { label: 'Sakura', icon: '🌸', lightBg: '#fdf2f8', darkBg: '#1f101a', orb1: 'rgba(236,72,153,0.3)', orb2: 'rgba(217,70,239,0.3)', orb3: 'rgba(251,113,133,0.2)' },
  kosmos: { label: 'Kosmos', icon: '🌠', lightBg: '#f8fafc', darkBg: '#090514', orb1: 'rgba(99,102,241,0.3)', orb2: 'rgba(168,85,247,0.3)', orb3: 'rgba(236,72,153,0.2)' },
}

interface ChatSession { id: string; title: string; createdAt: string; messages: ChatMessage[] }
interface TimeCapsule { id: string; text: string; createdAt: string; unlockDate: string }

interface SpeechRecognition extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void; onstart: () => void;
}
interface SpeechRecognitionEvent extends Event { resultIndex: number; results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEvent extends Event { error: string }

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function EmotionBadge({ emotion }: { emotion: EmotionKey }) {
  const meta = EMOTIONS[emotion]
  return (
    <div className="mx-auto my-3 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm anim-slide-up backdrop-blur-sm"
      style={{ background: `${meta.color}15`, color: meta.color, border: `1.5px dashed ${meta.color}50` }}>
      <span className="text-base">{meta.emoji}</span>
      <span className="tracking-wide uppercase">{meta.label} terdeteksi</span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 anim-slide-up mb-6">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#ec4899)' }}>K</div>
      <div className="px-6 py-4 flex items-center gap-2 h-14 shadow-sm"
        style={{ background: 'var(--surface-2)', borderRadius: '20px 20px 20px 6px', border: '1px solid var(--border-2)' }}>
        {[0, 150, 300].map(d => (
          <div key={d} className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#3b82f6', animation: `kBounce 1s ${d}ms ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  )
}

function PendingUserBubble({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 anim-slide-up mb-6">
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="px-6 py-4 text-sm leading-relaxed opacity-70 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: 'white', borderRadius: '20px 20px 6px 20px' }}>
            {text}
          </div>
          <p className="text-right text-xs mt-2 font-medium flex items-center justify-end gap-1" style={{ color: 'var(--text-faint)' }}>
            <span style={{ animation: 'kPulse 1.5s ease-in-out infinite' }}>⏳</span> Mengirim...
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const timeStr = new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const [isPlaying, setIsPlaying] = useState(false)

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return
    if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); return }
    window.speechSynthesis.cancel()
    const cleanText = msg.aiResponse
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .replace(/[*_~`#]/g, '').trim()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'id-ID'; utterance.rate = 0.95; utterance.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'))
    if (idVoice) utterance.voice = idVoice
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)
    setIsPlaying(true); window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="flex flex-col gap-3 anim-slide-up mb-4 msg-group">
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] relative">
          <div className="px-5 sm:px-6 py-3 sm:py-4 text-sm leading-relaxed shadow-sm"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: 'white', borderRadius: '20px 20px 6px 20px' }}>
            {msg.userMessage}
          </div>
          <p className="text-right text-xs mt-1.5 font-medium msg-time absolute -bottom-5 right-1" style={{ color: 'var(--text-faint)' }}>{timeStr}</p>
        </div>
      </div>
      <EmotionBadge emotion={msg.emotion} />
      <div className="flex items-end gap-2 sm:gap-3 mt-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#ec4899)' }}>K</div>
        <div className="max-w-[85%] sm:max-w-[75%] relative">
          <div className="px-5 sm:px-6 py-3 sm:py-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm relative"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', borderRadius: '20px 20px 20px 6px', border: '1px solid var(--border-2)' }}>
            {msg.aiResponse}
            <button onClick={handleSpeak}
              className="absolute -right-2 -bottom-2 sm:-right-3 sm:-bottom-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs shadow-md transition-all"
              style={{
                background: isPlaying ? '#3b82f6' : 'var(--surface)',
                color: isPlaying ? 'white' : 'var(--text-faint)',
                border: '1px solid var(--border-2)',
                animation: isPlaying ? 'kPulse 1.5s ease-in-out infinite' : 'none',
              }} title="Dengarkan Suara">
              {isPlaying ? '⏹' : '🔊'}
            </button>
          </div>
          <p className="text-xs mt-1.5 ml-2 font-medium msg-time absolute -bottom-5 left-1" style={{ color: 'var(--text-faint)' }}>{timeStr}</p>
        </div>
      </div>
    </div>
  )
}

function HistoryItem({ session, active, onClick, onDelete }: { session: ChatSession; active: boolean; onClick: () => void; onDelete?: (e: React.MouseEvent) => void }) {
  const lastMsg = session.messages[session.messages.length - 1]
  const meta = lastMsg ? EMOTIONS[lastMsg.emotion] : EMOTIONS['sedih']
  const label = new Date(session.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  return (
    <div className="relative hist-group">
      <button onClick={onClick}
        className="w-full text-left px-4 py-3.5 rounded-3xl transition-all duration-300"
        style={{
          background: active ? 'var(--surface)' : 'transparent',
          border: `1px solid ${active ? 'var(--border-2)' : 'transparent'}`,
          boxShadow: active ? '0 4px 16px rgba(0,0,0,0.05)' : 'none',
          transform: active ? 'scale(1.02)' : 'scale(1)',
        }}>
        <div className="flex items-center gap-2.5 mb-2 pr-8">
          <span className="text-xl">{meta.emoji}</span>
          <span className="text-xs font-bold tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
          <span className="text-xs font-semibold ml-auto" style={{ color: 'var(--text-faint)' }}>{label}</span>
        </div>
        <p className="text-xs truncate leading-relaxed font-medium pr-8" style={{ color: 'var(--text-muted)' }}>"{session.title}"</p>
      </button>
      {onDelete && (
        <button onClick={onDelete}
          className="absolute top-1/2 -translate-y-1/2 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all hist-delete"
          style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>✕</button>
      )}
    </div>
  )
}

function EmotionCalendar({ messages }: { messages: ChatMessage[] }) {
  const groupedData = useMemo(() => {
    const days: Record<string, Record<EmotionKey, number>> = {}
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString('id-ID')
      if (!days[date]) days[date] = { senang: 0, cinta: 0, marah: 0, takut: 0, sedih: 0 }
      days[date][msg.emotion]++
    })
    return Object.entries(days).map(([date, counts]) => {
      let dominant: EmotionKey = 'senang'; let max = 0
      ;(Object.keys(counts) as EmotionKey[]).forEach(k => { if (counts[k] > max) { max = counts[k]; dominant = k } })
      return { date, dominant }
    })
  }, [messages])

  return (
    <div className="mt-6 pt-6" style={{ borderTop: '1px dashed var(--border-2)' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-faint)' }}>Jejak Emosimu</p>
      <div className="flex flex-wrap gap-2.5">
        {groupedData.length === 0
          ? <p className="text-xs italic" style={{ color: 'var(--text-faint)' }}>Belum ada data perjalanan.</p>
          : groupedData.map((day, i) => (
            <div key={i} className="w-7 h-7 rounded-xl cursor-help cal-dot"
              style={{ background: EMOTIONS[day.dominant].color, opacity: 0.85 }}
              title={`${day.date}: ${EMOTIONS[day.dominant].label}`} />
          ))}
      </div>
    </div>
  )
}

// ─── OVERLAYS ────────────────────────────────────────────────────────────────

function FadingCanvasOverlay({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const isDrawingRef = useRef(false)
  const idleTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
    resize(); window.addEventListener('resize', resize)
    let animId: number
    const fade = () => {
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(10,10,15,0.08)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (!isDrawingRef.current) { idleTimeRef.current++; if (idleTimeRef.current > 90) { ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, canvas.width, canvas.height) } } else { idleTimeRef.current = 0 }
      animId = requestAnimationFrame(fade)
    }
    fade()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => { setIsDrawing(true); isDrawingRef.current = true; lastPos.current = getPos(e) }
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d'); if (!ctx) return
    const p = getPos(e)
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = `hsl(${Math.random() * 60 + 200},100%,75%)`; ctx.lineWidth = 6 + Math.random() * 6
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowBlur = 20; ctx.shadowColor = ctx.strokeStyle; ctx.stroke()
    lastPos.current = p
  }
  const stopDraw = () => { setIsDrawing(false); isDrawingRef.current = false; lastPos.current = null }

  return (
    <div className="fixed inset-0 z-100 flex flex-col anim-fade-in" style={{ background: '#0a0a0f', touchAction: 'none' }}>
      <div className="absolute top-10 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        <h2 className="text-3xl font-bold mb-2 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.9)' }}>Kanvas Fana</h2>
        <p className="text-sm text-center max-w-md" style={{ color: 'rgba(255,255,255,0.45)' }}>Coretkan amarah atau resahmu. Perhatikan bagaimana ia perlahan memudar tanpa sisa.</p>
      </div>
      <canvas ref={canvasRef} onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerCancel={stopDraw} onPointerLeave={stopDraw}
        className="absolute inset-0 w-full h-full cursor-crosshair" style={{ touchAction: 'none' }} />
      <button onClick={onClose} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-10 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl z-10"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(12px)' }}>
        Keluar ✨
      </button>
    </div>
  )
}

function HopeBalloonOverlay({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'flying' | 'done'>('idle')
  const handleRelease = () => {
    if (!text.trim()) return
    setPhase('flying')
    setTimeout(() => setPhase('done'), 4000)
    setTimeout(() => onClose(), 6500)
  }
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6 overflow-hidden anim-fade-in" style={{ background: 'rgba(12,74,110,0.97)', backdropFilter: 'blur(20px)' }}>
      {phase === 'idle' && (
        <div className="w-full max-w-md flex flex-col items-center anim-slide-up relative z-10">
          <div className="text-7xl mb-6" style={{ animation: 'kBounce2 2s ease-in-out infinite' }}>🎈</div>
          <h2 className="text-3xl font-bold text-white mb-3 text-center">Balon Pelepasan</h2>
          <p className="text-center text-sm mb-8 leading-relaxed px-4" style={{ color: 'rgba(186,230,253,0.8)' }}>Tuliskan satu pikiran yang mengganggu. Ikatkan di balon ini, dan biarkan angin membawanya pergi.</p>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Pikiran ini berat, tapi aku siap melepaskannya..."
            className="w-full p-5 rounded-3xl mb-6 text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', color: 'white' }} rows={4} />
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>Batal</button>
            <button onClick={handleRelease} disabled={!text.trim()} className="flex-1 py-4 rounded-2xl font-bold disabled:opacity-50 transition-all hover:scale-105"
              style={{ background: '#38bdf8', color: '#0c4a6e' }}>Lepaskan 🌬️</button>
          </div>
        </div>
      )}
      {phase === 'flying' && (
        <div className="flex flex-col items-center absolute bottom-10" style={{ animation: 'kBalloonFly 4s ease-in forwards' }}>
          <div className="p-4 rounded-2xl shadow-xl max-w-[220px] text-center mb-3 relative" style={{ background: 'rgba(255,255,255,0.9)' }}>
            <p className="text-sm font-medium leading-relaxed italic" style={{ color: '#0c4a6e' }}>"{text}"</p>
          </div>
          <div className="text-8xl">🎈</div>
        </div>
      )}
      {phase === 'done' && (
        <div className="anim-fade-in text-center z-10 px-6">
          <div className="text-6xl mb-6">☁️</div>
          <h2 className="text-3xl font-bold text-white mb-4">Telah Berlalu</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(186,230,253,0.9)' }}>Semua pikiran itu telah terbang jauh dan memudar.<br />Kamu aman di sini sekarang.</p>
        </div>
      )}
    </div>
  )
}

function TimeCapsuleOverlay({ capsules, setCapsules, onClose }: { capsules: TimeCapsule[]; setCapsules: (v: TimeCapsule[]) => void; onClose: () => void }) {
  const [view, setView] = useState<'list' | 'write' | 'read'>('list')
  const [text, setText] = useState('')
  const [duration, setDuration] = useState(7)
  const [activeCapsule, setActiveCapsule] = useState<TimeCapsule | null>(null)

  const handleSave = () => {
    if (!text.trim()) return
    const unlockDate = new Date(); unlockDate.setDate(unlockDate.getDate() + duration)
    const newC: TimeCapsule = { id: uuidv4(), text, createdAt: new Date().toISOString(), unlockDate: unlockDate.toISOString() }
    const updated = [newC, ...capsules]; setCapsules(updated); localStorage.setItem(CAPSULE_KEY, JSON.stringify(updated))
    setText(''); setView('list')
  }
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!confirm('Hapus kapsul ini selamanya?')) return
    const updated = capsules.filter(c => c.id !== id); setCapsules(updated); localStorage.setItem(CAPSULE_KEY, JSON.stringify(updated))
  }
  const openCapsule = (c: TimeCapsule) => {
    if (new Date() < new Date(c.unlockDate)) { alert(`Masih terkunci! Buka: ${new Date(c.unlockDate).toLocaleDateString('id-ID')}`); return }
    setActiveCapsule(c); setView('read')
  }

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="p-6 md:p-8 rounded-4xl max-w-lg w-full flex flex-col max-h-[85vh] anim-slide-up relative" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}>✕</button>

        {view === 'list' && <>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>⏳ Kapsul Waktu</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-faint)' }}>Pesan untuk dirimu di masa depan.</p>
          <button onClick={() => setView('write')} className="w-full py-4 mb-6 rounded-2xl font-bold text-white transition-all hover:scale-[1.02]"
            style={{ background: '#6366f1', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>✍️ Tulis Kapsul Baru</button>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {capsules.length === 0
              ? <p className="text-center text-sm mt-8 italic" style={{ color: 'var(--text-faint)' }}>Belum ada kapsul waktu.</p>
              : capsules.map(c => {
                const locked = new Date() < new Date(c.unlockDate)
                return (
                  <div key={c.id} onClick={() => openCapsule(c)} className="p-4 rounded-2xl relative transition-all cursor-pointer" style={{ background: locked ? 'var(--surface-2)' : 'rgba(99,102,241,0.08)', border: `1px solid ${locked ? 'var(--border-2)' : 'rgba(99,102,241,0.3)'}`, opacity: locked ? 0.8 : 1 }}>
                    <button onClick={e => handleDelete(c.id, e)} className="absolute top-4 right-4 text-sm transition-all hover:scale-110" style={{ color: 'var(--text-faint)' }}>🗑️</button>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{locked ? '🔒' : '🔓'}</span>
                      <div>
                        <p className="font-bold text-sm" style={{ color: locked ? 'var(--text-muted)' : '#6366f1' }}>{locked ? 'Masih Terkunci' : 'Sudah Bisa Dibuka!'}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Buka: {new Date(c.unlockDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </>}

        {view === 'write' && <>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#6366f1' }}>Tulis Pesan ke Masa Depan</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-faint)' }}>Pesan ini akan dikunci darimu.</p>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Hai diriku di masa depan, saat menulis ini aku sedang merasa..."
            className="w-full flex-1 min-h-[200px] p-5 rounded-2xl mb-4 text-sm leading-relaxed outline-none resize-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Kunci Selama:</label>
            <div className="flex gap-2">
              {[{ l: '1 Mgg', v: 7 }, { l: '1 Bln', v: 30 }, { l: '6 Bln', v: 180 }, { l: '1 Thn', v: 365 }].map(opt => (
                <button key={opt.v} onClick={() => setDuration(opt.v)} className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{ background: duration === opt.v ? '#6366f1' : 'var(--surface-2)', color: duration === opt.v ? 'white' : 'var(--text-muted)' }}>{opt.l}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-auto">
            <button onClick={() => setView('list')} className="flex-1 py-4 rounded-2xl font-bold" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>Batal</button>
            <button onClick={handleSave} disabled={!text.trim()} className="flex-1 py-4 rounded-2xl font-bold text-white disabled:opacity-50" style={{ background: '#6366f1' }}>🔒 Tanam Kapsul</button>
          </div>
        </>}

        {view === 'read' && activeCapsule && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'rgba(99,102,241,0.1)' }}>💌</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>Pesan dari masa lalu</p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Ditulis: {new Date(activeCapsule.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap italic"
              style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--text)' }}>
              "{activeCapsule.text}"
            </div>
            <button onClick={() => setView('list')} className="w-full mt-6 py-4 rounded-2xl font-bold" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>Tutup Surat</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Future Self Letter Modal (NEW - connected to /api/futureself) ──────────────
function FutureSelfOverlay({ history, userName, onClose }: { history: ChatMessage[]; userName: string; onClose: () => void }) {
  const [letter, setLetter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchLetter() }, [])

  const fetchLetter = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/futureself', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history.slice(-15), userName }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLetter(data.letter)
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat surat.') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)' }}>
      <div className="p-6 md:p-8 rounded-4xl max-w-lg w-full flex flex-col max-h-[88vh] anim-slide-up relative" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}>✕</button>

        <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border-2)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(134,239,172,0.2),rgba(110,231,183,0.2))', border: '1.5px solid rgba(134,239,172,0.3)' }}>✉️</div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Surat dari Masa Depanmu</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>5 tahun ke depan · Ditulis oleh Kenopia AI</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex gap-2">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-3 h-3 rounded-full" style={{ background: '#86efac', animation: `kBounce 1s ${d}ms ease-in-out infinite` }} />
                ))}
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>Merangkai kata dari masa depanmu...</p>
            </div>
          )}
          {error && (
            <div className="py-8 text-center">
              <p className="text-sm mb-4" style={{ color: '#ef4444' }}>⚠️ {error}</p>
              <button onClick={fetchLetter} className="px-6 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: '#6366f1' }}>Coba Lagi</button>
            </div>
          )}
          {letter && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-5 rounded-2xl"
              style={{ background: 'rgba(134,239,172,0.06)', border: '1px solid rgba(134,239,172,0.2)', color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.9 }}>
              {letter}
            </div>
          )}
        </div>

        {letter && (
          <div className="mt-5 pt-5 flex gap-3" style={{ borderTop: '1px solid var(--border-2)' }}>
            <button onClick={fetchLetter} className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>🔄 Tulis Ulang</button>
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>💚 Terima Kasih</button>
          </div>
        )}

        {history.length < 3 && !loading && !letter && (
          <div className="py-10 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text)' }}>Surat ini butuh setidaknya <strong>3 sesi curhat</strong> agar AI bisa menulis sesuatu yang personal untukmu.</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Kamu baru punya {history.length} pesan. Yuk cerita lebih banyak dulu!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function GroundingOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    { num: 5, icon: '👁️', title: 'Lihat', desc: 'Sebutkan 5 hal yang bisa kamu lihat di sekitarmu saat ini.', color: '#3b82f6' },
    { num: 4, icon: '✋', title: 'Sentuh', desc: 'Rasakan 4 hal di dekatmu (tekstur baju, meja, udara).', color: '#10b981' },
    { num: 3, icon: '👂', title: 'Dengar', desc: 'Fokuskan telinga, temukan 3 suara berbeda di ruangan ini.', color: '#f59e0b' },
    { num: 2, icon: '👃', title: 'Cium Aroma', desc: 'Hirup napas, cari 2 aroma yang bisa kamu cium saat ini.', color: '#8b5cf6' },
    { num: 1, icon: '👅', title: 'Rasakan', desc: 'Fokus pada 1 rasa di mulutmu (minum air atau permen).', color: '#ec4899' },
  ]
  const current = steps[step]
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6 anim-fade-in" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-md w-full relative">
        <button onClick={onClose} className="absolute -top-12 right-0 font-bold transition-all hover:opacity-100 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>✕ Tutup</button>
        {step < steps.length ? (
          <div className="p-8 md:p-10 rounded-4xl border flex flex-col items-center text-center anim-slide-up relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
            <div className="absolute top-0 left-0 h-1.5 w-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full transition-all duration-500" style={{ width: `${(step / steps.length) * 100}%`, background: current.color }} />
            </div>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg border-2"
              style={{ borderColor: `${current.color}50`, background: `${current.color}20` }}>{current.icon}</div>
            <h2 className="text-5xl font-bold mb-2 tabular-nums" style={{ color: current.color }}>{current.num}</h2>
            <h3 className="text-white text-2xl font-bold mb-4">{current.title}</h3>
            <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.75)' }}>{current.desc}</p>
            <button onClick={() => setStep(s => s + 1)} className="w-full py-4 rounded-2xl text-white font-bold transition-all hover:scale-105 active:scale-95 text-base"
              style={{ background: current.color }}>Sudah, Lanjut ✓</button>
          </div>
        ) : (
          <div className="p-8 md:p-10 rounded-4xl border flex flex-col items-center text-center anim-slide-up"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6" style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)' }}>🌿</div>
            <h2 className="text-white text-3xl font-bold mb-4">Kembali ke Realita</h2>
            <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.75)' }}>Kamu sudah kembali terhubung dengan masa kini. Tarik napas dalam, kamu aman di sini.</p>
            <button onClick={onClose} className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-105" style={{ background: 'white', color: '#0f172a' }}>Selesai ✨</button>
          </div>
        )}
      </div>
    </div>
  )
}

function BubbleWrapOverlay({ onClose }: { onClose: () => void }) {
  const [bubbles, setBubbles] = useState<boolean[]>(Array(42).fill(false))
  const isAllPopped = bubbles.every(b => b)
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)' }}>
      <div className="p-8 rounded-4xl border flex flex-col items-center max-w-sm w-full" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
        <h2 className="text-white text-2xl font-bold mb-2">Pecahkan Gelembung</h2>
        <p className="text-xs mb-8 text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>Fokuskan pikiranmu pada setiap letusan kecil ini untuk meredakan kecemasan.</p>
        <div className="grid grid-cols-6 gap-3 mb-8">
          {bubbles.map((popped, i) => (
            <button key={i} onClick={() => { if (popped) return; const b = [...bubbles]; b[i] = true; setBubbles(b) }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: popped ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.28)',
                transform: popped ? 'scale(0.88)' : 'scale(1)',
                opacity: popped ? 0.35 : 1,
                boxShadow: popped ? 'none' : 'inset 0 -4px 6px rgba(0,0,0,0.2), 0 4px 6px rgba(255,255,255,0.08)',
              }}>
              {popped && <span className="text-xs opacity-40">💥</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full">
          {isAllPopped && <button onClick={() => setBubbles(Array(42).fill(false))} className="flex-1 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-105" style={{ background: '#3b82f6' }}>🔄 Ulangi</button>}
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold transition-all hover:scale-105" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>Selesai ✓</button>
        </div>
      </div>
    </div>
  )
}

function BreathingOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'Tarik Napas...' | 'Tahan...' | 'Buang Napas...'>('Tarik Napas...')
  const [count, setCount] = useState(4)
  useEffect(() => {
    const phases: Array<{ label: 'Tarik Napas...' | 'Tahan...' | 'Buang Napas...'; duration: number }> = [
      { label: 'Tarik Napas...', duration: 4000 }, { label: 'Tahan...', duration: 2000 }, { label: 'Buang Napas...', duration: 4000 },
    ]
    let idx = 0; let countdown = phases[0].duration / 1000
    setPhase(phases[0].label); setCount(countdown)
    const ticker = setInterval(() => {
      countdown--; setCount(countdown)
      if (countdown <= 0) { idx = (idx + 1) % phases.length; countdown = phases[idx].duration / 1000; setPhase(phases[idx].label); setCount(countdown) }
    }, 1000)
    return () => clearInterval(ticker)
  }, [])
  const isInhale = phase === 'Tarik Napas...'; const isHold = phase === 'Tahan...'
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center anim-fade-in" style={{ background: 'rgba(3,3,8,0.93)', backdropFilter: 'blur(20px)' }}>
      <h2 className="text-white text-3xl md:text-4xl font-bold mb-4 text-center px-4">Tenangkan Pikiran Sejenak</h2>
      <p className="text-sm mb-16 tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Teknik 4-2-4 · Ikuti irama lingkaran</p>
      <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center"
        style={{
          background: isHold ? 'radial-gradient(circle,#818cf8,#6366f1)' : 'radial-gradient(circle,#7dd3fc,#0ea5e9)',
          transition: 'transform 4s ease-in-out, box-shadow 4s ease-in-out, background 0.5s ease',
          transform: isInhale ? 'scale(1.3)' : isHold ? 'scale(1.3)' : 'scale(0.8)',
          boxShadow: isInhale || isHold ? '0 0 120px rgba(14,165,233,0.6)' : '0 0 40px rgba(14,165,233,0.2)',
        }}>
        <div className="text-center">
          <span className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg tracking-widest block">{phase}</span>
          <span className="text-white text-5xl font-bold mt-2 block tabular-nums">{count}</span>
        </div>
      </div>
      <button onClick={onClose} className="mt-20 px-10 py-4 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(12px)' }}>
        Sudah Merasa Lebih Baik ✓
      </button>
    </div>
  )
}

function BurnBebanOverlay({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'igniting' | 'dissolving' | 'done'>('idle')
  const handleBurn = () => {
    if (!text) return
    setPhase('igniting'); setTimeout(() => setPhase('dissolving'), 1500); setTimeout(() => setPhase('done'), 2500); setTimeout(() => onClose(), 5000)
  }
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6 transition-all duration-1000 anim-fade-in"
      style={{ background: phase !== 'idle' ? 'rgba(69,10,10,0.97)' : 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)' }}>
      {phase !== 'done' ? (
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="text-6xl md:text-7xl mb-6 transition-all duration-500" style={{ transform: phase === 'igniting' ? 'scale(2)' : 'scale(1)', filter: phase === 'igniting' ? 'drop-shadow(0 0 30px rgba(239,68,68,1))' : 'none' }}>
            {phase === 'igniting' ? '🔥' : '🌬️'}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center transition-all" style={{ color: phase !== 'idle' ? '#fca5a5' : 'white' }}>
            {phase === 'igniting' ? 'Membakar Emosimu...' : 'Ruang Lepas Beban'}
          </h2>
          <p className="text-sm text-center mb-10 leading-relaxed transition-all" style={{ color: 'rgba(209,213,219,0.85)', opacity: phase !== 'idle' ? 0 : 1 }}>
            Ketikkan semua amarah atau kesedihan terdalammu di sini.<br />Teks akan <strong>dibakar</strong> dan tidak akan pernah disimpan.
          </p>
          <textarea className="w-full p-5 sm:p-8 rounded-3xl border-2 outline-none text-sm sm:text-base leading-relaxed resize-none shadow-2xl mb-8 transition-all duration-300"
            style={{
              background: phase === 'idle' ? 'rgba(255,255,255,0.08)' : 'rgba(153,27,27,0.5)',
              border: phase === 'idle' ? '2px solid rgba(255,255,255,0.15)' : '2px solid rgba(252,165,165,1)',
              color: phase !== 'idle' ? '#fef08a' : 'white',
              textShadow: phase !== 'idle' ? '0 0 15px #ef4444' : 'none',
              animation: phase === 'igniting' ? 'kBurnShake 0.3s infinite' : phase === 'dissolving' ? 'kAshFly 1.2s forwards' : 'none',
            }} rows={7}
            placeholder="Keluarkan semua amarahmu di sini. Tidak ada yang akan tahu..."
            value={text} onChange={e => setText(e.target.value)} disabled={phase !== 'idle'} />
          <div className="flex gap-4 w-full" style={{ opacity: phase !== 'idle' ? 0 : 1, pointerEvents: phase !== 'idle' ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(209,213,219,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>Batal</button>
            <button onClick={handleBurn} disabled={!text} className="flex-1 py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 10px 40px rgba(239,68,68,0.4)', border: '1px solid rgba(252,165,165,0.5)' }}>
              🔥 Bakar &amp; Hancurkan!
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center anim-slide-up text-center">
          <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8" style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', boxShadow: '0 0 80px rgba(34,197,94,0.3)' }}>
            <span className="text-7xl">🍃</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Sudah Berlalu</h2>
          <p className="text-gray-300 text-center max-w-md leading-relaxed text-lg px-4">Semua beban dan amarahmu telah lenyap tertiup angin. Tarik napas yang dalam...</p>
        </div>
      )}
    </div>
  )
}

function MicButton({ isListening, onClick, disabled }: { isListening: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="relative flex-shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
      style={{ width: 44, height: 44, borderRadius: '50%', background: isListening ? '#ef4444' : 'var(--surface-2)', color: isListening ? 'white' : 'var(--text-faint)', boxShadow: isListening ? '0 6px 20px rgba(239,68,68,0.4)' : 'none', animation: isListening ? 'kPulse 1.5s ease-in-out infinite' : 'none' }}
      aria-label={isListening ? 'Hentikan rekaman' : 'Bicara'}>
      <span className="text-lg">{isListening ? '⏹' : '🎤'}</span>
    </button>
  )
}

function MoodCheckinModal({ onSelect, onSkip }: { onSelect: (v: number) => void; onSkip: () => void }) {
  const moods = [
    { v: 5, e: '😄', l: 'Luar Biasa', c: '#22c55e' }, { v: 4, e: '🙂', l: 'Baik', c: '#84cc16' },
    { v: 3, e: '😐', l: 'Biasa', c: '#f59e0b' }, { v: 2, e: '😔', l: 'Kurang', c: '#f97316' },
    { v: 1, e: '😢', l: 'Berat', c: '#ef4444' },
  ]
  return (
    <div className="fixed inset-0 z-85 flex items-end sm:items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm anim-slide-up p-8 rounded-4xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
        <div className="text-center mb-7">
          <div className="text-5xl mb-4 inline-block" style={{ animation: 'kBounce2 2s ease-in-out infinite' }}>☀️</div>
          <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text)' }}>Selamat Datang Kembali!</h2>
          <p className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>Bagaimana perasaanmu hari ini?</p>
        </div>
        <div className="flex gap-2 mb-7">
          {moods.map(m => (
            <button key={m.v} onClick={() => onSelect(m.v)} className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all duration-200 hover:scale-110 active:scale-95 border-2"
              style={{ background: `${m.c}15`, borderColor: `${m.c}40`, color: m.c }}>
              <span className="text-2xl">{m.e}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{m.l}</span>
            </button>
          ))}
        </div>
        <button onClick={onSkip} className="w-full py-3 text-sm font-semibold rounded-2xl transition-all hover:opacity-80"
          style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}>Lewati untuk sekarang</button>
      </div>
    </div>
  )
}

function ConfettiRain() {
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.8, duration: 2.2 + Math.random() * 1.5,
    color: ['#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'][i % 7],
    size: 6 + Math.random() * 8, isCircle: Math.random() > 0.5,
  })), [])
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 340 }}>
      {pieces.map(p => (
        <div key={p.id} className="absolute" style={{
          left: `${p.left}%`, top: '-16px', width: p.size, height: p.size * (p.isCircle ? 1 : 0.5),
          background: p.color, borderRadius: p.isCircle ? '50%' : '2px',
          animation: `kConfetti ${p.duration}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  )
}

function RenameModal({ initialName, onSave, onClose }: { initialName: string; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(initialName)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="p-8 rounded-4xl max-w-sm w-full shadow-2xl relative anim-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
        <button onClick={onClose} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all"
          style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}>✕</button>
        <div className="text-4xl mb-4 text-center">✏️</div>
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--text)' }}>Ganti Nama Panggilanmu</h2>
        <input type="text" maxLength={20} placeholder="Nama Panggilanmu..." autoFocus
          className="w-full text-center text-xl font-bold p-4 rounded-2xl mb-6 outline-none transition-all"
          style={{ background: 'var(--surface-2)', border: '2px solid var(--border-2)', color: 'var(--text)' }}
          value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())} />
        <button onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim()}
          className="w-full py-4 rounded-2xl font-bold text-base text-white disabled:opacity-50 transition-all hover:scale-105"
          style={{ background: '#3b82f6', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
          Simpan Nama ✨
        </button>
      </div>
    </div>
  )
}

function StreakBadge({ count }: { count: number }) {
  if (count < 1) return null
  const isHot = count >= 7; const isMid = count >= 3
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm" title={`${count} hari berturut-turut`}
      style={{
        background: isHot ? 'linear-gradient(135deg,#f97316,#ef4444)' : isMid ? 'rgba(249,115,22,0.12)' : 'var(--surface-2)',
        color: isHot ? 'white' : isMid ? '#f97316' : 'var(--text-muted)',
        border: isHot ? 'none' : `1px solid ${isMid ? '#f9731640' : 'var(--border-2)'}`,
      }}>
      🔥 {count} hari
    </div>
  )
}

function QuickReplies({ emotion, onSelect }: { emotion: EmotionKey; onSelect: (text: string) => void }) {
  const replies = QUICK_REPLIES[emotion] || []
  return (
    <div className="flex flex-wrap justify-center gap-2 my-3 anim-fade-in px-4">
      {replies.map(reply => (
        <button key={reply} onClick={() => onSelect(reply)}
          className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border-2)', backdropFilter: 'blur(12px)' }}>
          {reply}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CurhatPage() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [bgTheme, setBgTheme] = useState<BgTheme>('default')
  const [userName, setUserName] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [tempName, setTempName] = useState('')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingText, setPendingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Overlay states
  const [showStats, setShowStats] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [showBurnOverlay, setShowBurnOverlay] = useState(false)
  const [showBubbleWrap, setShowBubbleWrap] = useState(false)
  const [showGrounding, setShowGrounding] = useState(false)
  const [showCapsule, setShowCapsule] = useState(false)
  const [showZenCanvas, setShowZenCanvas] = useState(false)
  const [showBalloon, setShowBalloon] = useState(false)
  const [showFutureSelf, setShowFutureSelf] = useState(false) // ← NEW
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [showSOS, setShowSOS] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showGratitude, setShowGratitude] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showPersonaDD, setShowPersonaDD] = useState(false)
  const [showAmbientDD, setShowAmbientDD] = useState(false)
  const [showThemeDD, setShowThemeDD] = useState(false)
  const [showMoodCheckin, setShowMoodCheckin] = useState(false)
  const [dailyMoodValue, setDailyMoodValue] = useState<number | null>(null)
  const [streakCount, setStreakCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [savedPin, setSavedPin] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSetupMsg, setPinSetupMsg] = useState('')
  const [pinSetupInput, setPinSetupInput] = useState('')
  const [gratitudes, setGratitudes] = useState<{ id: string; text: string; date: string }[]>([])
  const [newGratitude, setNewGratitude] = useState('')
  const [insightData, setInsightData] = useState<string | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [ambient, setAmbient] = useState<'hujan' | 'api' | 'alam' | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [persona, setPersona] = useState<'sahabat' | 'psikolog' | 'filsuf'>('sahabat')
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const personaDDRef = useRef<HTMLDivElement>(null)
  const ambientDDRef = useRef<HTMLDivElement>(null)
  const themeDDRef = useRef<HTMLDivElement>(null)

  const activeMessages = useMemo(() => sessions.find(s => s.id === activeSessionId)?.messages || [], [sessions, activeSessionId])
  const allMessages = useMemo(() => sessions.flatMap(s => s.messages), [sessions])

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter(s => s.title.toLowerCase().includes(q) || s.messages.some(m => m.userMessage.toLowerCase().includes(q)))
  }, [sessions, searchQuery])

  const dominantEmotion = useMemo(() => {
    if (!allMessages.length) return 'sedih' as EmotionKey
    const counts: Record<EmotionKey, number> = { senang: 0, cinta: 0, marah: 0, takut: 0, sedih: 0 }
    allMessages.forEach(m => counts[m.emotion]++)
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as EmotionKey
  }, [allMessages])

  const todayAffirmation = useMemo(() => {
    const idx = new Date().getDay() + new Date().getDate()
    return AFFIRMATIONS[idx % AFFIRMATIONS.length]
  }, [])

  const computeStreak = useCallback((s: ChatSession[]) => {
    if (!s.length) return 0
    const uniqueDays = Array.from(new Set(s.flatMap(sess => sess.messages.map(m => new Date(m.timestamp).toDateString())))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    let streak = 0; const check = new Date(); check.setHours(0, 0, 0, 0)
    for (const day of uniqueDays) {
      const d = new Date(day); d.setHours(0, 0, 0, 0)
      if (d.getTime() === check.getTime()) { streak++; check.setDate(check.getDate() - 1) } else break
    }
    return streak
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('kenopia-theme')
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark); document.documentElement.classList.toggle('dark', isDark)
    try {
      const savedName = localStorage.getItem(NAME_KEY)
      if (savedName) { setUserName(savedName) } else { setShowNameModal(true) }
      const savedBg = localStorage.getItem(THEME_KEY) as BgTheme
      if (savedBg && BG_THEMES[savedBg]) setBgTheme(savedBg)
      const storedSessions = localStorage.getItem(SESSION_STORAGE_KEY)
      let parsed: ChatSession[] = []
      if (storedSessions) {
        parsed = JSON.parse(storedSessions); setSessions(parsed)
        if (parsed.length > 0) setActiveSessionId(parsed[parsed.length - 1].id)
        setStreakCount(computeStreak(parsed))
      }
      const pin = localStorage.getItem(PIN_KEY); if (pin) { setSavedPin(pin); setIsLocked(true) }
      const grat = localStorage.getItem(GRATITUDE_KEY); if (grat) setGratitudes(JSON.parse(grat))
      const cap = localStorage.getItem(CAPSULE_KEY); if (cap) setCapsules(JSON.parse(cap))
      if (savedName) {
        const today = new Date().toDateString()
        const savedMood = localStorage.getItem(MOOD_KEY)
        const parsedMood = savedMood ? JSON.parse(savedMood) : null
        if (!parsedMood || parsedMood.date !== today) { setTimeout(() => setShowMoodCheckin(true), 1200) }
        else { setDailyMoodValue(parsedMood.value) }
      }
    } catch { /* ignore */ }
    setVoiceSupported(!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition)
    setMounted(true)
  }, [computeStreak])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) setShowMobileMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])



  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeMessages, loading, pendingText])
  useEffect(() => () => { recognitionRef.current?.abort() }, [])

  const handleBgThemeChange = (theme: BgTheme) => { setBgTheme(theme); localStorage.setItem(THEME_KEY, theme) }
  const handleSaveName = () => { if (!tempName.trim()) return; localStorage.setItem(NAME_KEY, tempName.trim()); setUserName(tempName.trim()); setShowNameModal(false); setTimeout(() => setShowMoodCheckin(true), 1000) }
  const handleMoodSelect = (v: number) => {
    const today = new Date().toDateString(); localStorage.setItem(MOOD_KEY, JSON.stringify({ date: today, value: v }))
    setDailyMoodValue(v); setShowMoodCheckin(false)
    if (v >= 4) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500) }
  }
  const handleMoodSkip = () => { localStorage.setItem(MOOD_KEY, JSON.stringify({ date: new Date().toDateString(), value: null })); setShowMoodCheckin(false) }

  const handlePlayAmbient = (type: 'hujan' | 'api' | 'alam' | null) => {
    setAmbient(type)
    if (type === null) { audioRef.current?.pause(); if (audioRef.current) audioRef.current.src = ''; return }
    const urls = { hujan: '/audio/hujan.mp3', api: '/audio/api.mp3', alam: '/audio/alam.mp3' }
    if (!audioRef.current) audioRef.current = new Audio(urls[type])
    else { audioRef.current.pause(); audioRef.current.src = urls[type] }
    audioRef.current.loop = true; audioRef.current.volume = 0.5; audioRef.current.play().catch(() => {})
  }

  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('kenopia-theme', next ? 'dark' : 'light') }
  const saveSessions = useCallback((newSessions: ChatSession[]) => { setSessions(newSessions); localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSessions)) }, [])
  const clearHistory = () => { if (confirm('Yakin ingin menghapus semua riwayat curhat?')) { saveSessions([]); setActiveSessionId(null); setStreakCount(0) } }
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!confirm('Hapus sesi ini?')) return
    const updated = sessions.filter(s => s.id !== id); saveSessions(updated); setStreakCount(computeStreak(updated))
    if (activeSessionId === id) setActiveSessionId(updated.length > 0 ? updated[updated.length - 1].id : null)
  }

  const handleExport = async () => {
    if (!exportRef.current) return
    try {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: dark ? '#0f172a' : '#f8fafc', scale: 2 })
      const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = `Kenopia-Wrapped-${new Date().toISOString().slice(0, 10)}.png`; link.click()
    } catch { setError('Gagal mengekspor jurnal.') }
  }

  const addGratitude = () => {
    if (!newGratitude) return
    const updated = [{ id: uuidv4(), text: newGratitude, date: new Date().toISOString() }, ...gratitudes]
    setGratitudes(updated); localStorage.setItem(GRATITUDE_KEY, JSON.stringify(updated)); setNewGratitude('')
  }

  const fetchInsight = async () => {
    if (allMessages.length === 0) return
    setLoadingInsight(true)
    try {
      const res = await fetch('/api/insight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history: allMessages.slice(-10), userName }) })
      const data = await res.json(); setInsightData(data.insight)
    } catch { setInsightData('Gagal menarik analisis AI.') }
    setLoadingInsight(false)
  }

  const handleDrawPromptCard = () => {
    const randomPrompt = REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)]
    setInput(randomPrompt); textareaRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 300) return
    setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }

  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); setVoiceHint(null); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'id-ID'; recognition.interimResults = true; recognition.maxAlternatives = 1; recognition.continuous = false
    recognitionRef.current = recognition
    recognition.onstart = () => { setIsListening(true); setVoiceHint('🎙️ Mendengarkan suara...'); setError(null) }
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''; let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
        else interim += event.results[i][0].transcript
      }
      if (interim) setInput(prev => { const base = prev.replace(/\[.*?\]$/, '').trimEnd(); return base ? `${base} [${interim}]` : `[${interim}]` })
      if (final) {
        setInput(prev => { const clean = prev.replace(/\s*\[.*?\]$/, '').trim(); return clean ? `${clean} ${final}` : final })
        setVoiceHint('✅ Suara direkam!')
        setTimeout(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px' } }, 0)
      }
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false); setVoiceHint(null)
      if (event.error === 'not-allowed') setError('Izin mikrofon ditolak.')
      else if (event.error === 'no-speech') { setVoiceHint('Tidak ada suara. Coba lagi.'); setTimeout(() => setVoiceHint(null), 3000) }
    }
    recognition.onend = () => { setIsListening(false); setTimeout(() => setVoiceHint(null), 2000); textareaRef.current?.focus() }
    recognition.start()
  }

  const handleSubmit = async () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false) }
    const text = input.replace(/\s*\[.*?\]$/, '').trim()
    if (!text || loading) return
    setInput(''); setError(null); setVoiceHint(null); setPendingText(text); setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    const recentContext = activeMessages.slice(-4).map(h => ({ user: h.userMessage, ai: h.aiResponse }))
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, context: recentContext, persona, userName }) })
      const rawText = await res.text()
      let data: AnalyzeResponse
      try { data = JSON.parse(rawText) } catch { throw new Error('Respons server tidak valid. Coba lagi.') }
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Terjadi kesalahan.')
      const newMsg: ChatMessage = { id: uuidv4(), userMessage: text, emotion: data.emotion, aiResponse: data.aiResponse, timestamp: data.timestamp }
      let updatedSessions = [...sessions]
      if (activeSessionId) {
        updatedSessions = updatedSessions.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newMsg] } : s)
      } else {
        const newSessionId = uuidv4()
        const words = text.split(' ')
        const sessionTitle = words.length > 5 ? words.slice(0, 5).join(' ') + '...' : text
        updatedSessions.push({ id: newSessionId, title: sessionTitle, createdAt: new Date().toISOString(), messages: [newMsg] })
        setActiveSessionId(newSessionId)
      }
      saveSessions(updatedSessions); setStreakCount(computeStreak(updatedSessions))
    } catch (e) { setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi ya.') }
    finally { setPendingText(null); setLoading(false) }
  }

  const handlePinDigit = (digit: string) => {
    const newPin = pinInput + digit; setPinInput(newPin)
    if (newPin.length === 4) {
      if (newPin === savedPin) { setIsLocked(false); setPinInput(''); setPinError('') }
      else { setPinError('PIN salah, coba lagi'); setTimeout(() => { setPinInput(''); setPinError('') }, 1200) }
    }
  }

  if (!mounted) return null

  // ── CSS variable values based on dark mode ─────────────────────────────────
  const cssVars = dark
    ? { '--bg': '#030308', '--surface': 'rgba(255,255,255,0.05)', '--surface-2': 'rgba(255,255,255,0.07)', '--border-2': 'rgba(255,255,255,0.1)', '--text': '#eef0ff', '--text-muted': 'rgba(238,240,255,0.65)', '--text-faint': 'rgba(238,240,255,0.38)', '--accent': '#3b82f6' }
    : { '--bg': '#f8faff', '--surface': 'rgba(255,255,255,0.9)', '--surface-2': 'rgba(248,250,255,0.85)', '--border-2': 'rgba(0,0,0,0.08)', '--text': '#0d1117', '--text-muted': 'rgba(13,17,23,0.65)', '--text-faint': 'rgba(13,17,23,0.4)', '--accent': '#3b82f6' }

  // ── Onboarding Name Modal ──────────────────────────────────────────────────
  if (showNameModal && !isLocked) {
    return (
      <div className="flex h-screen items-center justify-center flex-col relative overflow-hidden" style={{ background: '#030308', ...cssVars as React.CSSProperties }}>
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%,rgba(59,130,246,0.2) 0%,transparent 60%)' }} />
        <div className="z-10 p-8 sm:p-10 rounded-4xl flex flex-col items-center w-[90%] max-w-[420px] relative anim-fade-in"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
          <div className="text-6xl mb-6" style={{ animation: 'kBounce2 2s ease-in-out infinite' }}>👋</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center text-white">Kenalan Dulu Yuk!</h2>
          <p className="text-sm text-center mb-8 leading-relaxed" style={{ color: 'rgba(209,213,219,0.85)' }}>Agar Kenopia bisa mengenal dan memanggilmu dengan lebih akrab.</p>
          <input type="text" maxLength={20} placeholder="Nama Panggilanmu..." autoFocus
            className="w-full text-center text-xl font-bold p-4 rounded-2xl mb-6 outline-none transition-all text-white placeholder-gray-500"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveName()} />
          <button onClick={handleSaveName} disabled={!tempName.trim()}
            className="w-full py-4 rounded-2xl font-bold text-base text-white disabled:opacity-50 transition-all hover:scale-105"
            style={{ background: '#3b82f6', boxShadow: '0 10px 30px rgba(59,130,246,0.3)' }}>
            Mulai Curhat ✨
          </button>
        </div>
      </div>
    )
  }

  // ── Lock Screen ────────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div className="flex h-screen items-center justify-center flex-col relative overflow-hidden" style={{ background: '#030308', ...cssVars as React.CSSProperties }}>
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%,rgba(59,130,246,0.25) 0%,transparent 60%)' }} />
        <div className="z-10 p-8 sm:p-10 rounded-4xl flex flex-col items-center w-[90%] max-w-[400px] anim-fade-in"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-6" style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(236,72,153,0.2))', border: '1px solid rgba(255,255,255,0.1)' }}>🔒</div>
          <h2 className="text-2xl font-bold mb-8 text-white">Area Pribadi</h2>
          <div className="flex gap-4 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-5 h-5 rounded-full transition-all duration-300"
                style={{ background: pinError ? '#f87171' : pinInput.length > i ? '#60a5fa' : 'rgba(255,255,255,0.15)', transform: pinInput.length > i ? 'scale(1.25)' : 'scale(1)', boxShadow: pinInput.length > i ? '0 0 20px rgba(96,165,250,0.8)' : 'none', animation: pinError ? 'kPulse 0.3s ease-in-out' : 'none' }} />
            ))}
          </div>
          <div className="text-xs font-bold mb-6 h-5 transition-all" style={{ color: '#f87171', opacity: pinError ? 1 : 0 }}>{pinError || '—'}</div>
          <div className="grid grid-cols-3 gap-3 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((n, idx) => (
              <button key={idx}
                onClick={() => n === '⌫' ? setPinInput(p => p.slice(0, -1)) : n !== '' && handlePinDigit(String(n))}
                disabled={n === '' || (typeof n === 'number' && pinInput.length >= 4)}
                className="h-14 sm:h-16 rounded-2xl text-xl font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  visibility: n === '' ? 'hidden' : 'visible',
                  background: n === '⌫' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                  color: n === '⌫' ? '#f87171' : 'white',
                  border: `1px solid ${n === '⌫' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentTheme = BG_THEMES[bgTheme]
  const mainBgColor = dark ? currentTheme.darkBg : currentTheme.lightBg

  // ── Shared overlay open state for sidebar/mobile buttons ──────────────────
  const openOverlay = (fn: () => void) => { fn(); setSidebarOpen(false); setShowMobileMenu(false) }

  return (
    <>
      <style>{`
        /* ── CSS Custom Properties ── */
        .kp-app { ${Object.entries(cssVars).map(([k, v]) => `${k}:${v}`).join(';')} }

        /* ── Base ── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(156,163,175,0.5); }

        /* ── Keyframes (all animations self-contained) ── */
        @keyframes kBounce  { 0%,100%{transform:translateY(0);opacity:1;} 50%{transform:translateY(-6px);opacity:.5;} }
        @keyframes kBounce2 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        @keyframes kPulse   { 0%,100%{opacity:1;} 50%{opacity:.4;} }
        @keyframes kFadeIn  { from{opacity:0;} to{opacity:1;} }
        @keyframes kSlideUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes kPopIn   { 0%{opacity:0;transform:scale(0.8) translateY(12px);} 70%{transform:scale(1.04) translateY(-2px);} 100%{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes kOrbSlow { 0%,100%{transform:translate(0,0) scale(1) rotate(0deg);} 33%{transform:translate(4vw,-4vh) scale(1.1) rotate(10deg);} 66%{transform:translate(-3vw,3vh) scale(0.9) rotate(-5deg);} }
        @keyframes kBalloonFly { 0%{transform:translateY(0) scale(1) rotate(0deg);opacity:1;} 100%{transform:translateY(-120vh) scale(0.6) rotate(15deg);opacity:0;} }
        @keyframes kBurnShake { 0%,100%{transform:translate(1px,1px)} 25%{transform:translate(-3px,-2px)} 50%{transform:translate(3px,2px)} 75%{transform:translate(-2px,3px)} }
        @keyframes kAshFly { 0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);} 100%{opacity:0;transform:translateY(-150px) scale(1.1);filter:blur(15px);} }
        @keyframes kConfetti { 0%{transform:translateY(-20px) rotate(0deg);opacity:1;} 100%{transform:translateY(100vh) rotate(720deg);opacity:0;} }
        @keyframes kSheetUp { from{opacity:0;transform:translateY(100%);} to{opacity:1;transform:translateY(0);} }
        @keyframes kMenuIn  { from{opacity:0;transform:translateY(-8px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }

        /* ── Utility animation classes ── */
        .anim-fade-in  { animation: kFadeIn  0.35s ease both; }
        .anim-slide-up { animation: kSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-pop-in   { animation: kPopIn   0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .anim-orb-slow { animation: kOrbSlow 18s ease-in-out infinite; }
        .sheet-enter   { animation: kSheetUp 0.3s cubic-bezier(0.32,0.72,0,1) forwards; }
        .menu-enter    { animation: kMenuIn  0.18s ease-out forwards; }

        /* ── Message group hover ── */
        .msg-group .msg-time { opacity: 0; transition: opacity 0.2s; }
        .msg-group:hover .msg-time { opacity: 1; }
        .hist-group .hist-delete { opacity: 0; transition: opacity 0.2s; }
        .hist-group:hover .hist-delete { opacity: 1; }
        .cal-dot { transition: transform 0.3s, box-shadow 0.3s; }
        .cal-dot:hover { transform: scale(1.25) rotate(6deg); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

        /* ── Textarea no-scrollbar ── */
        .chat-input { -ms-overflow-style:none; scrollbar-width:none; }
        .chat-input::-webkit-scrollbar { display:none; }

        /* ── Rounded corners shorthand ── */
        .rounded-3xl { border-radius: 24px; }
        .rounded-4xl { border-radius: 32px; }

        /* ── z-index layers ── */
        .z-85  { z-index: 85; }
        .z-100 { z-index: 100; }
      `}</style>

      <div className="kp-app flex h-screen overflow-hidden relative transition-colors duration-1000" style={{ background: mainBgColor } as React.CSSProperties}>

        {/* ── Mesh Background Orbs ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-80" style={{ zIndex: 0 }}>
          {[
            { bg: currentTheme.orb1, delay: '0s', size: '80vw', pos: '-top-[20vh] -left-[10vw]' },
            { bg: currentTheme.orb2, delay: '3s', size: '70vw', pos: 'top-[10vh] -right-[15vw]' },
            { bg: currentTheme.orb3, delay: '6s', size: '90vw', pos: '-bottom-[30vh] left-[5vw]' },
          ].map((orb, i) => (
            <div key={i} className="absolute rounded-full anim-orb-slow" style={{
              width: orb.size, height: orb.size, background: orb.bg,
              filter: 'blur(100px)', animationDelay: orb.delay,
              mixBlendMode: dark ? 'screen' : 'multiply',
              ...(i === 0 ? { top: '-20vh', left: '-10vw' } : i === 1 ? { top: '10vh', right: '-15vw' } : { bottom: '-30vh', left: '5vw' }),
            }} />
          ))}
        </div>

        {/* ── Overlays ── */}
        {showZenCanvas && <FadingCanvasOverlay onClose={() => setShowZenCanvas(false)} />}
        {showBalloon && <HopeBalloonOverlay onClose={() => setShowBalloon(false)} />}
        {showBreathing && <BreathingOverlay onClose={() => setShowBreathing(false)} />}
        {showBurnOverlay && <BurnBebanOverlay onClose={() => setShowBurnOverlay(false)} />}
        {showBubbleWrap && <BubbleWrapOverlay onClose={() => setShowBubbleWrap(false)} />}
        {showGrounding && <GroundingOverlay onClose={() => setShowGrounding(false)} />}
        {showCapsule && <TimeCapsuleOverlay capsules={capsules} setCapsules={setCapsules} onClose={() => setShowCapsule(false)} />}
        {/* ✅ FIX: Future Self Letter connected to /api/futureself */}
        {showFutureSelf && <FutureSelfOverlay history={allMessages} userName={userName} onClose={() => setShowFutureSelf(false)} />}
        {showMoodCheckin && <MoodCheckinModal onSelect={handleMoodSelect} onSkip={handleMoodSkip} />}
        {showConfetti && <ConfettiRain />}
        {showRenameModal && <RenameModal initialName={userName} onSave={name => { localStorage.setItem(NAME_KEY, name); setUserName(name); setShowRenameModal(false) }} onClose={() => setShowRenameModal(false)} />}

        {/* Zen mode exit button */}
        {zenMode && (
          <button onClick={() => setZenMode(false)} className="fixed top-6 right-6 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg hover:scale-105 anim-fade-in"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text)', backdropFilter: 'blur(16px)', zIndex: 50 }}>
            Keluar Mode Fokus ✕
          </button>
        )}

        {/* ── SOS Modal ── */}
        {showSOS && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="p-8 rounded-4xl max-w-sm w-full shadow-2xl relative anim-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
              <button onClick={() => setShowSOS(false)} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>✕</button>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5" style={{ background: 'rgba(239,68,68,0.1)', animation: 'kPulse 2s ease-in-out infinite' }}>🆘</div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Bantuan Darurat</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-faint)' }}>Kamu berharga, {userName}. Jangan ragu untuk meminta bantuan.</p>
              </div>
              <div className="flex flex-col gap-4">
                <a href="tel:119" className="p-5 rounded-2xl flex justify-between items-center transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div><p className="font-bold" style={{ color: 'var(--text)' }}>Layanan Sejiwa</p><p className="text-xs" style={{ color: 'var(--text-faint)' }}>Kemenkes RI</p></div>
                  <span className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#3b82f6' }}>119 ext 8</span>
                </a>
                <a href="https://www.intothelightid.org" target="_blank" rel="noreferrer" className="p-5 rounded-2xl flex justify-between items-center transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <div><p className="font-bold" style={{ color: 'var(--text)' }}>Into The Light</p><p className="text-xs" style={{ color: 'var(--text-faint)' }}>Konseling</p></div>
                  <span className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#f97316' }}>Website ➔</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── PIN Setup Modal ── */}
        {showPinSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="p-8 rounded-4xl max-w-sm w-full shadow-2xl text-center relative anim-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
              <button onClick={() => { setShowPinSetup(false); setPinSetupInput(''); setPinSetupMsg('') }} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>✕</button>
              <div className="text-5xl mb-5">🔐</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{savedPin ? 'Ubah/Hapus PIN' : 'Buat Keamanan PIN'}</h2>
              <p className="text-xs mb-6" style={{ color: 'var(--text-faint)' }}>PIN 4 digit untuk mengunci privasimu</p>
              <input type="password" inputMode="numeric" maxLength={4} placeholder="•  •  •  •"
                className="w-full text-center text-2xl font-bold tracking-widest p-5 rounded-2xl mb-3 outline-none transition-all"
                style={{ background: 'var(--surface-2)', border: '2px solid var(--border-2)', color: 'var(--text)' }}
                value={pinSetupInput} onChange={e => { setPinSetupInput(e.target.value.replace(/\D/g, '')); setPinSetupMsg('') }} />
              {pinSetupMsg && <p className="text-xs font-bold mb-4" style={{ color: pinSetupMsg.includes('Berhasil') ? '#22c55e' : '#ef4444' }}>{pinSetupMsg}</p>}
              <div className="flex gap-3 mt-2">
                <button onClick={() => {
                  if (pinSetupInput.length !== 4) { setPinSetupMsg('Harus persis 4 digit!'); return }
                  localStorage.setItem(PIN_KEY, pinSetupInput); setSavedPin(pinSetupInput); setPinSetupMsg('✓ PIN Berhasil Disimpan!')
                  setTimeout(() => { setPinSetupInput(''); setPinSetupMsg(''); setShowPinSetup(false) }, 1200)
                }} className="flex-1 py-4 rounded-2xl font-bold text-white" style={{ background: '#3b82f6' }}>Simpan</button>
                {savedPin && <button onClick={() => {
                  localStorage.removeItem(PIN_KEY); setSavedPin(null); setPinSetupMsg('PIN Dihapus!')
                  setTimeout(() => { setPinSetupInput(''); setPinSetupMsg(''); setShowPinSetup(false) }, 1000)
                }} className="flex-1 py-4 rounded-2xl font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Hapus PIN</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── Gratitude Modal ── */}
        {showGratitude && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="p-6 sm:p-8 rounded-4xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[85vh] anim-slide-up" style={{ background: 'var(--surface)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <button onClick={() => setShowGratitude(false)} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>✕</button>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#ca8a04' }}>✨ Toples Syukur</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-faint)' }}>Satu hal kecil yang membuatmu tersenyum hari ini?</p>
              <div className="flex gap-3 mb-6">
                <input value={newGratitude} onChange={e => setNewGratitude(e.target.value)} placeholder="Aku bersyukur karena..."
                  onKeyDown={e => e.key === 'Enter' && addGratitude()}
                  className="flex-1 p-4 rounded-2xl outline-none text-sm transition-all min-w-0"
                  style={{ background: 'var(--surface-2)', border: '2px solid var(--border-2)', color: 'var(--text)' }} />
                <button onClick={addGratitude} className="flex-shrink-0 px-5 rounded-2xl text-2xl font-bold text-white transition-all hover:scale-105" style={{ background: '#eab308' }}>+</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {gratitudes.length === 0
                  ? <p className="text-center text-sm mt-10 italic" style={{ color: 'var(--text-faint)' }}>Toplesmu masih kosong. Mulai isi dengan kebahagiaan pertamamu.</p>
                  : gratitudes.map(g => (
                    <div key={g.id} className="p-5 rounded-2xl shadow-sm" style={{ background: 'var(--surface-2)', border: '1px solid rgba(234,179,8,0.15)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>"{g.text}"</p>
                      <p className="text-xs font-bold uppercase tracking-wider mt-3" style={{ color: 'rgba(202,138,4,0.7)' }}>{new Date(g.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI Insight Modal ── */}
        {showInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="p-6 sm:p-8 rounded-4xl max-w-lg w-full shadow-2xl relative anim-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
              <button onClick={() => setShowInsight(false)} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-all" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>✕</button>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-3" style={{ color: '#3b82f6' }}>
                <span className="p-2.5 rounded-2xl text-xl" style={{ background: 'rgba(59,130,246,0.1)' }}>🧠</span> AI Insight
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-faint)' }}>Analisis mendalam dari semua riwayat curhatanmu.</p>
              <div className="p-6 rounded-2xl min-h-[200px] flex items-center justify-center text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                {loadingInsight
                  ? <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">{[0, 150, 300].map(d => <div key={d} className="w-3 h-3 rounded-full" style={{ background: '#3b82f6', animation: `kBounce 1s ${d}ms ease-in-out infinite` }} />)}</div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(59,130,246,0.7)' }}>Menganalisis pola emosimu...</p>
                  </div>
                  : insightData
                    ? <p className="text-sm leading-relaxed whitespace-pre-wrap text-left w-full" style={{ color: 'var(--text)' }}>{insightData}</p>
                    : <button onClick={fetchInsight} className="px-8 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105" style={{ background: '#3b82f6', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>✨ Mulai Analisis AI</button>}
              </div>
            </div>
          </div>
        )}

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && <div className="fixed inset-0 z-30 lg:hidden anim-fade-in" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }} onClick={() => setSidebarOpen(false)} />}

        {/* ── SIDEBAR ── */}
        {!zenMode && (
          <aside className="fixed lg:relative z-40 lg:z-auto w-[280px] sm:w-[300px] h-full flex flex-col transition-transform duration-500 ease-out"
            style={{
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              background: dark ? 'rgba(9,5,30,0.75)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
              borderRight: '1px solid var(--border-2)', boxShadow: '2px 0 40px rgba(0,0,0,0.1)',
            }}
            // Desktop: always visible
            ref={node => { if (node) { if (window.innerWidth >= 1024) node.style.transform = 'translateX(0)' } }}>

            <div className="p-5 sm:p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-2)' }}>
              <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md" style={{ background: 'linear-gradient(135deg,#3b82f6,#ec4899)' }}>K</div>
                <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>Kenopia</span>
              </Link>
              <button className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }} onClick={() => setSidebarOpen(false)}>✕</button>
            </div>

            <div className="p-4 sm:p-5">
              {(streakCount > 0 || dailyMoodValue !== null) && (
                <div className="flex items-center gap-2 mb-4">
                  {streakCount > 0 && <StreakBadge count={streakCount} />}
                  {dailyMoodValue !== null && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-muted)' }}>
                      {dailyMoodValue >= 4 ? '😄' : dailyMoodValue >= 3 ? '🙂' : dailyMoodValue >= 2 ? '😐' : '😔'} Mood
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => { setActiveSessionId(null); setInput(''); setError(null); setPendingText(null); setSidebarOpen(false) }}
                className="w-full py-3 sm:py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-white hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: '#3b82f6', boxShadow: '0 6px 20px rgba(59,130,246,0.35)' }}>
                ✏️ Curhat Baru
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-4">
              {/* 9-feature grid sidebar */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { icon: '🧘', label: 'Grounding', fn: () => openOverlay(() => setShowGrounding(true)), color: '#10b981' },
                  { icon: '🫁', label: 'Napas', fn: () => openOverlay(() => setShowBreathing(true)), color: '#0ea5e9' },
                  { icon: '🫧', label: 'Bubble', fn: () => openOverlay(() => setShowBubbleWrap(true)), color: '#8b5cf6' },
                  { icon: '🔥', label: 'Beban', fn: () => openOverlay(() => setShowBurnOverlay(true)), color: '#ef4444' },
                  { icon: '✨', label: 'Syukur', fn: () => openOverlay(() => setShowGratitude(true)), color: '#ca8a04' },
                  { icon: '⏳', label: 'Kapsul', fn: () => openOverlay(() => setShowCapsule(true)), color: '#6366f1' },
                  { icon: '🎨', label: 'Kanvas', fn: () => openOverlay(() => setShowZenCanvas(true)), color: '#9ca3af' },
                  { icon: '🎈', label: 'Balon', fn: () => openOverlay(() => setShowBalloon(true)), color: '#3b82f6' },
                  { icon: '✉️', label: 'Surat', fn: () => openOverlay(() => setShowFutureSelf(true)), color: '#16a34a' },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.fn}
                    className="py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all hover:scale-105 shadow-sm"
                    style={{ background: `${btn.color}12`, color: btn.color, border: `1.5px dashed ${btn.color}35` }}>
                    <span className="text-xl">{btn.icon}</span>{btn.label}
                  </button>
                ))}
              </div>

              {/* Stats section */}
              <button onClick={() => setShowStats(!showStats)}
                className="w-full mb-3 py-3 px-5 rounded-2xl text-sm font-bold flex items-center justify-between transition-all shadow-sm"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-2"><span>📊</span> Analisis Emosi</div>
                <span className="text-xs opacity-60 transition-transform duration-300" style={{ transform: showStats ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>

              {showStats && (
                <div className="mb-5 p-4 sm:p-5 rounded-2xl anim-slide-up" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                  <EmotionChart history={allMessages} />
                  <EmotionCalendar messages={allMessages} />
                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => { setShowInsight(true); fetchInsight() }} className="w-full py-2.5 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>🧠 AI Insight</button>
                    {/* ✅ Future Self button in stats section */}
                    <button onClick={() => setShowFutureSelf(true)} className="w-full py-2.5 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(134,239,172,0.1)', color: '#16a34a', border: '1px solid rgba(134,239,172,0.2)' }}>✉️ Surat Masa Depan</button>
                    {allMessages.length > 0 && <button onClick={handleExport} className="w-full py-2.5 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02] text-white"
                      style={{ background: '#3b82f6', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>📸 Kenopia Wrapped</button>}
                  </div>
                </div>
              )}

              {/* History list */}
              <div className="py-2">
                <div className="flex justify-between items-center mb-3 px-1">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Riwayat ({sessions.length})</p>
                </div>
                {sessions.length >= 3 && (
                  <div className="relative mb-3">
                    <input type="text" placeholder="🔍 Cari sesi..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs outline-none transition-all"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-faint)' }}>✕</button>}
                  </div>
                )}
                {sessions.length === 0
                  ? <div className="py-8 px-4 text-center rounded-2xl" style={{ border: '2px dashed var(--border-2)', background: 'var(--surface-2)' }}>
                    <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-faint)' }}>Riwayat masih kosong.<br />Mulai sapa Kenopia yuk!</p>
                  </div>
                  : filteredSessions.length === 0
                    ? <p className="text-center text-xs py-6 italic" style={{ color: 'var(--text-faint)' }}>Tidak ada hasil untuk "{searchQuery}"</p>
                    : <div className="flex flex-col gap-1">{[...filteredSessions].reverse().map(session => (
                      <HistoryItem key={session.id} session={session} active={activeSessionId === session.id}
                        onClick={() => { setActiveSessionId(session.id); setSidebarOpen(false) }}
                        onDelete={e => deleteSession(session.id, e)} />
                    ))}</div>}
              </div>
            </div>

            {/* Sidebar footer */}
            <div className="p-4 sm:p-5 flex flex-col gap-2.5" style={{ borderTop: '1px solid var(--border-2)' }}>
              <div className="flex gap-2.5">
                <button onClick={() => setShowPinSetup(true)} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 hover:scale-105"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-muted)' }}>
                  🔒 {savedPin ? 'PIN' : 'Set PIN'}
                </button>
                <button onClick={() => setShowRenameModal(true)} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 hover:scale-105"
                  style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  👤 Nama
                </button>
              </div>
              {sessions.length > 0 && (
                <button onClick={clearHistory} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 hover:scale-105"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-faint)' }}>
                  🗑️ Hapus Riwayat
                </button>
              )}
            </div>
          </aside>
        )}

        {/* ── MAIN CHAT AREA ── */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative" style={{ zIndex: 10 }}>

          {/* ── Header ── */}
          {!zenMode && (
            <header className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0"
              style={{ background: dark ? 'rgba(9,5,30,0.5)' : 'rgba(255,255,255,0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border-2)', boxShadow: '0 1px 0 rgba(0,0,0,0.04)', zIndex: 30, position: 'relative' }}>
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <button className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-lg"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-faint)' }}
                  onClick={() => setSidebarOpen(true)}>☰</button>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#ec4899)' }}>K</div>
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base leading-tight truncate" style={{ color: 'var(--text)' }}>
                    {loading
                      ? <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#3b82f6', animation: 'kPulse 1.5s ease-in-out infinite' }} />Mengetik...</span>
                      : activeSessionId ? <>{EMOTIONS[activeMessages[activeMessages.length - 1]?.emotion ?? 'sedih'].emoji} Sesi Tersimpan</> : <>💬 Kenopia AI</>}
                  </p>
                  <p className="text-xs leading-tight mt-0.5 flex items-center gap-1.5 truncate" style={{ color: 'var(--text-faint)' }}>
                    Halo <span className="font-bold" style={{ color: '#3b82f6' }}>{userName || 'Teman'}</span>
                    <span className="opacity-30 hidden sm:inline">·</span>
                    <span className="hidden sm:inline">{persona === 'sahabat' ? '👋 Sahabat' : persona === 'psikolog' ? '🩺 Psikolog' : '🧘 Filsuf'}</span>
                  </p>
                </div>
              </div>

              {/* Desktop controls */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-3">
                {streakCount >= 2 && <StreakBadge count={streakCount} />}

                {/* Persona dropdown */}
                <div className="relative" ref={personaDDRef}>
                  <button className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:scale-105"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-muted)' }}
                    onClick={() => { setShowPersonaDD(v => !v); setShowAmbientDD(false); setShowThemeDD(false) }}>
                    🎭 {persona === 'sahabat' ? 'Sahabat' : persona === 'psikolog' ? 'Psikolog' : 'Filsuf Zen'} <span className="opacity-40 text-xs">▼</span>
                  </button>
                  {showPersonaDD && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 90 }} onClick={() => setShowPersonaDD(false)} />
                      <div className="absolute right-0 top-full mt-2 w-44" style={{ zIndex: 91 }}>
                        <div className="rounded-2xl shadow-xl flex flex-col overflow-hidden p-2" style={{ background: dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)', border: '1px solid var(--border-2)', backdropFilter: 'blur(20px)' }}>
                          {(['sahabat', 'psikolog', 'filsuf'] as const).map(p => (
                            <button key={p} onClick={() => { setPersona(p); setShowPersonaDD(false) }} className="text-left px-4 py-3 text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                              style={{ background: persona === p ? 'rgba(59,130,246,0.1)' : 'transparent', color: persona === p ? '#3b82f6' : 'var(--text-muted)' }}>
                              {p === 'sahabat' ? '👋' : p === 'psikolog' ? '🩺' : '🧘'} {p === 'sahabat' ? 'Sahabat' : p === 'psikolog' ? 'Psikolog' : 'Filsuf Zen'}
                              {persona === p && <span className="ml-auto text-xs">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Ambient dropdown */}
                <div className="relative" ref={ambientDDRef}>
                  <button className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:scale-105"
                    style={{ background: ambient ? '#3b82f6' : 'var(--surface-2)', border: `1px solid ${ambient ? 'transparent' : 'var(--border-2)'}`, color: ambient ? 'white' : 'var(--text-muted)' }}
                    onClick={() => { setShowAmbientDD(v => !v); setShowPersonaDD(false); setShowThemeDD(false) }}>
                    🎵 {ambient === 'hujan' ? 'Hujan' : ambient === 'api' ? 'Api' : ambient === 'alam' ? 'Alam' : 'Musik'} <span className="opacity-40 text-xs">▼</span>
                  </button>
                  {showAmbientDD && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 90 }} onClick={() => setShowAmbientDD(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48" style={{ zIndex: 91 }}>
                        <div className="rounded-2xl shadow-xl flex flex-col overflow-hidden p-2" style={{ background: dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)', border: '1px solid var(--border-2)', backdropFilter: 'blur(20px)' }}>
                          {(['hujan', 'api', 'alam'] as const).map(a => (
                            <button key={a} onClick={() => { handlePlayAmbient(a); setShowAmbientDD(false) }} className="text-left px-4 py-3 text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                              style={{ background: ambient === a ? 'rgba(59,130,246,0.1)' : 'transparent', color: ambient === a ? '#3b82f6' : 'var(--text-muted)' }}>
                              {a === 'hujan' ? '🌧️ Hujan Sore' : a === 'api' ? '🔥 Api Unggun' : '🍃 Suara Alam'}
                              {ambient === a && <span className="ml-auto text-xs">✓</span>}
                            </button>
                          ))}
                          {ambient && <>
                            <div className="my-1 mx-3 h-px" style={{ background: 'var(--border-2)' }} />
                            <button onClick={() => { handlePlayAmbient(null); setShowAmbientDD(false) }} className="text-left px-4 py-3 text-xs font-semibold rounded-xl transition-all" style={{ color: '#ef4444' }}>🔇 Matikan Suara</button>
                          </>}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Theme picker */}
                <div className="relative" ref={themeDDRef}>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all hover:scale-105"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                    onClick={() => { setShowThemeDD(v => !v); setShowPersonaDD(false); setShowAmbientDD(false) }}>{currentTheme.icon}</button>
                  {showThemeDD && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 90 }} onClick={() => setShowThemeDD(false)} />
                      <div className="absolute right-0 top-full mt-2 w-40" style={{ zIndex: 91 }}>
                        <div className="rounded-2xl shadow-xl flex flex-col p-2" style={{ background: dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)', border: '1px solid var(--border-2)', backdropFilter: 'blur(20px)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider px-2 pb-1" style={{ color: 'var(--text-faint)' }}>Tema Latar</p>
                          {(Object.keys(BG_THEMES) as BgTheme[]).map(key => (
                            <button key={key} onClick={() => { handleBgThemeChange(key); setShowThemeDD(false) }} className="text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
                              style={{ background: bgTheme === key ? 'rgba(59,130,246,0.1)' : 'transparent', color: bgTheme === key ? '#3b82f6' : 'var(--text-muted)' }}>
                              {BG_THEMES[key].icon} {BG_THEMES[key].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button onClick={() => setZenMode(true)} className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all hover:scale-105" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }} title="Mode Fokus">🧘</button>
                <button onClick={toggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all hover:scale-105" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                  {dark ? '☀️' : '🌙'}
                </button>
              </div>

              {/* Mobile controls */}
              <div className="flex md:hidden items-center gap-1 flex-shrink-0 ml-2">
                {streakCount >= 2 && <StreakBadge count={streakCount} />}

                {/* Zen mode */}
                <button onClick={() => setZenMode(true)} className="w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all active:scale-95"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>🧘</button>

                {/* Musik dropdown (mobile) */}
                <div className="relative">
                  <button onClick={() => { setShowAmbientDD(v => !v); setShowThemeDD(false) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all active:scale-95"
                    style={{ background: ambient ? '#3b82f6' : 'var(--surface-2)', border: `1px solid ${ambient ? 'transparent' : 'var(--border-2)'}` }}>
                    {ambient === 'hujan' ? '🌧️' : ambient === 'api' ? '🔥' : ambient === 'alam' ? '🍃' : '🎵'}
                  </button>
                  {showAmbientDD && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 90 }} onClick={() => setShowAmbientDD(false)} />
                      <div className="absolute right-0 top-full mt-2 w-44" style={{ zIndex: 91 }}>
                        <div className="rounded-2xl shadow-xl flex flex-col overflow-hidden p-2" style={{ background: dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)', border: '1px solid var(--border-2)', backdropFilter: 'blur(20px)' }}>
                          {(['hujan', 'api', 'alam'] as const).map(a => (
                            <button key={a} onClick={() => { handlePlayAmbient(a); setShowAmbientDD(false) }}
                              className="text-left px-4 py-3 text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                              style={{ background: ambient === a ? 'rgba(59,130,246,0.1)' : 'transparent', color: ambient === a ? '#3b82f6' : 'var(--text-muted)' }}>
                              {a === 'hujan' ? '🌧️ Hujan Sore' : a === 'api' ? '🔥 Api Unggun' : '🍃 Suara Alam'}
                              {ambient === a && <span className="ml-auto">✓</span>}
                            </button>
                          ))}
                          {ambient && <>
                            <div className="my-1 mx-3 h-px" style={{ background: 'var(--border-2)' }} />
                            <button onClick={() => { handlePlayAmbient(null); setShowAmbientDD(false) }} className="text-left px-4 py-3 text-xs font-semibold rounded-xl" style={{ color: '#ef4444' }}>🔇 Matikan Suara</button>
                          </>}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Theme dropdown (mobile) */}
                <div className="relative">
                  <button onClick={() => { setShowThemeDD(v => !v); setShowAmbientDD(false) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all active:scale-95"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                    {currentTheme.icon}
                  </button>
                  {showThemeDD && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 90 }} onClick={() => setShowThemeDD(false)} />
                      <div className="absolute right-0 top-full mt-2 w-40" style={{ zIndex: 91 }}>
                        <div className="rounded-2xl shadow-xl flex flex-col p-2" style={{ background: dark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)', border: '1px solid var(--border-2)', backdropFilter: 'blur(20px)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider px-2 pb-1" style={{ color: 'var(--text-faint)' }}>Tema Latar</p>
                          {(Object.keys(BG_THEMES) as BgTheme[]).map(key => (
                            <button key={key} onClick={() => { handleBgThemeChange(key); setShowThemeDD(false) }}
                              className="text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
                              style={{ background: bgTheme === key ? 'rgba(59,130,246,0.1)' : 'transparent', color: bgTheme === key ? '#3b82f6' : 'var(--text-muted)' }}>
                              {BG_THEMES[key].icon} {BG_THEMES[key].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Dark mode */}
                <button onClick={toggleTheme} className="w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all active:scale-95"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                  {dark ? '☀️' : '🌙'}
                </button>
              </div>
            </header>
          )}

          {/* ── Chat body ── */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 sm:py-8 flex flex-col gap-5 sm:gap-6 relative" style={{ zIndex: 10 }}>
            {activeMessages.length === 0 && !pendingText && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5 sm:gap-6 text-center py-8 sm:py-12 anim-fade-in">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-xl"
                  style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.9),rgba(236,72,153,0.9))', boxShadow: '0 20px 50px rgba(59,130,246,0.25)' }}>🤍</div>

                <div className="px-6 py-4 rounded-2xl max-w-[300px] sm:max-w-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
                  <span className="text-2xl block mb-2">{todayAffirmation.emoji}</span>
                  <p className="text-sm leading-relaxed font-medium italic" style={{ color: 'var(--text-muted)' }}>"{todayAffirmation.text}"</p>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text)' }}>Halo {userName || 'Teman'}, aku Kenopia</h2>
                  <p className="max-w-[300px] sm:max-w-lg text-sm sm:text-base leading-relaxed mx-auto" style={{ color: 'var(--text-faint)' }}>
                    Ini ruang amanmu. Ketikkan apa yang sedang kamu rasakan, tanpa penilaian.
                  </p>
                </div>

                <button onClick={handleDrawPromptCard} className="px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                  style={{ background: 'var(--surface)', color: '#3b82f6', border: '2px solid rgba(59,130,246,0.3)', boxShadow: '0 6px 20px rgba(59,130,246,0.15)' }}>
                  🃏 Ambil Kartu Refleksi
                </button>

                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2 max-w-2xl px-2">
                  {Object.values(EMOTIONS).map((e, idx) => (
                    <button key={e.label} onClick={() => { setInput(`Aku merasa ${e.label.toLowerCase()} hari ini karena... `); textareaRef.current?.focus() }}
                      className="px-4 sm:px-5 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all hover:-translate-y-1 active:translate-y-0 shadow-sm hover:shadow-md anim-pop-in"
                      style={{ background: `${e.color}15`, color: e.color, border: `1.5px solid ${e.color}30`, animationDelay: `${idx * 80}ms` }}>
                      {e.emoji} {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMessages.map((msg, idx) => (
              <div key={msg.id}>
                <MessageBubble msg={msg} />
                {idx === activeMessages.length - 1 && !loading && !pendingText && (
                  <QuickReplies emotion={msg.emotion} onSelect={text => { setInput(text); textareaRef.current?.focus() }} />
                )}
              </div>
            ))}

            {pendingText && <PendingUserBubble text={pendingText} />}
            {loading && <TypingIndicator />}

            {error && (
              <div className="anim-fade-in px-6 py-4 rounded-2xl text-sm font-bold shadow-md mx-auto max-w-md w-full text-center"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div className="flex-shrink-0 p-3 sm:p-4 md:p-6 relative" style={{ zIndex: 20 }}>
            <div className="relative z-10 max-w-4xl mx-auto">
              {voiceHint && (
                <div className="max-w-max mx-auto mb-3 px-6 py-2 rounded-full text-xs font-bold text-center anim-fade-in shadow-md flex items-center gap-2"
                  style={{
                    background: isListening ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                    color: isListening ? '#ef4444' : '#3b82f6',
                    border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  }}>
                  <span style={{ animation: 'kPulse 1.5s ease-in-out infinite' }}>{isListening ? '🔴' : '✅'}</span>
                  {voiceHint}
                </div>
              )}

              {input.length > 40 && (
                <div className="flex justify-end mb-1 px-2 anim-fade-in">
                  <span className="text-xs font-bold tabular-nums" style={{ color: input.length > 280 ? '#ef4444' : 'var(--text-faint)' }}>
                    {input.length}<span className="opacity-40">/300</span>
                  </span>
                </div>
              )}

              {/* Input box */}
              <div className="flex items-end gap-2 p-2 rounded-3xl focus-within:ring-2 focus-within:ring-blue-300/30 transition-all"
                style={{ background: dark ? 'rgba(9,5,30,0.65)' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-2)', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
                <div className="flex items-end gap-1 pb-1 pl-1 flex-shrink-0">
                  {voiceSupported && <MicButton isListening={isListening} onClick={toggleVoice} disabled={loading} />}
                  <button onClick={() => { const cycle = [null, 'hujan', 'api', 'alam'] as const; const idx = cycle.indexOf(ambient as any); handlePlayAmbient(cycle[(idx + 1) % cycle.length]) }}
                    className="relative flex-shrink-0 flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ width: 44, height: 44, borderRadius: '50%', background: ambient ? '#3b82f6' : 'var(--surface-2)', color: ambient ? 'white' : 'var(--text-faint)' }}>
                    {ambient && <span className="absolute inset-0 rounded-full" style={{ background: 'rgba(59,130,246,0.3)', animation: 'kPulse 2.5s ease-in-out infinite' }} />}
                    <span className="relative">{ambient === 'hujan' ? '🌧️' : ambient === 'api' ? '🔥' : ambient === 'alam' ? '🍃' : '🎵'}</span>
                  </button>
                </div>

                <textarea ref={textareaRef} className="chat-input flex-1 w-full min-w-0 px-3 sm:px-4 py-3 text-sm sm:text-base leading-relaxed bg-transparent border-none outline-none resize-none transition-all"
                  style={{ minHeight: '44px', maxHeight: '160px', color: 'var(--text)' }}
                  placeholder={isListening ? '🎙️ Merekam...' : 'Ketik pesanmu di sini...'}
                  rows={1} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={loading} />

                <div className="pb-1 pr-1 flex-shrink-0">
                  <button onClick={handleSubmit} disabled={loading || !input.replace(/\s*\[.*?\]$/, '').trim()}
                    className="flex items-center justify-center text-lg text-white transition-all duration-300 disabled:opacity-40 hover:scale-105 active:scale-95"
                    style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}>
                    {loading ? <span style={{ animation: 'kPulse 1.5s ease-in-out infinite' }}>✨</span> : <span style={{ marginLeft: 2 }}>🚀</span>}
                  </button>
                </div>
              </div>

              {ambient && (
                <div className="flex items-center justify-center gap-2 mt-2 anim-fade-in">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <span style={{ animation: 'kPulse 2s ease-in-out infinite' }}>♪</span>
                    <span>{ambient === 'hujan' ? 'Hujan Sore' : ambient === 'api' ? 'Api Unggun' : 'Suara Alam'} diputar</span>
                    <button onClick={() => handlePlayAmbient(null)} className="ml-1 opacity-60 hover:opacity-100 font-bold" style={{ transition: 'opacity 0.2s' }}>✕</button>
                  </div>
                </div>
              )}

              <p className="text-center text-xs font-bold mt-2.5 tracking-widest opacity-50 uppercase flex items-center justify-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
                🔒 Privasi 100% Aman · Kenopia tidak membagikan datamu
              </p>
            </div>
          </div>
        </main>

        {/* ── Hidden export card ── */}
        <div className="fixed pointer-events-none" style={{ top: -9999, left: -9999 }}>
          <div ref={exportRef} className="w-[400px] p-10 rounded-4xl flex flex-col items-center text-center relative overflow-hidden"
            style={{ background: dark ? '#0f172a' : '#ffffff', border: `3px solid ${EMOTIONS[dominantEmotion].color}`, color: dark ? '#f8fafc' : '#0f172a' }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${EMOTIONS[dominantEmotion].color}, transparent 70%)` }} />
            <h2 className="text-3xl font-bold relative mb-1" style={{ color: '#3b82f6' }}>Kenopia Wrapped</h2>
            <p className="text-sm opacity-60 relative mb-8 font-medium">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 relative shadow-lg"
              style={{ background: `${EMOTIONS[dominantEmotion].color}20`, border: `2px solid ${EMOTIONS[dominantEmotion].color}40` }}>
              {EMOTIONS[dominantEmotion].emoji}
            </div>
            <h3 className="text-xl font-semibold relative mb-2">Emosi Dominan: <span style={{ color: EMOTIONS[dominantEmotion].color }}>{EMOTIONS[dominantEmotion].label}</span></h3>
            <div className="w-full rounded-2xl p-5 relative mb-3 mt-6" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-3">Statistik Curhat</p>
              <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-sm font-medium">Total Pesan</span>
                <span className="text-xl font-bold" style={{ color: EMOTIONS[dominantEmotion].color }}>{allMessages.length}x</span>
              </div>
              {streakCount > 0 && (
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-medium">Streak</span>
                  <span className="text-xl font-bold" style={{ color: '#f97316' }}>🔥 {streakCount} hari</span>
                </div>
              )}
            </div>
            <p className="text-xs opacity-50 mt-4 relative font-semibold tracking-wide uppercase">💙 Kenopia AI</p>
          </div>
        </div>
      </div>
    </>
  )
}