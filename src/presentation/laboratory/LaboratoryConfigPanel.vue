<script setup lang="ts">
import { Calculator, RotateCcw } from 'lucide-vue-next'

import type { ChannelMode, InputKind } from '../composables/useCrcSimulator'

defineProps<{
  inputKind: InputKind
  inputValue: string
  generator: string
  channelMode: ChannelMode
  errorMessage: string | null
}>()

const emit = defineEmits<{
  'update:inputKind': [value: InputKind]
  'update:inputValue': [value: string]
  'update:generator': [value: string]
  'update:channelMode': [value: ChannelMode]
  calculate: []
  clear: []
}>()
</script>

<template>
  <aside
    class="min-h-0 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
    aria-label="Parámetros del laboratorio"
  >
    <div class="mb-4">
      <p class="text-[0.65rem] font-semibold tracking-[0.2em] text-cyan-300">PARÁMETROS</p>
      <h2 class="mt-1 text-base font-semibold text-white">Escenario de transmisión</h2>
      <p class="mt-1 text-xs leading-5 text-slate-400">
        Configura los datos y calcula el resultado completo de inmediato.
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="emit('calculate')">
      <fieldset>
        <legend class="mb-1.5 text-xs font-medium text-slate-300">Tipo de entrada</legend>
        <div class="grid grid-cols-2 rounded-lg border border-slate-700 bg-slate-950 p-1">
          <button
            type="button"
            class="lab-choice-button"
            :class="inputKind === 'text' ? 'lab-choice-button-active' : ''"
            :aria-pressed="inputKind === 'text'"
            @click="emit('update:inputKind', 'text')"
          >
            Texto
          </button>
          <button
            type="button"
            class="lab-choice-button"
            :class="inputKind === 'binary' ? 'lab-choice-button-active' : ''"
            :aria-pressed="inputKind === 'binary'"
            @click="emit('update:inputKind', 'binary')"
          >
            Binario
          </button>
        </div>
      </fieldset>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium text-slate-300">Entrada</span>
        <textarea
          :value="inputValue"
          :aria-label="inputKind === 'text' ? 'Mensaje de laboratorio' : 'Bits de laboratorio'"
          rows="3"
          class="lab-field resize-none font-mono"
          @input="emit('update:inputValue', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium text-slate-300">Polinomio generador</span>
        <input
          :value="generator"
          aria-label="Polinomio generador del laboratorio"
          inputmode="numeric"
          class="lab-field font-mono"
          @input="emit('update:generator', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium text-slate-300">Canal</span>
        <select
          :value="channelMode"
          aria-label="Modo del canal del laboratorio"
          class="lab-field"
          @change="
            emit('update:channelMode', ($event.target as HTMLSelectElement).value as ChannelMode)
          "
        >
          <option value="none">Sin error</option>
          <option value="random">Error aleatorio</option>
          <option value="manual">Error manual</option>
        </select>
      </label>

      <p
        v-if="errorMessage !== null"
        role="alert"
        class="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-200"
      >
        {{ errorMessage }}
      </p>

      <div class="grid gap-2 pt-1">
        <button type="submit" class="lab-primary-button">
          <Calculator :size="16" aria-hidden="true" />
          Calcular CRC
        </button>
        <button type="button" class="lab-secondary-button" @click="emit('clear')">
          <RotateCcw :size="15" aria-hidden="true" />
          Limpiar
        </button>
      </div>
    </form>
  </aside>
</template>
