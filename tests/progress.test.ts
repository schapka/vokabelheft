import type { Lesson } from '@/domain/lesson.ts'
import { describe, expect, it } from 'vitest'
import { buildLesson } from '@/domain/lesson.ts'
import {
  emptyProgress,
  recordCorrectTyped,
  recordError,
  shakyWords,
  sits,
  sitsCount,
  todayISO,
} from '@/domain/progress.ts'

const lesson: Lesson = buildLesson({
  id: 'ab12cd34',
  title: 'T',
  language: 'en-GB',
  schoolYear: 2026,
  groups: [2],
  words: [['haben', 'to have, had'], ['tausend', 'thousand']],
})
const haben = lesson.words[0]!
const tausend = lesson.words[1]!

describe('keys and dates', () => {
  it('keys progress by lesson id and normalised German side', () => {
    expect(haben.key).toBe('ab12cd34|haben')
    expect(buildLesson({ id: '3f9a1c2e', title: 'T', language: 'en-GB', schoolYear: 2026, groups: [1], words: [['(die) Meinung, (die) Ansicht', 'opinion']] }).words[0]!.key)
      .toBe('3f9a1c2e|diemeinungdieansicht')
  })

  it('formats today as YYYY-MM-DD in local time', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('sits rule', () => {
  it('needs correct answers on two different days', () => {
    const data = emptyProgress()
    expect(recordCorrectTyped(data, haben.key, '2026-09-19')).toEqual({ newDay: true, days: 1 })
    expect(sits(data, haben.key)).toBe(false)

    // same day again: no progress
    expect(recordCorrectTyped(data, haben.key, '2026-09-19')).toEqual({ newDay: false, days: 1 })
    expect(sits(data, haben.key)).toBe(false)

    expect(recordCorrectTyped(data, haben.key, '2026-09-20')).toEqual({ newDay: true, days: 2 })
    expect(sits(data, haben.key)).toBe(true)
    expect(sitsCount(data, lesson)).toBe(1)
  })

  it('errors never add progress but make the word shaky', () => {
    const data = emptyProgress()
    recordError(data, haben.key, '2026-09-20')
    expect(sits(data, haben.key)).toBe(false)
    expect(shakyWords(data, [lesson])).toEqual([haben])
    expect(data.words[haben.key]).toEqual({ days: [], errors: 1, lastError: '2026-09-20' })
  })

  it('a sitting word stays sitting after later mistakes', () => {
    const data = emptyProgress()
    recordCorrectTyped(data, haben.key, '2026-09-19')
    recordCorrectTyped(data, haben.key, '2026-09-20')
    recordError(data, haben.key, '2026-09-21')
    expect(sits(data, haben.key)).toBe(true)
    expect(shakyWords(data, [lesson])).toEqual([])
  })
})

describe('shakyWords order', () => {
  it('puts the most recent mistake first, then most mistakes', () => {
    const data = emptyProgress()
    recordError(data, haben.key, '2026-09-18')
    recordError(data, haben.key, '2026-09-18')
    recordError(data, tausend.key, '2026-09-20')
    expect(shakyWords(data, [lesson]).map(word => word.german)).toEqual(['tausend', 'haben'])

    recordError(data, haben.key, '2026-09-20')
    expect(shakyWords(data, [lesson]).map(word => word.german)).toEqual(['haben', 'tausend'])
  })

  it('ignores words that were never practiced', () => {
    expect(shakyWords(emptyProgress(), [lesson])).toEqual([])
  })
})
