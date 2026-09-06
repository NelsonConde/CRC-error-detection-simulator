<script setup lang="ts">
import { FlaskConical, GraduationCap } from 'lucide-vue-next'

import ChannelPanel from './components/ChannelPanel.vue'
import CurrentStepPanel from './components/CurrentStepPanel.vue'
import PlaybackControls from './components/PlaybackControls.vue'
import ProcessTimeline from './components/ProcessTimeline.vue'
import ReceiverPanel from './components/ReceiverPanel.vue'
import ResultSummary from './components/ResultSummary.vue'
import SenderPanel from './components/SenderPanel.vue'
import SimulatorConfigPanel from './components/SimulatorConfigPanel.vue'
import { useCrcSimulator } from './composables/useCrcSimulator'

const {
  experienceMode,
  inputKind,
  inputValue,
  generator,
  channelMode,
  playbackSpeed,
  simulation,
  errorMessage,
  player,
  startSimulation,
  applyManualAlteration,
  resetSimulation,
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
} = player
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-200">
    <header class="border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-sm">
      <div
        class="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <div>
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full bg-cyan-400" aria-hidden="true" />
            <h1 class="text-xl font-bold tracking-tight text-white">CRC Lab</h1>
          </div>
          <p class="mt-1 text-sm text-slate-400">
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
      class="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)]"
    >
      <SimulatorConfigPanel
        v-model:input-kind="inputKind"
        v-model:input-value="inputValue"
        v-model:generator="generator"
        v-model:channel-mode="channelMode"
        v-model:playback-speed="playbackSpeed"
        :error-message="errorMessage"
        :has-simulation="simulation !== null"
        class="h-fit lg:sticky lg:top-5"
        @start="startSimulation"
        @reset="resetSimulation"
      />

      <div class="min-w-0 space-y-5">
        <ProcessTimeline :stage="current?.stage ?? null" />

        <CurrentStepPanel
          :simulation="simulation"
          :step="current"
          :show-learning="experienceMode === 'learn'"
        />

        <section aria-label="Flujo CRC">
          <div
            class="mb-2 flex items-center gap-2 px-1 text-[10px] tracking-[0.16em] text-slate-500 uppercase"
          >
            <span>Emisor</span>
            <span aria-hidden="true">→</span>
            <span>Canal</span>
            <span aria-hidden="true">→</span>
            <span>Receptor</span>
          </div>
          <div class="grid gap-3 xl:grid-cols-3">
            <SenderPanel :simulation="simulation" :step="current" />
            <ChannelPanel :simulation="simulation" :step="current" @flip="applyManualAlteration" />
            <ReceiverPanel :simulation="simulation" :step="current" />
          </div>
        </section>

        <PlaybackControls
          :current-index="currentIndex"
          :total-steps="totalSteps"
          :progress="progress"
          :is-playing="isPlaying"
          :can-go-previous="canGoPrevious"
          :can-go-next="canGoNext"
          :speed="playbackSpeed"
          @previous="previous"
          @toggle-play="togglePlay"
          @next="next"
          @reset="resetSimulation"
        />

        <Transition name="result-reveal" appear>
          <ResultSummary v-if="current?.stage === 'result'" :result="current.result" />
        </Transition>
      </div>
    </main>
  </div>
</template>
