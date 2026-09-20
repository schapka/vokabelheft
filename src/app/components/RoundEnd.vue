<script setup lang="ts">
import type { Mode } from '@/app/composables/useRound.ts'
import type { Word } from '@/domain/lesson.ts'
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  mode: Mode
  review: boolean
  right: number
  total: number
  missed: Word[]
  hasNextGroup: boolean
}>()

const emit = defineEmits<{
  restart: []
  retryMissed: []
  toQuiz: []
  toWrite: []
  nextGroup: []
  home: []
}>()

const percent = computed(() => Math.round(props.right / props.total * 100))
const label = computed(() => {
  if (percent.value === 100)
    return 'Alles richtig.'
  if (percent.value >= 80)
    return 'Stark. Nur ein paar Wackelkandidaten.'
  if (percent.value >= 50)
    return 'Solide Basis, die Hälfte sitzt.'
  return 'Noch wackelig — nochmal lesen hilft.'
})
</script>

<template>
  <template v-if="mode === 'read'">
    <p class="text-2xl font-semibold tracking-tight">
      Alle {{ total }} gelesen.
    </p>
    <p class="mt-2 text-foreground-muted">
      Jetzt Schritt 2: Ankreuzen.
    </p>
    <div class="mt-6 flex gap-3">
      <BaseButton secondary @click="emit('restart')">
        Nochmal lesen
      </BaseButton>
      <BaseButton @click="emit('toQuiz')">
        Zum Ankreuzen
      </BaseButton>
    </div>
  </template>

  <template v-else>
    <p class="text-5xl font-semibold tracking-tight">
      {{ right }}<span class="text-foreground-muted"> / {{ total }}</span>
    </p>
    <p class="mt-2 text-foreground-muted">
      {{ label }}
    </p>

    <ul v-if="missed.length" class="mt-6 divide-y divide-border border-y border-border">
      <li v-for="word in missed" :key="word.key" class="flex items-baseline justify-between gap-4 py-2">
        <span class="truncate text-foreground-muted">{{ word.german }}</span>
        <span class="shrink-0 font-medium">{{ word.foreign }}</span>
      </li>
    </ul>

    <div class="mt-6 flex gap-3">
      <BaseButton v-if="missed.length" secondary @click="emit('retryMissed')">
        Nur die Fehler
      </BaseButton>
      <BaseButton v-if="review" @click="emit('home')">
        Zur Übersicht
      </BaseButton>
      <BaseButton v-else-if="mode === 'quiz'" @click="emit('toWrite')">
        Zum Schreiben
      </BaseButton>
      <BaseButton v-else @click="emit('restart')">
        Nochmal
      </BaseButton>
    </div>
    <div v-if="!review && mode === 'write' && hasNextGroup" class="mt-3 flex gap-3">
      <BaseButton secondary @click="emit('nextGroup')">
        Nächste Portion
      </BaseButton>
    </div>
  </template>
</template>
