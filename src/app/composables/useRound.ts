import type { Word } from '@/domain/lesson.ts'
import { computed, reactive } from 'vue'

export type Mode = 'read' | 'quiz' | 'write'

export const MODES: { id: Mode, label: string, hint: string }[] = [
  { id: 'read', label: 'Lesen', hint: 'kennenlernen' },
  { id: 'quiz', label: 'Ankreuzen', hint: 'wiedererkennen' },
  { id: 'write', label: 'Schreiben', hint: 'selbst tippen' },
]

export function shuffle<Item>(items: Item[]): Item[] {
  const shuffled = items.slice()
  for (let position = shuffled.length - 1; position > 0; position--) {
    const other = Math.floor(Math.random() * (position + 1))
    ;[shuffled[position], shuffled[other]] = [shuffled[other]!, shuffled[position]!]
  }
  return shuffled
}

/** One pass through a list of words: position, tally and the words missed. */
export function useRound() {
  const state = reactive({
    list: [] as Word[],
    index: 0,
    right: 0,
    missed: [] as Word[],
    revealed: false,
    locked: false,
  })

  const total = computed(() => state.list.length)
  const current = computed(() => state.list[state.index])
  const finished = computed(() => state.index >= state.list.length)
  const missedUnique = computed(() => {
    const seen = new Set<string>()
    return state.missed.filter(word => !seen.has(word.key) && seen.add(word.key))
  })

  /** reading keeps the book order, the other steps shuffle */
  function start(words: Word[], mode: Mode): void {
    state.list = mode === 'read' ? words.slice() : shuffle(words)
    state.index = 0
    state.right = 0
    state.missed = []
    state.revealed = false
    state.locked = false
  }

  /** "Nur die Fehler": a new round with just the missed words */
  function retryMissed(): void {
    start(missedUnique.value, 'write')
  }

  function answered(word: Word, correct: boolean): void {
    if (correct)
      state.right++
    else
      state.missed.push(word)
  }

  function next(): void {
    state.index++
    state.revealed = false
    state.locked = false
  }

  function back(): void {
    if (state.index > 0)
      state.index--
  }

  return { state, total, current, finished, missedUnique, start, retryMissed, answered, next, back }
}

export type Round = ReturnType<typeof useRound>
