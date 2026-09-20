<script setup lang="ts">
defineProps<{
  pressed?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <button
    type="button"
    class="h-10 rounded-full border px-4 text-sm font-medium disabled:cursor-default disabled:opacity-50"
    :class="pressed ? 'border-foreground bg-foreground text-background' : 'border-border-strong bg-surface text-foreground hover:bg-border/40'"
    :aria-pressed="pressed ? 'true' : 'false'"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
