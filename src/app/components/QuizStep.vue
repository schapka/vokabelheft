<script setup lang="ts">
import type { Word } from '@/domain/lesson.ts'
import { onBeforeUnmount, ref } from 'vue'
import { shuffle } from '@/app/composables/useRound.ts'
import { clean } from '@/domain/judge.ts'
import PromptWord from './PromptWord.vue'

const props = defineProps<{
  word: Word
  /** words to draw the wrong options from */
  pool: Word[]
}>()

const emit = defineEmits<{
  /** fired immediately on click */
  answered: [correct: boolean]
  /** fired after the feedback pause */
  next: []
}>()

// three distractors with a different English side, mixed with the right one
const distractors = props.pool.filter(candidate => candidate.key !== props.word.key && clean(candidate.foreign) !== clean(props.word.foreign))
const options = shuffle(shuffle(distractors).slice(0, 3).concat([props.word]))

const picked = ref<Word | null>(null)
let timer: number | undefined

function pick(option: Word): void {
  if (picked.value)
    return
  picked.value = option
  const correct = option.key === props.word.key
  emit('answered', correct)
  timer = window.setTimeout(emit, correct ? 550 : 1400, 'next')
}

function optionClass(option: Word): string {
  if (!picked.value)
    return 'border-border-strong bg-surface hover:bg-border/40'
  if (option.key === props.word.key)
    return 'border-success bg-success-background font-medium text-success'
  if (option === picked.value)
    return 'border-danger bg-danger-background text-danger'
  return 'border-border bg-surface opacity-60'
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <PromptWord :german="word.german" />

  <div class="mt-6 grid gap-3">
    <button
      v-for="option in options"
      :key="option.key"
      type="button"
      class="min-h-12 rounded-lg border px-4 py-3 text-left text-lg disabled:cursor-default"
      :class="optionClass(option)"
      :disabled="!!picked"
      @click="pick(option)"
    >
      {{ option.foreign }}
    </button>
  </div>
</template>
