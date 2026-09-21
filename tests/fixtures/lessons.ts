import type { Lesson } from '@/domain/lesson.ts'
import { buildLesson } from '@/domain/lesson.ts'
import { formatIssue, validateLessonSet } from '@/domain/lessonSet.ts'

/**
 * The lesson set the app walkthrough runs on, deliberately not data/lessons:
 * the walkthrough asserts titles, word counts and portion sizes, so every
 * lesson added to the repository would break it. That the real data is a
 * valid set — and stays one — is tests/lessons.test.ts's job.
 *
 * Two lessons of one grade: enough for the overview, the "Neu" badge and a
 * lesson with more than one portion, and few enough to write the expected
 * numbers out by hand.
 */

/** the lesson the walkthrough opens; 8 words in portions of 5 and 3 */
export const FIRST_LESSON = '11111111'
/** first word of the first lesson, as a progress key */
export const FIRST_WORD = `${FIRST_LESSON}|eins`
/** words in the first lesson, as its overview card counts them */
export const FIRST_LESSON_WORDS = 8

const files: Record<string, unknown> = {
  '2026-g06-01-en-eins.json': {
    id: FIRST_LESSON,
    title: 'Testliste 1',
    language: 'en-GB',
    schoolYear: 2026,
    grade: 6,
    groups: [5, 3],
    words: [
      ['eins', 'one'],
      ['zwei', 'two'],
      ['drei', 'three'],
      ['vier', 'four'],
      ['fünf', 'five'],
      ['sechs', 'six'],
      ['sieben', 'seven'],
      ['acht', 'eight'],
    ],
  },
  '2026-g06-02-en-zwei.json': {
    id: '22222222',
    title: 'Testliste 2',
    language: 'en-GB',
    schoolYear: 2026,
    grade: 6,
    groups: [2],
    words: [
      ['neun', 'nine'],
      ['zehn', 'ten'],
    ],
  },
}

/**
 * Runs the fixture through the real validator, so a fixture that stopped being
 * a legal lesson set fails loudly here instead of quietly testing a state the
 * app could never load.
 */
export function fixtureLessons(): Lesson[] {
  const { lessons, issues } = validateLessonSet(files)
  if (issues.length)
    throw new Error(`fixture is not a valid lesson set:\n${issues.map(formatIssue).join('\n')}`)
  return lessons.map(buildLesson)
}
