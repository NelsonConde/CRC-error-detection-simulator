<script setup lang="ts">
import { ArrowDown, CircleSlash2 } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import type { ReceiverDivisionSimulationStep, SenderDivisionSimulationStep } from '@/simulation'

const props = defineProps<{
  step: SenderDivisionSimulationStep | ReceiverDivisionSimulationStep
}>()

const operand = computed(() =>
  props.step.division.divisorApplied ? props.step.divisor : '0'.repeat(props.step.divisor.length),
)
const globalTrack = ref<HTMLElement | null>(null)
const globalBits = computed(() => {
  const position = props.step.division.position
  const activeEnd = position + props.step.division.activeWindow.length

  return Array.from(props.step.division.intermediateDividend, (bit, index) => ({
    bit,
    index,
    isProcessed: index < position,
    isActive: index >= position && index < activeEnd,
    isActiveStart: index === position,
    isActiveEnd: index === activeEnd - 1,
  }))
})

async function keepActiveWindowVisible(): Promise<void> {
  await nextTick()
  const track = globalTrack.value
  if (track === null || typeof track.scrollTo !== 'function') return

  const activeBit = track.querySelector<HTMLElement>('[data-active-window="start"]')
  if (activeBit === null) return

  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  track.scrollTo({
    left: Math.max(0, activeBit.offsetLeft - (track.clientWidth - activeBit.offsetWidth) / 2),
    behavior: reducedMotion ? 'auto' : 'smooth',
  })
}

watch(() => props.step.division.position, keepActiveWindowVisible, { flush: 'post' })
onMounted(keepActiveWindowVisible)
</script>

<template>
  <div data-testid="crc-division-visualizer" class="flex min-h-0 flex-col gap-2">
    <section
      aria-label="Vista global de la división"
      class="rounded-lg border border-slate-700/70 bg-slate-950/65 p-2"
    >
      <div class="mb-1 flex items-center justify-between gap-3">
        <p class="data-label mb-0">Cadena completa en proceso</p>
        <span class="text-[10px] text-slate-500">
          Ventana en posición {{ step.division.position + 1 }}
        </span>
      </div>
      <div
        ref="globalTrack"
        class="crc-global-track overflow-x-auto overscroll-x-contain pb-1 font-mono text-sm"
        tabindex="0"
        aria-label="Cadena binaria desplazable con ventana activa"
      >
        <div class="flex w-max min-w-full items-center py-0.5">
          <span
            v-for="item in globalBits"
            :key="item.index"
            class="crc-global-bit"
            :class="[
              item.isActive ? 'crc-global-bit-active' : '',
              item.isActiveStart ? 'crc-global-bit-active-start' : '',
              item.isActiveEnd ? 'crc-global-bit-active-end' : '',
              item.isProcessed && !item.isActive ? 'crc-global-bit-processed' : '',
            ]"
            :data-bit-index="item.index"
            :data-active-window="item.index === step.division.position ? 'start' : undefined"
          >
            {{ item.bit }}
          </span>
        </div>
      </div>
    </section>

    <div
      class="flex shrink-0 items-center justify-center gap-2 text-[10px] font-medium text-cyan-300"
    >
      <span class="h-px w-8 bg-cyan-400/25" aria-hidden="true" />
      <ArrowDown :size="14" aria-hidden="true" />
      <span>La ventana resaltada alimenta la operación</span>
      <span class="h-px w-8 bg-cyan-400/25" aria-hidden="true" />
    </div>

    <div class="grid min-h-0 gap-2 lg:grid-cols-[minmax(0,1fr)_11rem]">
      <div
        class="overflow-x-auto rounded-lg border border-cyan-400/20 bg-slate-950/80 px-3 py-2"
        aria-label="Operación XOR local"
      >
        <p
          class="mb-1 text-center text-[10px] font-semibold tracking-[0.13em] text-cyan-400 uppercase"
        >
          Ventana actual
        </p>
        <div class="mx-auto w-fit min-w-max font-mono text-lg tracking-[0.22em] sm:text-xl">
          <div class="division-window rounded-md bg-cyan-400/8 px-3 py-1 text-cyan-100">
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
            class="division-divisor mt-0.5 flex items-center gap-2 px-3 py-0.5"
            :class="step.division.divisorApplied ? 'text-blue-300' : 'text-slate-500'"
          >
            <span class="w-4 text-center text-sm">{{
              step.division.divisorApplied ? '⊕' : '·'
            }}</span>
            <span class="sr-only">Divisor: </span>
            <span
              v-for="(bit, index) in Array.from(operand)"
              :key="index"
              class="division-bit-slot"
            >
              <Transition name="division-bit">
                <span :key="bit" class="division-bit">{{ bit }}</span>
              </Transition>
            </span>
          </div>
          <div class="division-result border-t-2 border-slate-500/80 px-3 pt-1 text-teal-300">
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

        <div class="division-next mt-1 flex min-h-7 items-center justify-center gap-3 text-xs">
          <span
            class="text-right"
            :class="step.division.nextBit === null ? 'text-slate-500' : 'text-amber-200'"
          >
            <span class="block text-[9px] tracking-wide uppercase">Siguiente bit</span>
            <ArrowDown :size="15" class="ml-auto" aria-hidden="true" />
          </span>
          <span class="division-next-slot font-mono text-xl">
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
      </div>

      <aside class="rounded-lg border border-slate-800 bg-slate-950/45 p-2.5">
        <p class="data-label">Paso de división</p>
        <p class="font-mono text-lg text-slate-100">{{ step.division.position + 1 }}</p>

        <div class="mt-2 flex items-start gap-2">
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
  </div>
</template>
