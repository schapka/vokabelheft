import type { Lesson, Word } from '@/domain/lesson.ts'
import { loadLessons } from '@/domain/lessons.ts'

const result = loadLessons()
const lessons: Lesson[] = result.ok ? result.lessons : []
const error: string | null = result.ok ? null : result.error

export function useLessons() {
  function findLesson(id: string): Lesson | undefined {
    return lessons.find(lesson => lesson.id === id)
  }
  function allWords(): Word[] {
    return lessons.flatMap(lesson => lesson.words)
  }
  return { lessons, error, findLesson, allWords }
}
