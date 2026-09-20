<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppMark from './components/AppMark.vue'
import UpdateBar from './components/UpdateBar.vue'
import { useLessons } from './composables/useLessons.ts'
import { trackPreviousRoute } from './composables/usePreviousRoute.ts'

const { error } = useLessons()
trackPreviousRoute(useRouter())
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-6 sm:py-10">
    <UpdateBar />
    <template v-if="error">
      <div class="flex items-center gap-3">
        <AppMark />
        <h1 class="text-2xl font-semibold tracking-tight">
          Vokabeln üben
        </h1>
      </div>
      <div class="mt-6 rounded-lg border border-danger bg-danger-background p-4 text-sm whitespace-pre-line text-danger">
        Die Lektionsdaten lassen sich nicht lesen:
        {{ error }}
      </div>
    </template>
    <RouterView v-else />
    <AppFooter />
  </div>
</template>
