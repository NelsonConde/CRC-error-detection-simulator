<script setup lang="ts">
import { Binary, Info } from 'lucide-vue-next'
import { computed } from 'vue'

import type {
  CrcSimulation,
  SimulationStage,
  SimulationStep,
  TextEncodingSimulationStep,
} from '@/simulation'

import CrcDivisionVisualizer from './CrcDivisionVisualizer.vue'
import FrameComposition from './FrameComposition.vue'

const props = defineProps<{
  simulation: CrcSimulation | null
  step: SimulationStep | null
  showLearning: boolean
}>()

const stageLabels: Readonly<Record<SimulationStage, string>> = {
  initial: 'Inicio',
  encoding: 'Codificación',
  'crc-preparation': 'Preparación CRC',
  'sender-division': 'División del emisor',
  'frame-building': 'Formación de trama',
  'channel-ready': 'Canal preparado',
  transmission: 'Transmisión',
  'receiver-ready': 'Receptor preparado',
  'receiver-division': 'División del receptor',
  decoding: 'Decodificación',
  result: 'Resultado',
}

const completedEncodingSteps = computed(() => {
  if (props.simulation === null || props.step === null) return []

  return props.simulation.steps.filter(
    (step): step is TextEncodingSimulationStep =>
      step.index <= (props.step?.index ?? -1) &&
      step.stage === 'encoding' &&
      step.source === 'text',
  )
})
</script>

<template>
  <section
    class="min-h-72 rounded-2xl border border-slate-700/80 bg-slate-900 p-5 sm:p-6"
    aria-live="polite"
  >
    <div v-if="step" class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="mb-1 text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
          {{ stageLabels[step.stage] }}
        </p>
        <h2 class="text-xl font-semibold text-white">{{ step.learning.title }}</h2>
      </div>
      <span class="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
        Step {{ step.index + 1 }}
      </span>
    </div>

    <div v-if="!step" class="grid min-h-56 place-items-center text-center">
      <div>
        <Binary :size="32" class="mx-auto mb-3 text-slate-600" aria-hidden="true" />
        <h2 class="font-semibold text-slate-200">Simulación preparada</h2>
        <p class="mt-1 max-w-sm text-sm text-slate-500">
          Configura el mensaje y pulsa “Iniciar simulación” para explorar cada etapa.
        </p>
      </div>
    </div>

    <template v-else>
      <div
        v-if="showLearning"
        class="mb-5 flex items-start gap-2 rounded-lg border border-blue-400/20 bg-blue-400/8 px-3 py-2.5 text-sm text-blue-100"
      >
        <Info :size="16" class="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
        <p>{{ step.learning.explanation }}</p>
      </div>

      <div v-if="step.stage === 'initial'" class="space-y-2">
        <p class="data-label">Entrada original</p>
        <p class="text-lg text-slate-100 break-words">{{ step.input.value }}</p>
      </div>

      <div v-else-if="step.stage === 'encoding' && step.source === 'text'" class="space-y-4">
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="encodingStep in completedEncodingSteps"
            :key="encodingStep.id"
            class="rounded-xl border border-slate-700 bg-slate-950/60 p-3"
          >
            <p class="mb-2 text-lg font-semibold text-cyan-200">
              {{ encodingStep.symbol.symbol }}
            </p>
            <p class="font-mono text-xs text-slate-300 break-all">
              {{ encodingStep.symbol.bits }}
            </p>
          </div>
        </div>
        <div>
          <p class="data-label">Bits acumulados</p>
          <p class="binary-value text-cyan-100">{{ step.accumulatedBits }}</p>
        </div>
      </div>

      <div v-else-if="step.stage === 'encoding'" class="space-y-2">
        <p class="data-label">Entrada binaria validada</p>
        <p class="binary-value text-cyan-100">{{ step.validatedData }}</p>
      </div>

      <div v-else-if="step.stage === 'crc-preparation'" class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg bg-slate-950/60 p-3">
            <p class="data-label">Datos</p>
            <p class="binary-value">{{ step.data }}</p>
          </div>
          <div class="rounded-lg bg-slate-950/60 p-3">
            <p class="data-label">Ceros añadidos</p>
            <p class="binary-value text-blue-300">{{ step.zeroPadding }}</p>
          </div>
          <div class="rounded-lg bg-slate-950/60 p-3">
            <p class="data-label">Generador · grado {{ step.generator.degree }}</p>
            <p class="binary-value text-teal-300">{{ step.generator.bits }}</p>
          </div>
        </div>
        <div>
          <p class="data-label">Dividendo preparado</p>
          <p class="binary-value">{{ step.augmentedData }}</p>
        </div>
      </div>

      <CrcDivisionVisualizer
        v-else-if="step.stage === 'sender-division' || step.stage === 'receiver-division'"
        :step="step"
      />

      <FrameComposition
        v-else-if="step.stage === 'frame-building'"
        :data="step.data"
        :crc="step.crc"
        :frame="step.frame"
      />

      <div
        v-else-if="step.stage === 'channel-ready' || step.stage === 'transmission'"
        class="grid gap-4 sm:grid-cols-2"
      >
        <div>
          <p class="data-label">Trama enviada</p>
          <p class="binary-value">{{ step.sentFrame }}</p>
        </div>
        <div>
          <p class="data-label">Trama resultante</p>
          <p
            class="binary-value"
            :class="step.alterations.length ? 'text-rose-200' : 'text-teal-200'"
          >
            {{ step.receivedFrame }}
          </p>
        </div>
      </div>

      <div v-else-if="step.stage === 'receiver-ready'">
        <p class="data-label">Trama lista para verificar</p>
        <p class="binary-value">{{ step.receivedFrame }}</p>
      </div>

      <div v-else-if="step.stage === 'decoding'">
        <template v-if="step.outcome.status === 'decoded'">
          <p class="data-label">Mensaje recibido</p>
          <p class="text-2xl font-semibold text-slate-100">{{ step.outcome.message.text }}</p>
        </template>
        <template v-else>
          <p class="data-label">Decodificación no disponible</p>
          <p class="text-sm text-rose-200">{{ step.outcome.reason }}</p>
        </template>
      </div>

      <div v-else-if="step.stage === 'result'" class="space-y-2">
        <p class="data-label">Verificación CRC</p>
        <p
          class="text-xl font-semibold"
          :class="step.result.errorDetected ? 'text-rose-300' : 'text-teal-300'"
        >
          {{ step.result.errorDetected ? 'Error detectado' : 'No se detectaron errores' }}
        </p>
        <p class="font-mono text-sm text-slate-300">Residuo: {{ step.result.remainder }}</p>
      </div>
    </template>
  </section>
</template>
