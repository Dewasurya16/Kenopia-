export type EmotionKey = 'senang' | 'cinta' | 'marah' | 'takut' | 'sedih'

export interface EmotionMeta {
  label: string
  emoji: string
  color: string
  bgDark: string
  bgLight: string
  description: string
  hfLabel: string // HuggingFace output label
}

export const EMOTIONS: Record<EmotionKey, EmotionMeta> = {
  senang: {
    label: 'Senang',
    emoji: '😄',
    color: '#f59e0b',
    bgDark: 'rgba(245,158,11,0.15)',
    bgLight: '#fef3c7',
    description: 'Kamu sedang bahagia!',
    hfLabel: 'LABEL_0',
  },
  cinta: {
    label: 'Cinta',
    emoji: '🥰',
    color: '#f43f5e',
    bgDark: 'rgba(244,63,94,0.15)',
    bgLight: '#ffe4e6',
    description: 'Hatimu penuh kasih sayang',
    hfLabel: 'LABEL_1',
  },
  marah: {
    label: 'Marah',
    emoji: '😡',
    color: '#ef4444',
    bgDark: 'rgba(239,68,68,0.15)',
    bgLight: '#fee2e2',
    description: 'Kamu sedang kesal',
    hfLabel: 'LABEL_2',
  },
  takut: {
    label: 'Takut',
    emoji: '😨',
    color: '#8b5cf6',
    bgDark: 'rgba(139,92,246,0.15)',
    bgLight: '#ede9fe',
    description: 'Kamu sedang cemas',
    hfLabel: 'LABEL_3',
  },
  sedih: {
    label: 'Sedih',
    emoji: '😢',
    color: '#3b82f6',
    bgDark: 'rgba(59,130,246,0.15)',
    bgLight: '#dbeafe',
    description: 'Kamu sedang berduka',
    hfLabel: 'LABEL_4',
  },
}

export const HF_LABEL_MAP: Record<string, EmotionKey> = {
  LABEL_0: 'senang',
  LABEL_1: 'cinta',
  LABEL_2: 'marah',
  LABEL_3: 'takut',
  LABEL_4: 'sedih',
}

export interface ChatMessage {
  id: string
  userMessage: string
  emotion: EmotionKey
  aiResponse: string
  timestamp: string
}

export interface AnalyzeResponse {
  emotion: EmotionKey
  aiResponse: string
  timestamp: string
}
