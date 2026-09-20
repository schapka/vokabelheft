<script setup lang="ts">
defineProps<{
  /** 0–100 */
  percent: number
}>()
</script>

<template>
  <div class="h-1.5 w-full overflow-hidden rounded-full bg-border">
    <div class="h-full rounded-full bg-accent transition-all duration-300" :style="{ width: `${Math.max(0, Math.min(100, percent))}%` }" />
  </div>
</template>
