<script setup lang="ts">
import { ArrowDown, CircleSlash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import type { ReceiverDivisionSimulationStep, SenderDivisionSimulationStep } from '@/simulation'

const props = defineProps<{
  step: SenderDivisionSimulationStep | ReceiverDivisionSimulationStep
}>()

const operand = computed(() =>
  props.step.division.divisorApplied ? props.step.divisor : '0'.repeat(props.step.divisor.length),
)
</script>

<template>
  <div data-testid="crc-division-visualizer" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_12rem]">
    <div
      class="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-5 sm:px-6"
    >
      <div class="mx-auto w-fit min-w-max font-mono text-lg tracking-[0.2em] sm:text-xl">
        <div class="division-window rounded-md bg-cyan-400/8 px-3 py-1.5 text-cyan-100">
          <span class="sr-only">Ventana activa: </span>
          <span
            v-for="(bit, index) in Array.from(step.division.activeWindow)"
            :key="index"
            class="division-bit-slot"
          >
            <Transition name="division-bit">
              <span :key="bit" class="division-bit">{{ bit }}</span>
            </Transition>
          </span>
        </div>
        <div
          class="division-divisor mt-1 flex items-center gap-2 px-3 py-1.5"
          :class="step.division.divisorApplied ? 'text-blue-300' : 'text-slate-500'"
        >
          <span class="w-4 text-center text-sm">{{
            step.division.divisorApplied ? '⊕' : '·'
          }}</span>
          <span class="sr-only">Divisor: </span>
          <span v-for="(bit, index) in Array.from(operand)" :key="index" class="division-bit-slot">
            <Transition name="division-bit">
              <span :key="bit" class="division-bit">{{ bit }}</span>
            </Transition>
          </span>
        </div>
        <div class="division-result border-t border-slate-500/80 px-3 pt-2 text-teal-300">
          <span class="mr-2 inline-block w-4" aria-hidden="true" />
          <span class="sr-only">Resultado: </span>
          <span
            v-for="(bit, index) in Array.from(step.division.xorResult)"
            :key="index"
            class="division-bit-slot"
          >
            <Transition name="division-bit">
              <span :key="bit" class="division-bit">{{ bit }}</span>
            </Transition>
          </span>
        </div>
      </div>

      <div class="division-next mt-5 flex min-h-6 items-center justify-center gap-2 text-sm">
        <ArrowDown
          :size="16"
          :class="step.division.nextBit === null ? 'text-slate-600' : 'text-amber-200'"
          aria-hidden="true"
        />
        <span :class="step.division.nextBit === null ? 'text-slate-500' : 'text-amber-200'">
          Siguiente bit:
        </span>
        <span class="division-next-slot font-mono text-base">
          <Transition name="next-bit">
            <strong
              :key="step.division.nextBit ?? 'none'"
              :class="step.division.nextBit === null ? 'text-slate-600' : 'text-amber-200'"
            >
              {{ step.division.nextBit ?? '—' }}
            </strong>
          </Transition>
        </span>
      </div>

      <p class="mt-5 border-t border-slate-800 pt-3 text-xs text-slate-500">
        Estado del dividendo:
        <span class="ml-1 font-mono text-slate-300 break-all">
          {{ step.division.intermediateDividend }}
        </span>
      </p>
    </div>

    <aside class="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
      <p class="data-label">Paso de división</p>
      <p class="font-mono text-lg text-slate-100">{{ step.division.position + 1 }}</p>

      <div class="mt-5 flex items-start gap-2">
        <span
          class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full"
          :class="
            step.division.divisorApplied
              ? 'bg-cyan-400/15 text-cyan-300'
              : 'bg-slate-800 text-slate-400'
          "
        >
          <span v-if="step.division.divisorApplied" class="font-mono text-xs">⊕</span>
          <CircleSlash2 v-else :size="13" aria-hidden="true" />
        </span>
        <div>
          <p class="text-sm font-medium text-slate-200">
            {{ step.division.divisorApplied ? 'Se aplica el generador' : 'No se aplica' }}
          </p>
          <p class="mt-1 text-xs leading-relaxed text-slate-500">
            {{
              step.division.divisorApplied
                ? 'La ventana comienza en 1: corresponde realizar XOR.'
                : 'La ventana comienza en 0: se avanza usando ceros.'
            }}
          </p>
        </div>
      </div>
    </aside>
  </div>
</template>
