/**
 * Validates data/lessons: run with `pnpm validate` (plain Node, no build).
 * Exit code 1 and one line per problem when something is wrong.
 */
import type { Issue } from '../src/domain/lessonSet.ts'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { PORTION_MAX, PORTION_MIN } from '../src/domain/lesson.ts'
import { formatIssue, isLessonFile, validateLessonSet } from '../src/domain/lessonSet.ts'

const LESSONS_DIR = join(import.meta.dirname, '..', 'data', 'lessons')

const issues: Issue[] = []
const files: Record<string, unknown> = {}

for (const name of readdirSync(LESSONS_DIR).sort()) {
  if (!isLessonFile(name))
    continue
  try {
    files[name] = JSON.parse(readFileSync(join(LESSONS_DIR, name), 'utf8'))
  }
  catch (error) {
    issues.push({ file: name, path: '', message: `not valid JSON — ${(error as Error).message}` })
  }
}

const result = validateLessonSet(files)
issues.push(...result.issues)

if (issues.length) {
  for (const issue of issues)
    console.error(`data/lessons/${formatIssue(issue)}`)
  console.error(`\n${issues.length} problem${issues.length === 1 ? '' : 's'} found.`)
  process.exit(1)
}

// portion sizes are a guideline, not a rule — warn, don't fail
for (const lesson of result.lessons) {
  lesson.groups.forEach((size, position) => {
    if (size < PORTION_MIN || size > PORTION_MAX)
      console.warn(`warning: ${lesson.title}: portion ${position + 1} has ${size} words (guideline: ${PORTION_MIN}–${PORTION_MAX})`)
  })
}

const wordCount = result.lessons.reduce((count, lesson) => count + lesson.words.length, 0)
console.log(`OK — ${result.lessons.length} lesson${result.lessons.length === 1 ? '' : 's'}, ${wordCount} words. Order: ${result.lessons.map(lesson => lesson.id).join(', ')}`)
