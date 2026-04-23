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
          content: `Classify the dominant emotion in this Indonesian text into exactly ONE word.
Choose only from: senang, cinta, marah, takut, sedih

Text: "${text}"

Reply with ONLY the single emotion word, nothing else.`,
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

// ── Generate response via Groq (Memory + Personas Enabled) ───────────────────
async function generateResponse(text: string, emotion: EmotionKey, context: {user: string, ai: string}[], persona: string): Promise<string> {
  const meta = EMOTIONS[emotion]
  
  // Format history previous context into Groq format
  const pastMessages = context.flatMap((ctx) => [
    { role: 'user', content: ctx.user },
    { role: 'assistant', content: ctx.ai }
  ])

  // Logika Personas AI
  let systemRole = ''
  if (persona === 'psikolog') {
    systemRole = `Kamu adalah Psikolog Klinis profesional yang hangat. Pengguna terdeteksi merasa ${meta.label}. Validasi perasaan mereka secara medis/psikologis, lalu berikan teknik coping (misal: grounding, CBT ringan, atau breathing) yang praktis. Gunakan bahasa baku tapi empatik.`
  } else if (persona === 'filsuf') {
    systemRole = `Kamu adalah seorang Filsuf Zen yang bijaksana. Pengguna terdeteksi merasa ${meta.label}. Berikan respons yang puitis, menenangkan, menggunakan metafora alam (air, pohon, langit), dan ajarkan konsep stoicism atau penerimaan diri. Bahasa baku dan dalam.`
  } else {
    // Default: Sahabat
    systemRole = `Kamu adalah Kenopia, sahabat emosional yang hangat, empatik, dan penuh kepedulian. Kamu berbicara seperti sahabat terpercaya yang mendengarkan dengan sepenuh hati. Pengguna terdeteksi merasa ${meta.label}. Gaya bahasa: hangat, personal, tidak formal tapi sopan, penuh empati. JANGAN terdengar seperti robot atau template.`
  }

  try {
    const result = await groqChat(
      [
        {
          role: 'system',
          content: systemRole + ' Jawab dalam Bahasa Indonesia.',
        },
        ...pastMessages,
        {
          role: 'user',
          content: `Pengguna bercerita:
"${text}"

Balas dengan cara berikut (jangan gunakan bullet point, tulis mengalir seperti percakapan):
1. Akui dan validasi perasaan mereka dengan tulus (1-2 kalimat spesifik terhadap ceritanya)
2. Berikan tanggapan, kata-kata penyemangat, atau teknik sesuai persona kamu (2-3 kalimat)
3. Tutup dengan satu kalimat quote atau wisdom yang relevan

Total: 80-120 kata. Jangan tambahkan label atau header apapun.`,
        },
      ],
      400,
      0.8
    )
    return result || 'Aku mendengarmu. 💙'
  } catch (err) {
    console.error('[generateResponse]', err)
    return 'Aku mendengarmu dan peduli dengan apa yang kamu rasakan. 💙'
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Tambahkan persona di interface body
    let body: { message?: string, context?: {user: string, ai: string}[], persona?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Format permintaan tidak valid.' }, { status: 400 })
    }

    // Ambil persona dari request, default ke 'sahabat'
    const { message, context = [], persona = 'sahabat' } = body
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })
    }

    const trimmed = message.trim()
    const emotion = (await detectEmotionHF(trimmed)) ?? (await detectEmotionGroq(trimmed))
    
    // Pass the context AND persona to generateResponse
    const aiResponse = await generateResponse(trimmed, emotion, context, persona)

    return NextResponse.json({ emotion, aiResponse, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[/api/analyze]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server. Coba lagi ya.' }, { status: 500 })
  }
}