<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

import type { TransmissionSimulationStep } from '@/simulation'

defineProps<{
  step: TransmissionSimulationStep
}>()
</script>

<template>
  <div class="min-w-0 max-w-full space-y-5" aria-label="Transmisión de la trama">
    <div class="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
      <div class="min-w-0 rounded-xl border border-cyan-400/25 bg-cyan-400/8 p-3">
        <p class="data-label">Sale del emisor</p>
        <p class="binary-value text-cyan-100" tabindex="0">{{ step.sentFrame }}</p>
      </div>

      <div class="transmission-track" aria-hidden="true">
        <span class="transmission-line" />
        <span class="transmission-packet">01</span>
        <ArrowRight :size="20" class="transmission-arrow" />
      </div>

      <div
        class="min-w-0 rounded-xl border p-3"
        :class="
          step.alterations.length
            ? 'border-rose-400/30 bg-rose-400/8'
            : 'border-teal-400/25 bg-teal-400/8'
        "
      >
        <p class="data-label">Llega al receptor</p>
        <p
          class="binary-value"
          :class="step.alterations.length ? 'text-rose-100' : 'text-teal-100'"
          tabindex="0"
        >
          {{ step.receivedFrame }}
        </p>
      </div>
    </div>

    <p class="text-center text-xs text-slate-400">
      {{
        step.alterations.length
          ? 'El canal transporta una trama con bits alterados.'
          : 'El canal transporta la misma trama que recibió.'
      }}
    </p>
  </div>
</template>
