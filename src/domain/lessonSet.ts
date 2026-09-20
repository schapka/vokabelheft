import type { z } from 'zod'
import type { LessonFile } from './lesson.ts'
import { lessonFileSchema, primaryLanguage } from './lesson.ts'
import { compareFileNames, parseLessonFileName } from './lessonFileName.ts'

/**
 * Validates a whole data/lessons directory. Shared by the CLI validator
 * (scripts/validate.ts), the test suite and the app at startup, so all three
 * agree on what "valid" means.
 *
 * Two independent things:
 *   - the file name (see lessonFileName.ts) decides the position on the
 *     overview page; renaming a file reorders it
 *   - the id inside the file is the opaque, stable identity progress is keyed by
 */

export interface Issue {
  /** file name relative to data/lessons, e.g. "2026-01-en-1-2.json" */
  file: string
  /** zod-style path inside the file, e.g. "words[3][1]"; empty for file-level issues */
  path: string
  message: string
}

export interface LessonSetResult {
  /** valid lessons in display order; empty when there are issues */
  lessons: LessonFile[]
  issues: Issue[]
}

/** JSON Schema next to the data, not a lesson */
export const SCHEMA_FILE = 'lesson.schema.json'

/** true for the files in data/lessons that hold a lesson */
export function isLessonFile(name: string): boolean {
  return name.endsWith('.json') && name !== SCHEMA_FILE
}

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === 'number')
      return `${formatted}[${segment}]`
    return formatted ? `${formatted}.${String(segment)}` : String(segment)
  }, '')
}

function zodIssues(file: string, error: z.ZodError): Issue[] {
  return error.issues.map(issue => ({
    file,
    path: formatPath(issue.path),
    message: issue.message,
  }))
}

export function formatIssue(issue: Issue): string {
  const where = issue.path ? ` → ${issue.path}` : ''
  return `${issue.file}${where}: ${issue.message}`
}

/**
 * @param filesRaw  parsed content of every lesson file, keyed by file name
 */
export function validateLessonSet(filesRaw: Record<string, unknown>): LessonSetResult {
  const issues: Issue[] = []
  const lessons: { file: string, lesson: LessonFile }[] = []
  const fileOfId = new Map<string, string>()

  for (const [file, raw] of Object.entries(filesRaw)) {
    const nameParts = parseLessonFileName(file)
    if (!nameParts) {
      issues.push({ file, path: '', message: 'file name must be <school-year>-<nn>-<language>-<reference>.json, e.g. 2026-01-en-1-2.json (pnpm new-lesson creates it)' })
      continue
    }
    const result = lessonFileSchema.safeParse(raw)
    if (!result.success) {
      issues.push(...zodIssues(file, result.error))
      continue
    }
    const lesson = result.data
    // the file name repeats two fields for humans; they must not drift apart
    if (nameParts.schoolYear !== lesson.schoolYear) {
      issues.push({ file, path: 'schoolYear', message: `schoolYear ${lesson.schoolYear} does not match the file name (${nameParts.schoolYear})` })
      continue
    }
    if (nameParts.language !== primaryLanguage(lesson.language)) {
      issues.push({ file, path: 'language', message: `language "${lesson.language}" does not match the file name ("${nameParts.language}")` })
      continue
    }
    const otherFile = fileOfId.get(lesson.id)
    if (otherFile) {
      issues.push({ file, path: 'id', message: `id "${lesson.id}" is already used by ${otherFile}` })
      continue
    }
    fileOfId.set(lesson.id, file)
    lessons.push({ file, lesson })
  }

  if (issues.length)
    return { lessons: [], issues }

  lessons.sort((left, right) => compareFileNames(left.file, right.file))
  return { lessons: lessons.map(entry => entry.lesson), issues }
}
