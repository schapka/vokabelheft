import type { Ref } from 'vue'
import type { Lesson } from '@/domain/lesson.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

/** localStorage key: the grade this device practises (0 = not chosen yet) */
export const GRADE_KEY = 'vokabelheft-grade'

const chosenGrade = useLocalStorage<number>(GRADE_KEY, 0)

/**
 * Segments the lessons by school grade. With one grade in the data nothing
 * is filtered; with several, the device remembers the grade it practises
 * and the overview, the shaky words and the badges follow it.
 */
/**
 * @param lessons all lessons, in display order
 * @param seenIds ids of lessons this device has opened — a device that never
 *   chose a grade keeps showing the grade it has been practising
 */
export function useGradeFilter(lessons: Lesson[], seenIds: Ref<string[]>) {
  const grades = computed(() => [...new Set(lessons.map(lesson => lesson.grade))].sort((left, right) => left - right))

  const activeGrade = computed(() => {
    if (grades.value.includes(chosenGrade.value))
      return chosenGrade.value
    // not chosen yet: the grade this device has practised most, else the newest lesson's
    const counts = new Map<number, number>()
    for (const lesson of lessons) {
      if (seenIds.value.includes(lesson.id))
        counts.set(lesson.grade, (counts.get(lesson.grade) ?? 0) + 1)
    }
    const practised = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]
    return practised?.[0] ?? lessons.at(-1)?.grade ?? 0
  })

  const filteredLessons = computed(() => lessons.filter(lesson => lesson.grade === activeGrade.value))

  function chooseGrade(grade: number): void {
    chosenGrade.value = grade
  }

  return { grades, activeGrade, filteredLessons, chooseGrade }
}
