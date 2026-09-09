<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, CheckCircle2, Radio, Send, ShieldCheck } from 'lucide-vue-next'

import type { CrcSimulation } from '@/simulation'

import BinarySequence from './BinarySequence.vue'
import ManualBitEditor from './ManualBitEditor.vue'

const props = defineProps<{
  simulation: CrcSimulation
}>()

const emit = defineEmits<{
  flip: [position: number]
}>()

const channelLabel = computed(() => {
  const mode = props.simulation.configuration.channel.mode
  if (mode === 'manual') return 'Error manual'
  if (mode === 'random') return 'Error aleatorio'
  return 'Sin error'
})
const alterationsLabel = computed(() =>
  props.simulation.alterations.length === 0
    ? 'Ninguna'
    : props.simulation.alterations
        .map(({ position, previousBit, newBit }) => `#${position + 1} (${previousBit} → ${newBit})`)
        .join(', '),
)
const messageComparison = computed(() => {
  const original = Array.from(props.simulation.result.originalMessage ?? '')
  const received = Array.from(props.simulation.result.receivedMessage ?? '')
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
    class="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/55 p-4"
    aria-label="Resultados del laboratorio"
  >
    <div
      class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3"
    >
      <div class="min-w-0">
        <p class="text-[0.65rem] font-semibold tracking-[0.2em] text-cyan-300">
          RESULTADOS DEL CÁLCULO
        </p>
        <h2 class="mt-1 text-lg font-semibold text-white">Análisis completo de la transmisión</h2>
      </div>
      <span
        class="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 font-mono text-xs text-slate-300"
      >
        G(x): {{ simulation.generator.bits }} · grado {{ simulation.generator.degree }}
      </span>
    </div>

    <div class="grid min-w-0 gap-3 xl:grid-cols-2">
      <article class="technical-card">
        <header class="technical-card-header">
          <Send :size="16" aria-hidden="true" />
          <h3>EMISOR — CÁLCULO CRC</h3>
        </header>
        <dl class="technical-data-grid">
          <div>
            <dt>Entrada</dt>
            <dd>{{ simulation.configuration.input.value }}</dd>
          </div>
          <div>
            <dt>Generador / grado</dt>
            <dd class="font-mono">
              {{ simulation.generator.bits }} / {{ simulation.generator.degree }}
            </dd>
          </div>
        </dl>
        <div class="technical-sequence">
          <span>Bits de datos</span>
          <BinarySequence :bits="simulation.sender.originalData" label="Bits de datos del emisor" />
        </div>
        <div class="technical-sequence">
          <span>Datos aumentados</span>
          <BinarySequence :bits="simulation.sender.augmentedData" label="Datos aumentados" />
        </div>
        <dl class="technical-data-grid">
          <div>
            <dt>CRC calculado</dt>
            <dd class="font-mono text-cyan-200" data-testid="lab-sender-crc">
              {{ simulation.sender.crc }}
            </dd>
          </div>
        </dl>
        <div class="technical-sequence">
          <span>Frame completo</span>
          <BinarySequence
            :bits="simulation.sentFrame"
            label="Frame completo del emisor"
            test-id="lab-sender-frame"
          />
        </div>
      </article>

      <article class="technical-card">
        <header class="technical-card-header">
          <ShieldCheck :size="16" aria-hidden="true" />
          <h3>RECEPTOR — VERIFICACIÓN CRC</h3>
        </header>
        <div class="technical-sequence">
          <span>Frame recibido</span>
          <BinarySequence
            :bits="simulation.receivedFrame"
            :compare-with="simulation.sentFrame"
            label="Frame recibido por el receptor"
            test-id="lab-received-frame"
          />
        </div>
        <dl class="technical-data-grid">
          <div>
            <dt>Residuo calculado</dt>
            <dd class="font-mono" data-testid="lab-receiver-remainder">
              {{ simulation.verification.remainder }}
            </dd>
          </div>
          <div>
            <dt>Bits alterados</dt>
            <dd>{{ alterationsLabel }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt>Mensaje reconstruido</dt>
            <dd v-if="simulation.decoding.status === 'decoded'">
              {{ simulation.decoding.message.text }}
            </dd>
            <dd v-else class="text-amber-200">
              No decodificable: {{ simulation.decoding.reason }}
            </dd>
          </div>
        </dl>

        <div v-if="simulation.result.originalMessage !== null" class="message-comparison">
          <div>
            <span>Mensaje original</span>
            <strong aria-label="Mensaje original del laboratorio">
              <span
                v-for="character in messageComparison"
                :key="`original:${character.index}`"
                class="lab-message-character"
                :class="character.changed ? 'lab-message-character-changed' : ''"
                >{{ character.original }}</span
              >
            </strong>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <span>Mensaje recibido</span>
            <strong
              v-if="simulation.result.receivedMessage !== null"
              aria-label="Mensaje recibido del laboratorio"
            >
              <span
                v-for="character in messageComparison"
                :key="`received:${character.index}`"
                class="lab-message-character"
                :class="character.changed ? 'lab-message-character-changed' : ''"
                >{{ character.received }}</span
              >
            </strong>
            <strong v-else class="text-amber-200">No decodificable</strong>
          </div>
        </div>
      </article>

      <article class="technical-card xl:col-span-2">
        <header class="technical-card-header">
          <Radio :size="16" aria-hidden="true" />
          <h3>TRANSMISIÓN</h3>
          <span class="ml-auto rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
            {{ channelLabel }}
          </span>
        </header>
        <div class="grid min-w-0 gap-3 lg:grid-cols-2">
          <div class="technical-sequence">
            <span>Frame enviado</span>
            <BinarySequence :bits="simulation.sentFrame" label="Frame enviado por el canal" />
          </div>
          <div class="technical-sequence">
            <span>Frame recibido</span>
            <BinarySequence
              :bits="simulation.receivedFrame"
              :compare-with="simulation.sentFrame"
              label="Frame recibido tras el canal"
            />
          </div>
        </div>
        <p class="mt-2 text-xs text-slate-400">Alteraciones: {{ alterationsLabel }}</p>
        <ManualBitEditor
          v-if="simulation.configuration.channel.mode === 'manual'"
          class="mt-3"
          :simulation="simulation"
          @flip="emit('flip', $event)"
        />
      </article>

      <article
        class="lab-conclusion xl:col-span-2"
        :class="simulation.result.errorDetected ? 'lab-conclusion-error' : 'lab-conclusion-clear'"
      >
        <component
          :is="simulation.result.errorDetected ? AlertTriangle : CheckCircle2"
          :size="24"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <h3>
            {{ simulation.result.errorDetected ? 'ERROR DETECTADO' : 'NO SE DETECTARON ERRORES' }}
          </h3>
          <p class="mt-1 font-mono text-sm">Residuo: {{ simulation.result.remainder }}</p>
          <p class="mt-1 text-xs leading-5 opacity-80">
            <template v-if="simulation.result.errorDetected">
              La trama recibida no supera la verificación CRC.
            </template>
            <template v-else>
              Un residuo cero indica que CRC no detectó una inconsistencia; no garantiza ausencia
              absoluta de corrupción.
            </template>
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
