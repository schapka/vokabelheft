<script setup lang="ts">
import { useRouter } from 'vue-router'
import EmptyStage from '@/app/components/EmptyStage.vue'
import RoundEnd from '@/app/components/RoundEnd.vue'
import RoundHeader from '@/app/components/RoundHeader.vue'
import WriteStep from '@/app/components/WriteStep.vue'
import { useGradeFilter } from '@/app/composables/useGradeFilter.ts'
import { useLessons } from '@/app/composables/useLessons.ts'
import { useProgress } from '@/app/composables/useProgress.ts'
import { useRound } from '@/app/composables/useRound.ts'
import { useRoundStorage } from '@/app/composables/useRoundStorage.ts'
import { useSeenLessons } from '@/app/composables/useSeenLessons.ts'

const router = useRouter()
const { lessons, allWords } = useLessons()
const { seen } = useSeenLessons(lessons)
const { filteredLessons } = useGradeFilter(lessons, seen)
const progress = useProgress()
const round = useRound()
const storage = useRoundStorage('review', round, allWords)

// shaky words across the lessons of this device's grade, always in the write
// step, shuffled — unless a round was interrupted, then back to that
if (!storage.restore())
  round.start(progress.shakyWords(filteredLessons.value), 'write')
storage.track(() => ({ group: 0, mode: 'write' }))
</script>

<template>
  <RouterLink :to="{ name: 'home' }" class="inline-block rounded-md text-sm text-foreground-muted no-underline hover:text-foreground">
    ← Übersicht
  </RouterLink>
  <h1 class="mt-2 text-2xl font-semibold tracking-tight">
    Wackelkandidaten
  </h1>
  <p class="mt-1 text-foreground-muted">
    Wörter, die noch nicht sitzen — quer durch alle Lektionen deiner Klasse.
  </p>

  <RoundHeader :index="round.state.index" :total="round.total.value" :right="round.state.right" show-tally />

  <section class="mt-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
    <EmptyStage v-if="!round.total.value" review />
    <RoundEnd
      v-else-if="round.finished.value"
      mode="write"
      review
      :right="round.state.right"
      :total="round.total.value"
      :missed="round.missedUnique.value"
      :has-next-group="false"
      @retry-missed="round.retryMissed"
      @home="router.push({ name: 'home' })"
    />
    <WriteStep
      v-else
      :key="round.current.value!.key"
      :word="round.current.value!"
      @answered="correct => round.answered(round.current.value!, correct)"
      @next="round.next"
    />
  </section>
</template>
