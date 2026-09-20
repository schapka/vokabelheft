/**
 * A school year is named by the calendar year it starts in: 2026 is 2026/27.
 * Dependency-free on purpose: scripts/new-lesson.ts runs without `pnpm install`.
 */

/** a new school year starts in August */
export const SCHOOL_YEAR_FIRST_MONTH = 8

export function schoolYearOf(date: Date): number {
  return date.getMonth() + 1 >= SCHOOL_YEAR_FIRST_MONTH ? date.getFullYear() : date.getFullYear() - 1
}

/** 2026 → "2026/27" */
export function formatSchoolYear(schoolYear: number): string {
  return `${schoolYear}/${String(schoolYear + 1).slice(-2)}`
}
