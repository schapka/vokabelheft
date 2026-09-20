import { useLocalStorage } from '@vueuse/core'
import { canSpeak, speak as speakNow, stopSpeaking } from '@/domain/speech.ts'

/** localStorage key of the read-aloud preference */
export const SOUND_KEY = 'vokabelheft-sound'

const enabled = useLocalStorage<boolean>(SOUND_KEY, true)

export function useSpeech() {
  /** reads aloud if sound is on; `force` is for the explicit speaker button */
  function speak(text: string, language: string, force = false): void {
    if (!canSpeak)
      return
    if (enabled.value || force)
      speakNow(text, language)
  }
  function toggle(): void {
    enabled.value = !enabled.value
    if (!enabled.value)
      stopSpeaking()
  }
  return { canSpeak, enabled, speak, toggle }
}
