<script setup lang="ts">
import { Radio, Zap } from 'lucide-vue-next'
import { computed } from 'vue'

import type { ChannelStatus, CrcSimulation, SimulationStep } from '@/simulation'

const props = defineProps<{
  simulation: CrcSimulation | null
  step: SimulationStep | null
}>()

const emit = defineEmits<{
  flip: [position: number]
}>()

const statusLabels: Readonly<Record<ChannelStatus, string>> = {
  waiting: 'En espera',
  ready: 'Listo',
  transmitting: 'Transmitiendo',
  delivered: 'Entregado',
}

const status = computed(() => props.step?.participants.channel ?? 'waiting')
const isVisible = computed(() => status.value !== 'waiting')
const isManualReady = computed(
  () =>
    props.step?.stage === 'channel-ready' &&
    props.simulation?.configuration.channel.mode === 'manual',
)
const receivedBits = computed(() =>
  props.simulation === null ? [] : Array.from(props.simulation.receivedFrame),
)
const alteredPositions = computed(
  () => new Set(props.simulation?.alterations.map(({ position }) => position) ?? []),
)
</script>

<template>
  <article class="flow-panel" aria-labelledby="channel-title">
    <header class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <Radio :size="18" class="text-blue-300" aria-hidden="true" />
        <h2 id="channel-title" class="font-semibold text-slate-100">Canal</h2>
      </div>
      <span class="status-chip">{{ statusLabels[status] }}</span>
    </header>

    <div v-if="simulation && isVisible" class="mt-4 space-y-3 text-sm">
      <div>
        <p class="data-label">Trama enviada</p>
        <p class="binary-value">{{ simulation.sentFrame }}</p>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="data-label mb-0">Trama en el canal</p>
          <span v-if="isManualReady" class="text-[11px] text-cyan-300">Selecciona bits</span>
        </div>
        <div class="flex flex-wrap gap-1 font-mono" aria-label="Bits de la trama en el canal">
          <button
            v-for="(bit, position) in receivedBits"
            :key="position"
            type="button"
            class="bit-button"
            :class="alteredPositions.has(position) ? 'bit-button-altered' : ''"
            :disabled="!isManualReady"
            :data-altered="alteredPositions.has(position)"
            :aria-label="`Cambiar bit ${position + 1}, valor actual ${bit}`"
            @click="emit('flip', position)"
          >
            {{ bit }}
          </button>
        </div>
      </div>

      <div
        v-if="simulation.alterations.length"
        class="flex items-start gap-2 text-xs text-rose-200"
      >
        <Zap :size="14" class="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Bits alterados:
          {{ simulation.alterations.map(({ position }) => position + 1).join(', ') }}
        </span>
      </div>
      <p v-else class="text-xs text-teal-300">Sin alteraciones registradas.</p>
    </div>
    <p v-else class="mt-5 text-sm text-slate-500">Esperando la trama del emisor.</p>
  </article>
</template>
