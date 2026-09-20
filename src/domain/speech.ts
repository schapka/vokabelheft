import { primaryLanguage } from './lesson.ts'

/**
 * Reading words aloud with the browser's Web Speech API (no external service).
 * The language comes from the lesson, so the device's locale never decides the
 * voice. Whether it is on is decided by the caller (useSpeech).
 */

export const canSpeak
  = typeof window !== 'undefined'
    && typeof window.speechSynthesis !== 'undefined'
    && typeof window.SpeechSynthesisUtterance !== 'undefined'

let voices: SpeechSynthesisVoice[] = []

function loadVoices(): void {
  try {
    voices = window.speechSynthesis.getVoices() || []
  }
  catch {
    voices = []
  }
}

if (canSpeak) {
  loadVoices()
  try {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
  catch {}
}

/** a voice for exactly this tag (en-GB), else any voice of the language (en-*) */
function pickVoice(language: string): SpeechSynthesisVoice | null {
  const normalise = (tag: string) => tag.replace('_', '-').toLowerCase()
  const wanted = normalise(language)
  const primary = primaryLanguage(wanted)
  return voices.find(voice => normalise(voice.lang) === wanted)
    ?? voices.find(voice => primaryLanguage(normalise(voice.lang)) === primary)
    ?? null
}

/** Text as spoken: "(= organise)" becomes "or organise", brackets are dropped. */
export function spokenForm(text: string): string {
  return text.replace(/\(=\s*/g, 'or ').replace(/[()]/g, '').replace(/\s+/g, ' ').trim()
}

export function speak(text: string, language: string): void {
  if (!canSpeak)
    return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(spokenForm(text))
    utterance.lang = language
    utterance.rate = 0.85
    const voice = pickVoice(language)
    if (voice)
      utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }
  catch {}
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis.cancel()
  }
  catch {}
}
