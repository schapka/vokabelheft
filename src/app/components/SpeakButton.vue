<script setup lang="ts">
import { useSpeech } from '@/app/composables/useSpeech.ts'

const props = defineProps<{
  text: string
  language: string
}>()

const { speak } = useSpeech()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-base hover:bg-border/40"
    aria-label="Wort anhören"
    @click="speak(props.text, props.language, true)"
  >
    🔊
  </button>
</template>
