<script setup lang="ts">
import { useTemplateRef } from 'vue'

defineProps<{
  secondary?: boolean
  disabled?: boolean
}>()

const button = useTemplateRef<HTMLButtonElement>('button')
defineExpose({ focus: () => button.value?.focus() })
</script>

<template>
  <button
    ref="button"
    type="button"
    class="h-12 flex-1 rounded-lg px-4 font-medium disabled:cursor-default disabled:opacity-50"
    :class="secondary
      ? 'border border-border-strong bg-surface text-foreground hover:bg-border/40'
      : 'bg-accent text-accent-foreground hover:opacity-90'"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
