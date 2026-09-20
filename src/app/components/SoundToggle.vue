<script setup lang="ts">
import { useSpeech } from '@/app/composables/useSpeech.ts'

const { canSpeak, enabled, toggle } = useSpeech()
</script>

<!-- Read-aloud switch: filled when on, outlined when off. -->
<template>
  <span v-if="!canSpeak" class="text-sm text-foreground-muted">Vorlesen geht hier nicht</span>
  <button
    v-else
    type="button"
    role="switch"
    class="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium"
    :class="enabled
      ? 'border-accent bg-accent text-accent-foreground'
      : 'border-border-strong bg-surface text-foreground-muted hover:text-foreground'"
    :aria-checked="enabled ? 'true' : 'false'"
    @click="toggle"
  >
    <span aria-hidden="true">{{ enabled ? '🔊' : '🔇' }}</span>
    {{ enabled ? 'Vorlesen an' : 'Vorlesen aus' }}
  </button>
</template>
