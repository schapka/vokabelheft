import type { Mode, Round, RoundSnapshot } from './useRound.ts'
import type { Word } from '@/domain/lesson.ts'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'
import { watch } from 'vue'

/**
 * Keeps the current round in localStorage so that leaving the page (help,
 * overview, an iOS reload of the installed app) brings the child back to the
 * same word. One round at a time; a round older than MAX_AGE_MS or belonging
 * to another scope is ignored.
 */

export const ROUND_KEY = 'vokabelheft-round'
const MAX_AGE_MS = 6 * 60 * 60 * 1000

export interface StoredRound extends RoundSnapshot {
  /** lesson id, or "review" for the shaky-words round */
  scope: string
  group: number
  mode: Mode
  savedAt: number
}

// the default is null, so the serializer cannot be guessed and must be explicit
const stored = useLocalStorage<StoredRound | null>(ROUND_KEY, null, { serializer: StorageSerializers.object })

export function useRoundStorage(scope: string, round: Round, words: () => Word[]) {
  /** restores a fresh round of this scope; returns its group and mode, or null */
  function restore(): { group: number, mode: Mode } | null {
    const saved = stored.value
    if (!saved || saved.scope !== scope || Date.now() - saved.savedAt > MAX_AGE_MS)
      return null
    if (!round.restore(saved, words()))
      return null
    return { group: saved.group, mode: saved.mode }
  }

  function clear(): void {
    if (stored.value?.scope === scope)
      stored.value = null
  }

  /** saves every change of the round; a finished round is not worth resuming */
  function track(position: () => { group: number, mode: Mode }): void {
    watch(round.state, () => {
      if (round.finished.value) {
        clear()
        return
      }
      stored.value = { scope, ...position(), ...round.snapshot(), savedAt: Date.now() }
    }, { deep: true })
  }

  return { restore, clear, track }
}
