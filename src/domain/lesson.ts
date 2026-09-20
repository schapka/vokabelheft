import { z } from 'zod'

/**
 * Lesson data model.
 *
 * A lesson file (data/lessons/<school-year>-<nn>-<language>-<reference>.json)
 * is validated with `lessonFileSchema` and turned into a `Lesson` for the app
 * with `buildLesson`. `pnpm new-lesson` creates a file that follows every
 * convention here.
 *
 * Progress is keyed by `<lesson id>|<normalised German side>` (see `wordKey`).
 * Renaming `title`/`subject` is free; changing `id` or a German entry resets
 * the progress of the affected words. Both are enforced by validation, not here.
 */

/** opaque: 8 hex characters, generated with `pnpm new-id` */
export const LESSON_ID_PATTERN = /^[0-9a-f]{8}$/

/**
 * Portion size guideline: enough words for a session, few enough to finish it.
 * Not enforced by the schema; the validator warns outside this range.
 */
export const PORTION_MIN = 8
export const PORTION_MAX = 16

/** BCP-47 with a primary subtag and an optional region: en, en-GB, fr-FR */
export const LANGUAGE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/

/** "en-GB" → "en" */
export function primaryLanguage(language: string): string {
  return language.split('-')[0]!
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'Englisch',
  fr: 'Französisch',
  es: 'Spanisch',
  it: 'Italienisch',
  la: 'Latein',
}

/** German display name of a language tag, falling back to the tag itself */
export function languageName(language: string): string {
  return LANGUAGE_NAMES[primaryLanguage(language)] ?? language
}

/**
 * Progress key of a word within a lesson: lower-cased German side, letters only.
 * Stored in localStorage — must never change.
 */
export function wordKey(german: string): string {
  return german.toLowerCase().replace(/[^a-zäöüß]/g, '')
}

function nonBlank(label: string) {
  return z.string().refine(value => value.trim().length > 0, `${label} is empty`)
}

export const wordPairSchema = z.tuple([
  nonBlank('German side'),
  nonBlank('foreign-language side'),
])

export const lessonFileSchema = z
  .object({
    id: z.string().regex(LESSON_ID_PATTERN, 'id must be 8 hex characters (pnpm new-id)').describe('Opaque id: 8 hex characters, generated with `pnpm new-id`. Never changed after publishing: progress is keyed by it.'),
    title: z.string().min(1).describe('Shown in the app, e.g. "Vokabelliste 1.3". Display only, free to change at any time.'),
    language: z.string().regex(LANGUAGE_PATTERN, 'language must be a BCP-47 tag like en-GB').describe('Language being learned, BCP-47: "en-GB", "fr-FR". Drives the read-aloud voice and the display name (Englisch, Französisch). Free to change.'),
    schoolYear: z.int().min(2000).max(2100).describe('Calendar year the school year starts in: 2026 means 2026/27. A school year starts in August. Used for grouping; free to change.'),
    groups: z.array(z.int().positive('group sizes must be positive integers'))
      .describe('Portion sizes in order, e.g. [15, 14, 14]. Must add up to the number of words.'),
    words: z.array(wordPairSchema).min(1, 'a lesson needs at least one word').describe('Word pairs in the order of the book: ["deutsch", "english"]. The German side must be unique within the lesson (compared lower-case, letters only).'),
  })
  .strict()
  .superRefine((lesson, context) => {
    const sum = lesson.groups.reduce((total, size) => total + size, 0)
    if (sum !== lesson.words.length) {
      context.addIssue({
        code: 'custom',
        path: ['groups'],
        message: `group sizes add up to ${sum}, but the lesson has ${lesson.words.length} words`,
      })
    }

    // Two German entries with the same key would share one progress record.
    const seen = new Map<string, number>()
    lesson.words.forEach(([german], position) => {
      if (!german.trim())
        return // already reported as empty
      const key = wordKey(german)
      if (!key) {
        context.addIssue({
          code: 'custom',
          path: ['words', position, 0],
          message: `German side "${german}" contains no letters and would get an empty progress key`,
        })
        return
      }
      const firstPosition = seen.get(key)
      if (firstPosition !== undefined) {
        context.addIssue({
          code: 'custom',
          path: ['words', position, 0],
          message: `German side "${german}" duplicates words[${firstPosition}] ("${lesson.words[firstPosition]![0]}") — same progress key "${key}"`,
        })
      }
      else {
        seen.set(key, position)
      }
    })
  })

/**
 * JSON Schema of a lesson file, for editors and for the agent instructions.
 * Cross-field rules (group sum, unique German side) are not expressible here
 * and live in the superRefine above — documented in AGENTS.md.
 */
export function lessonJsonSchema(): Record<string, unknown> {
  return {
    ...z.toJSONSchema(lessonFileSchema, { io: 'input' }),
    title: 'Vokabelheft lesson',
    description: 'One vocabulary lesson. See AGENTS.md for the rules that JSON Schema cannot express.',
  }
}

export type WordPair = z.infer<typeof wordPairSchema>
export type LessonFile = z.infer<typeof lessonFileSchema>

export interface Word {
  /** position within the lesson, 0-based */
  index: number
  german: string
  /** the foreign-language side, as printed in the book */
  foreign: string
  /** BCP-47 tag of `foreign`, for reading aloud */
  language: string
  /** progress key, see `wordKey` */
  key: string
}

export interface Lesson {
  id: string
  title: string
  /** BCP-47 tag of the language being learned */
  language: string
  /** calendar year the school year starts in */
  schoolYear: number
  words: Word[]
  /** the words split into portions as configured in `groups` */
  groups: Word[][]
}

/**
 * Splits words into portions of the given sizes. If the sizes do not add up
 * (validation prevents this, but the app stays robust) it falls back to three
 * roughly equal portions, like the prototype did.
 */
export function groupWords(words: Word[], sizes: number[] | undefined): Word[][] {
  const groups: Word[][] = []
  let offset = 0
  if (Array.isArray(sizes) && sizes.length) {
    const sum = sizes.reduce((total, size) => total + size, 0)
    if (sum === words.length) {
      for (const size of sizes) {
        groups.push(words.slice(offset, offset + size))
        offset += size
      }
      return groups
    }
  }
  let remaining = words.length
  for (let groupNumber = 0; groupNumber < 3 && remaining > 0; groupNumber++) {
    const size = Math.ceil(remaining / (3 - groupNumber))
    groups.push(words.slice(offset, offset + size))
    offset += size
    remaining -= size
  }
  return groups
}

export function buildLesson(file: LessonFile): Lesson {
  const words: Word[] = file.words.map(([german, foreign], index) => ({
    index,
    german,
    foreign,
    language: file.language,
    key: `${file.id}|${wordKey(german)}`,
  }))
  return {
    id: file.id,
    title: file.title,
    language: file.language,
    schoolYear: file.schoolYear,
    words,
    groups: groupWords(words, file.groups),
  }
}
