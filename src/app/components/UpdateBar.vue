<script setup lang="ts">
import { useUpdateCheck } from '@/app/composables/useUpdateCheck.ts'
import BaseButton from './BaseButton.vue'

const { updateAvailable, reload } = useUpdateCheck()
</script>

<!-- Shown once a newer build is on the server; reloading picks it up. -->
<template>
  <div
    v-if="updateAvailable"
    role="status"
    class="mb-6 flex items-center justify-between gap-4 rounded-lg border border-accent bg-surface px-4 py-3"
  >
    <span>Es gibt eine neue Version.</span>
    <BaseButton class="max-w-40" @click="reload">
      Neu laden
    </BaseButton>
  </div>
</template>
