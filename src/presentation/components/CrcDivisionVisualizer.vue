<script setup lang="ts">
import { ArrowDown } from 'lucide-vue-next'

import type { ReceiverDivisionSimulationStep, SenderDivisionSimulationStep } from '@/simulation'

defineProps<{
  step: SenderDivisionSimulationStep | ReceiverDivisionSimulationStep
}>()
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
    <div class="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/80 p-4 font-mono">
      <div class="min-w-max space-y-1 text-base tracking-[0.18em]">
        <p class="text-cyan-200">{{ step.division.activeWindow }}</p>
        <p class="text-slate-400">{{ step.divisor }}</p>
        <div class="border-t border-slate-600 pt-1 text-teal-300">
          {{ step.division.xorResult }}
        </div>
      </div>
      <p class="mt-3 text-xs text-slate-500">
        Resultado completo:
        <span class="text-slate-300 break-all">{{ step.division.intermediateDividend }}</span>
      </p>
    </div>

    <dl class="grid grid-cols-2 gap-x-5 gap-y-3 text-sm lg:grid-cols-1">
      <div>
        <dt class="text-xs text-slate-500">Posición</dt>
        <dd class="font-mono text-slate-200">{{ step.division.position + 1 }}</dd>
      </div>
      <div>
        <dt class="text-xs text-slate-500">Operación</dt>
        <dd :class="step.division.divisorApplied ? 'text-cyan-300' : 'text-slate-400'">
          {{ step.division.divisorApplied ? 'XOR aplicado' : 'Divisor omitido' }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-slate-500">Siguiente bit</dt>
        <dd class="flex items-center gap-1 font-mono text-slate-200">
          <ArrowDown v-if="step.division.nextBit !== null" :size="14" aria-hidden="true" />
          {{ step.division.nextBit ?? '—' }}
        </dd>
      </div>
    </dl>
  </div>
</template>
