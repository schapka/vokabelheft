<script setup lang="ts">
import { useLessons } from './composables/useLessons.ts'

const { error } = useLessons()
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-6 sm:py-10">
    <template v-if="error">
      <h1 class="text-2xl font-semibold tracking-tight">
        Vokabeln üben
      </h1>
      <div class="mt-6 rounded-lg border border-danger bg-danger-background p-4 text-sm whitespace-pre-line text-danger">
        Die Lektionsdaten lassen sich nicht lesen:
        {{ error }}
      </div>
    </template>
    <RouterView v-else />
  </div>
</template>
