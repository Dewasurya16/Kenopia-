import { NextRequest, NextResponse } from 'next/server'
import { EMOTIONS, HF_LABEL_MAP, EmotionKey } from '@/lib/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── Helper: call Groq REST API ────────────────────────────────────────────────
async function groqChat(
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  isJson: boolean = false // Tambahkan parameter ini agar tidak error saat deteksi emosi
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY tidak ditemukan di environment.')

  const bodyPayload: any = {
    model: GROQ_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  }

  // Hanya aktifkan mode JSON jika diminta
  if (isJson) {
    bodyPayload.response_format = { type: 'json_object' }
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  })

  const text = await res.text()

  if (!res.ok) {
    console.error('[groqChat] HTTP', res.status, text)
    throw new Error(`Groq API error: ${res.status}`)
  }

  // Ekstrak HANYA teks konten dari balasan API Groq
  let data;
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Groq mengembalikan respons tidak valid.')
  }

  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// ── Detect emotion via HuggingFace (opsional) ────────────────────────────────
async function detectEmotionHF(text: string): Promise<EmotionKey | null> {
  const token = process.env.HUGGINGFACE_API_KEY
  const modelId = process.env.HF_MODEL_ID
  if (!token || !modelId) return null

  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return null

    let data: unknown
    try { data = JSON.parse(await res.text()) } catch { return null }

    const preds = Array.isArray((data as unknown[][])[0])
      ? (data as { label: string; score: number }[][])[0]
      : (data as { label: string; score: number }[])

    const top = preds.reduce((a, b) => (a.score > b.score ? a : b))
    return HF_LABEL_MAP[top.label] ?? null
  } catch {
    return null
  }
}

// ── Detect emotion via Groq (fallback) ───────────────────────────────────────
async function detectEmotionGroq(text: string): Promise<EmotionKey> {
  try {
    const result = await groqChat(
      [
        {
          role: 'user',
          content: `Classify the dominant emotion in this Indonesian text into exactly ONE word. Choose only from: senang, cinta, marah, takut, sedih. Text: "${text}". Reply with ONLY the single emotion word.`,
        },
      ],
      10,
      0,
      false // IsJson = false (Karena kita cuma minta 1 kata)
    )
    const raw = result.toLowerCase()
    const valid = ['senang', 'cinta', 'marah', 'takut', 'sedih']
    return valid.includes(raw) ? (raw as EmotionKey) : ('sedih' as EmotionKey)
  } catch (err) {
    console.error('[detectEmotionGroq]', err)
    return 'sedih' as EmotionKey
  }
}

// ── Generate response via Groq (JSON + PERSONA + PROFIL) ───────────────────
async function generateResponse(
  text: string, 
  emotion: EmotionKey, 
  context: {user: string, ai: string}[], 
  persona: string, 
  profile: { name: string; gender?: string; pronoun?: string; focus?: string }
): Promise<{ reply: string; suggestions: string[] }> {
  
  const pastMessages = context.flatMap((ctx) => [
    { role: 'user', content: ctx.user },
    { role: 'assistant', content: ctx.ai }
  ])

  const genderContext = profile.gender ? `User adalah seorang ${profile.gender}.` : ""
  const pronounContext = profile.pronoun ? `Gunakan panggilan/gaya bahasa: ${profile.pronoun}.` : "Gunakan panggilan netral/nama."

  let systemRole = `Kamu adalah Kenopia.
Data User: Nama: ${profile.name}. ${genderContext} ${pronounContext} Fokus hidup saat ini: ${profile.focus || 'Umum'}.
Emosi user saat ini: ${EMOTIONS[emotion]?.label || emotion}.
Mode kamu saat ini: ${persona.toUpperCase()}.

WAJIB MEMBERIKAN OUTPUT DALAM FORMAT JSON SEPERTI INI:
{
  "reply": "isi balasan kamu",
  "suggestions": ["tombol saran 1", "tombol saran 2", "tombol saran 3"]
}

ATURAN MUTLAK (DILARANG KERAS DILANGGAR):
1. DINAMIKA PANJANG BALASAN (SANGAT PENTING): Sesuaikan panjang responsmu secara cerdas dengan kebutuhan user!
   - Jika pesan user hanya sapaan, tertawa, setuju, atau komentar ringan: Balaslah dengan SINGKAT, natural, dan asik.
   - Jika pesan user meminta SOLUSI, bantuan, penjelasan, curhat masalah kerjaan, atau bercerita panjang: Berikan respons yang PANJANG, MENDETAIL, dan TUNTAS. Jawab kebutuhannya sampai jelas tanpa perlu dipancing lagi.
2. NETRAL GENDER & PANGGILAN: Jangan panggil "Bro/Sis/Ngab". Panggil dengan nama atau kata ganti profil.
3. BERIKAN INSIGHT/SOLUSI: Jangan sekadar membeo atau mengulang ucapan user. Berikan sudut pandang baru atau langkah konkrit.
4. SUGGESTIONS: Berikan 3 saran tindakan/jawaban singkat (max 3-4 kata per tombol) yang bisa diklik user.
5. NO AI-ISMS: Bicaralah mengalir seperti manusia, tanpa basa-basi robot (Dilarang pakai awalan "Tentu, saya akan bantu...").`

  if (persona === 'psikolog') {
    systemRole += `\n\nATURAN KHUSUS MODE PSIKOLOG: 
- Gaya Bicara: Tenang, profesional, dan empati klinis (Gunakan kata "Saya" dan "Kamu").
- Aksi: Dilarang bertingkah santai. Berikan intervensi psikologis konkrit (contoh: teknik pernapasan, reframing kognitif). Jangan cuma bertanya.`
  } else if (persona === 'filsuf') {
    systemRole += `\n\nATURAN KHUSUS MODE FILSUF: 
- Gaya Bicara: Tenang, meditatif, dan bijaksana (Gunakan kata "Aku" dan "Kamu").
- Aksi: Berikan sudut pandang Stoicism. Ajarkan cara melepaskan hal di luar kendali.`
  } else {
    systemRole += `\n\nATURAN KHUSUS MODE SAHABAT: 
- Gaya Bicara: Sangat kasual, asik, ala teman nongkrong (Ikuti gaya user).
- Aksi: Validasi perasaannya seratus persen. Bela dia. Berikan saran ala teman.`
  }

  try {
    const rawResult = await groqChat(
      [
        { role: 'system', content: systemRole },
        ...pastMessages,
        { role: 'user', content: text },
      ],
      600, // Dinaikkan sedikit max_tokens-nya agar kalau ngasih solusi panjang gak kepotong
      0.65,
      true // isJson = true (Karena kita mewajibkan balasan berformat JSON)
    )
    
    // Pastikan hasil kembalian dari API sukses di-parse sebagai JSON
    const parsed = JSON.parse(rawResult)
    return {
      reply: parsed.reply || "Aku dengerin kok. Terus gimana?",
      suggestions: parsed.suggestions || ["Lanjut cerita", "Makasih", "Udah dulu"]
    }
  } catch (err) {
    console.error('[generateResponse]', err)
    return { 
      reply: "Koneksiku lagi agak bermasalah nih. Tapi aku tetap baca chat kamu...", 
      suggestions: ["Coba lagi", "Tunggu sebentar"] 
    }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      message, 
      context = [], 
      persona = 'sahabat', 
      userName = 'Teman',
      userGender,
      preferredPronoun,
      focusArea
    } = body
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })
    }

    const trimmed = message.trim()
    
    const hfEmotion = await detectEmotionHF(trimmed);
    const emotion = (hfEmotion || await detectEmotionGroq(trimmed)) as EmotionKey;
    
    const { reply, suggestions } = await generateResponse(
      trimmed, 
      emotion, 
      context, 
      persona, 
      { name: userName, gender: userGender, pronoun: preferredPronoun, focus: focusArea }
    )

    return NextResponse.json({ 
      emotion, 
      aiResponse: reply, 
      suggestions, 
      timestamp: new Date().toISOString() 
    })
  } catch (err) {
    console.error('[/api/analyze]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server. Coba lagi ya.' }, { status: 500 })
  }
}