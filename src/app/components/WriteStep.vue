<script setup lang="ts">
import type { Verdict } from '@/domain/judge.ts'
import type { Word } from '@/domain/lesson.ts'
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useProgress } from '@/app/composables/useProgress.ts'
import { useSpeech } from '@/app/composables/useSpeech.ts'
import { clean, judge } from '@/domain/judge.ts'
import { languageName } from '@/domain/lesson.ts'
import { SITS_AFTER } from '@/domain/progress.ts'
import BaseButton from './BaseButton.vue'
import PromptWord from './PromptWord.vue'
import SpeakButton from './SpeakButton.vue'

const props = defineProps<{ word: Word }>()

const emit = defineEmits<{
  answered: [correct: boolean]
  next: []
}>()

const progress = useProgress()
const { canSpeak, speak } = useSpeech()

const input = useTemplateRef<HTMLInputElement>('input')
const nextButton = useTemplateRef<InstanceType<typeof BaseButton>>('nextButton')

const typed = ref('')
const done = ref(false)
const feedback = ref<{ kind: 'close' | 'good' | 'bad', typed?: string, sits?: string } | null>(null)

onMounted(() => setTimeout(() => input.value?.focus(), 30))

function submit(): void {
  if (!done.value)
    finish(judge(typed.value, props.word.foreign), typed.value)
}

function giveUp(): void {
  finish('no', '')
}

function finish(verdict: Verdict, answer: string): void {
  if (verdict === 'close') {
    // a typo: let them look again, no verdict yet
    feedback.value = { kind: 'close' }
    return
  }
  done.value = true
  const correct = verdict === 'yes'
  emit('answered', correct)
  if (correct) {
    const result = progress.recordCorrectTyped(props.word.key)
    let sits: string | undefined
    if (result.days >= SITS_AFTER && result.newDay)
      sits = 'Das sitzt jetzt.'
    else if (result.newDay && result.days === 1)
      sits = 'Morgen nochmal, dann sitzt es.'
    feedback.value = { kind: 'good', sits }
  }
  else {
    progress.recordError(props.word.key)
    feedback.value = { kind: 'bad', typed: clean(answer) }
  }
  speak(props.word.foreign, props.word.language)
  nextTick(() => setTimeout(() => nextButton.value?.focus(), 30))
}
</script>

<template>
  <PromptWord :german="word.german" />

  <label class="mt-6 block">
    <span class="text-sm text-foreground-muted">{{ languageName(word.language) }}</span>
    <!--
      The attributes switch off autocorrect, suggestions and password managers —
      the typed answer has to be the child's own.
    -->
    <input
      ref="input"
      v-model="typed"
      type="text"
      class="mt-1 block h-12 w-full rounded-lg border bg-surface px-4 text-lg text-foreground placeholder:text-foreground-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
      :class="{
        'border-border-strong': !feedback,
        'border-danger': feedback && feedback.kind !== 'good',
        'border-success': feedback?.kind === 'good',
      }"
      placeholder="Wort tippen"
      :lang="word.language"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="none"
      spellcheck="false"
      writingsuggestions="false"
      enterkeyhint="done"
      data-gramm="false"
      data-1p-ignore="true"
      data-lpignore="true"
      :readonly="done"
      @keydown.enter="submit"
    >
  </label>

  <div class="mt-4 flex min-h-10 items-start justify-between gap-4">
    <p v-if="feedback?.kind === 'close'" class="text-danger">
      Fast. Da ist noch ein Tippfehler drin — schau genau hin.
    </p>
    <p v-else-if="feedback?.kind === 'good'" class="font-medium text-success">
      Richtig.<template v-if="feedback.sits">
        {{ feedback.sits }}
      </template>
    </p>
    <p v-else-if="feedback?.kind === 'bad'" class="text-danger">
      Richtig wäre: <span class="text-lg font-semibold">{{ word.foreign }}</span>
      <span v-if="feedback.typed" class="mt-1 block text-sm text-foreground-muted">Du hattest: {{ feedback.typed }}</span>
    </p>
    <span v-else />
    <SpeakButton v-if="done && canSpeak" :text="word.foreign" :language="word.language" />
  </div>

  <div class="mt-4 flex gap-3">
    <template v-if="!done">
      <BaseButton secondary @click="giveUp">
        Ich weiß es nicht
      </BaseButton>
      <BaseButton @click="submit">
        Prüfen
      </BaseButton>
    </template>
    <BaseButton v-else ref="nextButton" @click="emit('next')">
      Weiter
    </BaseButton>
  </div>
</template>
