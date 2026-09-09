<script setup lang="ts">
import { FlaskConical, GraduationCap } from 'lucide-vue-next'
import { watch } from 'vue'

import ChannelPanel from './components/ChannelPanel.vue'
import CurrentStepPanel from './components/CurrentStepPanel.vue'
import PlaybackControls from './components/PlaybackControls.vue'
import ProcessTimeline from './components/ProcessTimeline.vue'
import ReceiverPanel from './components/ReceiverPanel.vue'
import SenderPanel from './components/SenderPanel.vue'
import SimulatorConfigPanel from './components/SimulatorConfigPanel.vue'
import { useCrcSimulator } from './composables/useCrcSimulator'
import LaboratoryWorkspace from './laboratory/LaboratoryWorkspace.vue'

const {
  experienceMode,
  inputKind,
  inputValue,
  generator,
  channelMode,
  playbackSpeed,
  simulation,
  laboratorySimulation,
  errorMessage,
  player,
  startSimulation,
  calculateLaboratory,
  applyManualAlteration,
  applyLaboratoryManualAlteration,
  resetSimulation,
  clearLaboratory,
} = useCrcSimulator()

const {
  current,
  currentIndex,
  totalSteps,
  isPlaying,
  canGoNext,
  canGoPrevious,
  progress,
  togglePlay,
  next,
  previous,
  pause,
} = player

watch(experienceMode, (mode) => {
  if (mode === 'lab') pause()
})
</script>

<template>
  <div
    class="flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-slate-200 lg:h-dvh lg:overflow-hidden"
  >
    <header class="shrink-0 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-sm">
      <div
        class="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8"
      >
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex shrink-0 items-center gap-2">
            <span class="size-2 rounded-full bg-cyan-400" aria-hidden="true" />
            <h1 class="text-xl font-bold tracking-tight text-white">CRC Lab</h1>
          </div>
          <p class="hidden truncate text-xs text-slate-500 md:block">
            Explora cómo una trama revela errores mediante división módulo 2.
          </p>
        </div>

        <div
          class="flex rounded-xl border border-slate-800 bg-slate-900 p-1"
          aria-label="Modo de experiencia"
        >
          <button
            type="button"
            class="mode-button"
            :class="experienceMode === 'learn' ? 'mode-button-active' : ''"
            :aria-pressed="experienceMode === 'learn'"
            @click="experienceMode = 'learn'"
          >
            <GraduationCap :size="16" aria-hidden="true" />
            Aprender
          </button>
          <button
            type="button"
            class="mode-button"
            :class="experienceMode === 'lab' ? 'mode-button-active' : ''"
            :aria-pressed="experienceMode === 'lab'"
            @click="experienceMode = 'lab'"
          >
            <FlaskConical :size="16" aria-hidden="true" />
            Laboratorio
          </button>
        </div>
      </div>
    </header>

    <main
      v-if="experienceMode === 'learn'"
      class="mx-auto grid w-full min-w-0 max-w-[1600px] flex-1 gap-3 px-4 py-3 sm:px-6 lg:min-h-0 lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:px-8 xl:grid-cols-[260px_minmax(0,1fr)]"
    >
      <SimulatorConfigPanel
        v-model:input-kind="inputKind"
        v-model:input-value="inputValue"
        v-model:generator="generator"
        v-model:channel-mode="channelMode"
        :experience-mode="experienceMode"
        :error-message="errorMessage"
        :has-simulation="simulation !== null"
        class="h-fit lg:max-h-full lg:overflow-y-auto"
        @start="startSimulation"
      />

      <div
        class="grid min-w-0 gap-3 overflow-hidden lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)_10rem_auto]"
      >
        <ProcessTimeline :stage="current?.stage ?? null" />

        <CurrentStepPanel
          :simulation="simulation"
          :step="current"
          :show-learning="experienceMode === 'learn'"
        />

        <section aria-label="Flujo CRC" class="min-h-0 min-w-0 overflow-hidden">
          <div class="grid h-full min-h-0 min-w-0 gap-2 lg:grid-cols-3">
            <SenderPanel :simulation="simulation" :step="current" />
            <ChannelPanel :simulation="simulation" :step="current" @flip="applyManualAlteration" />
            <ReceiverPanel :simulation="simulation" :step="current" />
          </div>
        </section>

        <PlaybackControls
          v-model:speed="playbackSpeed"
          :current-index="currentIndex"
          :total-steps="totalSteps"
          :progress="progress"
          :is-playing="isPlaying"
          :can-go-previous="canGoPrevious"
          :can-go-next="canGoNext"
          @previous="previous"
          @toggle-play="togglePlay"
          @next="next"
          @reset="resetSimulation"
        />
      </div>
    </main>

    <LaboratoryWorkspace
      v-else
      v-model:input-kind="inputKind"
      v-model:input-value="inputValue"
      v-model:generator="generator"
      v-model:channel-mode="channelMode"
      :simulation="laboratorySimulation"
      :error-message="errorMessage"
      @calculate="calculateLaboratory"
      @clear="clearLaboratory"
      @flip="applyLaboratoryManualAlteration"
    />
  </div>
</template>
