<script setup lang="ts">
defineProps<{ german: string }>()
</script>

<template>
  <p class="text-sm text-foreground-muted">
    Deutsch
  </p>
  <p data-testid="prompt" class="mt-1 text-3xl font-semibold tracking-tight">
    {{ german }}
  </p>
</template>
