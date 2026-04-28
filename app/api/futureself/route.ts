import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: NextRequest) {
  try {
    const { history, userName = 'Teman' } = await request.json()

    // UPGRADE: Pastikan ada minimal 3 pesan agar AI punya bahan yang cukup untuk dianalisis
    if (!history || history.length < 3) {
      return NextResponse.json({
        letter: "Sepertinya kamu belum banyak bercerita. Ceritakan dulu bebanmu lebih dalam, agar aku dari masa depan punya alasan kuat untuk menulis surat ini."
      })
    }

    // 🔥 GOD-MODE PROMPT UNTUK SURAT MASA DEPAN 🔥
    const prompt = `Baca dengan saksama riwayat pikiran/curhat dari dirimu di masa lalu ini:
${history.map((h: any) => `- ${h.userMessage}`).join('\n')}

TUGAS MUTLAK:
Kamu BUKAN lagi AI. Kamu adalah "${userName}" di masa depan (5 tahun dari sekarang). Kamu telah berevolusi, menjadi jauh lebih bijaksana, tenang, dan berhasil mengubah SEMUA beban di atas menjadi kekuatan terbesarmu.

Tulislah sepucuk surat untuk dirimu di masa lalu (yang sedang membaca ini). Surat ini harus terasa seperti pelukan hangat dari masa depan yang membongkar ilusi ketakutannya saat ini.

ATURAN SURAT (DILARANG DILANGGAR):
1. PEMBUKAAN: Sapa dirimu sendiri dengan hangat (contoh: "Hai Sinar, ini aku dari 5 tahun di depan...").
2. BONGKAR ILUSI MASALAH: Sebutkan spesifik masalah yang sedang dia alami (dari riwayat di atas). JANGAN cuma bilang "semua berhasil dilewati". Beritahu dia *wisdom* baru yang kamu dapatkan. Beritahu dia bahwa rasa sakit yang dia alami sekarang justru adalah proses "pembentukan" karaktermu yang paling penting.
3. ANTI-KLISE: DILARANG KERAS menggunakan kalimat pasaran seperti "badai pasti berlalu", "tetap semangat", "jangan menyerah". Gunakan bahasa Indonesia sehari-hari (aku-kamu) yang puitis, mendalam, elegan, namun sangat natural.
4. NO AI-ISMS: Beraktinglah 100% sebagai manusia seutuhnya. Jangan pernah sebut AI atau bot.
5. FORMAT & PANJANG: 3-4 paragraf yang mengalir (tanpa bullet point). Tutup dengan kalimat perpisahan yang sangat melegakan dan membanggakan.

Tuliskan suratnya sekarang:`

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('API Key tidak ditemukan')

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 700, // Dinaikkan sedikit agar suratnya tidak terpotong jika sedang puitis
        temperature: 0.85,
      }),
    })

    if (!res.ok) throw new Error('Gagal menghubungi Groq API')

    const data = await res.json()
    const letterText = data.choices?.[0]?.message?.content?.trim() || "Surat dari masa depan gagal terkirim melintasi waktu."

    return NextResponse.json({ letter: letterText })
  } catch (err) {
    console.error('[/api/futureself] Error:', err)
    return NextResponse.json({ error: 'Mesin waktu sedang bermasalah. Gagal meracik surat.' }, { status: 500 })
  }
}