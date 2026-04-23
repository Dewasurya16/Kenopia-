interface SpeechRecognition extends EventTarget {
  start(): void
  stop(): void
  abort(): void   // ← TAMBAHKAN INI
  onresult: (event: any) => void
  onerror: (event: any) => void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export {}