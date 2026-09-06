<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { computed } from 'vue'

import type { SimulationStage } from '@/simulation'

const props = defineProps<{
  stage: SimulationStage | null
}>()

const groups = [
  { label: 'Mensaje', stages: ['initial', 'encoding'] },
  { label: 'CRC', stages: ['crc-preparation', 'sender-division', 'frame-building'] },
  { label: 'Canal', stages: ['channel-ready', 'transmission'] },
  { label: 'Receptor', stages: ['receiver-ready', 'receiver-division', 'decoding'] },
  { label: 'Resultado', stages: ['result'] },
] as const

const activeGroupIndex = computed(() => {
  const stage = props.stage
  if (stage === null) return -1
  return groups.findIndex(({ stages }) => (stages as readonly string[]).includes(stage))
})
</script>

<template>
  <nav
    aria-label="Progreso de la simulación"
    class="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4"
  >
    <ol class="grid grid-cols-5 gap-2">
      <li
        v-for="(group, index) in groups"
        :key="group.label"
        class="relative flex min-w-0 flex-col items-center gap-2 text-center"
        :aria-current="index === activeGroupIndex ? 'step' : undefined"
      >
        <span
          class="relative z-10 grid size-7 place-items-center rounded-full border text-xs font-bold transition-colors"
          :class="
            index < activeGroupIndex
              ? 'border-teal-400 bg-teal-400 text-slate-950'
              : index === activeGroupIndex
                ? 'border-cyan-300 bg-cyan-300 text-slate-950 ring-4 ring-cyan-400/10'
                : 'border-slate-700 bg-slate-950 text-slate-500'
          "
        >
          <Check v-if="index < activeGroupIndex" :size="14" aria-hidden="true" />
          <span v-else>{{ index + 1 }}</span>
        </span>
        <span
          class="truncate text-[11px] font-medium sm:text-xs"
          :class="index <= activeGroupIndex ? 'text-slate-100' : 'text-slate-500'"
        >
          {{ group.label }}
        </span>
        <span
          v-if="index < groups.length - 1"
          aria-hidden="true"
          class="absolute top-3.5 left-[60%] -z-0 hidden h-px w-[80%] sm:block"
          :class="index < activeGroupIndex ? 'bg-teal-400/70' : 'bg-slate-700'"
        />
      </li>
    </ol>
  </nav>
</template>
