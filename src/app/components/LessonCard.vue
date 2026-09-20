<script setup lang="ts">
import type { Lesson } from '@/domain/lesson.ts'
import { computed } from 'vue'
import { useProgress } from '@/app/composables/useProgress.ts'
import { languageName } from '@/domain/lesson.ts'
import { formatSchoolYear } from '@/domain/schoolYear.ts'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{
  lesson: Lesson
  isNew?: boolean
}>()

const progress = useProgress()

const sitting = computed(() => progress.sitsCount(props.lesson))
const total = computed(() => props.lesson.words.length)
const steps = computed(() => {
  const lessonProgress = progress.lessonProgress(props.lesson.id)
  return [
    { label: 'Lesen', done: !!lessonProgress.read },
    { label: 'Ankreuzen', done: !!lessonProgress.quiz },
    { label: 'Schreiben', done: !!lessonProgress.written },
  ]
})
</script>

<template>
  <RouterLink
    :to="{ name: 'lesson', params: { id: lesson.id } }"
    class="block rounded-xl border border-border bg-surface p-4 text-inherit no-underline hover:border-border-strong"
  >
    <div class="flex items-baseline justify-between gap-4">
      <span class="text-lg font-semibold">
        {{ lesson.title }}
        <span v-if="isNew" class="ml-2 rounded-full bg-accent px-2 py-0.5 align-middle text-xs font-medium text-accent-foreground">Neu</span>
      </span>
      <span class="shrink-0 text-sm text-foreground-muted">{{ languageName(lesson.language) }}</span>
    </div>
    <p class="mt-1 text-sm text-foreground-muted">
      Klasse {{ lesson.grade }}, {{ formatSchoolYear(lesson.schoolYear) }}
    </p>
    <p class="mt-1 text-sm text-foreground-muted">
      {{ sitting }} von {{ total }} {{ sitting === 1 ? 'sitzt' : 'sitzen' }}
    </p>
    <ProgressBar class="mt-3" :percent="total ? sitting / total * 100 : 0" />
    <div class="mt-3 flex flex-wrap gap-2 text-sm">
      <span
        v-for="(step, position) in steps"
        :key="step.label"
        class="rounded-full border px-2.5 py-0.5"
        :class="step.done ? 'border-success text-success' : 'border-border text-foreground-muted'"
      >
        {{ position + 1 }} {{ step.label }}<template v-if="step.done"> ✓</template>
      </span>
    </div>
  </RouterLink>
</template>
