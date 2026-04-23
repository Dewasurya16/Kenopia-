'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ChatMessage, EMOTIONS, EmotionKey, AnalyzeResponse } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'
import html2canvas from 'html2canvas'

const EmotionChart = dynamic(() => import('@/components/EmotionChart'), { ssr: false })

const STORAGE_KEY = 'kenopia_history'
const PIN_KEY = 'kenopia_pin'
const GRATITUDE_KEY = 'kenopia_gratitude'

/// ── Web Speech API type declarations ─────────────────────────────────────────
interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean

  start(): void
  stop(): void
  abort(): void

  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
  onstart: () => void
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all hover:scale-110 active:scale-95"
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

function EmotionBadge({ emotion }: { emotion: EmotionKey }) {
  const meta = EMOTIONS[emotion]
  return (
    <div
      className="emotion-tag mx-auto my-1"
      style={{ background: meta.bgLight, color: meta.color, border: `1px solid ${meta.color}40` }}
    >
      {meta.emoji} <span>{meta.label} terdeteksi</span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #2563eb, #38bdf8)' }}
      >
        K
      </div>
      <div className="bubble-ai px-4 py-3 flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  )
}

function PendingUserBubble({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 animate-slide-up">
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="bubble-user px-4 py-3 text-sm leading-relaxed opacity-80">
            {text}
          </div>
          <p className="text-right text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Mengirim...
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const timeStr = new Date(msg.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-2 animate-slide-up">
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="bubble-user px-4 py-3 text-sm leading-relaxed">
            {msg.userMessage}
          </div>
          <p className="text-right text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{timeStr}</p>
        </div>
      </div>
      <EmotionBadge emotion={msg.emotion} />
      <div className="flex items-end gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563eb, #38bdf8)' }}
        >
          K
        </div>
        <div className="max-w-[75%]">
          <div className="bubble-ai px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
            {msg.aiResponse}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{timeStr}</p>
        </div>
      </div>
    </div>
  )
}

function HistoryItem({ msg, active, onClick }: { msg: ChatMessage; active: boolean; onClick: () => void }) {
  const meta = EMOTIONS[msg.emotion]
  const label = new Date(msg.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
      style={{
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: `1px solid ${active ? 'var(--border-2)' : 'transparent'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{meta.emoji}</span>
        <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-faint)' }}>{label}</span>
      </div>
      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{msg.userMessage}</p>
    </button>
  )
}

function EmotionCalendar({ history }: { history: ChatMessage[] }) {
  const groupedData = useMemo(() => {
    const days: Record<string, Record<EmotionKey, number>> = {}
    history.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString('id-ID')
      if (!days[date]) days[date] = { senang: 0, cinta: 0, marah: 0, takut: 0, sedih: 0 }
      days[date][msg.emotion]++
    })
    return Object.entries(days).map(([date, counts]) => {
      let dominant: EmotionKey = 'senang'
      let max = 0
      ;(Object.keys(counts) as EmotionKey[]).forEach(key => {
        if (counts[key] > max) { max = counts[key]; dominant = key }
      })
      return { date, dominant }
    })
  }, [history])

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-2)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
        Jejak Emosimu
      </p>
      <div className="flex flex-wrap gap-1.5">
        {groupedData.length === 0 && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Belum ada data</p>}
        {groupedData.map((day, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-md cursor-help transition-all hover:scale-125 shadow-sm"
            style={{ background: EMOTIONS[day.dominant].color, opacity: 0.8 }}
            title={`${day.date}: Dominan ${EMOTIONS[day.dominant].label}`}
          />
        ))}
      </div>
    </div>
  )
}

function BreathingOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'Tarik Napas...' | 'Buang Napas...'>('Tarik Napas...')

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => p === 'Tarik Napas...' ? 'Buang Napas...' : 'Tarik Napas...')
    }, 4000) 
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
      <h2 className="text-white text-2xl font-semibold mb-12">Mari Tenangkan Pikiran Sejenak</h2>
      <div 
        className="w-56 h-56 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: 'radial-gradient(circle, #7dd3fc, #0ea5e9)',
          transition: 'transform 4s ease-in-out',
          transform: phase === 'Tarik Napas...' ? 'scale(1.4)' : 'scale(0.8)'
        }}
      >
        <span className="text-white font-bold text-xl drop-shadow-md">{phase}</span>
      </div>
      <button 
        onClick={onClose}
        className="mt-24 px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-sm"
      >
        Sudah Merasa Lebih Baik
      </button>
    </div>
  )
}

function BurnBebanOverlay({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'igniting' | 'dissolving' | 'done'>('idle')

  const handleBurn = () => {
    if (!text) return
    setPhase('igniting')
    setTimeout(() => setPhase('dissolving'), 1500)
    setTimeout(() => setPhase('done'), 2500)
    setTimeout(() => onClose(), 5000)
  }

  return (
    <div className={`fixed inset-0 z-[100] backdrop-blur-md flex flex-col items-center justify-center p-6 transition-all duration-1000 ${phase !== 'idle' ? 'bg-red-950/90' : 'bg-black/80'}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes burnShake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-2px, -3px) rotate(-1deg); } 20% { transform: translate(-4px, 0px) rotate(1deg); } 30% { transform: translate(4px, 3px) rotate(0deg); } 40% { transform: translate(2px, -2px) rotate(2deg); } 50% { transform: translate(-2px, 3px) rotate(-1deg); } 60% { transform: translate(-4px, 1px) rotate(0deg); } 70% { transform: translate(4px, 2px) rotate(-2deg); } 80% { transform: translate(-2px, -2px) rotate(1deg); } 90% { transform: translate(2px, 3px) rotate(0deg); } 100% { transform: translate(1px, -3px) rotate(-1deg); } }
        @keyframes ashFly { 0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); filter: blur(0px) brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5); color: #ffeb3b; } 40% { opacity: 0.8; transform: translateY(-40px) scale(1.05) rotate(2deg); filter: blur(4px) brightness(0.8) sepia(0); color: #ea580c; } 100% { opacity: 0; transform: translateY(-150px) scale(1.1) rotate(-2deg); filter: blur(15px) brightness(0.2); color: #111827; letter-spacing: 10px; } }
        .burn-ignite { animation: burnShake 0.3s infinite; box-shadow: 0 0 60px #ef4444, inset 0 0 30px #ef4444 !important; border-color: #fca5a5 !important; color: #fef08a !important; background: rgba(153, 27, 27, 0.4) !important; text-shadow: 0 0 10px #ef4444, 0 0 20px #f97316; }
        .burn-dissolve { animation: ashFly 1.2s forwards cubic-bezier(0.4, 0, 0.2, 1); }
      `}} />

      {phase === 'idle' || phase === 'igniting' || phase === 'dissolving' ? (
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className={`text-6xl mb-4 transition-all duration-500 ${phase === 'igniting' ? 'scale-150 drop-shadow-[0_0_20px_rgba(239,68,68,1)]' : ''}`}>
            {phase === 'igniting' ? '🔥' : '🌬️'}
          </div>
          <h2 className={`text-2xl font-semibold mb-2 text-center transition-all ${phase !== 'idle' ? 'text-red-400 scale-110' : 'text-white'}`}>
            {phase === 'igniting' ? 'Membakar Emosimu...' : 'Ruang Lepas Beban'}
          </h2>
          <p className={`text-sm text-center mb-6 transition-all ${phase !== 'idle' ? 'opacity-0' : 'text-gray-300'}`}>
            Ketikkan semua amarah, kekesalan, atau kesedihan terdalammu di sini.<br/>
            Teks akan <strong>dibakar hingga hangus</strong> dan tidak akan pernah disimpan.
          </p>
          <textarea
            className={`w-full p-5 rounded-2xl border transition-all duration-300 outline-none
              ${phase === 'idle' ? 'bg-white/10 text-white placeholder-gray-400 border-white/20 focus:border-red-500 focus:bg-white/20' : ''}
              ${phase === 'igniting' ? 'burn-ignite' : ''}
              ${phase === 'dissolving' ? 'burn-dissolve' : ''}
            `}
            rows={6}
            placeholder="Keluarkan semua caci maki dan amarahmu di sini. Tidak ada yang akan tahu..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={phase !== 'idle'}
          />
          <div className={`flex gap-4 mt-6 w-full transition-all duration-300 ${phase !== 'idle' ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}>
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl text-gray-300 bg-white/10 hover:bg-white/20 transition-all font-medium">Batal</button>
            <button onClick={handleBurn} disabled={!text} className="flex-1 py-3.5 rounded-xl text-white font-bold transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>🔥 Bakar & Hancurkan!</button>
          </div>
        </div>
      ) : null}

      {phase === 'done' && (
        <div className="flex flex-col items-center justify-center animate-slide-up">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <span className="text-5xl">🍃</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-wide">Sudah Berlalu</h2>
          <p className="text-gray-300 text-center max-w-sm leading-relaxed text-lg">Semua beban dan amarahmu telah lenyap tertiup angin. Tarik napas yang dalam...</p>
        </div>
      )}
    </div>
  )
}

function MicButton({ isListening, onClick, disabled }: { isListening: boolean, onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
      style={{ borderRadius: '14px', background: isListening ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'var(--surface-3)', border: `1.5px solid ${isListening ? '#ef444460' : 'var(--border-2)'}`, color: isListening ? 'white' : 'var(--text-muted)' }}
      aria-label={isListening ? 'Hentikan rekaman' : 'Bicara'}
    >
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-2xl animate-ping" style={{ borderRadius: '14px', background: 'rgba(239,68,68,0.3)', animationDuration: '1s' }} />
          <span className="absolute inset-0 rounded-2xl" style={{ borderRadius: '14px', background: 'rgba(239,68,68,0.15)' }} />
        </>
      )}
      <span className="relative text-lg">{isListening ? '⏹' : '🎤'}</span>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CurhatPage() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingText, setPendingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  
  // Modals state
  const [showStats, setShowStats] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [showBurnOverlay, setShowBurnOverlay] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showGratitude, setShowGratitude] = useState(false)
  const [showInsight, setShowInsight] = useState(false)

  // Extra Features State
  const [savedPin, setSavedPin] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [gratitudes, setGratitudes] = useState<{id:string, text:string, date:string}[]>([])
  const [newGratitude, setNewGratitude] = useState('')
  const [insightData, setInsightData] = useState<string | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // Feature 7: Ambient Sound State
  const [ambient, setAmbient] = useState<'hujan' | 'api' | 'alam' | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // AI Personas State
  const [persona, setPersona] = useState<'sahabat' | 'psikolog' | 'filsuf'>('sahabat')

  // Voice state
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const exportRef = useRef<HTMLDivElement>(null) 

  const dominantEmotion = useMemo(() => {
    if (!history.length) return 'sedih'
    const counts: Record<EmotionKey, number> = { senang: 0, cinta: 0, marah: 0, takut: 0, sedih: 0 }
    history.forEach(m => counts[m.emotion]++)
    return (Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0]) as EmotionKey
  }, [history])

  useEffect(() => {
    const saved = localStorage.getItem('kenopia-theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: ChatMessage[] = JSON.parse(stored)
        setHistory(parsed)
        if (parsed.length > 0) setActiveId(parsed[parsed.length - 1].id)
      }
      
      const pin = localStorage.getItem(PIN_KEY)
      if (pin) { setSavedPin(pin); setIsLocked(true); }
      
      const grat = localStorage.getItem(GRATITUDE_KEY)
      if (grat) setGratitudes(JSON.parse(grat))
    } catch { /* ignore */ }

   const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SpeechRecognition)

    setMounted(true)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, loading, pendingText])
  useEffect(() => { return () => { recognitionRef.current?.abort() } }, [])

 // 🎵 FUNGSI AUDIO LOKAL (SUPER CEPAT & ANTI ERROR)
  const handlePlayAmbient = (type: 'hujan' | 'api' | 'alam' | null) => {
    setAmbient(type)
    if (type === null) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    } else {
      // Memanggil file mp3 dari folder public/audio/
      const urls = {
        hujan: '/audio/hujan.mp3',
        api: '/audio/api.mp3',
        alam: '/audio/alam.mp3'
      }
      if (!audioRef.current) {
        audioRef.current = new Audio(urls[type])
      } else {
        audioRef.current.pause()
        audioRef.current.src = urls[type]
      }
      audioRef.current.loop = true
      audioRef.current.play().catch(() => {})
    }
  }


  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('kenopia-theme', next ? 'dark' : 'light')
  }

  const saveHistory = useCallback((msgs: ChatMessage[]) => {
    setHistory(msgs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs))
  }, [])

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat curhat?')) {
      saveHistory([])
      setActiveId(null)
    }
  }

  const handleExport = async () => {
    if (!exportRef.current) return
    try {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: dark ? '#0f172a' : '#f8fafc', scale: 2 })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `Kenopia-Wrapped-${new Date().toISOString().slice(0,10)}.png`
      link.click()
    } catch (err) { alert('Gagal mengekspor jurnal.') }
  }

  const addGratitude = () => {
    if(!newGratitude) return
    const updated = [{id: uuidv4(), text: newGratitude, date: new Date().toISOString()}, ...gratitudes]
    setGratitudes(updated)
    localStorage.setItem(GRATITUDE_KEY, JSON.stringify(updated))
    setNewGratitude('')
  }

  const fetchInsight = async () => {
    if(history.length === 0) return
    setLoadingInsight(true)
    try {
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history.slice(-10) }) 
      })
      const data = await res.json()
      setInsightData(data.insight)
    } catch(e) { setInsightData("Gagal menarik analisis AI.") }
    setLoadingInsight(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const toggleVoice = () => {
  if (isListening) { 
    recognitionRef.current?.stop(); 
    setIsListening(false); 
    setVoiceHint(null); 
    return; 
  }

  // Gunakan type assertion (as any) untuk mengakses window secara dinamis
  const SpeechRecognition = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'; recognition.interimResults = true; recognition.maxAlternatives = 1; recognition.continuous = false
    recognitionRef.current = recognition
    recognition.onstart = () => { setIsListening(true); setVoiceHint('🎙️ Sedang mendengarkan...'); setError(null) }
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''; let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) { final += event.results[i][0].transcript } 
        else { interim += event.results[i][0].transcript }
      }
      if (interim) { setInput(prev => { const base = prev.replace(/\[.*?\]$/, '').trimEnd(); return base ? `${base} [${interim}]` : `[${interim}]` }) }
      if (final) {
        setInput(prev => { const clean = prev.replace(/\s*\[.*?\]$/, '').trim(); return clean ? `${clean} ${final}` : final })
        setVoiceHint('✅ Suara berhasil direkam!')
        setTimeout(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px' } }, 0)
      }
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false); setVoiceHint(null)
      if (event.error === 'not-allowed') { setError('Izin mikrofon ditolak. Aktifkan akses mikrofon di browser.') } 
      else if (event.error === 'no-speech') { setVoiceHint('Tidak ada suara terdeteksi. Coba lagi.'); setTimeout(() => setVoiceHint(null), 3000) }
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

    const recentContext = history.slice(-4).map(h => ({ user: h.userMessage, ai: h.aiResponse }))

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: recentContext, persona: persona }),
      })

      const rawText = await res.text()
      let data: AnalyzeResponse
      try { data = JSON.parse(rawText) } catch { throw new Error('Respons server tidak valid. Coba lagi.') }
      if (!res.ok) { throw new Error((data as { error?: string }).error || 'Terjadi kesalahan.') }

      const newMsg: ChatMessage = { id: uuidv4(), userMessage: text, emotion: data.emotion, aiResponse: data.aiResponse, timestamp: data.timestamp }
      const updated = [...history, newMsg]
      saveHistory(updated)
      setActiveId(newMsg.id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi ya.') } 
    finally { setPendingText(null); setLoading(false) }
  }

  if (!mounted) return null

  // ── LOCK SCREEN UI ──
  if (isLocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 60%)' }} />
        <div className="z-10 bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-700 w-80">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-6">Kenopia Terkunci</h2>
          <div className="flex gap-2 mb-6">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full ${pinInput.length > i ? 'bg-blue-500' : 'bg-gray-600'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => {
                const newPin = pinInput + n
                setPinInput(newPin)
                if(newPin.length === 4) {
                  if(newPin === savedPin) { setIsLocked(false); setPinInput('') }
                  else { setTimeout(() => setPinInput(''), 300); alert('PIN Salah') }
                }
              }} className="h-14 rounded-xl bg-gray-700 hover:bg-gray-600 text-xl font-bold transition-all active:scale-95">{n}</button>
            ))}
            <div />
            <button onClick={() => {
              const newPin = pinInput + '0'
              setPinInput(newPin)
              if(newPin.length === 4) {
                if(newPin === savedPin) { setIsLocked(false); setPinInput('') }
                else { setTimeout(() => setPinInput(''), 300); alert('PIN Salah') }
              }
            }} className="h-14 rounded-xl bg-gray-700 hover:bg-gray-600 text-xl font-bold transition-all active:scale-95">0</button>
            <button onClick={() => setPinInput(pinInput.slice(0,-1))} className="h-14 rounded-xl bg-red-900/40 text-red-400 hover:bg-red-800/60 font-bold">⌫</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>
      {/* ── MODALS & OVERLAYS ── */}
      {showBreathing && <BreathingOverlay onClose={() => setShowBreathing(false)} />}
      {showBurnOverlay && <BurnBebanOverlay onClose={() => setShowBurnOverlay(false)} />}
      
      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
            <button onClick={()=>setShowSOS(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 animate-pulse">🆘</div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Bantuan Darurat</h2>
              <p className="text-sm text-gray-500 mt-2">Kamu tidak sendirian. Jangan ragu untuk meminta bantuan profesional.</p>
            </div>
            <div className="flex flex-col gap-3">
              <a href="tel:119" className="p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 flex justify-between items-center transition-all">
                <div><p className="font-bold text-blue-900">Layanan Sejiwa</p><p className="text-xs text-blue-700">Kemenkes RI</p></div>
                <span className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">119 ext 8</span>
              </a>
              <a href="https://www.intothelightid.org/tentang-bunuh-diri/hotline-dan-konseling/" target="_blank" className="p-4 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 flex justify-between items-center transition-all">
                <div><p className="font-bold text-orange-900">Into The Light</p><p className="text-xs text-orange-700">Pencegahan Bunuh Diri</p></div>
                <span className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">Website ➔</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl text-center relative">
            <button onClick={()=>setShowPinSetup(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h2 className="text-xl font-bold mb-4 dark:text-white">{savedPin ? 'Ubah/Hapus PIN' : 'Buat PIN Baru'}</h2>
            <input type="password" maxLength={4} placeholder="Masukkan 4 Digit" className="w-full text-center text-2xl tracking-widest p-3 bg-gray-100 dark:bg-gray-900 rounded-xl mb-4 outline-none border focus:border-blue-500"
              value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            />
            <div className="flex gap-2">
              <button onClick={() => {
                if(pinInput.length !== 4) return alert("Harus 4 digit angka!")
                localStorage.setItem(PIN_KEY, pinInput); setSavedPin(pinInput); setPinInput(''); setShowPinSetup(false); alert("PIN Berhasil Disimpan!")
              }} className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl font-bold">Simpan</button>
              {savedPin && <button onClick={() => {
                localStorage.removeItem(PIN_KEY); setSavedPin(null); setPinInput(''); setShowPinSetup(false); alert("PIN Dihapus!")
              }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold">Hapus</button>}
            </div>
          </div>
        </div>
      )}

      {/* Gratitude Modal */}
      {showGratitude && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#fdfbf7] dark:bg-gray-800 p-6 rounded-3xl max-w-md w-full shadow-2xl relative flex flex-col max-h-[80vh]">
            <button onClick={()=>setShowGratitude(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h2 className="text-2xl font-display font-bold text-yellow-600 dark:text-yellow-400 mb-2">✨ Toples Syukur</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ingat satu hal baik yang terjadi hari ini?</p>
            
            <div className="flex gap-2 mb-6">
              <input value={newGratitude} onChange={e=>setNewGratitude(e.target.value)} placeholder="Aku bersyukur karena..." onKeyDown={e => e.key === 'Enter' && addGratitude()} className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-xl outline-none" />
              <button onClick={addGratitude} className="bg-yellow-500 text-white px-4 rounded-xl font-bold hover:bg-yellow-600 transition-all">+</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {gratitudes.length === 0 ? <p className="text-center text-gray-400 text-sm mt-10">Toplesmu masih kosong.</p> : 
               gratitudes.map(g => (
                 <div key={g.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl">
                   <p className="text-gray-800 dark:text-gray-200 text-sm">"{g.text}"</p>
                   <p className="text-xs text-yellow-600/70 mt-2">{new Date(g.date).toLocaleDateString('id-ID')}</p>
                 </div>
               ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Insight Modal */}
      {showInsight && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative">
            <button onClick={()=>setShowInsight(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h2 className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">🧠 AI Insight</h2>
            <p className="text-sm text-gray-500 mb-6">Analisis psikologis dari curhatan terakhirmu.</p>
            
            <div className="bg-blue-50 dark:bg-gray-900 p-5 rounded-2xl border border-blue-100 dark:border-gray-700 min-h-[150px] flex items-center justify-center text-center">
              {loadingInsight ? <div className="animate-pulse flex gap-2 text-blue-500"><span className="typing-dot bg-blue-500"></span><span className="typing-dot bg-blue-500"></span><span className="typing-dot bg-blue-500"></span></div> : 
               insightData ? <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap text-left w-full">{insightData}</p> :
               <button onClick={fetchInsight} className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all">Mulai Analisis</button>
              }
            </div>
          </div>
        </div>
      )}
      
      {/* Audio Player Tersembunyi */}
      <audio ref={audioRef} loop />

      {/* Hidden Poster untuk Export (Kenopia Wrapped) */}
      <div className="fixed top-[-9999px] left-[-9999px]">
        <div 
          ref={exportRef}
          className="w-[400px] p-10 rounded-[32px] flex flex-col items-center text-center relative overflow-hidden"
          style={{
            background: dark ? '#0f172a' : '#ffffff',
            border: `3px solid ${EMOTIONS[dominantEmotion].color}`,
            color: dark ? '#f8fafc' : '#0f172a'
          }}
        >
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ background: `radial-gradient(circle at 50% 30%, ${EMOTIONS[dominantEmotion].color}, transparent 70%)` }}
          />
          <h2 className="text-3xl font-display font-bold relative z-10 mb-1" style={{ color: 'var(--accent)' }}>
            Kenopia Wrapped
          </h2>
          <p className="text-sm opacity-60 relative z-10 mb-8 font-medium">
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 relative z-10 shadow-lg"
            style={{ background: EMOTIONS[dominantEmotion].bgLight }}
          >
            {EMOTIONS[dominantEmotion].emoji}
          </div>
          <h3 className="text-xl font-semibold relative z-10 mb-2">
            Emosi Dominan: <span style={{ color: EMOTIONS[dominantEmotion].color }}>{EMOTIONS[dominantEmotion].label}</span>
          </h3>
          <p className="text-sm relative z-10 mb-8 px-4 opacity-80 leading-relaxed">
            "{EMOTIONS[dominantEmotion].description}"
          </p>
          <div className="w-full rounded-2xl p-5 relative z-10" style={{ background: 'var(--surface-2)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-3">Statistik Curhat</p>
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium">Total Sesi</span>
              <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{history.length}x</span>
            </div>
          </div>
          <p className="text-xs opacity-50 mt-8 relative z-10 font-semibold tracking-wide uppercase">💙 Kenopia AI</p>
        </div>
      </div>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb w-[500px] h-[500px] -top-40 -left-40 opacity-20"
          style={{ background: 'radial-gradient(circle, #93c5fd, transparent 70%)', animation: 'orbFloat 10s ease-in-out infinite' }} />
        <div className="orb w-[400px] h-[400px] -bottom-32 -right-32 opacity-15"
          style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)', animation: 'orbFloat 13s ease-in-out infinite reverse' }} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 lg:z-auto w-72 h-full flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">💙</span>
            <span className="font-display text-lg font-semibold" style={{ color: 'var(--accent)' }}>Kenopia</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div className="p-3">
          <button
            onClick={() => { setActiveId(null); setInput(''); setError(null); setPendingText(null) }}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all btn-primary flex items-center justify-center gap-2"
            style={{ borderRadius: '10px' }}
          >
            ✏️ <span>Curhat Baru</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          
          {/* Fitur Extra di Sidebar */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setShowBurnOverlay(true)} className="py-2.5 rounded-xl text-xs font-semibold border-dashed border transition-all hover:bg-red-50 dark:hover:bg-red-900/20" style={{ borderColor: '#ef4444', color: '#ef4444' }}>🔥 Lepas Beban</button>
            <button onClick={() => setShowGratitude(true)} className="py-2.5 rounded-xl text-xs font-semibold border-dashed border transition-all hover:bg-yellow-50 dark:hover:bg-yellow-900/20" style={{ borderColor: '#eab308', color: '#eab308' }}>✨ Toples Syukur</button>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full mb-2 py-2 px-3 rounded-xl text-sm flex items-center justify-between transition-all"
            style={{ background: showStats ? 'var(--accent-soft)' : 'transparent', color: showStats ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <span>📊 Analisis Emosi</span>
            <span>{showStats ? '▲' : '▼'}</span>
          </button>

          {showStats && (
            <div className="mb-3 p-3 rounded-xl animate-slide-up" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <EmotionChart history={history} />
              <EmotionCalendar history={history} />
              <div className="mt-4 flex flex-col gap-2">
                <button onClick={() => {setShowInsight(true); fetchInsight()}} className="w-full py-2 text-xs font-semibold rounded-lg flex justify-center items-center gap-1 transition-all bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300">🧠 AI Insight Mingguan</button>
                {history.length > 0 && <button onClick={handleExport} className="w-full py-2 text-xs font-semibold rounded-lg flex justify-center items-center gap-1 transition-all" style={{ background: 'var(--accent)', color: 'white' }}>📸 Cetak Kenopia Wrapped</button>}
              </div>
            </div>
          )}

          <div className="py-2">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
              Riwayat Curhat ({history.length})
            </p>
            {history.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-faint)' }}>
                Belum ada curhat.<br />Mulai berbagi ceritamu!
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {[...history].reverse().map(msg => (
                  <HistoryItem key={msg.id} msg={msg} active={activeId === msg.id}
                    onClick={() => { setActiveId(msg.id); setSidebarOpen(false) }} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 flex justify-between gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setShowPinSetup(true)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all" style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>🔒 {savedPin ? 'Ubah PIN' : 'Set PIN'}</button>
          {history.length > 0 && <button onClick={clearHistory} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all" style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>🗑️ Hapus</button>}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <header className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                {activeId ? `${EMOTIONS[history.find(m => m.id === activeId)?.emotion ?? 'sedih'].emoji} Percakapan` : '💬 Kenopia AI'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>IndoBERT × Groq AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">

            {/* Persona Dropdown */}
            <div className="relative group hidden sm:block">
              <button className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                🎭 {persona === 'sahabat' ? 'Sahabat' : persona === 'psikolog' ? 'Psikolog' : 'Filsuf'}
              </button>
              <div className="absolute right-0 top-full pt-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                  <button onClick={() => setPersona('sahabat')} className="text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">👋 Sahabat</button>
                  <button onClick={() => setPersona('psikolog')} className="text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">🩺 Psikolog</button>
                  <button onClick={() => setPersona('filsuf')} className="text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">🧘 Filsuf Zen</button>
                </div>
              </div>
            </div>

            {/* SOS Button */}
            <button onClick={() => setShowSOS(true)} className="px-2.5 py-1.5 rounded-full text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-all hidden sm:block">🆘 Darurat</button>

            {/* Tombol Ambient Sound Dropdown */}
            <div className="relative group">
              <button 
                className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all"
                style={{ background: ambient ? 'var(--accent)' : 'var(--surface-2)', color: ambient ? 'white' : 'var(--text-muted)' }}
                title="Suara Latar Penenang"
              >
                🎵 {ambient === 'hujan' ? 'Hujan' : ambient === 'api' ? 'Api' : ambient === 'alam' ? 'Alam' : 'Musik'}
              </button>
              
              <div className="absolute right-0 top-full pt-2 w-36 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                  <button onClick={() => handlePlayAmbient('hujan')} className="text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">🌧️ Hujan Sore</button>
                  <button onClick={() => handlePlayAmbient('api')} className="text-left px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors">🔥 Api Unggun</button>
                  <button onClick={() => handlePlayAmbient('alam')} className="text-left px-4 py-2.5 text-sm hover:bg-green-50 dark:hover:bg-slate-700 transition-colors">🍃 Suara Alam</button>
                  <div className="h-px bg-gray-100 dark:bg-slate-700 w-full" />
                  <button onClick={() => handlePlayAmbient(null)} className="text-left px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-slate-700 text-red-500 transition-colors">🔇 Matikan</button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowBreathing(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all hover:scale-105 hidden sm:flex"
              style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.3)' }}
              title="Latihan Pernapasan"
            >
              🫁 Tenang
            </button>
            <ThemeToggle dark={dark} toggle={toggleTheme} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
          {history.length === 0 && !pendingText && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-12 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2563eb, #38bdf8)' }}>
                💙
              </div>
              <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text)' }}>
                Halo! Aku Kenopia
              </h2>
              <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Ceritakan apa yang sedang kamu rasakan lewat <strong>teks</strong> atau <strong>suara</strong>.
                Aku akan mendengarkan dengan sepenuh hati.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {Object.values(EMOTIONS).map(e => (
                  <button key={e.label}
                    onClick={() => { setInput(`Aku merasa ${e.label.toLowerCase()} karena... `); textareaRef.current?.focus() }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
                    style={{ background: e.bgLight, color: e.color, border: `1px solid ${e.color}40` }}>
                    {e.emoji} {e.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {pendingText && <PendingUserBubble text={pendingText} />}
          {loading && <TypingIndicator />}

          {error && (
            <div className="animate-fade-in px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {voiceHint && (
            <div
              className="max-w-3xl mx-auto mb-2 px-4 py-2 rounded-xl text-sm text-center animate-fade-in"
              style={{
                background: isListening ? 'rgba(239,68,68,0.08)' : 'var(--accent-soft)',
                color: isListening ? '#ef4444' : 'var(--accent)',
                border: `1px solid ${isListening ? '#ef444430' : 'var(--border-2)'}`,
              }}
            >
              {voiceHint}
            </div>
          )}

          <div className="max-w-3xl mx-auto flex items-end gap-2">
            {voiceSupported && (
              <MicButton isListening={isListening} onClick={toggleVoice} disabled={loading} />
            )}

            <textarea
              ref={textareaRef}
              className="chat-input flex-1 px-4 py-3 rounded-2xl text-sm"
              placeholder={
                isListening
                  ? '🎙️ Sedang mendengarkan suaramu...'
                  : voiceSupported
                  ? `Ketik atau tekan 🎤 untuk bicara dengan ${persona}...`
                  : `Ceritakan apa yang kamu rasakan pada ${persona}...`
              }
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                minHeight: '48px',
                maxHeight: '160px',
                borderColor: isListening ? '#ef4444' : undefined,
                boxShadow: isListening ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined,
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !input.replace(/\s*\[.*?\]$/, '').trim()}
              className="btn-primary w-12 h-12 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ borderRadius: '14px' }}
              aria-label="Kirim"
            >
              {loading ? <span style={{ animation: 'typing 1.2s ease-in-out infinite' }}>⏳</span> : '→'}
            </button>
          </div>

          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
            Kenopia menjaga privasimu — tidak ada manusia yang membaca curhatan ini
          </p>
        </div>
      </main>
    </div>
  )
}