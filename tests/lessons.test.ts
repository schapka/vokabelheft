import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildLesson, lessonFileSchema, lessonJsonSchema } from '@/domain/lesson.ts'
import { compareFileNames, formatLessonFileName, parseLessonFileName, toReference } from '@/domain/lessonFileName.ts'
import { formatIssue, isLessonFile, validateLessonSet } from '@/domain/lessonSet.ts'
import { formatSchoolYear, schoolYearOf } from '@/domain/schoolYear.ts'

const LESSONS_DIR = join(import.meta.dirname, '..', 'data', 'lessons')

function readLessonsDir(): Record<string, unknown> {
  const files: Record<string, unknown> = {}
  for (const name of readdirSync(LESSONS_DIR)) {
    if (isLessonFile(name))
      files[name] = JSON.parse(readFileSync(join(LESSONS_DIR, name), 'utf8'))
  }
  return files
}

describe('data/lessons', () => {
  it('is valid', () => {
    const result = validateLessonSet(readLessonsDir())
    expect(result.issues.map(formatIssue)).toEqual([])
    expect(result.lessons.length).toBeGreaterThan(0)
  })
})

describe('lessonFileSchema', () => {
  const valid = { id: '3f9a1c2e', title: 'T', language: 'en-GB', schoolYear: 2026, groups: [1, 1], words: [['eins', 'one'], ['zwei', 'two']] }

  function issuesOf(input: unknown): string[] {
    const result = lessonFileSchema.safeParse(input)
    return result.success ? [] : result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
  }

  it('accepts a valid lesson', () => {
    expect(issuesOf(valid)).toEqual([])
  })

  it('rejects bad ids', () => {
    expect(issuesOf({ ...valid, id: 'en-1-2' })).toEqual(['id: id must be 8 hex characters (pnpm new-id)'])
    expect(issuesOf({ ...valid, id: '3F9A1C2E' })).toHaveLength(1)
    expect(issuesOf({ ...valid, id: undefined })[0]).toMatch(/^id:/)
  })

  it('rejects group sizes that do not add up', () => {
    expect(issuesOf({ ...valid, groups: [1] })).toEqual(['groups: group sizes add up to 1, but the lesson has 2 words'])
  })

  it('rejects empty and one-sided pairs', () => {
    expect(issuesOf({ ...valid, words: [['eins', ''], ['', 'two']] })).toEqual([
      'words.0.1: foreign-language side is empty',
      'words.1.0: German side is empty',
    ])
    expect(issuesOf({ ...valid, words: [['eins'], ['zwei', 'two']] })[0]).toMatch(/^words\.0/)
  })

  it('rejects a duplicate German side, even when it only differs in case or punctuation', () => {
    expect(issuesOf({ ...valid, words: [['haben', 'to have'], ['Haben,', 'to own']] })).toEqual([
      'words.1.0: German side "Haben," duplicates words[0] ("haben") — same progress key "haben"',
    ])
  })

  it('rejects unknown fields (probably a typo)', () => {
    expect(issuesOf({ ...valid, titel: 'x' })[0]).toMatch(/titel/)
    expect(issuesOf({ ...valid, subject: 'Englisch' })[0]).toMatch(/subject/)
  })

  it('requires title, language and schoolYear', () => {
    expect(issuesOf({ ...valid, title: '' })[0]).toMatch(/^title:/)
    expect(issuesOf({ ...valid, language: 'english' })).toEqual(['language: language must be a BCP-47 tag like en-GB'])
    expect(issuesOf({ ...valid, schoolYear: '2026' })[0]).toMatch(/^schoolYear:/)
  })
})

describe('validateLessonSet', () => {
  const lessonNamed = (id: string, schoolYear = 2026, language = 'en-GB') => ({ id, title: 'T', language, schoolYear, groups: [1], words: [['eins', 'one']] })

  it('keeps the id independent of the file name', () => {
    const result = validateLessonSet({ '2026-01-en-1-2.json': lessonNamed('3f9a1c2e') })
    expect(result.issues).toEqual([])
    expect(result.lessons.map(lesson => lesson.id)).toEqual(['3f9a1c2e'])
  })

  it('rejects file names outside the convention', () => {
    const result = validateLessonSet({ 'en-1-2.json': lessonNamed('3f9a1c2e') })
    expect(result.issues.map(formatIssue)).toEqual([
      'en-1-2.json: file name must be <school-year>-<nn>-<language>-<reference>.json, e.g. 2026-01-en-1-2.json (pnpm new-lesson creates it)',
    ])
  })

  it('rejects the same id in two files', () => {
    const result = validateLessonSet({ '2026-01-en-a.json': lessonNamed('3f9a1c2e'), '2026-02-en-b.json': lessonNamed('3f9a1c2e') })
    expect(result.issues.map(formatIssue)).toEqual(['2026-02-en-b.json → id: id "3f9a1c2e" is already used by 2026-01-en-a.json'])
    expect(result.lessons).toEqual([])
  })

  it('collects issues from every file', () => {
    const result = validateLessonSet({ '2026-01-en-a.json': { ...lessonNamed('3f9a1c2e'), groups: [2] }, '2026-02-en-b.json': { id: 'B' } })
    expect(result.issues.map(issue => issue.file)).toEqual(['2026-01-en-a.json', ...Array.from({ length: 6 }).fill('2026-02-en-b.json')])
    expect(result.lessons).toEqual([])
  })

  it('keeps file name and fields in sync', () => {
    expect(validateLessonSet({ '2025-01-en-a.json': lessonNamed('3f9a1c2e', 2026) }).issues.map(formatIssue))
      .toEqual(['2025-01-en-a.json → schoolYear: schoolYear 2026 does not match the file name (2025)'])
    expect(validateLessonSet({ '2026-01-fr-a.json': lessonNamed('3f9a1c2e', 2026, 'en-GB') }).issues.map(formatIssue))
      .toEqual(['2026-01-fr-a.json → language: language "en-GB" does not match the file name ("fr")'])
  })

  it('orders lessons by school year and number, not by id', () => {
    const result = validateLessonSet({
      '2027-01-en-3-1.json': lessonNamed('00000003', 2027),
      '2026-10-en-2-4.json': lessonNamed('00000002'),
      '2026-02-en-1-3.json': lessonNamed('00000001'),
    })
    expect(result.issues).toEqual([])
    expect(result.lessons.map(lesson => lesson.id)).toEqual(['00000001', '00000002', '00000003'])
  })

  it('compareFileNames sorts 2 before 10', () => {
    expect(['2026-10-en-a.json', '2026-2-en-a.json', '2026-01-en-a.json'].sort(compareFileNames)).toEqual(['2026-01-en-a.json', '2026-2-en-a.json', '2026-10-en-a.json'])
  })
})

describe('buildLesson', () => {
  it('splits words into the configured groups', () => {
    const lesson = buildLesson({ id: '3f9a1c2e', title: 'T', language: 'fr-FR', schoolYear: 2027, groups: [2, 1], words: [['a', '1'], ['b', '2'], ['c', '3']] })
    expect(lesson.groups.map(group => group.map(word => word.german))).toEqual([['a', 'b'], ['c']])
    expect(lesson.words[0]).toEqual({ index: 0, german: 'a', foreign: '1', language: 'fr-FR', key: '3f9a1c2e|a' })
    expect(lesson.schoolYear).toBe(2027)
  })
})

describe('lesson.schema.json', () => {
  it('matches the zod schema (run `pnpm schema` after changing it)', () => {
    const committed = JSON.parse(readFileSync(join(LESSONS_DIR, 'lesson.schema.json'), 'utf8'))
    expect(committed).toEqual(lessonJsonSchema())
  })
})

describe('lesson file names', () => {
  it('round-trip through parse and format', () => {
    const parts = parseLessonFileName('2026-03-en-unit-1-list-3.json')
    expect(parts).toEqual({ schoolYear: 2026, number: 3, language: 'en', reference: 'unit-1-list-3' })
    expect(formatLessonFileName(parts!)).toBe('2026-03-en-unit-1-list-3.json')
    expect(parseLessonFileName('en-1-2.json')).toBeNull()
  })

  it('toReference makes a safe slug', () => {
    expect(toReference('Vokabelliste 1.3')).toBe('vokabelliste-1-3')
    expect(toReference('Übung: Größe!')).toBe('uebung-groesse')
    expect(toReference('Unité 1')).toBe('unite-1')
  })
})

describe('school year', () => {
  it('starts in August', () => {
    expect(schoolYearOf(new Date(2026, 8, 20))).toBe(2026) // September 2026
    expect(schoolYearOf(new Date(2027, 6, 31))).toBe(2026) // July 2027, still 2026/27
    expect(schoolYearOf(new Date(2027, 7, 1))).toBe(2027) // August 2027
  })

  it('formats as 2026/27', () => {
    expect(formatSchoolYear(2026)).toBe('2026/27')
    expect(formatSchoolYear(2099)).toBe('2099/00')
  })
})
