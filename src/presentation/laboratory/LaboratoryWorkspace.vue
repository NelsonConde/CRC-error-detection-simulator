<script setup lang="ts">
import { Binary, FlaskConical } from 'lucide-vue-next'

import type { CrcSimulation } from '@/simulation'

import type { ChannelMode, InputKind } from '../composables/useCrcSimulator'
import LaboratoryConfigPanel from './LaboratoryConfigPanel.vue'
import LaboratoryResults from './LaboratoryResults.vue'

defineProps<{
  inputKind: InputKind
  inputValue: string
  generator: string
  channelMode: ChannelMode
  simulation: CrcSimulation | null
  errorMessage: string | null
}>()

const emit = defineEmits<{
  'update:inputKind': [value: InputKind]
  'update:inputValue': [value: string]
  'update:generator': [value: string]
  'update:channelMode': [value: ChannelMode]
  calculate: []
  clear: []
  flip: [position: number]
}>()
</script>

<template>
  <main
    class="mx-auto grid w-full max-w-[1600px] flex-1 gap-3 overflow-y-auto px-4 py-3 sm:px-6 lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden lg:px-8"
    aria-label="Laboratorio CRC"
  >
    <LaboratoryConfigPanel
      :input-kind="inputKind"
      :input-value="inputValue"
      :generator="generator"
      :channel-mode="channelMode"
      :error-message="errorMessage"
      @update:input-kind="emit('update:inputKind', $event)"
      @update:input-value="emit('update:inputValue', $event)"
      @update:generator="emit('update:generator', $event)"
      @update:channel-mode="emit('update:channelMode', $event)"
      @calculate="emit('calculate')"
      @clear="emit('clear')"
    />

    <LaboratoryResults
      v-if="simulation !== null"
      :simulation="simulation"
      @flip="emit('flip', $event)"
    />
    <section
      v-else
      class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/35 p-8 text-center lg:min-h-0"
      aria-label="Laboratorio sin resultados"
    >
      <div class="max-w-md">
        <span
          class="mx-auto flex size-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
        >
          <FlaskConical :size="23" aria-hidden="true" />
        </span>
        <h2 class="mt-4 text-lg font-semibold text-white">Banco de pruebas CRC</h2>
        <p class="mt-2 text-sm leading-6 text-slate-400">
          Configura una entrada, el polinomio y el comportamiento del canal. Obtendrás el cálculo
          completo sin recorrer pasos de reproducción.
        </p>
        <div
          class="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-400"
        >
          <Binary :size="15" aria-hidden="true" />
          datos + CRC → frame → verificación
        </div>
      </div>
    </section>
  </main>
</template>
