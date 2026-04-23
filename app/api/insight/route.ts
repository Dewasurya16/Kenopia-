import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: NextRequest) {
  try {
    const { history } = await request.json()
    
    if (!history || history.length === 0) {
      return NextResponse.json({ insight: "Belum ada riwayat curhat yang cukup untuk dianalisis. Yuk, mulai cerita!" })
    }

    // Prompt khusus untuk AI menganalisis riwayat curhat
    const prompt = `Kamu adalah psikolog klinis yang hangat. Analisis riwayat curhat pengguna ini.\n\nRiwayat Curhat Terakhir:\n${history.map((h: any) => `- Emosi: ${h.emotion} | Teks: "${h.userMessage}"`).join('\n')}\n\nTugasmu:\nBerikan 2 paragraf singkat (maksimal 150 kata). Paragraf 1: Validasi pola emosi mereka akhir-akhir ini. Paragraf 2: Berikan satu saran praktis dan kalimat penutup yang menguatkan hati. Gunakan bahasa Indonesia yang santai tapi profesional.`

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
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.6,
      }),
    })

    if (!res.ok) {
        throw new Error('Gagal menghubungi Groq API')
    }

    const data = await res.json()
    const insightText = data.choices?.[0]?.message?.content?.trim() || "Maaf, AI sedang istirahat. Coba lagi nanti."

    return NextResponse.json({ insight: insightText })
  } catch (err) {
    console.error('[/api/insight] Error:', err)
    return NextResponse.json({ error: 'Gagal memproses insight.' }, { status: 500 })
  }
}