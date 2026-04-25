import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: NextRequest) {
  try {
    const { history, userName = 'Teman' } = await request.json()
    
    if (!history || history.length === 0) {
      return NextResponse.json({ insight: "Belum ada riwayat curhat yang cukup untuk dianalisis. Yuk, mulai cerita!" })
    }

    // PROMPT BARU: Lebih deep, natural, dan fokus ke "Akar Masalah" (Insight)
    const prompt = `Kamu adalah Kenopia, AI dengan kecerdasan emosional tinggi. Pengguna yang sedang kamu analisis bernama ${userName}.

Berikut adalah jejak riwayat curhatnya belakangan ini:
${history.map((h: any) => `- Emosi terdeteksi: ${h.emotion} | Teks: "${h.userMessage}"`).join('\n')}

INSTRUKSI ANALISIS (WAJIB DIPATUHI MUTLAK):
1. BACA BENANG MERAH: Jangan sekadar mengulang apa yang dia ketik. Analisis pola tersembunyinya. Apakah dia sedang lelah rutinitas, overthinking, merasa kesepian, atau sedang bersemangat?
2. GAYA BAHASA NATURAL: Gunakan bahasa Indonesia sehari-hari yang santai, hangat, dan asik (gunakan aku/kamu). Jangan kaku, jangan gunakan penomoran/bullet point.
3. STRUKTUR MENGALIR: Jangan kaku membagi jadi "Paragraf 1" dan "Paragraf 2". Rangkai kata-katamu dengan luwes.
4. KONTEN: Validasi perasaannya secara mendalam (bikin dia merasa "Wah, Kenopia ngerti banget"). Lalu, berikan 1 perspektif baru atau saran psikologis ringan yang *mind-blowing* tapi praktis.
5. NO AI-ISMS: Dilarang keras memakai awalan "Berdasarkan riwayat," "Sebagai AI," atau "Saya melihat pola." Langsung menyapa dan ngobrol layaknya membaca isi hatinya.

Panjang: Sekitar 100-150 kata. Bikin se-natural mungkin.`

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
        max_tokens: 300,
        temperature: 0.75, // Naikkan sedikit agar bahasanya lebih luwes dan empatik
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
    return NextResponse.json({ error: 'Gagal memproses insight.' }, { status: 500 })
  }
}