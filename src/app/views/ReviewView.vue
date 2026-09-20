<script setup lang="ts">
import { useRouter } from 'vue-router'
import EmptyStage from '@/app/components/EmptyStage.vue'
import RoundEnd from '@/app/components/RoundEnd.vue'
import RoundHeader from '@/app/components/RoundHeader.vue'
import WriteStep from '@/app/components/WriteStep.vue'
import { useLessons } from '@/app/composables/useLessons.ts'
import { useProgress } from '@/app/composables/useProgress.ts'
import { useRound } from '@/app/composables/useRound.ts'

const router = useRouter()
const { lessons } = useLessons()
const progress = useProgress()
const round = useRound()

// shaky words across all lessons, always in the write step, shuffled
round.start(progress.shakyWords(lessons), 'write')
</script>

<template>
  <RouterLink to="/" class="inline-block rounded-md text-sm text-foreground-muted no-underline hover:text-foreground">
    ← Übersicht
  </RouterLink>
  <h1 class="mt-2 text-2xl font-semibold tracking-tight">
    Wackelkandidaten
  </h1>
  <p class="mt-1 text-foreground-muted">
    Wörter, die noch nicht sitzen — quer durch alle Lektionen.
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
      @home="router.push('/')"
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
