<script setup lang="ts">
import { computed } from 'vue'

import type { CrcSimulation } from '@/simulation'

const props = defineProps<{
  simulation: CrcSimulation
}>()

const emit = defineEmits<{
  flip: [position: number]
}>()

const receivedBits = computed(() => Array.from(props.simulation.receivedFrame))
const activeAlterations = computed(() =>
  receivedBits.value
    .map((bit, position) => (bit !== props.simulation.sentFrame[position] ? position : null))
    .filter((position): position is number => position !== null),
)
const activePositionsLabel = computed(() =>
  activeAlterations.value.length === 0
    ? 'Ninguno'
    : activeAlterations.value.map((position) => position + 1).join(', '),
)
</script>

<template>
  <div
    class="min-w-0 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/60 p-3"
    aria-label="Editor manual de bits del laboratorio"
  >
    <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-[0.65rem] font-semibold tracking-[0.18em] text-cyan-300">ALTERAR BITS</p>
        <p class="mt-1 text-xs text-slate-400">
          Selecciona los bits que deseas invertir antes de verificar la trama.
        </p>
      </div>
      <span class="rounded-md bg-rose-500/10 px-2 py-1 text-xs text-rose-300">
        Bits alterados: {{ activePositionsLabel }}
      </span>
    </div>

    <div
      class="lab-binary-scroll py-1"
      aria-label="Secuencia editable de bits del laboratorio"
      tabindex="0"
    >
      <div class="flex w-max min-w-full gap-1">
        <button
          v-for="(bit, position) in receivedBits"
          :key="position"
          type="button"
          class="lab-bit-button"
          :class="bit !== simulation.sentFrame[position] ? 'lab-bit-button-altered' : ''"
          :aria-label="`Alterar bit de laboratorio ${position + 1}, valor actual ${bit}`"
          :aria-pressed="bit !== simulation.sentFrame[position]"
          :data-altered="bit !== simulation.sentFrame[position] || undefined"
          @click="emit('flip', position)"
        >
          {{ bit }}
        </button>
      </div>
    </div>

    <ul v-if="simulation.alterations.length > 0" class="mt-2 flex flex-wrap gap-1.5 text-xs">
      <li
        v-for="alteration in simulation.alterations"
        :key="alteration.sequence"
        class="rounded-md border border-rose-500/20 bg-rose-500/5 px-2 py-1 text-rose-200"
      >
        #{{ alteration.position + 1 }}: {{ alteration.previousBit }} → {{ alteration.newBit }}
      </li>
    </ul>
  </div>
</template>
