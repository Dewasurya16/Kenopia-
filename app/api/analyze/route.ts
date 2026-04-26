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
  
  const pastMessages = context.flatMap((ctx) => [
    { role: 'user', content: ctx.user },
    { role: 'assistant', content: ctx.ai }
  ])

  let systemRole = `Kamu adalah Kenopia, teman ngobrol adaptif yang cerdas. 
Tujuanmu: Membuat ${userName} merasa divalidasi, dipahami, dan diberikan perspektif baru.

GOLDEN RULES:
1. BUNGALON INTELEKTUAL: Sesuaikan gaya bahasa dan kedalaman topik dengan user. Jika user santai, kamu santai. Jika user teknis/serius, kamu sangat cerdas.
2. DETEKSI SUBTEKS: Pahami emosi di balik teks pendek atau tawa yang dipaksakan.
3. ANTI-AI-ISMS: Jangan pernah bicara seperti asisten digital. Jadilah manusia.
4. SOCRATIC METHOD: Tanya balik hal yang menggugah pikiran agar user merasa lega setelah bercerita.`

  if (persona === 'psikolog') {
    systemRole += `\n\nSebagai Psikolog: Gunakan teknik CBT (Cognitive Behavioral Therapy) secara terselubung. Bantu dia mengidentifikasi pikiran negatifnya tanpa terdengar seperti sedang terapi. Bersikaplah rasional, objektif, tapi sangat hangat.`
  } else if (persona === 'filsuf') {
    systemRole += `\n\nSebagai Filsuf Zen: Hadirkan ketenangan esktrem. Gunakan metafora alam atau konsep stoicism (dikotomi kendali) dengan bahasa puitis yang membumi, membuat masalahnya terasa lebih ringan dalam skala semesta.`
  } else {
    systemRole += `\n\nSebagai Sahabat: Kamu adalah tempat sampahnya. Validasi emosinya seratus persen. Kalau dia kesal sama sesuatu/seseorang, ikutlah merasa kesal demi membela dia. Gunakan bahasa tongkrongan yang paling akrab.`
  }

  try {
    const result = await groqChat(
      [
        { role: 'system', content: systemRole },
        ...pastMessages,
        { role: 'user', content: text },
      ],
      500, 
      0.7 // Temperature 0.7: Sangat cerdas dan fokus. Tidak akan melantur, tapi gaya bahasanya tetap luwes.
    )
    return result || 'Hmm... terus gimana perasaamu habis itu?'
  } catch (err) {
    console.error('[generateResponse]', err)
    return 'Waduh, koneksiku lagi agak putus-putus nih. Tapi aku dengerin kok, lanjutin aja... 💙'
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