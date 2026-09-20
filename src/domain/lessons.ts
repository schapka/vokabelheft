import type { Lesson } from './lesson.ts'
import { buildLesson } from './lesson.ts'
import { formatIssue, isLessonFile, validateLessonSet } from './lessonSet.ts'

/**
 * Loads all lessons bundled from data/lessons at build time.
 * This is the only module that knows about Vite's import.meta.glob.
 */

const lessonFiles = import.meta.glob('@data/lessons/*.json', {
  eager: true,
  import: 'default',
})

export type LoadResult
  = | { ok: true, lessons: Lesson[] }
    | { ok: false, error: string }

export function loadLessons(): LoadResult {
  const filesByName: Record<string, unknown> = {}
  for (const [path, content] of Object.entries(lessonFiles)) {
    const name = path.slice(path.lastIndexOf('/') + 1)
    if (isLessonFile(name))
      filesByName[name] = content
  }

  const result = validateLessonSet(filesByName)
  if (result.issues.length)
    return { ok: false, error: result.issues.map(formatIssue).join('\n') }
  if (!result.lessons.length)
    return { ok: false, error: 'Es ist noch keine Lektion eingetragen.' }
  return { ok: true, lessons: result.lessons.map(buildLesson) }
}
