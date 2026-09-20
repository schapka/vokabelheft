// @vitest-environment happy-dom
import type { Lesson } from '@/domain/lesson.ts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { buildLesson } from '@/domain/lesson.ts'

function lessonOf(id: string, grade: number): Lesson {
  return buildLesson({ id, title: id, language: 'en-GB', schoolYear: 2026, grade, groups: [1], words: [['eins', 'one']] })
}

const sixth = lessonOf('aaaaaaa1', 6)
const second = lessonOf('aaaaaaa2', 2)
const sixthLater = lessonOf('aaaaaaa3', 6)

// the remembered grade is a module singleton read at import, so each test loads it fresh
async function load() {
  vi.resetModules()
  return import('@/app/composables/useGradeFilter.ts')
}

beforeEach(() => {
  localStorage.clear()
})

describe('useGradeFilter', () => {
  it('lists the grades in ascending order', async () => {
    const { useGradeFilter } = await load()
    expect(useGradeFilter([sixth, second, sixthLater], ref([])).grades.value).toEqual([2, 6])
  })

  it('defaults to the grade of the newest lesson', async () => {
    const { useGradeFilter } = await load()
    const { activeGrade, filteredLessons } = useGradeFilter([second, sixth], ref([]))
    expect(activeGrade.value).toBe(6)
    expect(filteredLessons.value).toEqual([sixth])
  })

  it('remembers the chosen grade on the device', async () => {
    const { useGradeFilter, GRADE_KEY } = await load()
    const filter = useGradeFilter([second, sixth], ref([]))
    filter.chooseGrade(2)
    expect(filter.activeGrade.value).toBe(2)
    expect(filter.filteredLessons.value).toEqual([second])
    await nextTick() // the storage write is deferred
    expect(localStorage.getItem(GRADE_KEY)).toBe('2')

    const fresh = await load()
    expect(fresh.useGradeFilter([second, sixth], ref([])).activeGrade.value).toBe(2)
  })

  it('keeps the grade a device has been practising when the other grade gets a newer lesson', async () => {
    const { useGradeFilter } = await load()
    const { activeGrade } = useGradeFilter([sixth, second], ref([sixth.id]))
    expect(activeGrade.value).toBe(6)
  })

  it('falls back when the remembered grade has no lessons', async () => {
    localStorage.setItem('vokabelheft-grade', '4')
    const { useGradeFilter } = await load()
    expect(useGradeFilter([second, sixth], ref([])).activeGrade.value).toBe(6)
  })
})
