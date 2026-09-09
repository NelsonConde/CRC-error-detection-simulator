<script setup lang="ts">
import { Cpu } from 'lucide-vue-next'
import { computed } from 'vue'

import type { DataBits } from '@/core'
import type { CrcSimulation, SenderStatus, SimulationStep } from '@/simulation'

const props = defineProps<{
  simulation: CrcSimulation | null
  step: SimulationStep | null
}>()

const statusLabels: Readonly<Record<SenderStatus, string>> = {
  idle: 'En espera',
  encoding: 'Codificando',
  'crc-prepared': 'CRC preparado',
  dividing: 'Dividiendo',
  'frame-built': 'Trama lista',
}

const status = computed(() => props.step?.participants.sender ?? 'idle')
const visibleData = computed<DataBits | null>(() => {
  const step = props.step
  const simulation = props.simulation
  if (step === null || simulation === null || step.stage === 'initial') return null

  if (step.stage === 'encoding') {
    return step.source === 'text' ? step.accumulatedBits : step.validatedData
  }

  return simulation.sender.originalData
})
const showPreparedData = computed(
  () => props.step?.stage === 'crc-preparation' || props.step?.stage === 'sender-division',
)
const showFrame = computed(() => status.value === 'frame-built')
const isActive = computed(() => ['encoding', 'crc-prepared', 'dividing'].includes(status.value))
</script>

<template>
  <article
    class="flow-panel"
    :class="isActive ? 'flow-panel-active' : ''"
    aria-labelledby="sender-title"
  >
    <header class="flex min-w-0 items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2.5">
        <Cpu :size="16" class="text-cyan-300" aria-hidden="true" />
        <h2 id="sender-title" class="text-sm font-semibold text-slate-100">Emisor</h2>
      </div>
      <span class="status-chip">{{ statusLabels[status] }}</span>
    </header>

    <div v-if="simulation" class="flow-panel-body mt-2 flex flex-col text-xs">
      <div class="min-w-0" :class="showFrame ? 'order-4 mt-2' : 'order-1 mb-2'">
        <p class="data-label">Entrada</p>
        <p class="text-value-scroll" tabindex="0">{{ simulation.configuration.input.value }}</p>
      </div>
      <div v-if="visibleData" class="mb-2 min-w-0" :class="showFrame ? 'order-1' : 'order-2'">
        <p class="data-label">Bits de datos</p>
        <p class="binary-value" tabindex="0">{{ visibleData }}</p>
      </div>
      <div
        v-if="showFrame"
        class="sticky top-0 z-10 order-2 mb-2 min-w-0 bg-slate-900"
        data-testid="sender-crc"
      >
        <p class="data-label">CRC</p>
        <p class="binary-value text-teal-300" tabindex="0">{{ simulation.sender.crc }}</p>
      </div>
      <div v-if="showPreparedData" class="order-3 mb-2 min-w-0">
        <p class="data-label">Datos aumentados</p>
        <p class="binary-value" tabindex="0">{{ simulation.sender.augmentedData }}</p>
      </div>
      <div v-if="showFrame" class="order-3 min-w-0">
        <p class="data-label">Trama</p>
        <p class="binary-value" tabindex="0">{{ simulation.sentFrame }}</p>
      </div>
    </div>
    <p v-else class="flow-panel-body mt-2 text-xs text-slate-500">
      Inicia una simulación para preparar el mensaje.
    </p>
  </article>
</template>
