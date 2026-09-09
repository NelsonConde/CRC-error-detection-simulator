<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'
import { computed } from 'vue'

import type { CrcSimulation, ReceiverStatus, SimulationStep } from '@/simulation'

const props = defineProps<{
  simulation: CrcSimulation | null
  step: SimulationStep | null
}>()

const statusLabels: Readonly<Record<ReceiverStatus, string>> = {
  waiting: 'En espera',
  ready: 'Trama recibida',
  dividing: 'Verificando',
  decoding: 'Decodificando',
  complete: 'Finalizado',
}

const status = computed(() => props.step?.participants.receiver ?? 'waiting')
const isVisible = computed(() => status.value !== 'waiting')
const showResult = computed(() => status.value === 'complete')
const showDecodedMessage = computed(
  () => status.value === 'decoding' || status.value === 'complete',
)
const isActive = computed(() => ['ready', 'dividing', 'decoding'].includes(status.value))
</script>

<template>
  <article
    class="flow-panel"
    :class="isActive ? 'flow-panel-active' : ''"
    aria-labelledby="receiver-title"
  >
    <header class="flex min-w-0 items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2.5">
        <ShieldCheck :size="16" class="text-teal-300" aria-hidden="true" />
        <h2 id="receiver-title" class="text-sm font-semibold text-slate-100">Receptor</h2>
      </div>
      <span class="status-chip">{{ statusLabels[status] }}</span>
    </header>

    <div v-if="simulation && isVisible" class="flow-panel-body mt-2 space-y-2 text-xs">
      <div class="min-w-0">
        <p class="data-label">Trama recibida</p>
        <p class="binary-value" tabindex="0">{{ simulation.receivedFrame }}</p>
      </div>
      <div v-if="showDecodedMessage">
        <p class="data-label">Mensaje reconstruido</p>
        <p class="text-slate-100 break-words">
          {{ simulation.result.receivedMessage ?? 'No decodificable como UTF-8' }}
        </p>
      </div>
      <Transition name="status-reveal">
        <div v-if="showResult" class="space-y-3">
          <div>
            <p class="data-label">Residuo</p>
            <p class="binary-value" tabindex="0">{{ simulation.result.remainder }}</p>
          </div>
          <p
            class="text-sm font-medium"
            :class="simulation.result.errorDetected ? 'text-rose-300' : 'text-teal-300'"
          >
            {{ simulation.result.errorDetected ? 'Error detectado' : 'No se detectaron errores' }}
          </p>
        </div>
      </Transition>
    </div>
    <p v-else class="flow-panel-body mt-2 text-xs text-slate-500">
      Esperando la transmisión del canal.
    </p>
  </article>
</template>
