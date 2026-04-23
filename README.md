# 💜 Kenopia v2.0 — Emotion-Aware AI Companion

> Platform curhat berbasis AI yang memahami emosi dalam Bahasa Indonesia.
> Ditenagai oleh **IndoBERT** untuk deteksi emosi + **Claude AI** untuk respons empatik.

---

## ✨ Fitur Baru (v2.0)

| Fitur | Deskripsi |
|-------|-----------|
| 🤖 Dual AI | IndoBERT deteksi emosi + Claude untuk respons personal |
| 💬 Chat Interface | UI chat modern dengan riwayat percakapan |
| 📊 Emotion Analytics | Grafik distribusi emosi dari semua curhatan |
| 🌙 Dark / Light Mode | Tampilan nyaman di segala kondisi |
| 📱 Responsive | Optimal di desktop & mobile |
| 🔒 Privacy-first | Riwayat tersimpan lokal di browser, tidak ke server |
| ⚡ Vercel-ready | Deploy 1 klik ke Vercel |

---

## 🛠️ Tech Stack

```
Frontend:  Next.js 14 (App Router) + TypeScript
Styling:   Tailwind CSS + CSS Variables
AI:        Claude API (Anthropic) + HuggingFace Inference API
Charts:    Recharts
Animation: Framer Motion + CSS animations
Hosting:   Vercel (recommended)
```

---

## 🚀 Cara Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi:

```env
ANTHROPIC_API_KEY=sk-ant-...       # Wajib
HUGGINGFACE_API_KEY=hf_...         # Opsional
HF_MODEL_ID=username/model-name    # Opsional
```

**Cara dapat API keys:**
- **Anthropic (Claude):** https://console.anthropic.com/ → API Keys
- **HuggingFace:** https://huggingface.co/settings/tokens

### 3. Upload Model IndoBERT ke HuggingFace (Opsional tapi Direkomendasikan)

Jika kamu punya model `.h5` dari proyek sebelumnya:

1. Konversi ke format HuggingFace-compatible:
   ```python
   # convert_model.py
   from transformers import TFBertForSequenceClassification, BertTokenizer
   import tensorflow as tf

   # Load model lama
   model = TFBertForSequenceClassification.from_pretrained(
       'indobenchmark/indobert-base-p2', num_labels=5
   )
   model.load_weights('model/bert-model.h5')

   # Save dalam format HuggingFace
   model.save_pretrained('./kenopia-model')

   # Upload tokenizer juga
   from transformers import AutoTokenizer
   tokenizer = AutoTokenizer.from_pretrained('indobenchmark/indobert-base-p2')
   tokenizer.save_pretrained('./kenopia-model')
   ```

2. Upload ke HuggingFace Hub:
   ```bash
   pip install huggingface_hub
   huggingface-cli login
   huggingface-cli upload username/kenopia-model ./kenopia-model
   ```

3. Isi `HF_MODEL_ID=username/kenopia-model` di `.env.local`

> **Tanpa HuggingFace:** Claude AI akan otomatis mendeteksi emosi sebagai fallback — tetap akurat!

### 4. Jalankan development server

```bash
npm run dev
```

Buka http://localhost:3000

---

## 📦 Deploy ke Vercel

1. Push kode ke GitHub
2. Buka https://vercel.com/new
3. Import repository kamu
4. Tambahkan environment variables di Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `HUGGINGFACE_API_KEY` (opsional)
   - `HF_MODEL_ID` (opsional)
5. Klik **Deploy** ✅

---

## 📁 Struktur Project

```
kenopia/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts      # API: deteksi emosi + generate respons
│   ├── curhat/
│   │   └── page.tsx          # Halaman chat utama
│   ├── globals.css           # Design tokens & global styles
│   ├── layout.tsx            # Root layout + fonts
│   └── page.tsx              # Landing page
├── components/
│   └── EmotionChart.tsx      # Grafik distribusi emosi
├── lib/
│   └── types.ts              # TypeScript types + emotion config
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎭 Daftar Emosi yang Dideteksi

| Label | Emosi | Warna |
|-------|-------|-------|
| LABEL_0 | 😄 Senang | Amber |
| LABEL_1 | 🥰 Cinta | Rose |
| LABEL_2 | 😡 Marah | Red |
| LABEL_3 | 😨 Takut | Purple |
| LABEL_4 | 😢 Sedih | Blue |

---

## 🔧 Kustomisasi

### Ubah warna emosi
Edit `lib/types.ts` → bagian `EMOTIONS`

### Ubah prompt Claude
Edit `app/api/analyze/route.ts` → fungsi `generateResponse()`

### Tambah emosi baru
1. Tambahkan ke `EmotionKey` type di `lib/types.ts`
2. Tambahkan ke object `EMOTIONS`
3. Update `HF_LABEL_MAP` sesuai output model

---

## 📝 Dibuat untuk Skripsi

Universitas Dian Nuswantoro — Fakultas Ilmu Komputer  
Algoritma: BERT (Bidirectional Encoders from Transformers)  
Model pre-trained: `indobenchmark/indobert-base-p2`

---

© 2025 Kenopia
