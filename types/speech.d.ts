interface SpeechRecognition extends EventTarget {
  start(): void
  stop(): void
  onresult: (event: any) => void
  onerror: (event: any) => void
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition
  webkitSpeechRecognition: new () => SpeechRecognition
}