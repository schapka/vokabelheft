<script setup lang="ts">
import type { Word } from '@/domain/lesson.ts'
import { nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { shuffle } from '@/app/composables/useRound.ts'
import { useSpeech } from '@/app/composables/useSpeech.ts'
import { clean } from '@/domain/judge.ts'
import BaseButton from './BaseButton.vue'
import PromptWord from './PromptWord.vue'

const props = defineProps<{
  word: Word
  /** words to draw the wrong options from */
  pool: Word[]
}>()

const emit = defineEmits<{
  /** fired immediately on click */
  answered: [correct: boolean]
  /** fired after the feedback pause (right answer) or on "Weiter" (wrong answer) */
  next: []
}>()

/** how long a right answer stays on screen before the next word */
const CORRECT_PAUSE = 700

// three distractors with a different English side, mixed with the right one
const distractors = props.pool.filter(candidate => candidate.key !== props.word.key && clean(candidate.foreign) !== clean(props.word.foreign))
const options = shuffle(shuffle(distractors).slice(0, 3).concat([props.word]))

const { speak } = useSpeech()

const nextButton = useTemplateRef<InstanceType<typeof BaseButton>>('nextButton')
// the key, not the word: a ref would wrap the word in a proxy and break identity checks
const picked = ref<string | null>(null)
const correct = ref(false)
let timer: number | undefined

function pick(option: Word): void {
  if (picked.value)
    return
  picked.value = option.key
  correct.value = isRight(option)
  emit('answered', correct.value)
  // hear the right word either way, like the other steps
  speak(props.word.foreign, props.word.language)
  if (correct.value) {
    // a right answer moves on by itself; a wrong one waits for "Weiter" so
    // the child has time to take in both the mistake and the right word
    timer = window.setTimeout(emit, CORRECT_PAUSE, 'next')
  }
  else {
    nextTick(() => setTimeout(() => nextButton.value?.focus(), 30))
  }
}

function isRight(option: Word): boolean {
  return option.key === props.word.key
}

function isWrongPick(option: Word): boolean {
  return option.key === picked.value && !isRight(option)
}

/** the verdict an option carries once an answer is in */
function verdict(option: Word): 'right' | 'wrong' | undefined {
  if (!picked.value)
    return undefined
  if (isRight(option))
    return 'right'
  if (isWrongPick(option))
    return 'wrong'
  return undefined
}

/** the verdict read out with the option, for screen readers */
function optionLabel(option: Word): string | undefined {
  const result = verdict(option)
  if (!result)
    return undefined
  return `${option.foreign}, ${result === 'right' ? 'richtig' : 'falsch'}`
}

function optionClass(option: Word): string {
  if (!picked.value)
    return 'border-border-strong bg-surface hover:bg-border/40'
  if (isRight(option))
    return 'border-success bg-success-background font-medium text-success'
  if (isWrongPick(option))
    return 'border-danger bg-danger-background text-danger line-through'
  return 'border-border bg-surface opacity-50'
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
      class="flex min-h-12 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-lg disabled:cursor-default"
      :class="optionClass(option)"
      :disabled="!!picked"
      :data-verdict="verdict(option)"
      :aria-label="optionLabel(option)"
      @click="pick(option)"
    >
      <span>{{ option.foreign }}</span>
      <span v-if="picked && isRight(option)" aria-hidden="true" class="text-xl font-semibold">✓</span>
      <span v-else-if="isWrongPick(option)" aria-hidden="true" class="text-xl font-semibold">✗</span>
    </button>
  </div>

  <div v-if="picked" class="mt-4 min-h-10" role="status" aria-live="polite">
    <p v-if="correct" class="font-medium text-success">
      Richtig.
    </p>
    <p v-else class="text-danger">
      Falsch. Richtig wäre: <span class="text-lg font-semibold">{{ word.foreign }}</span>
    </p>
  </div>

  <div v-if="picked && !correct" class="mt-4 flex gap-3">
    <BaseButton ref="nextButton" @click="emit('next')">
      Weiter
    </BaseButton>
  </div>
</template>
