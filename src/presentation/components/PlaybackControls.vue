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
  'update:speed': [value: PlaybackSpeed]
  previous: []
  togglePlay: []
  next: []
  reset: []
}>()
</script>

<template>
  <section
    aria-label="Controles de reproducción"
    class="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5"
  >
    <div class="flex flex-wrap items-center gap-2 lg:flex-nowrap">
      <div class="min-w-32 flex-1">
        <div class="mb-1 flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <span data-testid="playback-step">
            Paso {{ totalSteps === 0 ? 0 : currentIndex + 1 }} de {{ totalSteps }}
          </span>
          <span>{{ Math.round(progress * 100) }}%</span>
        </div>
        <div class="h-1 overflow-hidden rounded-full bg-slate-800">
          <div
            class="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
            :style="{ width: `${progress * 100}%` }"
          />
        </div>
      </div>

      <div class="mx-auto flex items-center gap-1.5">
        <button
          type="button"
          class="control-button"
          :disabled="!canGoPrevious"
          aria-label="Paso anterior"
          @click="emit('previous')"
        >
          <ChevronLeft :size="18" aria-hidden="true" />
          <span class="sr-only">Anterior</span>
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
          <span class="hidden sm:inline">{{ isPlaying ? 'Pausa' : 'Play' }}</span>
        </button>
        <button
          type="button"
          class="control-button"
          :disabled="!canGoNext"
          aria-label="Siguiente paso"
          @click="emit('next')"
        >
          <span class="sr-only">Siguiente</span>
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

      <label class="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
        <span>Velocidad</span>
        <select
          :value="speed"
          class="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
          aria-label="Velocidad de reproducción"
          @change="
            emit('update:speed', ($event.target as HTMLSelectElement).value as PlaybackSpeed)
          "
        >
          <option value="manual">Manual</option>
          <option value="1x">1x</option>
          <option value="2x">2x</option>
        </select>
      </label>
    </div>
  </section>
</template>
