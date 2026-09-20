<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import { usePreviousRoute } from '@/app/composables/usePreviousRoute.ts'

/**
 * "← Zurück zur Lektion" when the user came from a lesson or the shaky-words
 * round (their round is restored there), "← Übersicht" otherwise.
 */
const { previous } = usePreviousRoute()

const target = computed<{ to: RouteLocationRaw, label: string }>(() => {
  const from = previous.value
  if (from?.name === 'lesson' || from?.name === 'review')
    return { to: { name: from.name, params: from.params }, label: '← Zurück zur Lektion' }
  return { to: { name: 'home' }, label: '← Übersicht' }
})
</script>

<template>
  <RouterLink :to="target.to" class="inline-block rounded-md text-sm text-foreground-muted no-underline hover:text-foreground">
    {{ target.label }}
  </RouterLink>
</template>
