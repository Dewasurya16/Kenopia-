import { NextRequest, NextResponse } from 'next/server'
import { EMOTIONS, HF_LABEL_MAP, EmotionKey } from '@/lib/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── Helper: call Groq REST API STREAM ────────────────────────────────────────────────
async function groqChatStream(
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number
) {
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
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[groqChatStream] HTTP', res.status, text)
    throw new Error(`Groq API error: ${res.status}`)
  }

  return res.body
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
    const apiKey = process.env.GROQ_API_KEY
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: `Classify the dominant emotion in this Indonesian text into exactly ONE word. Choose only from: senang, cinta, marah, takut, sedih. Text: "${text}". Reply with ONLY the single emotion word.` }],
        max_tokens: 10,
        temperature: 0
      }),
    })
    const data = await res.json()
    const raw = (data.choices?.[0]?.message?.content?.trim() || '').toLowerCase()
    const valid = ['senang', 'cinta', 'marah', 'takut', 'sedih']
    return valid.includes(raw) ? (raw as EmotionKey) : ('sedih' as EmotionKey)
  } catch (err) {
    console.error('[detectEmotionGroq]', err)
    return 'sedih' as EmotionKey
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      context = [],
      longTermMemory = "",
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

    // 1. Proses deteksi emosi
    const hfEmotion = await detectEmotionHF(trimmed);
    const emotion = (hfEmotion || await detectEmotionGroq(trimmed)) as EmotionKey;

    // 2. Siapkan Context & Prompt
    const pastMessages = context.flatMap((ctx: any) => [
      { role: 'user', content: ctx.user },
      { role: 'assistant', content: ctx.ai }
    ])

    const genderContext = userGender ? `User adalah seorang ${userGender}.` : ""
    const pronounContext = preferredPronoun ? `Gunakan panggilan/gaya bahasa: ${preferredPronoun}.` : "Gunakan panggilan netral/nama."
    const ltmContext = longTermMemory ? `\n\nBUKU CATATAN PSIKOLOG (Topik dari sesi-sesi sebelumnya):\n${longTermMemory}\n(Gunakan informasi di atas jika relevan dengan obrolan saat ini)` : "";

    let systemRole = `Kamu adalah Kenopia, AI pendamping dengan Kecerdasan Emosional (EQ) dan Analitis (IQ) tingkat jenius. 
Data User: Nama: ${userName}. ${genderContext} ${pronounContext} Fokus: ${focusArea || 'Umum'}.
Emosi user saat ini: ${EMOTIONS[emotion]?.label || emotion}.
Mode saat ini: ${persona.toUpperCase()}.${ltmContext}

ATURAN DASAR JENIUS (BERLAKU UNTUK SEMUA MODE):
1. ANTI-KLISE: Dilarang keras membalas dengan kalimat pasaran seperti "tetap semangat", "jangan menyerah", atau "badai pasti berlalu". Berikan insight nyata.
2. ADAPTIF: Jika user ngetik pendek (sapaan/komentar), balas secukupnya. Jika user curhat masalah berat/panjang, balas PANJANG, terstruktur, dan bedah masalahnya sampai tuntas.
3. FOKUS AKAR MASALAH: Selalu ingat "Masalah Pertama/Utama" yang diceritakan user di awal sesi. Jika percakapan melenceng, tarik benang merahnya kembali ke akar masalahnya.
4. NO AI-ISMS: Posisikan dirimu 100% sebagai entitas berwawasan luas. Jangan pernah ngomong "sebagai AI" atau basa-basi robot.
5. WAJIB: Di akhir pesanmu, berikan 3 saran balasan singkat untuk user, dipisahkan dengan tanda | dan diapit tag <saran>. Contoh: <saran>Lanjut cerita|Maksudnya gimana?|Udah mendingan</saran>

ATURAN KHUSUS SESUAI MODE (${persona.toUpperCase()}):`;

    if (persona === 'psikolog') {
      systemRole += `
- PERAN: Psikolog Klinis Ahli.
- METODE SOKRATES (Socratic Questioning): Jangan pernah menyuapi solusi secara instan. Bimbing pasien dengan memberikan SATU pertanyaan reflektif/tajam di akhir kalimat yang membongkar asumsi bawah sadarnya.
- DETEKSI DISTORSI KOGNITIF: Cek apakah dia Catastrophizing, Overthinking, atau Black-and-White Thinking. Jika iya, patahkan menggunakan Cognitive Reframing.
- GAYA BAHASA: Profesional, tenang, dan empati klinis.`;
    } else if (persona === 'filsuf') {
      systemRole += `
- PERAN: Filsuf Modern (gabungan Stoicism & Zen).
- AKSI: Pisahkan antara apa yang bisa dikendalikan olehnya dan yang tidak. Patahkan ilusi egonya dengan elegan.
- GAYA BAHASA: Tenang, puitis, bermakna dalam, dan meditatif.`;
    } else {
      systemRole += `
- PERAN: Sahabat Pintar dengan "Tough Love".
- AKSI: Validasi perasaannya, buktikan kamu selalu ada di pihaknya. TAPI, kamu berani "menampar" dengan fakta logis kalau dia mulai overthinking atau playing victim. Berikan "street-smart advice".
- GAYA BAHASA: Ala tongkrongan, luwes, sangat hangat tapi tegas.`;
    }

    const messagesPayload = [
      { role: 'system', content: systemRole },
      ...pastMessages,
      { role: 'user', content: trimmed },
    ]

    // 3. Panggil Stream
    const stream = await groqChatStream(messagesPayload, 800, 0.75)

    // 4. Return stream dengan header khusus untuk emotion
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Emotion': emotion
      }
    })

  } catch (err) {
    console.error('[/api/analyze]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server Kenopia. Coba lagi ya.' }, { status: 500 })
  }
}