<script setup lang="ts">
import type { Mode } from '@/app/composables/useRound.ts'
import { MODES } from '@/app/composables/useRound.ts'

defineProps<{ mode: Mode }>()
const emit = defineEmits<{ select: [mode: Mode] }>()
</script>

<!-- Segmented control. The three steps are a sequence, so they are numbered. -->
<template>
  <div class="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1">
    <button
      v-for="(step, position) in MODES"
      :key="step.id"
      type="button"
      class="h-10 rounded-md text-sm font-medium"
      :class="mode === step.id ? 'bg-foreground text-background' : 'text-foreground-muted hover:bg-border/40 hover:text-foreground'"
      :aria-pressed="mode === step.id ? 'true' : 'false'"
      @click="emit('select', step.id)"
    >
      <span class="mr-1 opacity-60">{{ position + 1 }}</span>{{ step.label }}
    </button>
  </div>
</template>
