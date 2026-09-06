import { parseBinaryInput, type EncodedMessage } from '@/core'

import type {
  ChannelAlteration,
  CrcSimulation,
  DecodingOutcome,
  ParticipantState,
  SimulationConfiguration,
  SimulationResult,
  SimulationStep,
} from './models'

type SenderContext = Pick<CrcSimulation, 'generator' | 'sender'> & {
  readonly configuration: SimulationConfiguration
  readonly encoding: EncodedMessage | null
}

type ReceiverContext = Pick<
  CrcSimulation,
  'generator' | 'sender' | 'verification' | 'decoding' | 'result'
> & {
  readonly receivedFrame: CrcSimulation['receivedFrame']
  readonly alterations: readonly ChannelAlteration[]
}

const INITIAL_PARTICIPANTS: ParticipantState = {
  sender: 'idle',
  channel: 'waiting',
  receiver: 'waiting',
}

const SENDER_FRAME_BUILT: ParticipantState = {
  sender: 'frame-built',
  channel: 'waiting',
  receiver: 'waiting',
}

export function buildSenderSteps(context: SenderContext): readonly SimulationStep[] {
  const steps: SimulationStep[] = [
    {
      stage: 'initial',
      index: 0,
      id: 'initial',
      participants: INITIAL_PARTICIPANTS,
      learning: {
        title: 'Entrada preparada',
        explanation: 'La simulación conserva la entrada antes de transformarla.',
      },
      input: context.configuration.input,
    },
  ]

  appendEncodingSteps(steps, context)

  steps.push({
    stage: 'crc-preparation',
    index: steps.length,
    id: 'crc-preparation',
    participants: {
      sender: 'crc-prepared',
      channel: 'waiting',
      receiver: 'waiting',
    },
    learning: {
      title: 'Preparación del CRC',
      explanation: 'Se agregan tantos ceros como el grado del generador.',
    },
    data: context.sender.originalData,
    generator: context.generator,
    zeroPadding: '0'.repeat(context.generator.degree),
    augmentedData: context.sender.augmentedData,
  })

  for (const division of context.sender.divisionSteps) {
    steps.push({
      stage: 'sender-division',
      index: steps.length,
      id: `sender-division:${division.index}`,
      participants: {
        sender: 'dividing',
        channel: 'waiting',
        receiver: 'waiting',
      },
      learning: {
        title: `División del emisor ${division.index + 1}`,
        explanation: division.divisorApplied
          ? 'La ventana inicia en 1, por lo que se aplica el generador mediante XOR.'
          : 'La ventana inicia en 0, por lo que se avanza sin aplicar el generador.',
      },
      dividend: context.sender.augmentedData,
      divisor: context.generator.bits,
      division,
    })
  }

  steps.push({
    stage: 'frame-building',
    index: steps.length,
    id: 'frame-building',
    participants: SENDER_FRAME_BUILT,
    learning: {
      title: 'Formación de la trama',
      explanation: 'El residuo CRC se adjunta a los bits de datos.',
    },
    data: context.sender.originalData,
    crc: context.sender.crc,
    frame: context.sender.frame,
  })

  return steps
}

export function buildChannelAndReceiverSteps(
  startIndex: number,
  context: ReceiverContext,
): readonly SimulationStep[] {
  const steps: SimulationStep[] = []
  const nextIndex = (): number => startIndex + steps.length

  steps.push({
    stage: 'channel-ready',
    index: nextIndex(),
    id: 'channel-ready',
    participants: {
      sender: 'frame-built',
      channel: 'ready',
      receiver: 'waiting',
    },
    learning: {
      title: 'Canal preparado',
      explanation: 'La trama puede enviarse intacta o alterarse antes de llegar al receptor.',
    },
    sentFrame: context.sender.frame,
    receivedFrame: context.receivedFrame,
    alterations: context.alterations,
  })

  steps.push({
    stage: 'transmission',
    index: nextIndex(),
    id: 'transmission',
    participants: {
      sender: 'frame-built',
      channel: 'transmitting',
      receiver: 'waiting',
    },
    learning: {
      title: 'Transmisión',
      explanation: 'El canal entrega la versión resultante de la trama.',
    },
    sentFrame: context.sender.frame,
    receivedFrame: context.receivedFrame,
    alterations: context.alterations,
  })

  steps.push({
    stage: 'receiver-ready',
    index: nextIndex(),
    id: 'receiver-ready',
    participants: {
      sender: 'frame-built',
      channel: 'delivered',
      receiver: 'ready',
    },
    learning: {
      title: 'Receptor preparado',
      explanation: 'La trama recibida se verificará sin agregar ceros.',
    },
    receivedFrame: context.receivedFrame,
    alterations: context.alterations,
  })

  appendReceiverDivisionSteps(steps, startIndex, context)
  appendDecodingStep(steps, startIndex, context.receivedFrame, context.decoding)
  appendResultStep(steps, startIndex, context.result)

  return steps
}

function appendEncodingSteps(steps: SimulationStep[], context: SenderContext): void {
  if (context.configuration.input.kind === 'binary') {
    steps.push({
      stage: 'encoding',
      source: 'binary',
      index: steps.length,
      id: 'encoding:binary',
      participants: {
        sender: 'encoding',
        channel: 'waiting',
        receiver: 'waiting',
      },
      learning: {
        title: 'Entrada binaria validada',
        explanation: 'Los bits ya están codificados y pueden pasar al cálculo CRC.',
      },
      validatedData: context.sender.originalData,
    })
    return
  }

  if (context.encoding === null) {
    throw new Error('La codificación de texto debe estar disponible.')
  }

  const encoding = context.encoding

  encoding.symbols.forEach((symbol, symbolIndex) => {
    const accumulatedBits = parseBinaryInput(
      encoding.symbols
        .slice(0, symbolIndex + 1)
        .map(({ bits }) => bits)
        .join(''),
    )

    steps.push({
      stage: 'encoding',
      source: 'text',
      index: steps.length,
      id: `encoding:text:${symbolIndex}`,
      participants: {
        sender: 'encoding',
        channel: 'waiting',
        receiver: 'waiting',
      },
      learning: {
        title: `Codificación de ${symbol.symbol}`,
        explanation: 'Cada símbolo se representa mediante uno o más bytes UTF-8.',
      },
      symbolIndex,
      symbol,
      accumulatedBits,
    })
  })
}

function appendReceiverDivisionSteps(
  steps: SimulationStep[],
  startIndex: number,
  context: ReceiverContext,
): void {
  for (const division of context.verification.divisionSteps) {
    steps.push({
      stage: 'receiver-division',
      index: startIndex + steps.length,
      id: `receiver-division:${division.index}`,
      participants: {
        sender: 'frame-built',
        channel: 'delivered',
        receiver: 'dividing',
      },
      learning: {
        title: `División del receptor ${division.index + 1}`,
        explanation: division.divisorApplied
          ? 'El receptor aplica el generador mediante XOR.'
          : 'El bit inicial es 0 y el receptor avanza sin aplicar el generador.',
      },
      dividend: context.receivedFrame,
      divisor: context.generator.bits,
      division,
    })
  }
}

function appendDecodingStep(
  steps: SimulationStep[],
  startIndex: number,
  receivedFrame: CrcSimulation['receivedFrame'],
  outcome: DecodingOutcome,
): void {
  steps.push({
    stage: 'decoding',
    index: startIndex + steps.length,
    id: 'decoding',
    participants: {
      sender: 'frame-built',
      channel: 'delivered',
      receiver: 'decoding',
    },
    learning: {
      title: 'Decodificación',
      explanation:
        outcome.status === 'decoded'
          ? 'Los bits de datos recibidos forman una secuencia UTF-8 válida.'
          : 'Los datos recibidos no se pueden interpretar como texto UTF-8.',
    },
    receivedFrame,
    outcome,
  })
}

function appendResultStep(
  steps: SimulationStep[],
  startIndex: number,
  result: SimulationResult,
): void {
  steps.push({
    stage: 'result',
    index: startIndex + steps.length,
    id: 'result',
    participants: {
      sender: 'frame-built',
      channel: 'delivered',
      receiver: 'complete',
    },
    learning: {
      title: 'Resultado de la verificación',
      explanation: result.verificationSummary,
    },
    result,
  })
}
