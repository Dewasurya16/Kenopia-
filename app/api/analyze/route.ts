import { NextRequest, NextResponse } from 'next/server'
import { EMOTIONS, HF_LABEL_MAP, EmotionKey } from '@/lib/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── Helper: call Groq REST API ────────────────────────────────────────────────
async function groqChat(
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  isJson: boolean = false
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY tidak ditemukan di environment.')

  const bodyPayload: any = {
    model: GROQ_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  }

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
      false
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
  context: { user: string, ai: string }[],
  persona: string,
  profile: { name: string; gender?: string; pronoun?: string; focus?: string }
): Promise<{ reply: string; suggestions: string[] }> {

  const pastMessages = context.flatMap((ctx) => [
    { role: 'user', content: ctx.user },
    { role: 'assistant', content: ctx.ai }
  ])

  const genderContext = profile.gender ? `User adalah seorang ${profile.gender}.` : ""
  const pronounContext = profile.pronoun ? `Gunakan panggilan/gaya bahasa: ${profile.pronoun}.` : "Gunakan panggilan netral/nama."

  // 🔥 PROMPT DEWA V2 (FULL PSIKOLOG PROFESIONAL & MULTI-PERSONA) 🔥
  let systemRole = `Kamu adalah Kenopia, AI pendamping dengan Kecerdasan Emosional (EQ) dan Analitis (IQ) tingkat jenius. 
Data User: Nama: ${profile.name}. ${genderContext} ${pronounContext} Fokus: ${profile.focus || 'Umum'}.
Emosi user saat ini: ${EMOTIONS[emotion]?.label || emotion}.
Mode saat ini: ${persona.toUpperCase()}.

WAJIB MERESPONS DALAM FORMAT JSON SEPERTI INI:
{
  "reply": "isi balasan kamu",
  "suggestions": ["tombol saran 1", "tombol saran 2", "tombol saran 3"]
}

ATURAN DASAR JENIUS (BERLAKU UNTUK SEMUA MODE):
1. ANTI-KLISE: Dilarang keras membalas dengan kalimat pasaran seperti "tetap semangat", "jangan menyerah", atau "badai pasti berlalu". Berikan insight nyata.
2. ADAPTIF: Jika user ngetik pendek (sapaan/komentar), balas secukupnya. Jika user curhat masalah berat/panjang, balas PANJANG, terstruktur, dan bedah masalahnya sampai tuntas.
3. BACA YANG TERSIRAT: Cari akar masalah dari teksnya, bukan sekadar merespons gejalanya.
4. NO AI-ISMS: Posisikan dirimu 100% sebagai entitas berwawasan luas. Jangan pernah ngomong "sebagai AI" atau basa-basi robot.

ATURAN KHUSUS SESUAI MODE (${persona.toUpperCase()}):`;

  if (persona === 'psikolog') {
    systemRole += `
- PERAN: Psikolog Klinis Ahli.
- METODE SOKRATES (Socratic Questioning): Jangan pernah menyuapi solusi secara instan. Bimbing pasien dengan memberikan SATU pertanyaan reflektif/tajam di akhir kalimat yang membongkar asumsi bawah sadarnya.
- DETEKSI DISTORSI KOGNITIF: Cek apakah dia Catastrophizing (mendramatisir), Overthinking, atau Black-and-White Thinking. Jika iya, patahkan "kesalahan logika" itu menggunakan Cognitive Reframing (rasionalitas medis).
- REGULASI SARAF: Jika emosinya panik/marah/takut tinggi, berikan teknik grounding konkrit (misal: Box Breathing atau 5-4-3-2-1).
- GAYA BAHASA: Profesional, tenang, dan empati klinis. Gunakan kata "Saya" dan panggil nama user. Validasi perasaannya secara medis sebelum mengintervensi.`;
  } else if (persona === 'filsuf') {
    systemRole += `
- PERAN: Filsuf Modern (gabungan Stoicism & Zen).
- AKSI: Pisahkan antara apa yang bisa dikendalikan olehnya dan yang tidak. Patahkan ilusi egonya dengan elegan. Tunjukkan betapa kecilnya masalah ini di skala semesta, lalu berikan ketenangan batin yang absolut.
- GAYA BAHASA: Tenang, puitis, bermakna dalam, dan meditatif.`;
  } else {
    systemRole += `
- PERAN: Sahabat Pintar dengan "Tough Love" (Kasih Sayang yang Tegas).
- AKSI: Validasi perasaannya, buktikan kamu selalu ada di pihaknya. TAPI, kamu berani "menampar" dengan fakta logis kalau dia mulai overthinking atau playing victim. Berikan "street-smart advice" (nasihat praktis) yang bisa langsung dieksekusi.
- GAYA BAHASA: Ala tongkrongan, luwes, sangat hangat tapi tegas. (Gunakan aku/kamu atau ikuti gaya bahasa user).`;
  }

  try {
    const rawResult = await groqChat(
      [
        { role: 'system', content: systemRole },
        ...pastMessages,
        { role: 'user', content: text },
      ],
      800, // Token maksimal
      0.75, // Temperatur kreativitas tinggi
      true // isJson = true
    )

    const parsed = JSON.parse(rawResult)
    return {
      reply: parsed.reply || "Aku dengerin kok. Coba ceritain lebih lanjut biar aku bisa bantu lebih dalam.",
      suggestions: parsed.suggestions || ["Lanjut cerita", "Maksudnya gimana?", "Udah mendingan"]
    }
  } catch (err) {
    console.error('[generateResponse]', err)
    return {
      reply: "Koneksiku lagi agak bermasalah nih. Tapi aku tetap baca chat kamu, mau coba kirim ulang?",
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

    // Proses deteksi emosi
    const hfEmotion = await detectEmotionHF(trimmed);
    const emotion = (hfEmotion || await detectEmotionGroq(trimmed)) as EmotionKey;

    // Proses pembuatan respons
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
    return NextResponse.json({ error: 'Terjadi kesalahan pada server Kenopia. Coba lagi ya.' }, { status: 500 })
  }
}