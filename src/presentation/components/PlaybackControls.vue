<script setup lang="ts">
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-vue-next'

import type { PlaybackSpeed } from '@/presentation/composables/useSimulationPlayer'

defineProps<{
  currentIndex: number
  totalSteps: number
  progress: number
  isPlaying: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  speed: PlaybackSpeed
}>()

const emit = defineEmits<{
  previous: []
  togglePlay: []
  next: []
  reset: []
}>()
</script>

<template>
  <section
    aria-label="Controles de reproducción"
    class="rounded-2xl border border-slate-800 bg-slate-900/65 p-4"
  >
    <div class="mb-3 flex items-center justify-between gap-4 text-xs text-slate-400">
      <span>Paso {{ totalSteps === 0 ? 0 : currentIndex + 1 }} de {{ totalSteps }}</span>
      <span>{{ Math.round(progress * 100) }}%</span>
    </div>
    <div class="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
      <div
        class="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
        :style="{ width: `${progress * 100}%` }"
      />
    </div>
    <div class="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        class="control-button"
        :disabled="!canGoPrevious"
        aria-label="Paso anterior"
        @click="emit('previous')"
      >
        <ChevronLeft :size="18" aria-hidden="true" />
        <span class="hidden sm:inline">Anterior</span>
      </button>
      <button
        type="button"
        class="control-button control-button-primary"
        :disabled="speed === 'manual' || (!isPlaying && !canGoNext)"
        :aria-label="isPlaying ? 'Pausar' : 'Reproducir'"
        @click="emit('togglePlay')"
      >
        <Pause v-if="isPlaying" :size="18" fill="currentColor" aria-hidden="true" />
        <Play v-else :size="18" fill="currentColor" aria-hidden="true" />
        {{ isPlaying ? 'Pausa' : 'Play' }}
      </button>
      <button
        type="button"
        class="control-button"
        :disabled="!canGoNext"
        aria-label="Siguiente paso"
        @click="emit('next')"
      >
        <span class="hidden sm:inline">Siguiente</span>
        <ChevronRight :size="18" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="control-button"
        :disabled="totalSteps === 0"
        aria-label="Reiniciar reproducción"
        @click="emit('reset')"
      >
        <RotateCcw :size="17" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
