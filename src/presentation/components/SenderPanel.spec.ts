import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createCrcSimulation, type SimulationStep } from '@/simulation'

import SenderPanel from './SenderPanel.vue'

function frameBuildingStep(steps: readonly SimulationStep[]): SimulationStep {
  const step = steps.find(({ stage }) => stage === 'frame-building')
  if (step === undefined) throw new Error('La simulación no contiene el paso de trama.')
  return step
}

describe('SenderPanel', () => {
  it('shows the calculated sender CRC once the frame is available', () => {
    const simulation = createCrcSimulation({
      input: { kind: 'text', value: 'HOLA' },
      generator: '10011',
      channel: { mode: 'none' },
    })
    const wrapper = mount(SenderPanel, {
      props: { simulation, step: frameBuildingStep(simulation.steps) },
    })

    expect(simulation.sender.crc).toBe('1111')
    expect(wrapper.get('[data-testid="sender-crc"]').text()).toContain(simulation.sender.crc)
  })

  it('keeps the CRC and complete frame in the panel for long data', () => {
    const simulation = createCrcSimulation({
      input: { kind: 'binary', value: '10110010'.repeat(32) },
      generator: '10011',
      channel: { mode: 'none' },
    })
    const wrapper = mount(SenderPanel, {
      props: { simulation, step: frameBuildingStep(simulation.steps) },
    })

    expect(simulation.sentFrame).toHaveLength(260)
    expect(wrapper.get('[data-testid="sender-crc"]').text()).toContain(simulation.sender.crc)
    expect(wrapper.text()).toContain(simulation.sentFrame)
  })
})
