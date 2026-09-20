<script setup lang="ts">
import type { Mode } from '@/app/composables/useRound.ts'
import type { LessonStep } from '@/domain/progress.ts'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EmptyStage from '@/app/components/EmptyStage.vue'
import GroupChips from '@/app/components/GroupChips.vue'
import ModeSwitch from '@/app/components/ModeSwitch.vue'
import QuizStep from '@/app/components/QuizStep.vue'
import ReadStep from '@/app/components/ReadStep.vue'
import RoundEnd from '@/app/components/RoundEnd.vue'
import RoundHeader from '@/app/components/RoundHeader.vue'
import WriteStep from '@/app/components/WriteStep.vue'
import { useLessons } from '@/app/composables/useLessons.ts'
import { useProgress } from '@/app/composables/useProgress.ts'
import { useRound } from '@/app/composables/useRound.ts'
import { useSeenLessons } from '@/app/composables/useSeenLessons.ts'
import { languageName } from '@/domain/lesson.ts'

const props = defineProps<{ id: string }>()

const router = useRouter()
const { lessons, findLesson } = useLessons()
const { markSeen } = useSeenLessons(lessons)
const progress = useProgress()
const round = useRound()

const lesson = computed(() => findLesson(props.id))
const group = ref(0)
const mode = ref<Mode>('read')

function startRound(): void {
  round.start(lesson.value?.groups[group.value] ?? [], mode.value)
}

function setGroup(position: number): void {
  group.value = position
  startRound()
}

function setMode(next: Mode): void {
  mode.value = next
  startRound()
}

watch(lesson, (current) => {
  if (!current) {
    router.replace('/')
    return
  }
  markSeen(current.id)
  group.value = 0
  mode.value = 'read'
  startRound()
}, { immediate: true })

// finishing a round marks the step on the lesson entry
watch(() => round.finished.value, (finished) => {
  if (!finished || !round.total.value || !lesson.value)
    return
  const step: LessonStep = mode.value === 'read' ? 'read' : mode.value === 'quiz' ? 'quiz' : 'written'
  progress.markStep(lesson.value.id, step)
})

const hasNextGroup = computed(() => !!lesson.value && group.value < lesson.value.groups.length - 1)

function nextGroup(): void {
  group.value++
  mode.value = 'read'
  startRound()
}
</script>

<template>
  <template v-if="lesson">
    <RouterLink to="/" class="inline-block rounded-md text-sm text-foreground-muted no-underline hover:text-foreground">
      ← Übersicht
    </RouterLink>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight">
      {{ lesson.title }}
    </h1>
    <p class="mt-1 text-foreground-muted">
      {{ languageName(lesson.language) }}, {{ lesson.words.length }} Wörter
    </p>

    <GroupChips class="mt-8" :groups="lesson.groups" :active="group" @select="setGroup" />
    <ModeSwitch class="mt-4" :mode="mode" @select="setMode" />

    <RoundHeader :index="round.state.index" :total="round.total.value" :right="round.state.right" :show-tally="mode !== 'read'" />

    <section class="mt-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <EmptyStage v-if="!round.total.value" :review="false" />
      <RoundEnd
        v-else-if="round.finished.value"
        :mode="mode"
        :review="false"
        :right="round.state.right"
        :total="round.total.value"
        :missed="round.missedUnique.value"
        :has-next-group="hasNextGroup"
        @restart="startRound"
        @retry-missed="round.retryMissed"
        @to-quiz="setMode('quiz')"
        @to-write="setMode('write')"
        @next-group="nextGroup"
      />
      <ReadStep
        v-else-if="mode === 'read'"
        :word="round.current.value!"
        :revealed="round.state.revealed"
        :can-back="round.state.index > 0"
        :is-last="round.state.index === round.total.value - 1"
        @reveal="round.state.revealed = true"
        @back="round.back"
        @next="round.next"
      />
      <QuizStep
        v-else-if="mode === 'quiz'"
        :key="round.current.value!.key"
        :word="round.current.value!"
        :pool="lesson.words"
        @answered="correct => round.answered(round.current.value!, correct)"
        @next="round.next"
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
</template>
