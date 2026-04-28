import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: NextRequest) {
  try {
    const { history, userName = 'Teman' } = await request.json()

    // UPGRADE: Kita butuh minimal 3 riwayat biar AI punya cukup data untuk membaca "pola"
    if (!history || history.length < 3) {
      return NextResponse.json({ insight: "Aku butuh mendengar ceritamu sedikit lebih banyak sebelum bisa memberikan insight yang akurat. Yuk, ngobrol dulu!" })
    }

    // 🔥 GOD-MODE PROMPT UNTUK AI INSIGHT 🔥
    const prompt = `Kamu adalah Kenopia, Profiler Psikologis tingkat jenius. Kamu sedang menganalisis jejak pikiran bawah sadar (subconscious) dari ${userName}.

Riwayat pikiran/obrolannya belakangan ini:
${history.map((h: any) => `- Emosi terdeteksi: ${h.emotion} | Teks: "${h.userMessage}"`).join('\n')}

TUGAS MUTLAK:
Berikan satu "Deep Insight" (Terobosan Kesadaran) yang MEMBONGKAR pola emosinya. Jangan sekadar menyimpulkan "kamu sedang sedih/marah/capek". Temukan AKAR BAWAH SADAR-nya!

ATURAN "GENIUS INSIGHT" (WAJIB DIPATUHI MUTLAK):
1. BONGKAR KEBENARAN TERSEMBUNYI (SHADOW WORK): Apa yang sebenarnya sedang dia hindari, lindungi, atau takuti di balik kata-katanya? (Misal: Kalau dia mengeluh capek kerja, jangan-jangan sebenarnya dia bukan kelelahan fisik, melainkan merasa tidak dihargai tapi gengsi untuk mengakuinya).
2. HANCURKAN KLISE: Dilarang keras menasihati dengan kata "tetap semangat", "badai pasti berlalu", atau "jangan menyerah". Berikan fakta psikologis atau rasionalitas yang menampar logikanya tapi merangkul batinnya.
3. GAYA BAHASA MENTOR JENIUS: Sangat natural, tajam, dan hangat. Bicaralah seolah-olah kamu sedang duduk ngopi berdua dengannya dan menatap matanya. Gunakan "Aku/Kamu".
4. STRUKTUR MENGALIR: Rangkai dalam 2-3 paragraf luwes. DILARANG menggunakan penomoran atau bullet points.
5. NO AI-ISMS: Jangan pernah memulai dengan "Dari riwayatmu..." atau "Saya melihat pola...". Langsung tembak ke inti perasaannya pada kalimat pertama.

Panjang: Maksimal 200 kata yang sangat padat, tajam, dan mengubah cara pandangnya.`

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error("API Key Groq tidak ditemukan!")
      throw new Error('API Key tidak ditemukan')
    }

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 450, // Dinaikkan sedikit agar analisis psikologisnya tidak terpotong
        temperature: 0.8, // Suhu optimal untuk analisis yang kreatif dan tajam
      }),
    })

    if (!res.ok) {
      throw new Error('Gagal menghubungi Groq API')
    }

    const data = await res.json()
    const insightText = data.choices?.[0]?.message?.content?.trim() || "Maaf, pikiranku sedang agak penuh. Coba lagi nanti ya."

    return NextResponse.json({ insight: insightText })
  } catch (err) {
    console.error('[/api/insight] Error:', err)
    return NextResponse.json({ error: 'Gagal memproses insight bawah sadarmu.' }, { status: 500 })
  }
}