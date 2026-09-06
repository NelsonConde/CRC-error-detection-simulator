<script setup lang="ts">
import { Play, RotateCcw, Settings2 } from 'lucide-vue-next'

import type { ChannelMode, InputKind } from '@/presentation/composables/useCrcSimulator'
import type { PlaybackSpeed } from '@/presentation/composables/useSimulationPlayer'

defineProps<{
  inputKind: InputKind
  inputValue: string
  generator: string
  channelMode: ChannelMode
  playbackSpeed: PlaybackSpeed
  errorMessage: string | null
  hasSimulation: boolean
}>()

const emit = defineEmits<{
  'update:inputKind': [value: InputKind]
  'update:inputValue': [value: string]
  'update:generator': [value: string]
  'update:channelMode': [value: ChannelMode]
  'update:playbackSpeed': [value: PlaybackSpeed]
  start: []
  reset: []
}>()
</script>

<template>
  <aside class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
    <div class="mb-5 flex items-center gap-3">
      <span class="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
        <Settings2 :size="18" aria-hidden="true" />
      </span>
      <div>
        <h2 class="font-semibold text-slate-100">Configuración</h2>
        <p class="text-xs text-slate-400">Define la entrada y el canal.</p>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="emit('start')">
      <fieldset>
        <legend class="mb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
          Tipo de entrada
        </legend>
        <div class="grid grid-cols-2 rounded-lg bg-slate-950/70 p-1">
          <button
            v-for="option in ['text', 'binary'] as const"
            :key="option"
            type="button"
            class="rounded-md px-3 py-2 text-sm font-medium transition-colors"
            :class="
              inputKind === option
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-400 hover:text-slate-100'
            "
            @click="emit('update:inputKind', option)"
          >
            {{ option === 'text' ? 'Texto' : 'Binario' }}
          </button>
        </div>
      </fieldset>

      <label class="block">
        <span class="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
          {{ inputKind === 'text' ? 'Mensaje' : 'Bits de datos' }}
        </span>
        <textarea
          :value="inputValue"
          rows="3"
          class="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
          :placeholder="inputKind === 'text' ? 'HOLA' : '01001000'"
          :aria-label="inputKind === 'text' ? 'Mensaje' : 'Bits de datos'"
          @input="emit('update:inputValue', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
          Polinomio generador
        </span>
        <input
          :value="generator"
          class="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
          aria-label="Polinomio generador"
          inputmode="numeric"
          @input="emit('update:generator', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
          Canal
        </span>
        <select
          :value="channelMode"
          class="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
          aria-label="Modo del canal"
          @change="
            emit('update:channelMode', ($event.target as HTMLSelectElement).value as ChannelMode)
          "
        >
          <option value="none">Sin error</option>
          <option value="manual">Error manual</option>
          <option value="random">Error aleatorio</option>
        </select>
      </label>

      <label class="block">
        <span class="mb-2 block text-xs font-medium tracking-wide text-slate-400 uppercase">
          Velocidad
        </span>
        <select
          :value="playbackSpeed"
          class="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
          aria-label="Velocidad de reproducción"
          @change="
            emit(
              'update:playbackSpeed',
              ($event.target as HTMLSelectElement).value as PlaybackSpeed,
            )
          "
        >
          <option value="manual">Manual</option>
          <option value="1x">1x</option>
          <option value="2x">2x</option>
        </select>
      </label>

      <p
        v-if="errorMessage"
        role="alert"
        class="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
      >
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        <Play :size="16" fill="currentColor" aria-hidden="true" />
        Iniciar simulación
      </button>

      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!hasSimulation"
        @click="emit('reset')"
      >
        <RotateCcw :size="16" aria-hidden="true" />
        Reiniciar
      </button>
    </form>
  </aside>
</template>
