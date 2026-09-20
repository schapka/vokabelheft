<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from './BaseButton.vue'

defineProps<{ review: boolean }>()
const router = useRouter()
</script>

<template>
  <p class="text-2xl font-semibold tracking-tight">
    {{ review ? 'Nichts wackelt gerade.' : 'Diese Portion ist leer.' }}
  </p>
  <p v-if="review" class="mt-2 text-foreground-muted">
    Alles, was du geübt hast, sitzt. Such dir eine Lektion aus.
  </p>
  <div class="mt-6 flex gap-3">
    <BaseButton @click="router.push({ name: 'home' })">
      Zur Übersicht
    </BaseButton>
  </div>
</template>
