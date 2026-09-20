/**
 * Writes data/lessons/lesson.schema.json from the zod schema in src/domain/lesson.ts.
 * Run with `pnpm schema` after changing the schema; tests/lessons.test.ts fails
 * when the committed file is out of date.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { lessonJsonSchema } from '../src/domain/lesson.ts'

const target = join(import.meta.dirname, '..', 'data', 'lessons', 'lesson.schema.json')
writeFileSync(target, `${JSON.stringify(lessonJsonSchema(), null, 2)}\n`)
console.log(`Wrote ${target}`)
