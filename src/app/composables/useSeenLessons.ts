import type { Lesson } from '@/domain/lesson.ts'
import { useLocalStorage } from '@vueuse/core'

/** localStorage key: ids of the lessons this device has already seen */
export const SEEN_LESSONS_KEY = 'vokabelheft-seen-lessons'

const seen = useLocalStorage<string[]>(SEEN_LESSONS_KEY, [])

/**
 * "Neu" badges: a lesson is new until it was opened on this device.
 * On the very first start everything counts as seen, so a fresh device does
 * not show every lesson as new.
 */
export function useSeenLessons(lessons: Lesson[]) {
  if (seen.value.length === 0 && lessons.length)
    seen.value = lessons.map(lesson => lesson.id)

  function isNew(id: string): boolean {
    return !seen.value.includes(id)
  }

  function markSeen(id: string): void {
    if (!seen.value.includes(id))
      seen.value = [...seen.value, id]
  }

  return { isNew, markSeen, seen }
}
