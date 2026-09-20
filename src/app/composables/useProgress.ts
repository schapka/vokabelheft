import type { Lesson } from '@/domain/lesson.ts'
import type { LessonProgress, LessonStep, ProgressData } from '@/domain/progress.ts'
import { useLocalStorage } from '@vueuse/core'
import {
  emptyProgress,
  markStep as markStepIn,
  recordCorrectTyped,
  recordError,
  shakyWords,
  sits,
  sitsCount,
  STORE_KEY,
  todayISO,
} from '@/domain/progress.ts'

/**
 * Reactive wrapper around the pure progress functions. One shared instance
 * for the whole app; useLocalStorage persists every change and keeps
 * multiple tabs in sync.
 */
const data = useLocalStorage<ProgressData>(STORE_KEY, emptyProgress(), { mergeDefaults: true })

export function useProgress() {
  return {
    sits: (key: string) => sits(data.value, key),
    sitsCount: (lesson: Lesson) => sitsCount(data.value, lesson),
    shakyWords: (lessons: Lesson[]) => shakyWords(data.value, lessons),
    lessonProgress: (id: string): LessonProgress => data.value.lessons[id] ?? {},

    recordCorrectTyped: (key: string) => recordCorrectTyped(data.value, key, todayISO()),
    recordError: (key: string) => recordError(data.value, key, todayISO()),
    markStep: (id: string, step: LessonStep) => markStepIn(data.value, id, step, todayISO()),
    reset: () => {
      data.value = emptyProgress()
    },
  }
}
