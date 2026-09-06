<script setup lang="ts">
import { ChevronDown, Play, Settings2 } from 'lucide-vue-next'

import type {
  ChannelMode,
  ExperienceMode,
  InputKind,
} from '@/presentation/composables/useCrcSimulator'

defineProps<{
  inputKind: InputKind
  inputValue: string
  generator: string
  channelMode: ChannelMode
  experienceMode: ExperienceMode
  errorMessage: string | null
  hasSimulation: boolean
}>()

const emit = defineEmits<{
  'update:inputKind': [value: InputKind]
  'update:inputValue': [value: string]
  'update:generator': [value: string]
  'update:channelMode': [value: ChannelMode]
  start: []
}>()

const channelLabels: Readonly<Record<ChannelMode, string>> = {
  none: 'Sin error',
  manual: 'Error manual',
  random: 'Error aleatorio',
}
</script>

<template>
  <aside class="rounded-xl border border-slate-800 bg-slate-900/65 p-3 shadow-lg shadow-black/10">
    <details :open="experienceMode === 'lab' || !hasSimulation" class="group">
      <summary
        class="block cursor-pointer list-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        <div class="flex items-center gap-2.5">
          <span class="rounded-md bg-cyan-400/10 p-1.5 text-cyan-300">
            <Settings2 :size="16" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-semibold text-slate-100">Configuración</h2>
            <p class="truncate text-[11px] text-slate-500">
              {{
                experienceMode === 'learn' && hasSimulation
                  ? 'Parámetros activos'
                  : 'Entrada y canal'
              }}
            </p>
          </div>
          <span
            v-if="experienceMode === 'learn' && hasSimulation"
            class="text-[10px] font-medium text-cyan-300 group-open:hidden"
          >
            Editar configuración
          </span>
          <ChevronDown
            :size="15"
            class="text-slate-500 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </div>

        <dl
          v-if="experienceMode === 'learn' && hasSimulation"
          aria-label="Resumen de configuración"
          class="mt-3 grid gap-2 border-t border-slate-800 pt-2.5 text-[11px] group-open:hidden"
        >
          <div class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
            <dt class="text-slate-500">{{ inputKind === 'text' ? 'Mensaje' : 'Datos' }}</dt>
            <dd class="truncate font-mono text-slate-200" :title="inputValue">{{ inputValue }}</dd>
          </div>
          <div class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
            <dt class="text-slate-500">Generador</dt>
            <dd class="font-mono text-cyan-200">{{ generator }}</dd>
          </div>
          <div class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
            <dt class="text-slate-500">Canal</dt>
            <dd class="text-slate-200">{{ channelLabels[channelMode] }}</dd>
          </div>
        </dl>
      </summary>

      <form class="mt-3 space-y-2.5" @submit.prevent="emit('start')">
        <fieldset>
          <legend class="mb-1 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
            Tipo de entrada
          </legend>
          <div class="grid grid-cols-2 rounded-lg bg-slate-950/70 p-0.5">
            <button
              v-for="option in ['text', 'binary'] as const"
              :key="option"
              type="button"
              class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
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
          <span class="mb-1 block text-[10px] font-medium tracking-wide text-slate-500 uppercase">
            {{ inputKind === 'text' ? 'Mensaje' : 'Bits de datos' }}
          </span>
          <textarea
            :value="inputValue"
            rows="2"
            class="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 font-mono text-xs text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
            :placeholder="inputKind === 'text' ? 'HOLA' : '01001000'"
            :aria-label="inputKind === 'text' ? 'Mensaje' : 'Bits de datos'"
            @input="emit('update:inputValue', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-[10px] font-medium tracking-wide text-slate-500 uppercase">
            Polinomio generador
          </span>
          <input
            :value="generator"
            class="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 font-mono text-xs text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
            aria-label="Polinomio generador"
            inputmode="numeric"
            @input="emit('update:generator', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-[10px] font-medium tracking-wide text-slate-500 uppercase">
            Canal
          </span>
          <select
            :value="channelMode"
            class="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
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

        <p
          v-if="errorMessage"
          role="alert"
          class="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          <Play :size="16" fill="currentColor" aria-hidden="true" />
          Iniciar simulación
        </button>
      </form>
    </details>
  </aside>
</template>
