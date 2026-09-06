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
</script>

<template>
  <article class="flow-panel" aria-labelledby="sender-title">
    <header class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <Cpu :size="18" class="text-cyan-300" aria-hidden="true" />
        <h2 id="sender-title" class="font-semibold text-slate-100">Emisor</h2>
      </div>
      <span class="status-chip">{{ statusLabels[status] }}</span>
    </header>

    <div v-if="simulation" class="mt-4 space-y-3 text-sm">
      <div>
        <p class="data-label">Entrada</p>
        <p class="text-slate-200 break-words">{{ simulation.configuration.input.value }}</p>
      </div>
      <div v-if="visibleData">
        <p class="data-label">Bits de datos</p>
        <p class="binary-value">{{ visibleData }}</p>
      </div>
      <div v-if="showPreparedData">
        <p class="data-label">Datos aumentados</p>
        <p class="binary-value">{{ simulation.sender.augmentedData }}</p>
      </div>
      <template v-if="showFrame">
        <div>
          <p class="data-label">CRC</p>
          <p class="binary-value text-teal-300">{{ simulation.sender.crc }}</p>
        </div>
        <div>
          <p class="data-label">Trama</p>
          <p class="binary-value">{{ simulation.sentFrame }}</p>
        </div>
      </template>
    </div>
    <p v-else class="mt-5 text-sm text-slate-500">
      Inicia una simulación para preparar el mensaje.
    </p>
  </article>
</template>
