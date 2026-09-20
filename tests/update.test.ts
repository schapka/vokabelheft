// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { checkForUpdate } from '@/app/composables/useUpdateCheck.ts'

function fetcherReturning(body: unknown, ok = true): typeof fetch {
  return (async () => ({ ok, json: async () => body })) as unknown as typeof fetch
}

describe('checkForUpdate', () => {
  it('reports a newer build on the server', async () => {
    expect(await checkForUpdate(fetcherReturning({ build: 'something-else' }))).toBe(true)
  })

  it('is quiet when the server has the same build', async () => {
    expect(await checkForUpdate(fetcherReturning({ build: __BUILD_ID__ }))).toBe(false)
  })

  it('ignores a missing version file or a failed request', async () => {
    expect(await checkForUpdate(fetcherReturning({}, false))).toBe(false)
    const offline = (async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    expect(await checkForUpdate(offline)).toBe(false)
  })
})
