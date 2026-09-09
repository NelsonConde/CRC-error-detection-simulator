<script setup lang="ts">
import type { CrcBits, DataBits, FrameBits } from '@/core'

defineProps<{
  data: DataBits
  crc: CrcBits
  frame: FrameBits
}>()
</script>

<template>
  <div class="min-w-0 max-w-full space-y-5" aria-label="Composición de la trama">
    <div
      class="flex min-w-0 flex-wrap items-center justify-center gap-2 font-mono text-sm sm:text-base"
    >
      <span
        class="frame-data min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2.5 text-cyan-200 whitespace-nowrap"
        tabindex="0"
      >
        <span class="mr-2 font-sans text-[10px] text-cyan-400 uppercase">Datos</span>{{ data }}
      </span>
      <span class="frame-operator px-1 text-slate-500">+</span>
      <span
        class="frame-crc rounded-lg border border-teal-400/30 bg-teal-400/10 px-3 py-2.5 text-teal-200"
      >
        <span class="mr-2 font-sans text-[10px] text-teal-400 uppercase">CRC</span>{{ crc }}
      </span>
      <span class="frame-operator px-1 text-slate-500">→</span>
    </div>
    <div
      class="frame-result min-w-0 rounded-xl border border-blue-400/30 bg-blue-400/8 px-4 py-3 text-center"
    >
      <p class="data-label">Trama formada</p>
      <p class="binary-value text-sm text-blue-100 sm:text-base" tabindex="0">{{ frame }}</p>
    </div>
  </div>
</template>
