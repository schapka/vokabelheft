<script setup lang="ts">
import ProgressBar from './ProgressBar.vue'
import SoundToggle from './SoundToggle.vue'

defineProps<{
  index: number
  total: number
  right: number
  /** the read step has no tally */
  showTally: boolean
}>()
</script>

<template>
  <div class="mt-8">
    <div class="mb-2 flex items-center justify-between gap-4 text-sm text-foreground-muted">
      <span>
        <template v-if="total">
          Wort {{ Math.min(index + 1, total) }} von {{ total }}<template v-if="showTally">, {{ right }} richtig</template>
        </template>
      </span>
      <SoundToggle />
    </div>
    <ProgressBar :percent="total ? index / total * 100 : 0" />
  </div>
</template>
