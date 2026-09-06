import { computed, ref, shallowRef, watch } from 'vue'

import {
  applyManualBitFlip,
  createCrcSimulation,
  type CrcSimulation,
  type SimulationChannelPlan,
} from '@/simulation'

import { useSimulationPlayer, type PlaybackSpeed } from './useSimulationPlayer'

export type ExperienceMode = 'learn' | 'lab'
export type InputKind = 'text' | 'binary'
export type ChannelMode = SimulationChannelPlan['mode']

const DEFAULT_BINARY_MESSAGE = '01001000010011110100110001000001'

export function useCrcSimulator() {
  const experienceMode = ref<ExperienceMode>('learn')
  const inputKind = ref<InputKind>('text')
  const textMessage = ref('HOLA')
  const binaryMessage = ref(DEFAULT_BINARY_MESSAGE)
  const generator = ref('10011')
  const channelMode = ref<ChannelMode>('none')
  const playbackSpeed = ref<PlaybackSpeed>('manual')
  const simulation = shallowRef<CrcSimulation | null>(null)
  const laboratorySimulation = shallowRef<CrcSimulation | null>(null)
  const errorMessage = ref<string | null>(null)
  const player = useSimulationPlayer(playbackSpeed.value)

  const inputValue = computed({
    get: () => (inputKind.value === 'text' ? textMessage.value : binaryMessage.value),
    set: (value: string) => {
      if (inputKind.value === 'text') {
        textMessage.value = value
      } else {
        binaryMessage.value = value
      }
    },
  })

  watch(playbackSpeed, (nextSpeed) => player.setSpeed(nextSpeed))
  watch([inputKind, inputValue, generator, channelMode], () => {
    laboratorySimulation.value = null
  })
  watch(
    () => player.current.value?.stage,
    (stage) => {
      if (stage === 'channel-ready' && simulation.value?.configuration.channel.mode === 'manual') {
        player.pause()
      }
    },
    { flush: 'sync' },
  )

  function startSimulation(): void {
    try {
      const nextSimulation = createConfiguredSimulation()

      simulation.value = nextSimulation
      errorMessage.value = null
      player.loadSteps(nextSimulation.steps)
    } catch (error: unknown) {
      player.pause()
      errorMessage.value =
        error instanceof Error ? error.message : 'No se pudo iniciar la simulación.'
    }
  }

  function calculateLaboratory(): void {
    try {
      laboratorySimulation.value = createConfiguredSimulation()
      errorMessage.value = null
    } catch (error: unknown) {
      laboratorySimulation.value = null
      errorMessage.value =
        error instanceof Error ? error.message : 'No se pudo calcular el escenario CRC.'
    }
  }

  function applyManualAlteration(position: number): void {
    const activeSimulation = simulation.value
    if (
      activeSimulation === null ||
      activeSimulation.configuration.channel.mode !== 'manual' ||
      player.current.value?.stage !== 'channel-ready'
    ) {
      return
    }

    try {
      const updatedSimulation = applyManualBitFlip(activeSimulation, position)
      simulation.value = updatedSimulation
      errorMessage.value = null
      player.loadSteps(updatedSimulation.steps, updatedSimulation.channelReadyStepIndex)
    } catch (error: unknown) {
      errorMessage.value =
        error instanceof Error ? error.message : 'No se pudo alterar el bit seleccionado.'
    }
  }

  function applyLaboratoryManualAlteration(position: number): void {
    const activeSimulation = laboratorySimulation.value
    if (activeSimulation === null || activeSimulation.configuration.channel.mode !== 'manual') {
      return
    }

    try {
      laboratorySimulation.value = applyManualBitFlip(activeSimulation, position)
      errorMessage.value = null
    } catch (error: unknown) {
      errorMessage.value =
        error instanceof Error ? error.message : 'No se pudo alterar el bit seleccionado.'
    }
  }

  function clearLaboratory(): void {
    laboratorySimulation.value = null
    errorMessage.value = null
  }

  function resetSimulation(): void {
    player.reset()
    errorMessage.value = null
  }

  function createChannelPlan(mode: ChannelMode): SimulationChannelPlan {
    if (mode === 'manual') {
      return { mode: 'manual', positions: [] }
    }

    if (mode === 'random') {
      return { mode: 'random', randomSource: Math.random }
    }

    return { mode: 'none' }
  }

  function createConfiguredSimulation(): CrcSimulation {
    return createCrcSimulation({
      input: { kind: inputKind.value, value: inputValue.value },
      generator: generator.value,
      channel: createChannelPlan(channelMode.value),
    })
  }

  return {
    experienceMode,
    inputKind,
    inputValue,
    generator,
    channelMode,
    playbackSpeed,
    simulation,
    laboratorySimulation,
    errorMessage,
    player,
    startSimulation,
    calculateLaboratory,
    applyManualAlteration,
    applyLaboratoryManualAlteration,
    resetSimulation,
    clearLaboratory,
  }
}
