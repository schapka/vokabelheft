<script setup lang="ts">
import type { Word } from '@/domain/lesson.ts'
import { useProgress } from '@/app/composables/useProgress.ts'
import ChipButton from './ChipButton.vue'

defineProps<{
  groups: Word[][]
  active: number
}>()

const emit = defineEmits<{ select: [index: number] }>()

const progress = useProgress()

function allSit(group: Word[]): boolean {
  return group.every(word => progress.sits(word.key))
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="mr-1 text-sm text-foreground-muted">Portion</span>
    <ChipButton
      v-for="(group, position) in groups"
      :key="position"
      :pressed="position === active"
      @click="emit('select', position)"
    >
      {{ group[0]!.index + 1 }}–{{ group[group.length - 1]!.index + 1 }}<template v-if="allSit(group)">
        ✓
      </template>
    </ChipButton>
  </div>
</template>
