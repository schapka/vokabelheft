<script setup lang="ts">
import { computed } from 'vue'
import AppMark from '@/app/components/AppMark.vue'
import GradeNav from '@/app/components/GradeNav.vue'
import LessonCard from '@/app/components/LessonCard.vue'
import { useGradeFilter } from '@/app/composables/useGradeFilter.ts'
import { useLessons } from '@/app/composables/useLessons.ts'
import { useProgress } from '@/app/composables/useProgress.ts'
import { useSeenLessons } from '@/app/composables/useSeenLessons.ts'

const { lessons } = useLessons()
const progress = useProgress()
const { isNew, seen } = useSeenLessons(lessons)
const { grades, activeGrade, filteredLessons, chooseGrade } = useGradeFilter(lessons, seen)

const shaky = computed(() => progress.shakyWords(filteredLessons.value))
</script>

<template>
  <div class="flex items-center gap-3">
    <AppMark />
    <h1 class="text-2xl font-semibold tracking-tight">
      Vokabeln üben
    </h1>
  </div>
  <p class="mt-2 text-foreground-muted">
    Ein Wort sitzt, wenn du es an zwei verschiedenen Tagen richtig getippt hast.
  </p>

  <GradeNav v-if="grades.length > 1" class="mt-6" :grades="grades" :active="activeGrade" @select="chooseGrade" />

  <div class="grid gap-3" :class="grades.length > 1 ? 'mt-3' : 'mt-8'">
    <RouterLink
      v-if="shaky.length"
      :to="{ name: 'review' }"
      class="block rounded-xl bg-foreground p-4 text-background no-underline hover:opacity-90"
    >
      <span class="block text-lg font-semibold">Wackelkandidaten</span>
      <span class="mt-1 block text-sm opacity-80">
        {{ shaky.length === 1 ? 'Ein Wort, das' : `${shaky.length} Wörter, die` }} noch nicht {{ shaky.length === 1 ? 'sitzt' : 'sitzen' }}. Schreiben, gemischt.
      </span>
    </RouterLink>

    <LessonCard v-for="lesson in filteredLessons" :key="lesson.id" :lesson="lesson" :is-new="isNew(lesson.id)" />
  </div>
</template>
