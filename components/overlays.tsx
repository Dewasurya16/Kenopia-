
'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { ChatMessage } from '@/lib/types'

export const triggerVibrate = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

const CAPSULE_KEY = 'kenopia_time_capsules'
export interface TimeCapsule { id: string; text: string; createdAt: string; unlockDate: string }


export function FadingCanvasOverlay({ onClose }: { onClose: () => void }) {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-100 flex flex-col" style={{ background: '#0a0a0f', touchAction: 'none' }}>
      <div className="absolute top-10 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        <h2 className="text-3xl font-bold mb-2 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.9)' }}>Kanvas Fana</h2>
        <p className="text-sm text-center max-w-md" style={{ color: 'rgba(255,255,255,0.45)' }}>Coretkan amarah atau resahmu. Perhatikan bagaimana ia perlahan memudar tanpa sisa.</p>
      </div>
      <canvas ref={canvasRef} onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerCancel={stopDraw} onPointerLeave={stopDraw}
        className="absolute inset-0 w-full h-full cursor-crosshair" style={{ touchAction: 'none' }} />
      <motion.button onClick={onClose} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-10 py-4 rounded-full font-bold shadow-xl z-10"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(12px)' }}>
        Keluar ✨
      </motion.button>
    </motion.div>
  )
}

export function HopeBalloonOverlay({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'flying' | 'done'>('idle')
  const handleRelease = () => {
    if (!text.trim()) return
    setPhase('flying')
    setTimeout(() => setPhase('done'), 4000)
    setTimeout(() => onClose(), 6500)
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6 overflow-hidden" style={{ background: 'rgba(12,74,110,0.97)', backdropFilter: 'blur(20px)' }}>
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md flex flex-col items-center relative z-10">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-7xl mb-6">🎈</motion.div>
            <h2 className="text-3xl font-bold text-white mb-3 text-center">Balon Pelepasan</h2>
            <p className="text-center text-sm mb-8 leading-relaxed px-4" style={{ color: 'rgba(186,230,253,0.8)' }}>Tuliskan satu pikiran yang mengganggu. Ikatkan di balon ini, dan biarkan angin membawanya pergi.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Pikiran ini berat, tapi aku siap melepaskannya..."
              className="w-full p-5 rounded-3xl mb-6 text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', color: 'white' }} rows={4} />
            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>Batal</button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRelease} disabled={!text.trim()} className="flex-1 py-4 rounded-2xl font-bold disabled:opacity-50"
                style={{ background: '#38bdf8', color: '#0c4a6e' }}>Lepaskan 🌬️</motion.button>
            </div>
          </motion.div>
        )}
        {phase === 'flying' && (
          <motion.div key="flying" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -1000, scale: 0.5, rotate: 15 }} transition={{ duration: 4, ease: "easeIn" }} className="flex flex-col items-center absolute bottom-10">
            <div className="p-4 rounded-2xl shadow-xl max-w-[220px] text-center mb-3 relative" style={{ background: 'rgba(255,255,255,0.9)' }}>
              <p className="text-sm font-medium leading-relaxed italic" style={{ color: '#0c4a6e' }}>"{text}"</p>
            </div>
            <div className="text-8xl">🎈</div>
          </motion.div>
        )}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center z-10 px-6">
            <div className="text-6xl mb-6">☁️</div>
            <h2 className="text-3xl font-bold text-white mb-4">Telah Berlalu</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(186,230,253,0.9)' }}>Semua pikiran itu telah terbang jauh dan memudar.<br />Kamu aman di sini sekarang.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function TimeCapsuleOverlay({ capsules, setCapsules, onClose }: { capsules: TimeCapsule[]; setCapsules: (v: TimeCapsule[]) => void; onClose: () => void }) {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex flex-col items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 md:p-8 rounded-4xl max-w-lg w-full flex flex-col max-h-[85vh] relative" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}>✕</button>

        <AnimatePresence mode="wait">
          {view === 'list' && <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 min-h-0">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>⏳ Kapsul Waktu</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-faint)' }}>Pesan untuk dirimu di masa depan.</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setView('write')} className="w-full py-4 mb-6 rounded-2xl font-bold text-white"
              style={{ background: '#6366f1', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>✍️ Tulis Kapsul Baru</motion.button>
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
          </motion.div>}

          {view === 'write' && <motion.div key="write" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col flex-1 min-h-0">
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
          </motion.div>}

          {view === 'read' && activeCapsule && (
            <motion.div key="read" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full">
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export function FutureSelfOverlay({ history, userName, onClose }: { history: ChatMessage[]; userName: string; onClose: () => void }) {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex flex-col items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 md:p-8 rounded-4xl max-w-lg w-full flex flex-col max-h-[88vh] relative" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
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
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-3 h-3 rounded-full" style={{ background: '#86efac' }}
                    animate={{ y: [0, -8, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-relaxed whitespace-pre-wrap p-5 rounded-2xl"
              style={{ background: 'rgba(134,239,172,0.06)', border: '1px solid rgba(134,239,172,0.2)', color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.9 }}>
              {letter}
            </motion.div>
          )}
        </div>

        {letter && (
          <div className="mt-5 pt-5 flex gap-3" style={{ borderTop: '1px solid var(--border-2)' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchLetter} className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>🔄 Tulis Ulang</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>💚 Terima Kasih</motion.button>
          </div>
        )}

        {history.length < 3 && !loading && !letter && (
          <div className="py-10 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text)' }}>Surat ini butuh setidaknya <strong>3 sesi curhat</strong> agar AI bisa menulis sesuatu yang personal untukmu.</p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Kamu baru punya {history.length} pesan. Yuk cerita lebih banyak dulu!</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export function GroundingOverlay({ onClose }: { onClose: () => void }) {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-md w-full relative">
        <button onClick={onClose} className="absolute -top-12 right-0 font-bold transition-all hover:opacity-100 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>✕ Tutup</button>
        <AnimatePresence mode="wait">
          {step < steps.length ? (
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 md:p-10 rounded-4xl border flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
              <div className="absolute top-0 left-0 h-1.5 w-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full transition-all duration-500" style={{ width: `${(step / steps.length) * 100}%`, background: current.color }} />
              </div>
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg border-2"
                style={{ borderColor: `${current.color}50`, background: `${current.color}20` }}>{current.icon}</div>
              <h2 className="text-5xl font-bold mb-2 tabular-nums" style={{ color: current.color }}>{current.num}</h2>
              <h3 className="text-white text-2xl font-bold mb-4">{current.title}</h3>
              <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.75)' }}>{current.desc}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setStep(s => s + 1)} className="w-full py-4 rounded-2xl text-white font-bold text-base"
                style={{ background: current.color }}>Sudah, Lanjut ✓</motion.button>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 md:p-10 rounded-4xl border flex flex-col items-center text-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6" style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.4)' }}>🌿</div>
              <h2 className="text-white text-3xl font-bold mb-4">Kembali ke Realita</h2>
              <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.75)' }}>Kamu sudah kembali terhubung dengan masa kini. Tarik napas dalam, kamu aman di sini.</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="w-full py-4 rounded-2xl font-bold text-base" style={{ background: 'white', color: '#0f172a' }}>Selesai ✨</motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function BubbleWrapOverlay({ onClose }: { onClose: () => void }) {
  const [bubbles, setBubbles] = useState<boolean[]>(Array(42).fill(false))
  const isAllPopped = bubbles.every(b => b)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex flex-col items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)' }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-8 rounded-4xl border flex flex-col items-center max-w-sm w-full" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }}>
        <h2 className="text-white text-2xl font-bold mb-2">Pecahkan Gelembung</h2>
        <p className="text-xs mb-8 text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>Fokuskan pikiranmu pada setiap letusan kecil ini untuk meredakan kecemasan.</p>
        <div className="grid grid-cols-6 gap-3 mb-8">
          {bubbles.map((popped, i) => (
            <button key={i} onClick={() => { 
                if (popped) return; 
                triggerVibrate(15); // Haptic ketika meletus!
                const b = [...bubbles]; b[i] = true; setBubbles(b) 
              }}
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
          {isAllPopped && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setBubbles(Array(42).fill(false))} className="flex-1 py-3.5 rounded-2xl font-bold text-white" style={{ background: '#3b82f6' }}>🔄 Ulangi</motion.button>}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>Selesai ✓</motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function BreathingOverlay({ onClose }: { onClose: () => void }) {
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
  const scale = isInhale ? 1.3 : isHold ? 1.3 : 0.8;
  const shadow = isInhale || isHold ? '0 0 120px rgba(14,165,233,0.6)' : '0 0 40px rgba(14,165,233,0.2)'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex flex-col items-center justify-center" style={{ background: 'rgba(3,3,8,0.93)', backdropFilter: 'blur(20px)' }}>
      <h2 className="text-white text-3xl md:text-4xl font-bold mb-4 text-center px-4">Tenangkan Pikiran Sejenak</h2>
      <p className="text-sm mb-16 tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Teknik 4-2-4 · Ikuti irama lingkaran</p>
      
      <motion.div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center"
        animate={{ scale, boxShadow: shadow }}
        transition={{ duration: phase === 'Tahan...' ? 0.5 : 4, ease: "easeInOut" }}
        style={{ background: isHold ? 'radial-gradient(circle,#818cf8,#6366f1)' : 'radial-gradient(circle,#7dd3fc,#0ea5e9)' }}>
        <div className="text-center">
          <span className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg tracking-widest block">{phase}</span>
          <span className="text-white text-5xl font-bold mt-2 block tabular-nums">{count}</span>
        </div>
      </motion.div>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="mt-20 px-10 py-4 rounded-full font-bold shadow-lg"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(12px)' }}>
        Sudah Merasa Lebih Baik ✓
      </motion.button>
    </motion.div>
  )
}

export function BurnBebanOverlay({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'igniting' | 'dissolving' | 'done'>('idle')
  const handleBurn = () => {
    if (!text) return
    setPhase('igniting'); setTimeout(() => setPhase('dissolving'), 1500); setTimeout(() => setPhase('done'), 2500); setTimeout(() => onClose(), 5000)
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6 transition-colors duration-1000"
      style={{ background: phase !== 'idle' ? 'rgba(69,10,10,0.97)' : 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)' }}>
      <AnimatePresence mode="wait">
        {phase !== 'done' ? (
          <motion.div key="form" exit={{ opacity: 0 }} className="w-full max-w-xl flex flex-col items-center">
            <motion.div animate={phase === 'igniting' ? { scale: 2, filter: 'drop-shadow(0 0 30px rgba(239,68,68,1))' } : { scale: 1 }} transition={{ duration: 0.5 }} className="text-6xl md:text-7xl mb-6">
              {phase === 'igniting' ? '🔥' : '🌬️'}
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center transition-colors" style={{ color: phase !== 'idle' ? '#fca5a5' : 'white' }}>
              {phase === 'igniting' ? 'Membakar Emosimu...' : 'Ruang Lepas Beban'}
            </h2>
            <p className="text-sm text-center mb-10 leading-relaxed transition-opacity" style={{ color: 'rgba(209,213,219,0.85)', opacity: phase !== 'idle' ? 0 : 1 }}>
              Ketikkan semua amarah atau kesedihan terdalammu di sini.<br />Teks akan <strong>dibakar</strong> dan tidak akan pernah disimpan.
            </p>
            <motion.textarea className="w-full p-5 sm:p-8 rounded-3xl border-2 outline-none text-sm sm:text-base leading-relaxed resize-none shadow-2xl mb-8"
              animate={phase === 'igniting' ? { x: [-3, 3, -3, 3, 0] } : phase === 'dissolving' ? { y: -150, scale: 1.1, filter: 'blur(15px)', opacity: 0 } : {}}
              transition={phase === 'igniting' ? { duration: 0.3, repeat: Infinity } : phase === 'dissolving' ? { duration: 1.2 } : {}}
              style={{
                background: phase === 'idle' ? 'rgba(255,255,255,0.08)' : 'rgba(153,27,27,0.5)',
                border: phase === 'idle' ? '2px solid rgba(255,255,255,0.15)' : '2px solid rgba(252,165,165,1)',
                color: phase !== 'idle' ? '#fef08a' : 'white',
                textShadow: phase !== 'idle' ? '0 0 15px #ef4444' : 'none',
              }} rows={7}
              placeholder="Keluarkan semua amarahmu di sini. Tidak ada yang akan tahu..."
              value={text} onChange={e => setText(e.target.value)} disabled={phase !== 'idle'} />
            
            <div className="flex gap-4 w-full transition-opacity" style={{ opacity: phase !== 'idle' ? 0 : 1, pointerEvents: phase !== 'idle' ? 'none' : 'auto' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(209,213,219,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>Batal</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleBurn} disabled={!text} className="flex-1 py-4 rounded-2xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 10px 40px rgba(239,68,68,0.4)', border: '1px solid rgba(252,165,165,0.5)' }}>
                🔥 Bakar &amp; Hancurkan!
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8" style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', boxShadow: '0 0 80px rgba(34,197,94,0.3)' }}>
              <span className="text-7xl">🍃</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Sudah Berlalu</h2>
            <p className="text-gray-300 text-center max-w-md leading-relaxed text-lg px-4">Semua beban dan amarahmu telah lenyap tertiup angin. Tarik napas yang dalam...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
