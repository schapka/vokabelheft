<script setup lang="ts">
defineProps<{
  grades: number[]
  active: number
}>()

const emit = defineEmits<{ select: [grade: number] }>()
</script>

<!-- Sticky segmented control, shown only when lessons of several grades exist. -->
<template>
  <nav class="sticky-top z-10 -mx-4 bg-background/95 px-4 py-3 backdrop-blur" aria-label="Klasse">
    <div class="grid gap-1 rounded-lg border border-border bg-surface p-1" :style="{ gridTemplateColumns: `repeat(${grades.length}, minmax(0, 1fr))` }">
      <button
        v-for="grade in grades"
        :key="grade"
        type="button"
        class="h-10 rounded-md text-sm font-medium"
        :class="grade === active ? 'bg-foreground text-background' : 'text-foreground-muted hover:bg-border/40 hover:text-foreground'"
        :aria-pressed="grade === active ? 'true' : 'false'"
        @click="emit('select', grade)"
      >
        Klasse {{ grade }}
      </button>
    </div>
  </nav>
</template>
