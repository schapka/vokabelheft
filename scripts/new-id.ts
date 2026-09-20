/**
 * Prints a fresh lesson id: 8 hex characters from a random UUID.
 * Run with `pnpm new-id`.
 */
import { randomUUID } from 'node:crypto'

console.log(randomUUID().replaceAll('-', '').slice(0, 8))
