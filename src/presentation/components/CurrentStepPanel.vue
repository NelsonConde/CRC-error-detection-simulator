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
import ResultSummary from './ResultSummary.vue'
import TransmissionVisualizer from './TransmissionVisualizer.vue'

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
    data-testid="current-step-panel"
    class="current-step-panel flex h-full min-h-[28rem] overflow-hidden rounded-xl border border-cyan-400/25 bg-slate-900 p-3 sm:p-4 lg:min-h-0"
    aria-live="polite"
  >
    <div class="step-content flex min-h-0 flex-1 flex-col">
      <div v-if="step" class="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-2">
        <div>
          <p class="mb-1 text-xs font-semibold tracking-[0.16em] text-cyan-400 uppercase">
            {{ stageLabels[step.stage] }}
          </p>
          <h2 class="text-lg font-semibold text-white">{{ step.learning.title }}</h2>
        </div>
        <span class="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
          Step {{ step.index + 1 }}
        </span>
      </div>

      <div v-if="!step" class="grid min-h-0 flex-1 place-items-center text-center">
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
          class="mb-3 flex shrink-0 items-start gap-2 rounded-lg border border-blue-400/20 bg-blue-400/8 px-3 py-2 text-xs leading-relaxed text-blue-100"
        >
          <Info :size="16" class="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
          <p>{{ step.learning.explanation }}</p>
        </div>

        <div
          v-else-if="simulation"
          class="mb-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-700/70 bg-slate-950/55 px-3 py-2 text-[11px] text-slate-400"
          aria-label="Contexto técnico del laboratorio"
        >
          <span
            >Generador
            <strong class="font-mono text-cyan-200">{{ simulation.generator.bits }}</strong></span
          >
          <span
            v-if="step.participants.sender === 'frame-built'"
            class="inline-block min-w-0 max-w-full truncate align-bottom"
          >
            Frame <strong class="font-mono text-slate-200">{{ simulation.sentFrame }}</strong>
          </span>
          <span v-if="step.participants.channel !== 'waiting'">
            Alteraciones
            <strong :class="simulation.alterations.length ? 'text-rose-300' : 'text-teal-300'">
              {{ simulation.alterations.length }}
            </strong>
          </span>
          <span v-if="step.participants.receiver === 'complete'">
            Residuo
            <strong class="font-mono text-slate-200">{{ simulation.result.remainder }}</strong>
          </span>
        </div>

        <div
          class="stage-content-area relative min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
        >
          <Transition name="stage-content">
            <div :key="step.stage" class="stage-content">
              <div v-if="step.stage === 'initial'" class="space-y-2">
                <p class="data-label">Entrada original</p>
                <p class="text-lg text-slate-100 break-words">{{ step.input.value }}</p>
              </div>

              <div
                v-else-if="step.stage === 'encoding' && step.source === 'text'"
                class="space-y-4"
              >
                <TransitionGroup
                  name="encoding-item"
                  tag="div"
                  class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div
                    v-for="encodingStep in completedEncodingSteps"
                    :key="encodingStep.id"
                    class="encoding-card rounded-xl border bg-slate-950/60 p-3 transition-[border-color,background-color,opacity,transform] duration-150"
                    :class="
                      encodingStep.id === step.id
                        ? 'encoding-card-current border-cyan-300/70 bg-cyan-400/8 opacity-100'
                        : 'border-slate-700/70 opacity-55'
                    "
                    :aria-current="encodingStep.id === step.id ? 'step' : undefined"
                  >
                    <p class="mb-2 text-lg font-semibold text-cyan-200">
                      {{ encodingStep.symbol.symbol }}
                    </p>
                    <p class="font-mono text-xs text-slate-300 break-all">
                      {{ encodingStep.symbol.bits }}
                    </p>
                  </div>
                </TransitionGroup>
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

              <TransmissionVisualizer v-else-if="step.stage === 'transmission'" :step="step" />

              <div v-else-if="step.stage === 'channel-ready'" class="grid gap-4 sm:grid-cols-2">
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
                  <p class="text-2xl font-semibold text-slate-100">
                    {{ step.outcome.message.text }}
                  </p>
                </template>
                <template v-else>
                  <p class="data-label">Decodificación no disponible</p>
                  <p class="text-sm text-rose-200">{{ step.outcome.reason }}</p>
                </template>
              </div>

              <ResultSummary
                v-else-if="step.stage === 'result'"
                :result="step.result"
                :sent-frame="simulation?.sentFrame"
                :received-frame="simulation?.receivedFrame"
                embedded
              />
            </div>
          </Transition>
        </div>
      </template>
    </div>
  </section>
</template>
