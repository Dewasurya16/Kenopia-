import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: NextRequest) {
  try {
    const { history, userName = 'Teman' } = await request.json()
    
    if (!history || history.length < 3) {
      return NextResponse.json({ 
        error: "Surat ini butuh setidaknya 3 sesi curhat agar lebih personal. Yuk, cerita lebih banyak dulu!" 
      }, { status: 400 })
    }

    // PROMPT KHUSUS: Persona "Masa Depan", Hangat, Menenangkan, Puitis
    const prompt = `Kamu sekarang BUKAN Kenopia. Kamu adalah versi masa depan dari ${userName}, tepatnya 5 tahun dari sekarang. Kamu menulis surat ini untuk dirimu di masa lalu.

Berikut adalah apa yang sedang dirasakan dan dialami oleh dirimu di masa lalu saat ini:
${history.map((h: any) => `- Emosi: ${h.emotion} | Teks: "${h.userMessage}"`).join('\n')}

INSTRUKSI MENULIS SURAT (WAJIB DIPATUHI MUTLAK):
1. SUDUT PANDANG: Gunakan sudut pandang orang pertama ("Aku" untuk masa depan, "Kamu" untuk masa lalu).
2. TONE & GAYA BAHASA: Sangat hangat, suportif, sedikit puitis tapi tidak lebay (cringy). Gunakan bahasa Indonesia sehari-hari yang luwes.
3. KONTEN UTAMA: 
   - Sapa dia dengan penuh kasih sayang.
   - Akui bahwa kamu tahu persis seberapa berat beban yang sedang dia rasakan sekarang (sebutkan konteks masalahnya secara spesifik tapi halus).
   - Yakinkan dia bahwa di masa depan (tempatmu berada sekarang), semuanya baik-baik saja. Beri tahu dia bahwa keputusan-keputusannya, sekecil apapun, membawamu ke tempat yang indah ini.
   - Berikan kalimat penutup yang menguatkan (misal: "Teruslah melangkah, aku menunggumu di sini dengan bangga").
4. FORMAT: Mengalir seperti surat nyata. Jangan pakai bullet point, penomoran, atau format kaku.
5. NO AI-ISMS: Dilarang menyebutkan kata "AI", "Bot", atau "Berdasarkan riwayat". Jadilah manusia sungguhan.

Panjang surat: Sekitar 150 - 250 kata.`

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
        max_tokens: 400,
        temperature: 0.8, // Sedikit lebih tinggi agar imajinasinya lebih kaya & puitis
      }),
    })

    if (!res.ok) {
        throw new Error('Gagal menghubungi Groq API')
    }

    const data = await res.json()
    const letterText = data.choices?.[0]?.message?.content?.trim() || "Maaf, mesin waktu sedang bermasalah. Coba tulis ulang suratnya nanti ya."

    return NextResponse.json({ letter: letterText })
  } catch (err) {
    console.error('[/api/futureself] Error:', err)
    return NextResponse.json({ error: 'Gagal mengirim surat dari masa depan.' }, { status: 500 })
  }
}