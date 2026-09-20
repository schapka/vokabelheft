import type { RouteLocationNormalized, Router } from 'vue-router'
import { shallowRef } from 'vue'

/**
 * Remembers the route the user navigated away from, so a page like the help
 * can offer "back to the lesson" instead of always "back to the overview".
 * Only in-app navigation counts; a fresh start has no previous route.
 */
const previous = shallowRef<RouteLocationNormalized | null>(null)

export function trackPreviousRoute(router: Router): void {
  router.afterEach((_to, from) => {
    previous.value = from.name ? from : null
  })
}

export function usePreviousRoute() {
  return { previous }
}
