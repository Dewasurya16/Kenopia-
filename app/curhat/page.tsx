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

// ── Quick Replies per Emotion (FITUR BARU) ───────────────────────────────────
const QUICK_REPLIES: Record<EmotionKey, string[]> = {
  senang: ['Ceritakan lebih lanjut! 😄', 'Apa yang paling membuatku bahagia?', 'Bagaimana cara menjaga mood ini?'],
  cinta: ['Siapa yang membuatku merasa spesial?', 'Bagaimana cara mengungkapkan perasaan ini?', 'Aku ingin cerita lebih banyak 💕'],
  marah: ['Apa yang paling membuatku kesal?', 'Bagaimana cara terbaik menghadapinya?', 'Aku butuh cara melepas amarah ini'],
  takut: ['Apa yang paling aku takutkan?', 'Bagaimana cara menghadapi ketakutan ini?', 'Bantu aku berpikir lebih jernih'],
  sedih: ['Aku butuh semangat hari ini 🤍', 'Bantu aku menemukan hal positif', 'Aku ingin cerita lebih banyak'],
}

// ── Type Definitions ──────────────────────────────────────────────────────────

interface ChatSession {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

interface SpeechRecognition extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void; onstart: () => void;
}
interface SpeechRecognitionEvent extends Event { resultIndex: number; results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }

// ── Sub-components ────────────────────────────────────────────────────────────

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
      style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-2)' }}
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
      className="mx-auto my-3 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm animate-slide-up"
      style={{ background: meta.bgLight, color: meta.color, border: `1.5px dashed ${meta.color}50` }}
    >
      <span className="text-base drop-shadow-sm">{meta.emoji}</span>
      <span className="tracking-wide uppercase">{meta.label} terdeteksi</span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-slide-up mb-6">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] flex-shrink-0 font-bold text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #ec4899)' }}
      >K</div>
      <div className="bubble-ai-cute px-6 py-4 flex items-center gap-2 h-14">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

function PendingUserBubble({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 animate-slide-up mb-6">
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bubble-user-cute px-6 py-4 text-[15px] leading-relaxed opacity-70">{text}</div>
          <p className="text-right text-xs mt-2 font-medium flex items-center justify-end gap-1" style={{ color: 'var(--text-faint)' }}>
            <span className="animate-pulse">⏳</span> Mengirim...
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const timeStr = new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex flex-col gap-3 animate-slide-up mb-4 group">
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bubble-user-cute px-6 py-4 text-[15px] leading-relaxed shadow-md">{msg.userMessage}</div>
          <p className="text-right text-[11px] mt-2 font-semibold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-faint)' }}>{timeStr}</p>
        </div>
      </div>
      <EmotionBadge emotion={msg.emotion} />
      <div className="flex items-end gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] flex-shrink-0 font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #ec4899)' }}
        >K</div>
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bubble-ai-cute px-6 py-4 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-colors">
            {msg.aiResponse}
          </div>
          <p className="text-[11px] mt-2 ml-2 font-semibold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-faint)' }}>{timeStr}</p>
        </div>
      </div>
    </div>
  )
}

// BUG FIX: Added onDelete prop + delete button hover reveal
function HistoryItem({
  session, active, onClick, onDelete
}: {
  session: ChatSession; active: boolean; onClick: () => void; onDelete?: (e: React.MouseEvent) => void
}) {
  const lastMsg = session.messages[session.messages.length - 1]
  const meta = lastMsg ? EMOTIONS[lastMsg.emotion] : EMOTIONS['sedih']
  const label = new Date(session.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  return (
    <div className="relative group/hist">
      <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3.5 rounded-[20px] transition-all duration-300 ${active ? 'shadow-md scale-[1.02]' : 'hover:bg-black/5 dark:hover:bg-white/5 hover:scale-[1.01]'}`}
        style={{ background: active ? 'var(--surface-2)' : 'transparent', border: `1px solid ${active ? 'var(--border-2)' : 'transparent'}` }}
      >
        <div className="flex items-center gap-2.5 mb-2 pr-7">
          <span className="text-xl drop-shadow-sm">{meta.emoji}</span>
          <span className="text-[13px] font-bold tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
          <span className="text-[11px] font-semibold ml-auto" style={{ color: 'var(--text-faint)' }}>{label}</span>
        </div>
        <p className="text-[13px] truncate leading-relaxed font-medium pr-7" style={{ color: 'var(--text-muted)' }}>"{session.title}"</p>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1/2 -translate-y-1/2 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200 opacity-0 group-hover/hist:opacity-100 hover:scale-110 active:scale-95"
          style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
          aria-label="Hapus sesi ini"
          title="Hapus sesi ini"
        >✕</button>
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
      ;(Object.keys(counts) as EmotionKey[]).forEach(key => { if (counts[key] > max) { max = counts[key]; dominant = key } })
      return { date, dominant }
    })
  }, [messages])
  return (
    <div className="mt-6 pt-6" style={{ borderTop: '1px dashed var(--border-2)' }}>
      <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-faint)' }}>Jejak Emosimu</p>
      <div className="flex flex-wrap gap-2.5">
        {groupedData.length === 0 && <p className="text-[13px] italic" style={{ color: 'var(--text-faint)' }}>Belum ada data perjalanan.</p>}
        {groupedData.map((day, i) => (
          <div key={i} className="w-7 h-7 rounded-[10px] cursor-help transition-all duration-300 hover:scale-125 hover:rotate-6 shadow-sm hover:shadow-md"
            style={{ background: EMOTIONS[day.dominant].color, opacity: 0.9 }}
            title={`${day.date}: Dominan ${EMOTIONS[day.dominant].label}`} />
        ))}
      </div>
    </div>
  )
}

function BreathingOverlay({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'Tarik Napas...' | 'Tahan...' | 'Buang Napas...'>('Tarik Napas...')
  const [count, setCount] = useState(4)

  useEffect(() => {
    const phases: Array<{ label: 'Tarik Napas...' | 'Tahan...' | 'Buang Napas...'; duration: number }> = [
      { label: 'Tarik Napas...', duration: 4000 },
      { label: 'Tahan...', duration: 2000 },
      { label: 'Buang Napas...', duration: 4000 },
    ]
    let idx = 0
    let countdown = phases[0].duration / 1000
    setPhase(phases[0].label)
    setCount(countdown)

    const ticker = setInterval(() => {
      countdown--
      setCount(countdown)
      if (countdown <= 0) {
        idx = (idx + 1) % phases.length
        countdown = phases[idx].duration / 1000
        setPhase(phases[idx].label)
        setCount(countdown)
      }
    }, 1000)
    return () => clearInterval(ticker)
  }, [])

  const isInhale = phase === 'Tarik Napas...'
  const isHold = phase === 'Tahan...'

  return (
    <div className="fixed inset-0 z-[100] bg-[#030305]/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
      <h2 className="text-white text-3xl md:text-4xl font-display font-bold mb-4 tracking-wide text-center px-4">Tenangkan Pikiran Sejenak</h2>
      <p className="text-white/50 text-sm mb-16 tracking-wider font-medium">Teknik 4-2-4 · Ikuti irama lingkaran</p>
      <div
        className="relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center"
        style={{
          background: isHold ? 'radial-gradient(circle, #818cf8, #6366f1)' : 'radial-gradient(circle, #7dd3fc, #0ea5e9)',
          transition: 'transform 4s ease-in-out, box-shadow 4s ease-in-out, background 0.5s ease',
          transform: isInhale ? 'scale(1.3)' : isHold ? 'scale(1.3)' : 'scale(0.8)',
          boxShadow: isInhale || isHold ? '0 0 120px rgba(14,165,233,0.6)' : '0 0 40px rgba(14,165,233,0.2)',
        }}
      >
        <div className="text-center">
          <span className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg tracking-widest block">{phase}</span>
          <span className="text-white/80 text-5xl font-bold mt-2 block tabular-nums">{count}</span>
        </div>
      </div>
      <button onClick={onClose} className="mt-20 px-10 py-4 bg-white/10 hover:bg-white/25 text-white font-bold rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 hover:scale-105 active:scale-95 shadow-lg">Sudah Merasa Lebih Baik ✓</button>
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
    <div className={`fixed inset-0 z-[100] backdrop-blur-xl flex flex-col items-center justify-center p-6 transition-all duration-1000 ${phase !== 'idle' ? 'bg-red-950/95' : 'bg-black/80'}`}>
      <style dangerouslySetInnerHTML={{__html: `@keyframes burnShake{0%{transform:translate(1px,1px) rotate(0deg)}10%{transform:translate(-2px,-3px) rotate(-1deg)}20%{transform:translate(-4px,0px) rotate(1deg)}30%{transform:translate(4px,3px) rotate(0deg)}40%{transform:translate(2px,-2px) rotate(2deg)}50%{transform:translate(-2px,3px) rotate(-1deg)}60%{transform:translate(-4px,1px) rotate(0deg)}70%{transform:translate(4px,2px) rotate(-2deg)}80%{transform:translate(-2px,-2px) rotate(1deg)}90%{transform:translate(2px,3px) rotate(0deg)}100%{transform:translate(1px,-3px) rotate(-1deg)}}@keyframes ashFly{0%{opacity:1;transform:translateY(0) scale(1) rotate(0deg);filter:blur(0px) brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5);color:#ffeb3b}40%{opacity:.8;transform:translateY(-40px) scale(1.05) rotate(2deg);filter:blur(4px) brightness(.8) sepia(0);color:#ea580c}100%{opacity:0;transform:translateY(-150px) scale(1.1) rotate(-2deg);filter:blur(15px) brightness(.2);color:#111827;letter-spacing:10px}}.burn-ignite{animation:burnShake .3s infinite;box-shadow:0 0 80px #ef4444,inset 0 0 40px #ef4444!important;border-color:#fca5a5!important;color:#fef08a!important;background:rgba(153,27,27,.5)!important;text-shadow:0 0 15px #ef4444,0 0 25px #f97316}.burn-dissolve{animation:ashFly 1.2s forwards cubic-bezier(.4,0,.2,1)}`}} />
      {phase !== 'done' ? (
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className={`text-6xl md:text-7xl mb-6 transition-all duration-500 ${phase === 'igniting' ? 'scale-[2] drop-shadow-[0_0_30px_rgba(239,68,68,1)]' : ''}`}>{phase === 'igniting' ? '🔥' : '🌬️'}</div>
          <h2 className={`text-3xl md:text-4xl font-display font-bold mb-3 text-center transition-all ${phase !== 'idle' ? 'text-red-400 scale-110' : 'text-white'}`}>{phase === 'igniting' ? 'Membakar Emosimu...' : 'Ruang Lepas Beban'}</h2>
          <p className={`text-[15px] md:text-[16px] text-center mb-10 transition-all leading-relaxed ${phase !== 'idle' ? 'opacity-0' : 'text-gray-300'}`}>Ketikkan semua amarah, kekesalan, atau kesedihan terdalammu di sini.<br />Teks akan <strong>dibakar hingga hangus</strong> dan tidak akan pernah disimpan.</p>
          <textarea className={`w-full p-6 md:p-8 rounded-[32px] border-2 transition-all duration-300 outline-none text-[16px] leading-relaxed resize-none shadow-2xl ${phase === 'idle' ? 'bg-white/10 text-white placeholder-gray-400 border-white/20 focus:border-red-500/50 focus:bg-white/20' : ''} ${phase === 'igniting' ? 'burn-ignite' : ''} ${phase === 'dissolving' ? 'burn-dissolve' : ''}`}
            rows={7} placeholder="Keluarkan semua caci maki dan amarahmu di sini. Tidak ada yang akan tahu..." value={text} onChange={e => setText(e.target.value)} disabled={phase !== 'idle'} />
          <div className={`flex gap-4 mt-8 w-full transition-all duration-300 ${phase !== 'idle' ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}>
            <button onClick={onClose} className="flex-1 py-4 md:py-5 rounded-2xl text-gray-300 bg-white/10 hover:bg-white/20 transition-all font-bold text-[15px] border border-white/10 hover:scale-[1.02] active:scale-95">Batal</button>
            <button onClick={handleBurn} disabled={!text} className="flex-1 py-4 md:py-5 rounded-2xl text-white font-bold text-[15px] transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 shadow-[0_10px_40px_rgba(239,68,68,0.4)] border border-red-400/50" style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>🔥 Bakar &amp; Hancurkan!</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center animate-slide-up">
          <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(34,197,94,0.4)] border border-green-500/40"><span className="text-7xl">🍃</span></div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-wide">Sudah Berlalu</h2>
          <p className="text-gray-300 text-center max-w-md leading-relaxed text-lg md:text-xl">Semua beban dan amarahmu telah lenyap tertiup angin. Tarik napas yang dalam...</p>
        </div>
      )}
    </div>
  )
}

function MicButton({ isListening, onClick, disabled }: { isListening: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      style={{ background: isListening ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'var(--surface-2)', border: `1px solid ${isListening ? '#ef444460' : 'var(--border-2)'}`, color: isListening ? 'white' : 'var(--text-muted)' }}
      aria-label={isListening ? 'Hentikan rekaman' : 'Bicara'}
    >
      {isListening && (<><span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(239,68,68,0.5)', animationDuration: '1.5s' }} /><span className="absolute inset-0 rounded-full" style={{ background: 'rgba(239,68,68,0.2)' }} /></>)}
      <span className="relative text-2xl drop-shadow-sm">{isListening ? '⏹' : '🎤'}</span>
    </button>
  )
}

// ── Mood Check-in ─────────────────────────────────────────────────────────────

function MoodCheckinModal({ onSelect, onSkip }: { onSelect: (v: number) => void; onSkip: () => void }) {
  const moods = [
    { v: 5, e: '😄', l: 'Luar Biasa', c: '#22c55e' },
    { v: 4, e: '🙂', l: 'Baik', c: '#84cc16' },
    { v: 3, e: '😐', l: 'Biasa', c: '#f59e0b' },
    { v: 2, e: '😔', l: 'Kurang', c: '#f97316' },
    { v: 1, e: '😢', l: 'Berat', c: '#ef4444' },
  ]
  return (
    <div className="fixed inset-0 z-[85] bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm animate-slide-up"
        style={{ background: 'var(--surface)', borderRadius: '36px', border: '1px solid var(--border-2)', boxShadow: '0 40px 100px rgba(0,0,0,0.3)', padding: '32px' }}>
        <div className="text-center mb-7">
          <div className="text-5xl mb-4 inline-block animate-bounce">☀️</div>
          <h2 className="text-[22px] font-display font-bold mb-1.5" style={{ color: 'var(--text)' }}>Selamat Datang Kembali!</h2>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-faint)' }}>Bagaimana perasaanmu hari ini?</p>
        </div>
        <div className="flex gap-2 mb-7">
          {moods.map(m => (
            <button key={m.v} onClick={() => onSelect(m.v)}
              className="flex-1 flex flex-col items-center gap-2 py-4 rounded-[20px] transition-all duration-200 hover:scale-110 active:scale-95 border-2"
              style={{ background: `${m.c}15`, borderColor: `${m.c}40`, color: m.c }}
            >
              <span className="text-[28px] leading-none">{m.e}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">{m.l}</span>
            </button>
          ))}
        </div>
        <button onClick={onSkip}
          className="w-full py-3 text-[13px] font-semibold rounded-2xl transition-all hover:opacity-80"
          style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}>
          Lewati untuk sekarang
        </button>
      </div>
    </div>
  )
}

// ── Confetti Rain (BUG FIX: keyframe now defined inline) ──────────────────────

function ConfettiRain() {
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.8,
    duration: 2.2 + Math.random() * 1.5,
    color: ['#3b82f6','#ec4899','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4'][i % 7],
    size: 6 + Math.random() * 8,
    isCircle: Math.random() > 0.5,
  })), [])
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}.confetti-fall{animation:confettiFall var(--dur,3s) var(--delay,0s) ease-in forwards}` }} />
      <div className="fixed inset-0 pointer-events-none z-[340] overflow-hidden">
        {pieces.map(p => (
          <div key={p.id}
            className="absolute confetti-fall"
            style={{
              left: `${p.left}%`, top: '-16px',
              width: p.size, height: p.size * (p.isCircle ? 1 : 0.5),
              background: p.color,
              borderRadius: p.isCircle ? '50%' : '2px',
              '--delay': `${p.delay}s`,
              '--dur': `${p.duration}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  )
}

// ── FITUR BARU: Rename Modal (proper overlay, bukan fullscreen) ────────────────

function RenameModal({ initialName, onSave, onClose }: { initialName: string; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(initialName)
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[36px] max-w-sm w-full shadow-2xl relative border border-gray-100 dark:border-gray-700 animate-slide-up">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:scale-110 transition-all">✕</button>
        <div className="text-4xl mb-4 text-center">✏️</div>
        <h2 className="text-2xl font-display font-bold text-center mb-6 dark:text-white">Ganti Nama Panggilanmu</h2>
        <input
          type="text" maxLength={20} placeholder="Nama Panggilanmu..."
          autoFocus
          className="w-full text-center text-xl font-bold p-4 bg-gray-50 dark:bg-gray-900 rounded-[20px] mb-6 outline-none border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all dark:text-white placeholder-gray-400"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
        />
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          disabled={!name.trim()}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-[16px] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
        >
          Simpan Nama ✨
        </button>
      </div>
    </div>
  )
}

// ── FITUR BARU: Streak Badge ──────────────────────────────────────────────────

function StreakBadge({ count }: { count: number }) {
  if (count < 1) return null
  const isHot = count >= 7
  const isMid = count >= 3
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm transition-all"
      style={{
        background: isHot ? 'linear-gradient(135deg,#f97316,#ef4444)' : isMid ? 'rgba(249,115,22,0.12)' : 'var(--surface-2)',
        color: isHot ? 'white' : isMid ? '#f97316' : 'var(--text-muted)',
        border: isHot ? 'none' : `1px solid ${isMid ? '#f9731640' : 'var(--border-2)'}`,
      }}
      title={`${count} hari berturut-turut`}
    >
      🔥 {count} hari
    </div>
  )
}

// ── FITUR BARU: Quick Replies ─────────────────────────────────────────────────

function QuickReplies({ emotion, onSelect }: { emotion: EmotionKey; onSelect: (text: string) => void }) {
  const replies = QUICK_REPLIES[emotion] || []
  return (
    <div className="flex flex-wrap justify-center gap-2 my-3 animate-fade-in px-4">
      {replies.map(reply => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border-2)' }}
        >
          {reply}
        </button>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CurhatPage() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [userName, setUserName] = useState<string>('')
  const [showNameModal, setShowNameModal] = useState<boolean>(false)
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false) // FIX: Separate modal for rename
  const [tempName, setTempName] = useState<string>('')

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingText, setPendingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showStats, setShowStats] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [showBurnOverlay, setShowBurnOverlay] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showGratitude, setShowGratitude] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // BUG FIX: Added showMoodCheckin state
  const [showMoodCheckin, setShowMoodCheckin] = useState(false)
  const [dailyMoodValue, setDailyMoodValue] = useState<number | null>(null)

  // FITUR BARU: Streak
  const [streakCount, setStreakCount] = useState(0)

  // FITUR BARU: Confetti
  const [showConfetti, setShowConfetti] = useState(false)

  // FITUR BARU: Session search
  const [searchQuery, setSearchQuery] = useState('')

  const [savedPin, setSavedPin] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  // BUG FIX: Replace alert() with inline PIN error state
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

  const activeMessages = useMemo(() => sessions.find(s => s.id === activeSessionId)?.messages || [], [sessions, activeSessionId])
  const allMessages = useMemo(() => sessions.flatMap(s => s.messages), [sessions])

  // FITUR BARU: filtered sessions for search
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.messages.some(m => m.userMessage.toLowerCase().includes(q))
    )
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

  // FITUR BARU: Streak computation
  const computeStreak = useCallback((s: ChatSession[]) => {
    if (!s.length) return 0
    const uniqueDays = [...new Set(s.flatMap(sess => sess.messages.map(m => new Date(m.timestamp).toDateString())))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    let streak = 0
    const check = new Date()
    check.setHours(0, 0, 0, 0)
    for (const day of uniqueDays) {
      const d = new Date(day)
      d.setHours(0, 0, 0, 0)
      if (d.getTime() === check.getTime()) {
        streak++
        check.setDate(check.getDate() - 1)
      } else break
    }
    return streak
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('kenopia-theme')
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    try {
      const savedName = localStorage.getItem(NAME_KEY)
      if (savedName) { setUserName(savedName) } else { setShowNameModal(true) }

      const storedSessions = localStorage.getItem(SESSION_STORAGE_KEY)
      let parsed: ChatSession[] = []
      if (storedSessions) {
        parsed = JSON.parse(storedSessions)
        setSessions(parsed)
        if (parsed.length > 0) setActiveSessionId(parsed[parsed.length - 1].id)
        setStreakCount(computeStreak(parsed))
      }

      const pin = localStorage.getItem(PIN_KEY)
      if (pin) { setSavedPin(pin); setIsLocked(true) }

      const grat = localStorage.getItem(GRATITUDE_KEY)
      if (grat) setGratitudes(JSON.parse(grat))

      // BUG FIX: Daily mood check-in logic
      if (savedName) {
        const today = new Date().toDateString()
        const savedMood = localStorage.getItem(MOOD_KEY)
        const parsedMood = savedMood ? JSON.parse(savedMood) : null
        if (!parsedMood || parsedMood.date !== today) {
          setTimeout(() => setShowMoodCheckin(true), 1200)
        } else {
          setDailyMoodValue(parsedMood.value)
        }
      }
    } catch { /* ignore */ }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SpeechRecognition)
    setMounted(true)
  }, [computeStreak])

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeMessages, loading, pendingText])
  useEffect(() => { return () => { recognitionRef.current?.abort() } }, [])

  const handleSaveName = () => {
    if (!tempName.trim()) return
    localStorage.setItem(NAME_KEY, tempName.trim())
    setUserName(tempName.trim())
    setShowNameModal(false)
    // Show mood checkin after onboarding
    setTimeout(() => setShowMoodCheckin(true), 1000)
  }

  // BUG FIX: Mood select handler
  const handleMoodSelect = (v: number) => {
    const today = new Date().toDateString()
    localStorage.setItem(MOOD_KEY, JSON.stringify({ date: today, value: v }))
    setDailyMoodValue(v)
    setShowMoodCheckin(false)
    if (v >= 4) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500) }
  }

  const handleMoodSkip = () => {
    const today = new Date().toDateString()
    localStorage.setItem(MOOD_KEY, JSON.stringify({ date: today, value: null }))
    setShowMoodCheckin(false)
  }

  const handlePlayAmbient = (type: 'hujan' | 'api' | 'alam' | null) => {
    setAmbient(type)
    if (type === null) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    } else {
      const urls = { hujan: '/audio/hujan.mp3', api: '/audio/api.mp3', alam: '/audio/alam.mp3' }
      if (!audioRef.current) { audioRef.current = new Audio(urls[type]) } else { audioRef.current.pause(); audioRef.current.src = urls[type] }
      audioRef.current.loop = true; audioRef.current.volume = 0.5
      audioRef.current.play().catch(() => {})
    }
  }

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('kenopia-theme', next ? 'dark' : 'light')
  }

  const saveSessions = useCallback((newSessions: ChatSession[]) => {
    setSessions(newSessions)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSessions))
  }, [])

  const clearHistory = () => {
    if (confirm('Yakin ingin menghapus semua riwayat curhat?')) { saveSessions([]); setActiveSessionId(null); setStreakCount(0) }
  }

  // FITUR BARU: Delete single session
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Hapus sesi ini?')) return
    const updated = sessions.filter(s => s.id !== id)
    saveSessions(updated)
    setStreakCount(computeStreak(updated))
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[updated.length - 1].id : null)
    }
  }

  const handleExport = async () => {
    if (!exportRef.current) return
    try {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: dark ? '#0f172a' : '#f8fafc', scale: 2 })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `Kenopia-Wrapped-${new Date().toISOString().slice(0, 10)}.png`
      link.click()
    } catch { setError('Gagal mengekspor jurnal.') }
  }

  const addGratitude = () => {
    if (!newGratitude) return
    const updated = [{ id: uuidv4(), text: newGratitude, date: new Date().toISOString() }, ...gratitudes]
    setGratitudes(updated)
    localStorage.setItem(GRATITUDE_KEY, JSON.stringify(updated))
    setNewGratitude('')
  }

  const fetchInsight = async () => {
    if (allMessages.length === 0) return
    setLoadingInsight(true)
    try {
      const res = await fetch('/api/insight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history: allMessages.slice(-10) }) })
      const data = await res.json()
      setInsightData(data.insight)
    } catch { setInsightData('Gagal menarik analisis AI.') }
    setLoadingInsight(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 300) return // Enforce char limit
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); setVoiceHint(null); return }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'; recognition.interimResults = true; recognition.maxAlternatives = 1; recognition.continuous = false
    recognitionRef.current = recognition
    recognition.onstart = () => { setIsListening(true); setVoiceHint('🎙️ Mendengarkan suara...'); setError(null) }
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''; let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) { final += event.results[i][0].transcript } else { interim += event.results[i][0].transcript }
      }
      if (interim) { setInput(prev => { const base = prev.replace(/\[.*?\]$/, '').trimEnd(); return base ? `${base} [${interim}]` : `[${interim}]` }) }
      if (final) {
        setInput(prev => { const clean = prev.replace(/\s*\[.*?\]$/, '').trim(); return clean ? `${clean} ${final}` : final })
        setVoiceHint('✅ Suara direkam!')
        setTimeout(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px' } }, 0)
      }
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false); setVoiceHint(null)
      if (event.error === 'not-allowed') { setError('Izin mikrofon ditolak. Aktifkan akses mikrofon di browser.') }
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
      if (!res.ok) { throw new Error((data as { error?: string }).error || 'Terjadi kesalahan.') }
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
      saveSessions(updatedSessions)
      setStreakCount(computeStreak(updatedSessions)) // FITUR BARU: Update streak
    } catch (e) { setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi ya.') }
    finally { setPendingText(null); setLoading(false) }
  }

  // BUG FIX: Inline PIN check, no alert()
  const handlePinDigit = (digit: string) => {
    const newPin = pinInput + digit
    setPinInput(newPin)
    if (newPin.length === 4) {
      if (newPin === savedPin) {
        setIsLocked(false); setPinInput(''); setPinError('')
      } else {
        setPinError('PIN salah, coba lagi')
        setTimeout(() => { setPinInput(''); setPinError('') }, 1200)
      }
    }
  }

  if (!mounted) return null

  // ── ONBOARDING NAMA ────────────────────────────────────────────────────────
  if (showNameModal && !isLocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030305]/95 text-white flex-col relative overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(59,130,246,0.2) 0%, transparent 60%)' }} />
        <div className="z-10 p-10 md:p-12 rounded-[40px] flex flex-col items-center w-[90%] max-w-[420px] relative animate-fade-in"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
          <div className="text-6xl mb-6 animate-bounce drop-shadow-[0_10px_20px_rgba(255,255,255,0.2)]">👋</div>
          <h2 className="text-3xl font-display font-bold mb-3 tracking-wide">Kenalan Dulu Yuk!</h2>
          <p className="text-[15px] text-gray-300 text-center mb-10 leading-relaxed">Agar Kenopia bisa mengenal dan memanggilmu dengan lebih akrab selayaknya teman.</p>
          <input type="text" maxLength={20} placeholder="Nama Panggilanmu..."
            autoFocus
            className="w-full text-center text-2xl font-bold p-5 bg-white/5 rounded-[24px] mb-8 outline-none border border-white/10 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all text-white placeholder-gray-500 shadow-inner"
            value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveName()} />
          <button onClick={handleSaveName} disabled={!tempName.trim()} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:scale-100 text-white py-4 md:py-5 rounded-2xl font-bold text-[16px] transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(59,130,246,0.3)]">Mulai Curhat ✨</button>
        </div>
      </div>
    )
  }

  // ── LOCK SCREEN ───────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#030305] text-white flex-col relative overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(59,130,246,0.25) 0%, transparent 60%)' }} />
        <div className="z-10 p-10 md:p-12 rounded-[40px] flex flex-col items-center w-[90%] max-w-[400px] relative animate-fade-in"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-[0_10px_30px_rgba(59,130,246,0.3)] border border-white/10" style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(236,72,153,0.2))' }}>🔒</div>
          <h2 className="text-3xl font-display font-bold mb-8 tracking-wide">Area Pribadi</h2>
          <div className="flex gap-4 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-5 h-5 rounded-full transition-all duration-300 ${pinError ? 'bg-red-400 animate-pulse' : pinInput.length > i ? 'bg-blue-400 scale-125 shadow-[0_0_20px_rgba(96,165,250,0.8)]' : 'bg-white/15'}`} />
            ))}
          </div>
          {/* BUG FIX: Inline error instead of alert */}
          <div className={`text-[13px] font-bold text-red-400 mb-6 transition-all duration-300 ${pinError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            {pinError || '—'}
          </div>
          <div className="grid grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} onClick={() => handlePinDigit(String(n))} disabled={pinInput.length >= 4}
                className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 text-2xl font-bold transition-all hover:scale-105 active:scale-95 border border-white/5 hover:border-white/30 shadow-sm disabled:opacity-40">{n}
              </button>
            ))}
            <div />
            <button onClick={() => handlePinDigit('0')} disabled={pinInput.length >= 4}
              className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 text-2xl font-bold transition-all hover:scale-105 active:scale-95 border border-white/5 hover:border-white/30 shadow-sm disabled:opacity-40">0</button>
            <button onClick={() => setPinInput(p => p.slice(0, -1))} className="h-16 rounded-2xl text-2xl bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-all hover:scale-105 active:scale-95 border border-red-500/20 hover:border-red-500/50 shadow-sm">⌫</button>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.25); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(156,163,175,0.5); }
        .bubble-ai-cute { background: var(--surface-2); border-radius: 24px 24px 24px 8px; color: var(--text); }
        .bubble-user-cute { background: linear-gradient(135deg,#3b82f6,#0ea5e9); color: white; border-radius: 24px 24px 8px 24px; }
        .chat-input::-webkit-scrollbar { display: none; }
        .chat-input { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes mobileMenuIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .mobile-menu-enter { animation: mobileMenuIn 0.18s ease-out forwards; }
        @keyframes sheetSlideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        .sheet-enter { animation: sheetSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
        @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .backdrop-enter { animation: backdropFadeIn 0.2s ease-out forwards; }
        @keyframes pinShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .pin-shake { animation: pinShake 0.4s ease-out; }
        @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
        .confetti-fall { animation: confettiFall var(--dur, 3s) var(--delay, 0s) ease-in forwards; }
      `}</style>

      <div className="flex h-screen overflow-hidden relative font-sans" style={{ background: 'var(--bg)' }}>
        {showBreathing && <BreathingOverlay onClose={() => setShowBreathing(false)} />}
        {showBurnOverlay && <BurnBebanOverlay onClose={() => setShowBurnOverlay(false)} />}
        {/* BUG FIX: Daily mood check-in now renders */}
        {showMoodCheckin && <MoodCheckinModal onSelect={handleMoodSelect} onSkip={handleMoodSkip} />}
        {/* FITUR BARU: Confetti */}
        {showConfetti && <ConfettiRain />}
        {/* FITUR BARU: Rename modal */}
        {showRenameModal && (
          <RenameModal
            initialName={userName}
            onSave={(name) => { localStorage.setItem(NAME_KEY, name); setUserName(name); setShowRenameModal(false) }}
            onClose={() => setShowRenameModal(false)}
          />
        )}

        {/* ── MODAL SOS ── */}
        {showSOS && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[36px] max-w-sm w-full shadow-2xl relative border border-gray-100 dark:border-gray-700 animate-slide-up">
              <button onClick={() => setShowSOS(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:scale-110 transition-all bg-gray-100 dark:bg-gray-700 w-9 h-9 rounded-full flex items-center justify-center">✕</button>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.3)]">🆘</div>
                <h2 className="text-2xl font-display font-bold text-gray-800 dark:text-white">Bantuan Darurat</h2>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Kamu berharga, {userName}. Jangan ragu untuk meminta bantuan tenaga ahli profesional.</p>
              </div>
              <div className="flex flex-col gap-4">
                <a href="tel:119" className="p-5 rounded-[20px] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 hover:scale-[1.03] active:scale-95 flex justify-between items-center transition-all shadow-sm hover:shadow-md">
                  <div><p className="font-bold text-blue-900 dark:text-blue-300 text-lg">Layanan Sejiwa</p><p className="text-sm text-blue-700 dark:text-blue-400">Kemenkes RI</p></div>
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">119 ext 8</span>
                </a>
                <a href="https://www.intothelightid.org/tentang-bunuh-diri/hotline-dan-konseling/" target="_blank" rel="noreferrer" className="p-5 rounded-[20px] bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 hover:scale-[1.03] active:scale-95 flex justify-between items-center transition-all shadow-sm hover:shadow-md">
                  <div><p className="font-bold text-orange-900 dark:text-orange-300 text-lg">Into The Light</p><p className="text-sm text-orange-700 dark:text-orange-400">Konseling</p></div>
                  <span className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">Website ➔</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL PIN SETUP (BUG FIX: no alert, inline feedback) ── */}
        {showPinSetup && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[36px] max-w-sm w-full shadow-2xl text-center relative border border-gray-100 dark:border-gray-700 animate-slide-up">
              <button onClick={() => { setShowPinSetup(false); setPinSetupInput(''); setPinSetupMsg('') }} className="absolute top-6 right-6 text-gray-400 w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:scale-110 transition-all">✕</button>
              <div className="text-5xl mb-5">🔐</div>
              <h2 className="text-2xl font-display font-bold mb-2 dark:text-white">{savedPin ? 'Ubah/Hapus PIN' : 'Buat Keamanan PIN'}</h2>
              <p className="text-[13px] text-gray-400 mb-6">PIN 4 digit untuk mengunci privasimu</p>
              <input
                type="password" inputMode="numeric" maxLength={4} placeholder="•  •  •  •"
                className="w-full text-center text-2xl font-bold tracking-[0.5em] p-5 bg-gray-50 dark:bg-gray-900 rounded-[20px] mb-3 outline-none border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all dark:text-white"
                value={pinSetupInput} onChange={e => { setPinSetupInput(e.target.value.replace(/\D/g, '')); setPinSetupMsg('') }}
              />
              {pinSetupMsg && (
                <p className={`text-[13px] font-bold mb-4 ${pinSetupMsg.includes('Berhasil') ? 'text-green-500' : 'text-red-500'}`}>
                  {pinSetupMsg}
                </p>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    if (pinSetupInput.length !== 4) { setPinSetupMsg('Harus persis 4 digit!'); return }
                    localStorage.setItem(PIN_KEY, pinSetupInput); setSavedPin(pinSetupInput); setPinSetupMsg('✓ PIN Berhasil Disimpan!')
                    setTimeout(() => { setPinSetupInput(''); setPinSetupMsg(''); setShowPinSetup(false) }, 1200)
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold text-[15px] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
                >Simpan</button>
                {savedPin && (
                  <button
                    onClick={() => {
                      localStorage.removeItem(PIN_KEY); setSavedPin(null); setPinSetupMsg('PIN Dihapus!')
                      setTimeout(() => { setPinSetupInput(''); setPinSetupMsg(''); setShowPinSetup(false) }, 1000)
                    }}
                    className="flex-1 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 py-4 rounded-2xl font-bold text-[15px] transition-all hover:scale-105 active:scale-95 border border-red-200 dark:border-red-800"
                  >Hapus PIN</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL TOPLES SYUKUR ── */}
        {showGratitude && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#fdfbf7] dark:bg-gray-800 p-8 rounded-[36px] max-w-lg w-full shadow-2xl relative flex flex-col max-h-[85vh] border border-yellow-100 dark:border-gray-700 animate-slide-up">
              <button onClick={() => setShowGratitude(false)} className="absolute top-6 right-6 text-gray-400 w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:scale-110 transition-all">✕</button>
              <h2 className="text-3xl font-display font-bold text-yellow-600 dark:text-yellow-400 mb-2">✨ Toples Syukur</h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-6">Satu hal kecil yang membuatmu tersenyum hari ini?</p>
              <div className="flex gap-3 mb-8">
                <input value={newGratitude} onChange={e => setNewGratitude(e.target.value)} placeholder="Aku sangat bersyukur karena..." onKeyDown={e => e.key === 'Enter' && addGratitude()}
                  className="flex-1 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 p-4 rounded-[20px] outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all text-[15px] dark:text-white" />
                <button onClick={addGratitude} className="bg-yellow-500 text-white px-7 rounded-[20px] font-bold text-2xl hover:bg-yellow-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/30">+</button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 rounded-xl">
                {gratitudes.length === 0
                  ? <p className="text-center text-gray-400 text-[15px] mt-12 italic">Toplesmu masih kosong. Mulai isi dengan kebahagiaan pertamamu.</p>
                  : gratitudes.map(g => (
                    <div key={g.id} className="p-5 bg-white dark:bg-gray-900 border border-yellow-100 dark:border-gray-700 rounded-[20px] shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-gray-800 dark:text-gray-200 text-[15px] leading-relaxed">"{g.text}"</p>
                      <p className="text-[11px] font-bold text-yellow-600/70 mt-3 uppercase tracking-wider">{new Date(g.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL AI INSIGHT ── */}
        {showInsight && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[36px] max-w-lg w-full shadow-2xl relative border border-gray-100 dark:border-gray-700 animate-slide-up">
              <button onClick={() => setShowInsight(false)} className="absolute top-6 right-6 text-gray-400 w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:scale-110 transition-all">✕</button>
              <h2 className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-3">
                <span className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-2xl text-2xl">🧠</span> AI Insight
              </h2>
              <p className="text-[15px] text-gray-500 mb-8">Analisis mendalam dari semua riwayat curhatanmu.</p>
              <div className="bg-blue-50/60 dark:bg-gray-900/60 p-6 md:p-8 rounded-[24px] border border-blue-100 dark:border-gray-700 min-h-[220px] flex items-center justify-center text-center shadow-inner">
                {loadingInsight
                  ? <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2 text-blue-500">
                      <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-[15px] font-semibold text-blue-600/70 tracking-wide">Menganalisis pola emosimu...</p>
                  </div>
                  : insightData
                    ? <p className="text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap text-left w-full">{insightData}</p>
                    : <button onClick={fetchInsight} className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-[15px] hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30">✨ Mulai Analisis AI</button>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── MOBILE BOTTOM SHEET ── */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 z-[190] md:hidden backdrop-enter"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowMobileMenu(false)}
            />
            <div
              className="fixed bottom-0 left-0 right-0 z-[195] rounded-t-[32px] px-5 pt-4 pb-10 sheet-enter md:hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 -24px 80px rgba(0,0,0,0.2)' }}
            >
              <div className="w-10 h-1.5 rounded-full mx-auto mb-6" style={{ background: 'var(--border-2)' }} />

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => { setShowBreathing(true); setShowMobileMenu(false) }}
                  className="py-4 rounded-2xl text-[14px] font-bold flex flex-col items-center gap-2 transition-all active:scale-95 hover:scale-[1.02] shadow-sm"
                  style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)' }}
                >
                  <span className="text-2xl">🫁</span>
                  <span>Latihan Napas</span>
                </button>
                <button
                  onClick={() => { setShowBurnOverlay(true); setShowMobileMenu(false) }}
                  className="py-4 rounded-2xl text-[14px] font-bold flex flex-col items-center gap-2 transition-all active:scale-95 hover:scale-[1.02] shadow-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <span className="text-2xl">🔥</span>
                  <span>Lepas Beban</span>
                </button>
                <button
                  onClick={() => { setShowSOS(true); setShowMobileMenu(false) }}
                  className="py-4 rounded-2xl text-[14px] font-bold flex flex-col items-center gap-2 transition-all active:scale-95 hover:scale-[1.02] shadow-sm"
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  <span className="text-2xl">🆘</span>
                  <span>Bantuan Darurat</span>
                </button>
                <button
                  onClick={() => { setShowGratitude(true); setShowMobileMenu(false) }}
                  className="py-4 rounded-2xl text-[14px] font-bold flex flex-col items-center gap-2 transition-all active:scale-95 hover:scale-[1.02] shadow-sm"
                  style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px dashed rgba(234,179,8,0.4)' }}
                >
                  <span className="text-2xl">✨</span>
                  <span>Toples Syukur</span>
                </button>
              </div>

              {/* Persona */}
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>Persona Kenopia</p>
              <div className="flex gap-2 mb-6">
                {(['sahabat', 'psikolog', 'filsuf'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => { setPersona(p); setShowMobileMenu(false) }}
                    className="flex-1 py-3.5 rounded-2xl text-[12px] font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95"
                    style={{
                      background: persona === p ? 'var(--accent)' : 'var(--surface-2)',
                      color: persona === p ? 'white' : 'var(--text-muted)',
                      border: `1px solid ${persona === p ? 'transparent' : 'var(--border-2)'}`,
                      boxShadow: persona === p ? '0 6px 20px rgba(59,130,246,0.35)' : 'none',
                    }}
                  >
                    <span className="text-xl">{p === 'sahabat' ? '👋' : p === 'psikolog' ? '🩺' : '🧘'}</span>
                    <span>{p === 'sahabat' ? 'Sahabat' : p === 'psikolog' ? 'Psikolog' : 'Filsuf Zen'}</span>
                    {persona === p && <span className="text-[10px] opacity-70">✓ Aktif</span>}
                  </button>
                ))}
              </div>

              {/* Ambient Sounds */}
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>Suara Latar</p>
              <div className="flex gap-2">
                {(['hujan', 'api', 'alam'] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => { handlePlayAmbient(ambient === a ? null : a); setShowMobileMenu(false) }}
                    className="flex-1 py-3.5 rounded-2xl text-[12px] font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95"
                    style={{
                      background: ambient === a ? 'var(--accent)' : 'var(--surface-2)',
                      color: ambient === a ? 'white' : 'var(--text-muted)',
                      border: `1px solid ${ambient === a ? 'transparent' : 'var(--border-2)'}`,
                      boxShadow: ambient === a ? '0 6px 20px rgba(59,130,246,0.35)' : 'none',
                    }}
                  >
                    <span className="text-xl">{a === 'hujan' ? '🌧️' : a === 'api' ? '🔥' : '🍃'}</span>
                    <span>{a === 'hujan' ? 'Hujan' : a === 'api' ? 'Api' : 'Alam'}</span>
                    {ambient === a && <span className="text-[10px] opacity-70">▶ On</span>}
                  </button>
                ))}
              </div>
              {ambient && (
                <button
                  onClick={() => { handlePlayAmbient(null); setShowMobileMenu(false) }}
                  className="w-full mt-3 py-3 rounded-2xl text-[13px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                  style={{ color: '#ef4444', border: '1px solid #ef444430', background: '#ef444408' }}
                >
                  🔇 Matikan Suara Latar
                </button>
              )}
            </div>
          </>
        )}

        {/* Ambient orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="orb w-[500px] h-[500px] -top-40 -left-40 opacity-20" style={{ background: 'radial-gradient(circle,#93c5fd,transparent 70%)', animation: 'orbFloat 10s ease-in-out infinite' }} />
          <div className="orb w-[400px] h-[400px] -bottom-32 -right-32 opacity-15" style={{ background: 'radial-gradient(circle,#7dd3fc,transparent 70%)', animation: 'orbFloat 13s ease-in-out infinite reverse' }} />
        </div>

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />}

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside
          className={`fixed lg:relative z-40 lg:z-auto w-[300px] h-full flex flex-col transition-transform duration-500 ease-out shadow-2xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        >
          <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[15px] shadow-md font-bold" style={{ background: 'linear-gradient(135deg,#3b82f6,#ec4899)' }}>K</div>
              <span className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>Kenopia</span>
            </Link>
            <button className="lg:hidden w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 hover:scale-110 transition-all" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <div className="p-5">
            {/* FITUR BARU: Streak + Daily mood in sidebar */}
            {(streakCount > 0 || dailyMoodValue !== null) && (
              <div className="flex items-center gap-2 mb-4">
                {streakCount > 0 && <StreakBadge count={streakCount} />}
                {dailyMoodValue !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border-2)' }}>
                    {dailyMoodValue >= 4 ? '😄' : dailyMoodValue >= 3 ? '🙂' : dailyMoodValue >= 2 ? '😐' : '😔'} Mood hari ini
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { setActiveSessionId(null); setInput(''); setError(null); setPendingText(null); setSidebarOpen(false) }}
              className="w-full py-4 rounded-2xl text-[15px] font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              ✏️ Curhat Baru
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => { setShowBurnOverlay(true); setSidebarOpen(false) }} className="py-3.5 rounded-2xl text-[13px] font-bold border-dashed border-2 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 flex flex-col items-center gap-1.5 hover:scale-105 shadow-sm" style={{ borderColor: '#ef444450', color: '#ef4444' }}>
                <span className="text-2xl">🔥</span>Lepas Beban
              </button>
              <button onClick={() => { setShowGratitude(true); setSidebarOpen(false) }} className="py-3.5 rounded-2xl text-[13px] font-bold border-dashed border-2 transition-all hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex flex-col items-center gap-1.5 hover:scale-105 shadow-sm" style={{ borderColor: '#eab30850', color: '#eab308' }}>
                <span className="text-2xl">✨</span>Toples Syukur
              </button>
            </div>

            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full mb-3 py-3.5 px-5 rounded-2xl text-[14px] font-bold flex items-center justify-between transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-900 shadow-sm"
              style={{ background: showStats ? 'var(--accent-soft)' : 'var(--surface-2)', color: showStats ? 'var(--accent)' : 'var(--text)' }}
            >
              <div className="flex items-center gap-2"><span>📊</span> Analisis Emosi</div>
              <span className={`text-xs opacity-60 transition-transform duration-300 ${showStats ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </button>

            {showStats && (
              <div className="mb-6 p-5 rounded-2xl animate-slide-up shadow-inner border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
                <EmotionChart history={allMessages} />
                <EmotionCalendar messages={allMessages} />
                <div className="mt-6 flex flex-col gap-3">
                  <button onClick={() => { setShowInsight(true); fetchInsight() }} className="w-full py-3 text-[13px] font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-sm" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>🧠 AI Insight Keseluruhan</button>
                  {allMessages.length > 0 && <button onClick={handleExport} className="w-full py-3 text-[13px] font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_15px_rgba(59,130,246,0.3)]" style={{ background: 'var(--accent)', color: 'white' }}>📸 Kenopia Wrapped</button>}
                </div>
              </div>
            )}

            <div className="py-2">
              <div className="flex justify-between items-center mb-4 px-2">
                <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                  Riwayat ({sessions.length})
                </p>
              </div>

              {/* FITUR BARU: Search sessions */}
              {sessions.length >= 3 && (
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="🔍 Cari sesi..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                    style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border-2)' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  )}
                </div>
              )}

              {sessions.length === 0
                ? <div className="py-8 px-4 text-center bg-gray-50 dark:bg-gray-800/40 rounded-[20px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-[14px] leading-relaxed font-medium" style={{ color: 'var(--text-faint)' }}>Riwayat masih kosong.<br />Mulai sapa Kenopia yuk!</p>
                </div>
                : filteredSessions.length === 0
                  ? <p className="text-center text-[13px] py-6 italic" style={{ color: 'var(--text-faint)' }}>Tidak ada hasil untuk "{searchQuery}"</p>
                  : <div className="flex flex-col gap-2">
                    {[...filteredSessions].reverse().map(session => (
                      <HistoryItem
                        key={session.id}
                        session={session}
                        active={activeSessionId === session.id}
                        onClick={() => { setActiveSessionId(session.id); setSidebarOpen(false) }}
                        onDelete={(e) => deleteSession(session.id, e)}
                      />
                    ))}
                  </div>
              }
            </div>
          </div>

          <div className="p-5 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex gap-3">
              <button onClick={() => setShowPinSetup(true)} className="flex-1 py-3 rounded-xl text-[13px] font-bold transition-all border border-transparent hover:border-gray-300 dark:hover:border-gray-600 flex items-center justify-center gap-2 hover:scale-105" style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                🔒 {savedPin ? 'Ubah PIN' : 'Set PIN'}
              </button>
              {/* BUG FIX: Ganti Nama now opens RenameModal instead of fullscreen */}
              <button onClick={() => setShowRenameModal(true)} className="flex-1 py-3 rounded-xl text-[13px] font-bold transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 flex items-center justify-center gap-2 hover:scale-105" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                👤 Ganti Nama
              </button>
            </div>
            {sessions.length > 0 && (
              <button onClick={clearHistory} className="w-full py-3 rounded-xl text-[13px] font-bold transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 flex items-center justify-center gap-2 hover:scale-105" style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                🗑️ Hapus Semua Riwayat
              </button>
            )}
          </div>
        </aside>

        {/* ── AREA CHAT UTAMA ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 bg-transparent">

          {/* ── HEADER (RESPONSIVE) ── */}
          <header
            className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0 relative"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', minHeight: '64px', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}
          >
            <div className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.3) 40%, rgba(236,72,153,0.2) 60%, transparent 100%)' }} />

            {/* Kiri */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 hover:scale-105 active:scale-95 text-lg"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-muted)' }}
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka sidebar"
              >☰</button>

              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[14px] font-bold text-white shadow-lg ring-2 ring-white/20"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#ec4899)' }}
              >K</div>

              <div className="min-w-0">
                <p className="font-bold text-[15px] md:text-[16px] leading-tight truncate" style={{ color: 'var(--text)' }}>
                  {loading
                    ? <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
                        Kenopia sedang mengetik...
                      </span>
                    : activeSessionId
                      ? <>{EMOTIONS[activeMessages[activeMessages.length - 1]?.emotion ?? 'sedih'].emoji} Sesi Tersimpan</>
                      : <>💬 Kenopia AI</>
                  }
                </p>
                <p className="text-[11px] md:text-[12px] font-medium leading-tight truncate mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
                  Halo <span className="font-bold" style={{ color: 'var(--accent)' }}>{userName || 'Sinar'}</span>
                  <span className="opacity-30 hidden sm:inline">·</span>
                  <span className="hidden sm:inline opacity-60">{persona === 'sahabat' ? '👋 Sahabat' : persona === 'psikolog' ? '🩺 Psikolog' : '🧘 Filsuf'}</span>
                </p>
              </div>
            </div>

            {/* Kanan */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">

              {/* ── DESKTOP: semua tombol lengkap ── */}
              <div className="hidden md:flex items-center gap-2">
                {/* FITUR BARU: Streak badge di header */}
                {streakCount >= 2 && <StreakBadge count={streakCount} />}

                {/* Persona dropdown */}
                <div className="relative group">
                  <button className="px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm border hover:scale-105" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', borderColor: 'var(--border-2)' }}>
                    🎭 {persona === 'sahabat' ? 'Sahabat' : persona === 'psikolog' ? 'Psikolog' : 'Filsuf Zen'}
                    <span className="opacity-40 text-[10px]">▼</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                    <div className="absolute inset-x-0 -top-3 h-6 bg-transparent" />
                    <div className="rounded-2xl shadow-xl border flex flex-col overflow-hidden p-2" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}>
                      {(['sahabat', 'psikolog', 'filsuf'] as const).map(p => (
                        <button key={p} onClick={() => setPersona(p)}
                          className="text-left px-4 py-3 text-[13px] font-semibold rounded-xl transition-all flex items-center gap-2"
                          style={{ background: persona === p ? 'var(--accent-soft)' : 'transparent', color: persona === p ? 'var(--accent)' : 'var(--text)' }}
                        >
                          {p === 'sahabat' ? '👋' : p === 'psikolog' ? '🩺' : '🧘'}
                          {p === 'sahabat' ? 'Sahabat' : p === 'psikolog' ? 'Psikolog' : 'Filsuf Zen'}
                          {persona === p && <span className="ml-auto text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ambient dropdown */}
                <div className="relative group">
                  <button className="px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm border hover:scale-105"
                    style={{ background: ambient ? 'var(--accent)' : 'var(--surface-2)', color: ambient ? 'white' : 'var(--text-muted)', borderColor: ambient ? 'transparent' : 'var(--border-2)' }}>
                    🎵 {ambient === 'hujan' ? 'Hujan' : ambient === 'api' ? 'Api' : ambient === 'alam' ? 'Alam' : 'Musik'}
                    <span className={`text-[10px] ${ambient ? 'opacity-60' : 'opacity-40'}`}>▼</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                    <div className="absolute inset-x-0 -top-3 h-6 bg-transparent" />
                    <div className="rounded-2xl shadow-xl border flex flex-col overflow-hidden p-2" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}>
                      {(['hujan', 'api', 'alam'] as const).map(a => (
                        <button key={a} onClick={() => handlePlayAmbient(a)}
                          className="text-left px-4 py-3 text-[13px] font-semibold rounded-xl transition-all flex items-center gap-2"
                          style={{ background: ambient === a ? 'var(--accent-soft)' : 'transparent', color: ambient === a ? 'var(--accent)' : 'var(--text)' }}
                        >
                          {a === 'hujan' ? '🌧️ Hujan Sore' : a === 'api' ? '🔥 Api Unggun' : '🍃 Suara Alam'}
                          {ambient === a && <span className="ml-auto text-xs">✓</span>}
                        </button>
                      ))}
                      {ambient && <>
                        <div className="my-1 mx-3" style={{ height: '1px', background: 'var(--border)' }} />
                        <button onClick={() => handlePlayAmbient(null)} className="text-left px-4 py-3 text-[13px] font-semibold rounded-xl transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                          🔇 Matikan Suara
                        </button>
                      </>}
                    </div>
                  </div>
                </div>

                <button onClick={() => setShowSOS(true)} className="px-4 py-2 rounded-full text-[13px] font-bold transition-all hover:scale-105 active:scale-95 shadow-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  🆘 Darurat
                </button>

                <button onClick={() => setShowBreathing(true)} className="px-4 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.25)' }}>
                  🫁 Tenang
                </button>

                <ThemeToggle dark={dark} toggle={toggleTheme} />
              </div>

              {/* ── MOBILE: theme + menu pill ── */}
              <div className="flex md:hidden items-center gap-2">
                {streakCount >= 2 && <StreakBadge count={streakCount} />}
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] transition-all hover:scale-110 active:scale-95"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-muted)' }}
                  aria-label="Ganti tema"
                >{dark ? '☀️' : '🌙'}</button>

                <div className="relative" ref={mobileMenuRef}>
                  <button
                    onClick={() => setShowMobileMenu(v => !v)}
                    className="h-9 px-3.5 rounded-xl flex items-center gap-2 text-[13px] font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: showMobileMenu ? 'var(--accent)' : 'var(--surface-2)',
                      color: showMobileMenu ? 'white' : 'var(--text-muted)',
                      border: `1px solid ${showMobileMenu ? 'transparent' : 'var(--border-2)'}`,
                      boxShadow: showMobileMenu ? '0 4px 16px rgba(59,130,246,0.35)' : 'none',
                    }}
                    aria-label="Menu pilihan"
                  >
                    <span className="text-[16px]">{persona === 'sahabat' ? '👋' : persona === 'psikolog' ? '🩺' : '🧘'}</span>
                    <span
                      className="text-[10px] opacity-60 transition-transform duration-200 inline-block"
                      style={{ transform: showMobileMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >▾</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* ── CHAT BODY ── */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-6">
            {activeMessages.length === 0 && !pendingText && (
              <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center py-12 animate-fade-in">
                <div className="w-24 h-24 rounded-[30px] flex items-center justify-center text-5xl shadow-[0_20px_50px_rgba(59,130,246,0.35)] animate-float-slow border border-white/20"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#ec4899)' }}>🤍</div>

                {/* FITUR BARU: Daily affirmation */}
                <div className="px-6 py-4 rounded-2xl max-w-sm animate-fade-in"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                  <span className="text-2xl block mb-2">{todayAffirmation.emoji}</span>
                  <p className="text-[14px] leading-relaxed font-medium italic" style={{ color: 'var(--text-muted)' }}>
                    "{todayAffirmation.text}"
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text)' }}>
                    Halo {userName || 'Sinar'}, aku Kenopia
                  </h2>
                  <p className="max-w-lg text-[15px] md:text-[16px] leading-relaxed mx-auto opacity-75 font-medium" style={{ color: 'var(--text)' }}>
                    Ini ruang amanmu. Setiap sesi obrolan akan tersimpan dan diberi judul otomatis. Ketikkan apa yang sedang kamu rasakan.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4 max-w-2xl">
                  {Object.values(EMOTIONS).map((e, idx) => (
                    <button key={e.label}
                      onClick={() => { setInput(`Aku merasa ${e.label.toLowerCase()} hari ini karena... `); textareaRef.current?.focus() }}
                      className="px-5 py-3 rounded-full text-[14px] font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-1 active:translate-y-0 animate-pop-in-cute"
                      style={{ background: e.bgLight, color: e.color, border: `1.5px solid ${e.color}30`, animationDelay: `${idx * 80}ms` }}
                    >
                      {e.emoji} {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMessages.map((msg, idx) => (
              <div key={msg.id}>
                <MessageBubble msg={msg} />
                {/* FITUR BARU: Quick replies after last AI message */}
                {idx === activeMessages.length - 1 && !loading && !pendingText && (
                  <QuickReplies
                    emotion={msg.emotion}
                    onSelect={(text) => { setInput(text); textareaRef.current?.focus() }}
                  />
                )}
              </div>
            ))}
            {pendingText && <PendingUserBubble text={pendingText} />}
            {loading && <TypingIndicator />}
            {error && (
              <div className="animate-fade-in px-6 py-5 rounded-2xl text-[15px] font-bold shadow-md mx-auto max-w-md w-full text-center" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ── INPUT AREA ── */}
          <div className="flex-shrink-0 p-4 md:p-6 bg-transparent relative">
            <div className="absolute inset-0 top-auto h-40 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }} />

            <div className="relative z-10 max-w-4xl mx-auto">
              {voiceHint && (
                <div className="max-w-max mx-auto mb-4 px-6 py-3 rounded-full text-[14px] font-bold text-center animate-fade-in shadow-md flex items-center gap-2"
                  style={{ background: isListening ? 'rgba(239,68,68,0.1)' : 'var(--accent-soft)', color: isListening ? '#ef4444' : 'var(--accent)', border: `1px solid ${isListening ? '#ef444440' : 'var(--accent)40'}` }}>
                  {isListening ? <span className="animate-pulse">🔴</span> : <span>✅</span>}{voiceHint}
                </div>
              )}

              {/* Character count */}
              {input.length > 40 && (
                <div className="flex justify-end mb-1.5 px-2 animate-fade-in">
                  <span
                    className="text-[11px] font-bold tabular-nums transition-colors"
                    style={{ color: input.length > 280 ? '#ef4444' : 'var(--text-faint)' }}
                  >
                    {input.length}<span className="opacity-40">/300</span>
                  </span>
                </div>
              )}

              <div className="flex items-end gap-2 p-2 backdrop-blur-2xl rounded-[36px] border transition-all focus-within:border-blue-300 dark:focus-within:border-blue-900/50"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>

                <div className="flex items-end gap-1.5 pb-1 pl-1 flex-shrink-0">
                  {voiceSupported && (
                    <MicButton isListening={isListening} onClick={toggleVoice} disabled={loading} />
                  )}

                  {/* Ambient toggle */}
                  <button
                    onClick={() => {
                      const cycle = [null, 'hujan', 'api', 'alam'] as const
                      const idx = cycle.indexOf(ambient as any)
                      handlePlayAmbient(cycle[(idx + 1) % cycle.length])
                    }}
                    className="relative w-[44px] h-[44px] rounded-full flex items-center justify-center text-[18px] flex-shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                    style={{
                      background: ambient ? 'var(--accent)' : 'var(--surface-2)',
                      border: `1px solid ${ambient ? 'transparent' : 'var(--border-2)'}`,
                      color: ambient ? 'white' : 'var(--text-muted)',
                    }}
                    aria-label={ambient ? `Suara: ${ambient}` : 'Putar suara latar'}
                    title={ambient ? `Suara aktif: ${ambient}. Klik untuk ganti` : 'Putar suara latar'}
                  >
                    {ambient && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ background: 'var(--accent)', animationDuration: '2.5s' }} />
                    )}
                    <span className="relative">
                      {ambient === 'hujan' ? '🌧️' : ambient === 'api' ? '🔥' : ambient === 'alam' ? '🍃' : '🎵'}
                    </span>
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  className="chat-input flex-1 px-3 py-4 rounded-[24px] text-[15px] md:text-[16px] leading-relaxed bg-transparent border-none outline-none resize-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={
                    isListening ? '🎙️ Sedang merekam...'
                      : voiceSupported ? `Ketik atau 🎤 ceritakan ke ${persona}...`
                        : `Ceritakan ke ${persona}...`
                  }
                  rows={1} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} disabled={loading}
                  style={{ minHeight: '56px', maxHeight: '200px', color: 'var(--text)' }}
                />
                <div className="pb-1 pr-1">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !input.replace(/\s*\[.*?\]$/, '').trim()}
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: 'white' }}
                    aria-label="Kirim"
                  >
                    {loading ? <span className="animate-pulse">✨</span> : <span className="ml-0.5">🚀</span>}
                  </button>
                </div>
              </div>

              {/* Ambient status bar */}
              {ambient && (
                <div className="flex items-center justify-center gap-2 mt-2.5 animate-fade-in">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)30' }}>
                    <span className="animate-pulse">♪</span>
                    <span>
                      {ambient === 'hujan' ? 'Hujan Sore' : ambient === 'api' ? 'Api Unggun' : 'Suara Alam'} sedang diputar
                    </span>
                    <button
                      onClick={() => handlePlayAmbient(null)}
                      className="ml-1 opacity-60 hover:opacity-100 transition-opacity font-bold"
                      aria-label="Matikan suara"
                    >✕</button>
                  </div>
                </div>
              )}

              <p className="text-center text-[10px] md:text-[11px] font-bold mt-3 tracking-widest opacity-35 uppercase flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                🔒 Privasi 100% Aman <span className="opacity-50">•</span> Kenopia tidak membagikan datamu
              </p>
            </div>
          </div>
        </main>

        {/* Hidden export card */}
        <div className="fixed top-[-9999px] left-[-9999px]">
          <div ref={exportRef} className="w-[400px] p-10 rounded-[32px] flex flex-col items-center text-center relative overflow-hidden"
            style={{ background: dark ? '#0f172a' : '#ffffff', border: `3px solid ${EMOTIONS[dominantEmotion].color}`, color: dark ? '#f8fafc' : '#0f172a' }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${EMOTIONS[dominantEmotion].color}, transparent 70%)` }} />
            <h2 className="text-3xl font-display font-bold relative z-10 mb-1" style={{ color: 'var(--accent)' }}>Kenopia Wrapped</h2>
            <p className="text-sm opacity-60 relative z-10 mb-8 font-medium">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 relative z-10 shadow-lg" style={{ background: EMOTIONS[dominantEmotion].bgLight }}>{EMOTIONS[dominantEmotion].emoji}</div>
            <h3 className="text-xl font-semibold relative z-10 mb-2">Emosi Dominan: <span style={{ color: EMOTIONS[dominantEmotion].color }}>{EMOTIONS[dominantEmotion].label}</span></h3>
            <p className="text-sm relative z-10 mb-8 px-4 opacity-80 leading-relaxed">"{(EMOTIONS[dominantEmotion] as any).description}"</p>
            <div className="w-full rounded-2xl p-5 relative z-10 mb-3" style={{ background: 'rgba(0,0,0,0.05)' }}>
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
            <p className="text-xs opacity-50 mt-4 relative z-10 font-semibold tracking-wide uppercase">💙 Kenopia AI</p>
          </div>
        </div>
      </div>
    </>
  )
}