import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { ref, watch } from 'vue'

/**
 * Notices that a newer build was deployed: compares the build id baked into
 * this bundle with version.json on the server, on start, whenever the app
 * returns to the foreground, and every few minutes while it stays open.
 * Matters for the installed app, which otherwise keeps an old bundle in
 * memory for days.
 */

const CHECK_INTERVAL_MS = 5 * 60 * 1000
const MIN_GAP_MS = 30 * 1000

const updateAvailable = ref(false)
let lastCheck = 0
let started = false

export async function checkForUpdate(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetcher(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' })
    if (!response.ok)
      return false
    const { build } = await response.json() as { build?: string }
    updateAvailable.value = typeof build === 'string' && build !== __BUILD_ID__
  }
  catch {
    // offline or no version.json: nothing to report
  }
  return updateAvailable.value
}

function checkThrottled(): void {
  const now = Date.now()
  if (now - lastCheck < MIN_GAP_MS)
    return
  lastCheck = now
  void checkForUpdate()
}

export function useUpdateCheck() {
  if (!started) {
    started = true
    checkThrottled()
    const visibility = useDocumentVisibility()
    watch(visibility, (state) => {
      if (state === 'visible')
        checkThrottled()
    })
    useIntervalFn(checkThrottled, CHECK_INTERVAL_MS)
  }

  function reload(): void {
    window.location.reload()
  }

  return { updateAvailable, reload }
}
