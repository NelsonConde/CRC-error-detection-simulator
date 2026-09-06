import { describe, expect, it } from 'vitest'

import type {
  ChannelReadySimulationStep,
  ReceiverDivisionSimulationStep,
  ResultSimulationStep,
  SenderDivisionSimulationStep,
  SimulationChannelPlan,
  SimulationConfiguration,
  TextEncodingSimulationStep,
} from '@/simulation'
import { applyManualBitFlip, createCrcSimulation } from '@/simulation'

function textConfiguration(channel: SimulationChannelPlan): SimulationConfiguration {
  return {
    input: { kind: 'text', value: 'HOLA' },
    generator: '10011',
    channel,
  }
}

describe('CRC simulation sequence', () => {
  it('builds the complete no-error flow for HOLA', () => {
    const simulation = createCrcSimulation(textConfiguration({ mode: 'none' }))
    const stages = simulation.steps.map(({ stage }) => stage)

    expect(stages[0]).toBe('initial')
    expect(stages).toContain('encoding')
    expect(stages).toContain('crc-preparation')
    expect(stages).toContain('sender-division')
    expect(stages).toContain('frame-building')
    expect(stages).toContain('channel-ready')
    expect(stages).toContain('transmission')
    expect(stages).toContain('receiver-ready')
    expect(stages).toContain('receiver-division')
    expect(stages).toContain('decoding')
    expect(stages.at(-1)).toBe('result')

    expect(simulation.sentFrame).toBe(simulation.receivedFrame)
    expect(simulation.result).toMatchObject({
      errorDetected: false,
      originalMessage: 'HOLA',
      receivedMessage: 'HOLA',
      verificationSummary: 'No se detectaron errores.',
      alterations: [],
    })
  })

  it('creates progressive UTF-8 encoding events from the core encoding', () => {
    const simulation = createCrcSimulation(textConfiguration({ mode: 'none' }))
    const encodingSteps = simulation.steps.filter(
      (step): step is TextEncodingSimulationStep =>
        step.stage === 'encoding' && step.source === 'text',
    )

    expect(encodingSteps.map(({ symbol }) => symbol.symbol)).toEqual(['H', 'O', 'L', 'A'])
    expect(encodingSteps.map(({ symbol }) => symbol.bits)).toEqual([
      '01001000',
      '01001111',
      '01001100',
      '01000001',
    ])
    expect(encodingSteps.map(({ accumulatedBits }) => accumulatedBits)).toEqual([
      '01001000',
      '0100100001001111',
      '010010000100111101001100',
      '01001000010011110100110001000001',
    ])
  })

  it('maps every core division step in the same order for sender and receiver', () => {
    const simulation = createCrcSimulation(textConfiguration({ mode: 'none' }))
    const senderSteps = simulation.steps.filter(
      (step): step is SenderDivisionSimulationStep => step.stage === 'sender-division',
    )
    const receiverSteps = simulation.steps.filter(
      (step): step is ReceiverDivisionSimulationStep => step.stage === 'receiver-division',
    )

    expect(senderSteps.map(({ division }) => division)).toEqual(simulation.sender.divisionSteps)
    expect(receiverSteps.map(({ division }) => division)).toEqual(
      simulation.verification.divisionSteps,
    )
    expect(senderSteps.map(({ division }) => division.index)).toEqual(
      simulation.sender.divisionSteps.map(({ index }) => index),
    )
  })

  it('is deterministic for the same configuration', () => {
    const configuration = textConfiguration({ mode: 'none' })

    expect(createCrcSimulation(configuration).steps).toEqual(
      createCrcSimulation(configuration).steps,
    )
  })

  it('represents binary input with one validated encoding event', () => {
    const simulation = createCrcSimulation({
      input: { kind: 'binary', value: '01001000' },
      generator: '10011',
      channel: { mode: 'none' },
    })
    const encodingSteps = simulation.steps.filter(({ stage }) => stage === 'encoding')

    expect(encodingSteps).toHaveLength(1)
    expect(encodingSteps[0]).toMatchObject({
      stage: 'encoding',
      source: 'binary',
      validatedData: '01001000',
    })
  })

  it('keeps the result available when received data is not valid UTF-8', () => {
    const simulation = createCrcSimulation({
      input: { kind: 'binary', value: '11111111' },
      generator: '10011',
      channel: { mode: 'none' },
    })

    expect(simulation.result).toMatchObject({
      errorDetected: false,
      receivedMessage: null,
      verificationSummary: 'No se detectaron errores.',
      decoding: {
        status: 'invalid',
        errorCode: 'INVALID_UTF8',
      },
    })
    expect(simulation.steps.at(-1)?.stage).toBe('result')
  })
})

describe('simulation channel', () => {
  it('keeps the frame unchanged when no errors are configured', () => {
    const simulation = createCrcSimulation(textConfiguration({ mode: 'none' }))
    const channelReady = simulation.steps.find(
      (step): step is ChannelReadySimulationStep => step.stage === 'channel-ready',
    )

    expect(channelReady).toMatchObject({
      sentFrame: simulation.sentFrame,
      receivedFrame: simulation.sentFrame,
      alterations: [],
    })
  })

  it('records a manual data-bit change and rebuilds only the receiver tail', () => {
    const original = createCrcSimulation(textConfiguration({ mode: 'manual', positions: [] }))
    const altered = applyManualBitFlip(original, 7)

    expect(altered.sentFrame).toBe(original.sentFrame)
    expect(altered.receivedFrame).not.toBe(original.receivedFrame)
    expect(altered.sender).toBe(original.sender)
    expect(altered.alterations).toEqual([
      {
        sequence: 0,
        position: 7,
        previousBit: '0',
        newBit: '1',
        frameBefore: original.sentFrame,
        frameAfter: altered.receivedFrame,
      },
    ])

    for (let index = 0; index < original.channelReadyStepIndex; index += 1) {
      expect(altered.steps[index]).toBe(original.steps[index])
    }

    expect(altered.result).toMatchObject({
      errorDetected: true,
      originalMessage: 'HOLA',
      receivedMessage: 'IOLA',
      verificationSummary: 'Se detectaron errores.',
    })
  })

  it('supports multiple sequential manual alterations', () => {
    const initial = createCrcSimulation(textConfiguration({ mode: 'manual', positions: [] }))
    const once = applyManualBitFlip(initial, 7)
    const twice = applyManualBitFlip(once, 7)

    expect(twice.alterations).toHaveLength(2)
    expect(twice.alterations[1]).toMatchObject({
      sequence: 1,
      position: 7,
      previousBit: '1',
      newBit: '0',
    })
    expect(twice.receivedFrame).toBe(initial.sentFrame)
    expect(twice.result.errorDetected).toBe(false)
  })

  it('applies one random alteration through an injected deterministic source', () => {
    const simulation = createCrcSimulation(
      textConfiguration({ mode: 'random', randomSource: () => 0.25 }),
    )
    const expectedPosition = Math.floor(simulation.sentFrame.length * 0.25)

    expect(simulation.alterations).toHaveLength(1)
    expect(simulation.alterations[0]?.position).toBe(expectedPosition)
    expect(simulation.receivedFrame).not.toBe(simulation.sentFrame)
    expect(simulation.result.errorDetected).toBe(true)
  })

  it('rejects manual changes when the channel is not in manual mode', () => {
    const simulation = createCrcSimulation(textConfiguration({ mode: 'none' }))

    expect(() => applyManualBitFlip(simulation, 0)).toThrowError(
      'Las alteraciones manuales requieren un canal configurado en modo manual.',
    )
  })

  it('keeps result metadata synchronized with the final event', () => {
    const simulation = applyManualBitFlip(
      createCrcSimulation(textConfiguration({ mode: 'manual', positions: [] })),
      7,
    )
    const resultStep = simulation.steps.at(-1) as ResultSimulationStep

    expect(resultStep.stage).toBe('result')
    expect(resultStep.result).toBe(simulation.result)
    expect(resultStep.result.alterations).toBe(simulation.alterations)
    expect(resultStep.participants).toEqual({
      sender: 'frame-built',
      channel: 'delivered',
      receiver: 'complete',
    })
  })
})
