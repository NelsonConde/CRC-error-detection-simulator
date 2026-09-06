<script setup lang="ts">
import { CircleAlert, ShieldCheck } from 'lucide-vue-next'
import { computed } from 'vue'

import type { SimulationResult } from '@/simulation'

const props = defineProps<{
  result: SimulationResult
}>()

const messageComparison = computed(() => {
  const original = Array.from(props.result.originalMessage ?? '')
  const received = Array.from(props.result.receivedMessage ?? '')
  const length = Math.max(original.length, received.length)

  return Array.from({ length }, (_, index) => ({
    index,
    original: original[index] ?? '∅',
    received: received[index] ?? '∅',
    changed: original[index] !== received[index],
  }))
})
</script>

<template>
  <section
    aria-labelledby="result-title"
    aria-live="polite"
    class="result-summary rounded-2xl border p-5 sm:p-6"
    :class="
      result.errorDetected ? 'border-rose-400/30 bg-rose-400/8' : 'border-teal-400/30 bg-teal-400/8'
    "
  >
    <div class="flex items-start gap-3">
      <CircleAlert
        v-if="result.errorDetected"
        :size="22"
        class="mt-0.5 shrink-0 text-rose-300"
        aria-hidden="true"
      />
      <ShieldCheck v-else :size="22" class="mt-0.5 shrink-0 text-teal-300" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <h2 id="result-title" class="font-semibold text-slate-100">Resultado</h2>
        <p
          class="mt-1 text-sm font-medium"
          :class="result.errorDetected ? 'text-rose-200' : 'text-teal-200'"
        >
          {{ result.errorDetected ? 'Error detectado' : 'No se detectaron errores' }}
        </p>
      </div>
    </div>

    <dl class="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div class="sm:col-span-2 lg:col-span-2">
        <dt class="data-label">Comparación de mensajes</dt>
        <dd v-if="result.originalMessage !== null && result.receivedMessage !== null">
          <p class="mb-1 text-[10px] text-slate-500">Mensaje original</p>
          <div class="flex flex-wrap gap-1 font-mono text-lg" aria-label="Mensaje original">
            <span
              v-for="character in messageComparison"
              :key="`original:${character.index}`"
              class="result-character"
              :class="character.changed ? 'result-character-changed' : ''"
            >
              {{ character.original }}
            </span>
          </div>
          <div class="my-1 text-xs text-slate-500" aria-hidden="true">↓</div>
          <p class="mb-1 text-[10px] text-slate-500">Mensaje recibido</p>
          <div class="flex flex-wrap gap-1 font-mono text-lg" aria-label="Mensaje recibido">
            <span
              v-for="character in messageComparison"
              :key="`received:${character.index}`"
              class="result-character"
              :class="character.changed ? 'result-character-changed' : ''"
            >
              {{ character.received }}
            </span>
          </div>
        </dd>
        <dd v-else class="text-slate-100">
          {{ result.originalMessage ?? 'Entrada binaria' }} →
          {{ result.receivedMessage ?? 'No decodificable' }}
        </dd>
      </div>
      <div>
        <dt class="data-label">Residuo</dt>
        <dd class="font-mono text-slate-100">{{ result.remainder }}</dd>
      </div>
      <div>
        <dt class="data-label">Bits alterados</dt>
        <dd class="text-slate-100">
          {{
            result.alterations.length
              ? result.alterations.map(({ position }) => position + 1).join(', ')
              : 'Ninguno'
          }}
        </dd>
      </div>
    </dl>
  </section>
</template>
