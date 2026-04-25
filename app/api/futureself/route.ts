import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function POST(request: NextRequest) {
  try {
    const { history, userName = 'Teman' } = await request.json()
    
    if (!history || history.length === 0) {
      return NextResponse.json({ letter: "Sepertinya kamu belum banyak bercerita. Ceritakan dulu bebanmu, agar aku dari masa depan bisa menulis surat untukmu." })
    }

    // PROMPT JENIUS: Memaksa LLaMA melakukan Roleplay sebagai User di Masa Depan
    const prompt = `Baca dengan saksama riwayat curhat ini:
${history.map((h: any) => `- ${h.userMessage}`).join('\n')}

TUGASMU:
Kamu bukan lagi AI Kenopia. Kamu adalah "${userName}" di masa depan (5 tahun dari sekarang). Kamu sudah sukses, bahagia, dan berhasil melewati SEMUA beban, stres, dan masalah yang diceritakan di atas.

Tulislah sepucuk surat hangat, penuh air mata kebahagiaan, dan sangat personal untuk dirimu di masa lalu (dirimu yang sedang membaca surat ini). 

ATURAN SURAT:
1. Mulai dengan menyapa namamu sendiri (contoh: "Hai Sinar, ini aku, kamu dari masa depan...").
2. Sebutkan secara spesifik beban yang sedang dia alami saat ini (berdasarkan riwayat di atas), lalu yakinkan dia bahwa semua itu berhasil dilewati.
3. Gunakan bahasa Indonesia yang sangat emosional, hangat, puitis tapi tetap natural (bahasa sehari-hari, aku-kamu).
4. Jangan pernah menyebut dirimu AI. Beraktinglah 100% sebagai dirinya dari masa depan.
5. Panjang surat sekitar 3-4 paragraf yang melegakan hati. Tutup dengan pelukan hangat dari masa depan.`

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
        max_tokens: 600,
        temperature: 0.85, // Temperatur tinggi untuk kreativitas emosional
      }),
    })

    if (!res.ok) throw new Error('Gagal menghubungi Groq API')

    const data = await res.json()
    const letterText = data.choices?.[0]?.message?.content?.trim() || "Surat dari masa depan gagal terkirim."

    return NextResponse.json({ letter: letterText })
  } catch (err) {
    console.error('[/api/futureself] Error:', err)
    return NextResponse.json({ error: 'Gagal meracik surat.' }, { status: 500 })
  }
}