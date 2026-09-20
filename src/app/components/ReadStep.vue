<script setup lang="ts">
import type { Word } from '@/domain/lesson.ts'
import { watch } from 'vue'
import { useSpeech } from '@/app/composables/useSpeech.ts'
import { languageName } from '@/domain/lesson.ts'
import BaseButton from './BaseButton.vue'
import PromptWord from './PromptWord.vue'
import SpeakButton from './SpeakButton.vue'

const props = defineProps<{
  word: Word
  revealed: boolean
  canBack: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  reveal: []
  back: []
  next: []
}>()

const { canSpeak, speak } = useSpeech()

watch(() => props.revealed, (revealed) => {
  if (revealed)
    speak(props.word.foreign, props.word.language)
})
</script>

<template>
  <PromptWord :german="word.german" />

  <div class="mt-6 border-t border-border pt-6">
    <p class="text-sm text-foreground-muted">
      {{ languageName(word.language) }}
    </p>
    <div class="mt-1 flex min-h-10 items-center justify-between gap-4">
      <p v-if="revealed" class="text-3xl font-semibold tracking-tight text-accent">
        {{ word.foreign }}
      </p>
      <p v-else class="text-foreground-muted">
        Erst selbst überlegen, dann nachschauen.
      </p>
      <SpeakButton v-if="revealed && canSpeak" :text="word.foreign" :language="word.language" />
    </div>
  </div>

  <div class="mt-6 flex gap-3">
    <BaseButton v-if="!revealed" @click="emit('reveal')">
      Lösung zeigen
    </BaseButton>
    <template v-else>
      <BaseButton v-if="canBack" secondary @click="emit('back')">
        Zurück
      </BaseButton>
      <BaseButton @click="emit('next')">
        {{ isLast ? 'Fertig' : 'Weiter' }}
      </BaseButton>
    </template>
  </div>
</template>
