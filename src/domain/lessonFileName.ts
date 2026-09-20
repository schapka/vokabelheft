/**
 * File-name convention of a lesson: <school-year>-<nn>-<language>-<reference>.json
 *
 *   2026-01-en-1-2.json    school year 2026/27, 1st lesson of that year, English, "1-2" as reference
 *
 * The name is for humans and for ordering (numerically aware, so 2026-02 comes
 * before 2026-10). Renaming a file changes nothing but its position. The
 * school year and language are repeated inside the file; the validator keeps
 * both in sync.
 *
 * Dependency-free on purpose: scripts/new-lesson.ts runs without `pnpm install`.
 */

export const LESSON_FILE_PATTERN = /^(\d{4})-(\d{2})-([a-z]{2})-([a-z0-9-]+)\.json$/

export interface LessonFileName {
  /** calendar year the school year starts in */
  schoolYear: number
  /** running number within the school year, starting at 1 */
  number: number
  /** primary language subtag, e.g. "en" */
  language: string
  /** free text in [a-z0-9-], e.g. the book's unit and list number */
  reference: string
}

export function parseLessonFileName(name: string): LessonFileName | null {
  const match = LESSON_FILE_PATTERN.exec(name)
  if (!match)
    return null
  return { schoolYear: Number(match[1]), number: Number(match[2]), language: match[3]!, reference: match[4]! }
}

export function formatLessonFileName(parts: LessonFileName): string {
  return `${parts.schoolYear}-${String(parts.number).padStart(2, '0')}-${parts.language}-${parts.reference}.json`
}

const fileOrder = new Intl.Collator('en', { numeric: true })

/** display order: numerically aware, so 2 comes before 10 */
export function compareFileNames(left: string, right: string): number {
  return fileOrder.compare(left, right)
}

/** "Vokabelliste 1.3" → "vokabelliste-1-3", "Unité 1" → "unite-1" */
export function toReference(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
