import type { Lesson, Word } from './lesson.ts'

/**
 * Learning progress, stored per device in localStorage under STORE_KEY:
 *
 *   {
 *     words:   { [wordKey]: { days: ["2026-09-20"], errors: 0, lastError: null } },
 *     lessons: { [lessonId]: { read?: "…", quiz?: "…", written?: "…" } }
 *   }
 *
 * This is the on-device format. Changing it means existing devices lose
 * their progress — add a migration rather than renaming fields.
 *
 * A word "sits" once it has been typed correctly on SITS_AFTER different
 * calendar days. Only the write step records days; quiz mistakes count as
 * errors (making the word a "shaky" candidate) but never as progress.
 *
 * All functions here are pure over a ProgressData object; persistence and
 * reactivity live in the app layer (useProgress, via VueUse's useLocalStorage).
 */

export const STORE_KEY = 'vokabelheft-progress'
export const SITS_AFTER = 2
export const MAX_SHAKY = 15

export interface WordProgress {
  /** local dates (YYYY-MM-DD) on which the word was typed correctly */
  days: string[]
  errors: number
  lastError: string | null
}

export type LessonStep = 'read' | 'quiz' | 'written'

/** the date each step was last completed */
export type LessonProgress = Partial<Record<LessonStep, string>>

export interface ProgressData {
  words: Record<string, WordProgress>
  lessons: Record<string, LessonProgress>
}

export function emptyProgress(): ProgressData {
  return { words: {}, lessons: {} }
}

/** local calendar date as YYYY-MM-DD */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function wordEntry(data: ProgressData, key: string): WordProgress {
  if (!data.words[key])
    data.words[key] = { days: [], errors: 0, lastError: null }
  return data.words[key]
}

export function sits(data: ProgressData, key: string): boolean {
  const entry = data.words[key]
  return !!entry && entry.days.length >= SITS_AFTER
}

export function practiced(data: ProgressData, key: string): boolean {
  const entry = data.words[key]
  return !!entry && (entry.days.length > 0 || entry.errors > 0)
}

export interface CorrectResult {
  /** true if today was not yet recorded for this word */
  newDay: boolean
  /** number of distinct days after recording */
  days: number
}

/** Records a correct answer in the write step. */
export function recordCorrectTyped(data: ProgressData, key: string, today: string): CorrectResult {
  const entry = wordEntry(data, key)
  let newDay = false
  if (!entry.days.includes(today)) {
    entry.days.push(today)
    newDay = true
  }
  return { newDay, days: entry.days.length }
}

/** Records a mistake (quiz or write step). Never adds progress. */
export function recordError(data: ProgressData, key: string, today: string): void {
  const entry = wordEntry(data, key)
  entry.errors++
  entry.lastError = today
}

export function lessonProgress(data: ProgressData, id: string): LessonProgress {
  if (!data.lessons[id])
    data.lessons[id] = {}
  return data.lessons[id]
}

export function markStep(data: ProgressData, id: string, step: LessonStep, today: string): void {
  lessonProgress(data, id)[step] = today
}

export function sitsCount(data: ProgressData, lesson: Lesson): number {
  return lesson.words.filter(word => sits(data, word.key)).length
}

/**
 * Words that have been practiced but do not sit yet, across all lessons:
 * most recent mistake first, then most mistakes, then fewest correct days.
 * Capped at MAX_SHAKY.
 */
export function shakyWords(data: ProgressData, lessons: Lesson[]): Word[] {
  const shaky: Word[] = []
  for (const lesson of lessons) {
    for (const word of lesson.words) {
      if (practiced(data, word.key) && !sits(data, word.key))
        shaky.push(word)
    }
  }
  shaky.sort((left, right) => {
    const leftEntry = data.words[left.key]!
    const rightEntry = data.words[right.key]!
    const leftLastError = leftEntry.lastError || ''
    const rightLastError = rightEntry.lastError || ''
    if (leftLastError !== rightLastError)
      return leftLastError < rightLastError ? 1 : -1
    return (rightEntry.errors - leftEntry.errors) || (leftEntry.days.length - rightEntry.days.length)
  })
  return shaky.slice(0, MAX_SHAKY)
}
