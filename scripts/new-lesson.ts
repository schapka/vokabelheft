/**
 * Creates a lesson file that follows every convention, so nobody has to know them:
 *
 *   pnpm new-lesson --title "Vokabelliste 1.3" --grade 6 [--language en-GB] [--reference 1-3] [--date 2026-09-20]
 *   node scripts/new-lesson.ts --title "…"        (same, without pnpm)
 *
 * Derives the school year from the date (August starts a new one), takes the
 * next free number for that school year and grade, generates the id, and writes
 * data/lessons/<school-year>-g<grade>-<nn>-<language>-<reference>.json with empty
 * `groups` and `words` to fill in. Prints the path.
 *
 * Only Node built-ins: runs without `pnpm install`.
 */
import { randomUUID } from 'node:crypto'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { formatLessonFileName, parseLessonFileName, toReference } from '../src/domain/lessonFileName.ts'
import { schoolYearOf } from '../src/domain/schoolYear.ts'

const LESSONS_DIR = join(import.meta.dirname, '..', 'data', 'lessons')

const { values } = parseArgs({
  options: {
    title: { type: 'string' },
    grade: { type: 'string' },
    language: { type: 'string', default: 'en-GB' },
    reference: { type: 'string' },
    date: { type: 'string' },
  },
})

if (!values.title || !values.grade) {
  console.error('usage: pnpm new-lesson --title "Vokabelliste 1.3" --grade 6 [--language en-GB] [--reference 1-3] [--date YYYY-MM-DD]')
  process.exit(1)
}
const grade = Number(values.grade)
if (!Number.isInteger(grade) || grade < 1 || grade > 13) {
  console.error(`--grade must be a whole number from 1 to 13, got "${values.grade}"`)
  process.exit(1)
}
if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(values.language)) {
  console.error(`--language must be a BCP-47 tag like en-GB, got "${values.language}"`)
  process.exit(1)
}

const date = values.date ? new Date(values.date) : new Date()
if (Number.isNaN(date.getTime())) {
  console.error(`--date must be YYYY-MM-DD, got "${values.date}"`)
  process.exit(1)
}

const schoolYear = schoolYearOf(date)
const language = values.language.split('-')[0]!
const reference = toReference(values.reference ?? values.title) || 'lesson'

const existingNumbers = readdirSync(LESSONS_DIR)
  .map(parseLessonFileName)
  .filter(parts => parts !== null && parts.schoolYear === schoolYear && parts.grade === grade)
  .map(parts => parts!.number)
const number = Math.max(0, ...existingNumbers) + 1

const fileName = formatLessonFileName({ schoolYear, grade, number, language, reference })
const target = join(LESSONS_DIR, fileName)
if (existsSync(target)) {
  console.error(`${target} already exists`)
  process.exit(1)
}

const lesson = {
  id: randomUUID().replaceAll('-', '').slice(0, 8),
  title: values.title,
  language: values.language,
  schoolYear,
  grade,
  groups: [],
  words: [],
}
writeFileSync(target, `${JSON.stringify(lesson, null, 2)}\n`)
console.log(`data/lessons/${fileName}`)
