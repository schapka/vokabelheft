<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProgress } from '@/app/composables/useProgress.ts'

const progress = useProgress()
const route = useRoute()

// compile-time constant, see vite.config.ts
const buildId = __BUILD_ID__

type ResetState = 'idle' | 'confirming' | 'done'
const reset = ref<ResetState>('idle')

function resetAll(): void {
  progress.reset()
  reset.value = 'done'
}

// leaving the page closes the confirmation
watch(() => route.path, () => {
  reset.value = 'idle'
})
</script>

<template>
  <footer class="mt-12 border-t border-border pt-6">
    <nav class="flex flex-wrap gap-3" aria-label="Weitere Funktionen">
      <RouterLink
        :to="{ name: 'help' }"
        class="inline-flex h-10 items-center rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-foreground no-underline hover:bg-border/40"
      >
        Hilfe
      </RouterLink>
      <button
        type="button"
        class="inline-flex h-10 items-center rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-foreground hover:bg-border/40"
        :aria-expanded="reset === 'confirming' ? 'true' : 'false'"
        @click="reset = reset === 'confirming' ? 'idle' : 'confirming'"
      >
        Fortschritt löschen
      </button>
    </nav>

    <div v-if="reset === 'confirming'" role="alertdialog" class="mt-4 rounded-lg border border-danger bg-danger-background p-4">
      <p class="font-medium text-danger">
        Wirklich den gesamten Fortschritt auf diesem Gerät löschen?
      </p>
      <p class="mt-1 text-sm text-foreground-muted">
        Alle Wörter beginnen wieder bei null. Das lässt sich nicht rückgängig machen.
      </p>
      <div class="mt-4 flex gap-3">
        <button
          type="button"
          class="inline-flex h-10 items-center rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-foreground hover:bg-border/40"
          @click="reset = 'idle'"
        >
          Abbrechen
        </button>
        <button
          type="button"
          class="inline-flex h-10 items-center rounded-lg border border-danger bg-surface px-4 text-sm font-medium text-danger hover:bg-danger-background"
          @click="resetAll"
        >
          Ja, alles löschen
        </button>
      </div>
    </div>
    <p v-else-if="reset === 'done'" role="status" class="mt-4 text-sm text-foreground-muted">
      Fortschritt gelöscht.
    </p>

    <div class="mt-6 space-y-1 text-sm text-foreground-muted">
      <p>Der Fortschritt wird nur auf diesem Gerät gespeichert.</p>
      <p>Die Listen sind von Fotos abgetippt. Wenn etwas komisch aussieht: im Heft nachschauen.</p>
      <p class="text-xs">
        Version {{ buildId }}
      </p>
    </div>
  </footer>
</template>
