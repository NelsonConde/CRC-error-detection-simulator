import {
  CrcDomainError,
  calculateCrc,
  createGeneratorPolynomial,
  decodeFrameText,
  encodeText,
  flipBit,
  flipRandomBit,
  parseBinaryInput,
  verifyFrame,
  type BitFlipResult,
  type DataBits,
  type EncodedMessage,
  type FrameBits,
  type GeneratorPolynomial,
} from '@/core'

import type {
  ChannelAlteration,
  CrcSimulation,
  DecodingOutcome,
  SimulationChannelPlan,
  SimulationConfiguration,
  SimulationResult,
} from './models'
import { buildChannelAndReceiverSteps, buildSenderSteps } from './stepSequence'

interface PreparedInput {
  readonly data: DataBits
  readonly encoding: EncodedMessage | null
  readonly originalMessage: string | null
}

interface ChannelOutcome {
  readonly receivedFrame: FrameBits
  readonly alterations: readonly ChannelAlteration[]
}

interface ReceiverOutcome {
  readonly verification: CrcSimulation['verification']
  readonly decoding: DecodingOutcome
  readonly result: SimulationResult
}

export function createCrcSimulation(configuration: SimulationConfiguration): CrcSimulation {
  const preparedInput = prepareInput(configuration)
  const generator = createGeneratorPolynomial(configuration.generator)
  const sender = calculateCrc(preparedInput.data, generator)
  const channel = applyChannelPlan(sender.frame, configuration.channel)
  const receiver = evaluateReceiver(
    channel.receivedFrame,
    generator,
    preparedInput.originalMessage,
    channel.alterations,
  )
  const senderSteps = buildSenderSteps({
    configuration,
    encoding: preparedInput.encoding,
    generator,
    sender,
  })
  const receiverSteps = buildChannelAndReceiverSteps(senderSteps.length, {
    generator,
    sender,
    receivedFrame: channel.receivedFrame,
    alterations: channel.alterations,
    ...receiver,
  })

  return {
    configuration,
    encoding: preparedInput.encoding,
    generator,
    sender,
    sentFrame: sender.frame,
    receivedFrame: channel.receivedFrame,
    alterations: channel.alterations,
    ...receiver,
    channelReadyStepIndex: senderSteps.length,
    steps: [...senderSteps, ...receiverSteps],
  }
}

export function applyManualBitFlip(simulation: CrcSimulation, position: number): CrcSimulation {
  if (simulation.configuration.channel.mode !== 'manual') {
    throw new Error('Las alteraciones manuales requieren un canal configurado en modo manual.')
  }

  const bitFlip = flipBit(simulation.receivedFrame, position)
  const alteration = toChannelAlteration(bitFlip, simulation.alterations.length)
  const alterations = [...simulation.alterations, alteration]
  const configuration: SimulationConfiguration = {
    ...simulation.configuration,
    channel: {
      mode: 'manual',
      positions: [...simulation.configuration.channel.positions, position],
    },
  }
  const originalMessage = configuration.input.kind === 'text' ? configuration.input.value : null
  const receiver = evaluateReceiver(
    bitFlip.frame,
    simulation.generator,
    originalMessage,
    alterations,
  )
  const senderSteps = simulation.steps.slice(0, simulation.channelReadyStepIndex)
  const receiverSteps = buildChannelAndReceiverSteps(senderSteps.length, {
    generator: simulation.generator,
    sender: simulation.sender,
    receivedFrame: bitFlip.frame,
    alterations,
    ...receiver,
  })

  return {
    configuration,
    encoding: simulation.encoding,
    generator: simulation.generator,
    sender: simulation.sender,
    sentFrame: simulation.sentFrame,
    receivedFrame: bitFlip.frame,
    alterations,
    ...receiver,
    channelReadyStepIndex: senderSteps.length,
    steps: [...senderSteps, ...receiverSteps],
  }
}

function prepareInput(configuration: SimulationConfiguration): PreparedInput {
  if (configuration.input.kind === 'text') {
    const encoding = encodeText(configuration.input.value)

    return {
      data: encoding.bits,
      encoding,
      originalMessage: configuration.input.value,
    }
  }

  return {
    data: parseBinaryInput(configuration.input.value),
    encoding: null,
    originalMessage: null,
  }
}

function applyChannelPlan(sentFrame: FrameBits, plan: SimulationChannelPlan): ChannelOutcome {
  if (plan.mode === 'none') {
    return { receivedFrame: sentFrame, alterations: [] }
  }

  if (plan.mode === 'random') {
    const bitFlip = flipRandomBit(sentFrame, plan.randomSource)
    return {
      receivedFrame: bitFlip.frame,
      alterations: [toChannelAlteration(bitFlip, 0)],
    }
  }

  let receivedFrame = sentFrame
  const alterations: ChannelAlteration[] = []

  for (const position of plan.positions) {
    const bitFlip = flipBit(receivedFrame, position)
    alterations.push(toChannelAlteration(bitFlip, alterations.length))
    receivedFrame = bitFlip.frame
  }

  return { receivedFrame, alterations }
}

function evaluateReceiver(
  receivedFrame: FrameBits,
  generator: GeneratorPolynomial,
  originalMessage: string | null,
  alterations: readonly ChannelAlteration[],
): ReceiverOutcome {
  const verification = verifyFrame(receivedFrame, generator)
  const decoding = tryDecodeFrame(receivedFrame, generator)
  const errorDetected = verification.errorDetected
  const result: SimulationResult = {
    errorDetected,
    remainder: verification.remainder,
    originalMessage,
    receivedMessage: decoding.status === 'decoded' ? decoding.message.text : null,
    decoding,
    alterations,
    verificationSummary: errorDetected ? 'Se detectaron errores.' : 'No se detectaron errores.',
  }

  return { verification, decoding, result }
}

function tryDecodeFrame(receivedFrame: FrameBits, generator: GeneratorPolynomial): DecodingOutcome {
  try {
    return {
      status: 'decoded',
      message: decodeFrameText(receivedFrame, generator).message,
    }
  } catch (error: unknown) {
    if (!(error instanceof CrcDomainError)) {
      throw error
    }

    return {
      status: 'invalid',
      errorCode: error.code,
      reason: error.message,
    }
  }
}

function toChannelAlteration(bitFlip: BitFlipResult, sequence: number): ChannelAlteration {
  return {
    sequence,
    position: bitFlip.position,
    previousBit: bitFlip.previousBit,
    newBit: bitFlip.newBit,
    frameBefore: bitFlip.originalFrame,
    frameAfter: bitFlip.frame,
  }
}
