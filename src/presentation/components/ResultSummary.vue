<script setup lang="ts">
import { CircleAlert, ShieldCheck } from 'lucide-vue-next'

import type { SimulationResult } from '@/simulation'

defineProps<{
  result: SimulationResult
}>()
</script>

<template>
  <section
    aria-labelledby="result-title"
    aria-live="polite"
    class="rounded-2xl border p-5"
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
      <div>
        <dt class="data-label">Mensaje original</dt>
        <dd class="text-slate-100">{{ result.originalMessage ?? 'Entrada binaria' }}</dd>
      </div>
      <div>
        <dt class="data-label">Mensaje recibido</dt>
        <dd class="text-slate-100">{{ result.receivedMessage ?? 'No decodificable' }}</dd>
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
