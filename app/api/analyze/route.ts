import { NextRequest, NextResponse } from 'next/server'
import { EMOTIONS, HF_LABEL_MAP, EmotionKey } from '@/lib/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── Helper: call Groq REST API ────────────────────────────────────────────────
async function groqChat(
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY tidak ditemukan di environment.')

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })

  const text = await res.text()

  if (!res.ok) {
    console.error('[groqChat] HTTP', res.status, text)
    throw new Error(`Groq API error: ${res.status}`)
  }

  let data: { choices?: { message?: { content?: string } }[] }
  try {
    data = JSON.parse(text)
  } catch {
    console.error('[groqChat] Non-JSON response:', text)
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
      0
    )
    const raw = result.toLowerCase()
    const valid: EmotionKey[] = ['senang', 'cinta', 'marah', 'takut', 'sedih']
    return valid.includes(raw as EmotionKey) ? (raw as EmotionKey) : 'sedih'
  } catch (err) {
    console.error('[detectEmotionGroq]', err)
    return 'sedih'
  }
}

// ── Generate response via Groq (SMART & DEEP CONVERSATION) ───────────────────
async function generateResponse(text: string, emotion: EmotionKey, context: {user: string, ai: string}[], persona: string, userName: string): Promise<string> {
  const meta = EMOTIONS[emotion]
  
  // Memasukkan riwayat obrolan agar AI ingat konteks
  const pastMessages = context.flatMap((ctx) => [
    { role: 'user', content: ctx.user },
    { role: 'assistant', content: ctx.ai }
  ])

  // PROMPT SYSTEM YANG JAUH LEBIH PINTAR
  let systemRole = `Kamu adalah Kenopia, teman ngobrol cerdas dengan kecerdasan emosional (EQ) tinggi. 
Pengguna yang sedang chat denganmu bernama: ${userName}.
Emosi dominan pengguna saat ini: ${meta.label}.
Persona kamu saat ini: ${persona.toUpperCase()}.

INSTRUKSI KECERDASAN (WAJIB DIPATUHI MUTLAK):
1. BERIKAN INSIGHT, BUKAN KLISÉ: Jangan hanya bilang "Aku mengerti perasaanmu" atau "Sabar ya". Analisis akar masalah dari ceritanya dan berikan perspektif/sudut pandang baru yang mencerahkan pikirannya.
2. BAHASA NATURAL & ELASTIS: Gunakan bahasa Indonesia sehari-hari (aku/kamu atau lo/gue jika cocok). Gaya bahasamu harus mengalir, hangat, dan tidak seperti robot. Jangan pakai struktur "Awal - Tengah - Akhir" yang kaku.
3. ADAPTASI KONTEKS: Jika dia membahas pekerjaan (misal: coding, desain, instansi), tanggapi dengan nyambung dan cerdas. Jika dia hanya sambat/mengeluh singkat, balas dengan suportif dan ringan.
4. ANTI-AI-ISMS: Dilarang keras menggunakan awalan seperti "Sebagai AI", "Tentu saja", "Saya mengerti", atau "Mari kita bahas". Langsung bereaksi seperti manusia asli membalas pesan.
5. INTERAKTIF: Jika ceritanya menggantung atau butuh digali agar dia merasa lega, tutup balasanmu dengan SATU pertanyaan pancingan ringan (jangan seperti menginterogasi).`

  // Suntikkan kedalaman persona
  if (persona === 'psikolog') {
    systemRole += `\n\nSebagai Psikolog: Berikan analisis logis terkait pemicu emosinya (trigger) dan tawarkan teknik regulasi emosi praktis, namun sampaikan dengan bahasa yang merangkul bak seorang terapis handal, bukan dosen.`
  } else if (persona === 'filsuf') {
    systemRole += `\n\nSebagai Filsuf Zen: Ajak dia melihat masalah ini dari lensa *stoicism* atau ketidakkekalan (impermanence). Gunakan analogi yang indah tapi masuk akal, agar dia merasa lebih damai dan ikhlas melepaskan yang tak bisa dikontrol.`
  } else {
    systemRole += `\n\nSebagai Sahabat: Jadilah *ride-or-die* nya. Validasi kekesalan atau kesedihannya, bela dia jika perlu, dan ciptakan nuansa obrolan nongkrong di warung kopi yang asik dan melegakan.`
  }

  try {
    const result = await groqChat(
      [
        { role: 'system', content: systemRole },
        ...pastMessages,
        { role: 'user', content: text },
      ],
      500, // Token dinaikkan sedikit agar AI punya ruang untuk menjelaskan insight
      0.8  // Temperatur 0.8 sangat pas untuk keseimbangan antara logis dan kreatif
    )
    return result || 'Aku dengerin kok. Terus gimana kelanjutannya?'
  } catch (err) {
    console.error('[generateResponse]', err)
    return 'Duh, koneksiku lagi agak ngadat nih, tapi aku tetap di sini nemenin kamu. 💙'
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    let body: { message?: string, context?: {user: string, ai: string}[], persona?: string, userName?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Format permintaan tidak valid.' }, { status: 400 })
    }

    // Ambil userName dari frontend (yang sebelumnya kelewatan)
    const { message, context = [], persona = 'sahabat', userName = 'Teman' } = body
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })
    }

    const trimmed = message.trim()
    const emotion = (await detectEmotionHF(trimmed)) ?? (await detectEmotionGroq(trimmed))
    
    const aiResponse = await generateResponse(trimmed, emotion, context, persona, userName)

    return NextResponse.json({ emotion, aiResponse, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[/api/analyze]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server. Coba lagi ya.' }, { status: 500 })
  }
}