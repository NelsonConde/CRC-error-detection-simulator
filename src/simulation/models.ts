import type {
  BinaryBits,
  Bit,
  CrcBits,
  CrcCalculation,
  CrcDivisionStep,
  CrcDomainErrorCode,
  DataBits,
  DecodedMessage,
  EncodedMessage,
  EncodedSymbol,
  FrameBits,
  FrameVerification,
  GeneratorPolynomial,
  RandomSource,
} from '@/core'

export type SimulationInput =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'binary'; readonly value: string }

export type SimulationChannelPlan =
  | { readonly mode: 'none' }
  | { readonly mode: 'manual'; readonly positions: readonly number[] }
  | { readonly mode: 'random'; readonly randomSource: RandomSource }

export interface SimulationConfiguration {
  readonly input: SimulationInput
  readonly generator: string
  readonly channel: SimulationChannelPlan
}

export type SenderStatus = 'idle' | 'encoding' | 'crc-prepared' | 'dividing' | 'frame-built'

export type ChannelStatus = 'waiting' | 'ready' | 'transmitting' | 'delivered'

export type ReceiverStatus = 'waiting' | 'ready' | 'dividing' | 'decoding' | 'complete'

export interface ParticipantState {
  readonly sender: SenderStatus
  readonly channel: ChannelStatus
  readonly receiver: ReceiverStatus
}

export interface LearningMetadata {
  readonly title: string
  readonly explanation: string
}

export interface ChannelAlteration {
  readonly sequence: number
  readonly position: number
  readonly previousBit: Bit
  readonly newBit: Bit
  readonly frameBefore: FrameBits
  readonly frameAfter: FrameBits
}

export type DecodingOutcome =
  | { readonly status: 'decoded'; readonly message: DecodedMessage }
  | {
      readonly status: 'invalid'
      readonly errorCode: CrcDomainErrorCode
      readonly reason: string
    }

export interface SimulationResult {
  readonly errorDetected: boolean
  readonly remainder: CrcBits
  readonly originalMessage: string | null
  readonly receivedMessage: string | null
  readonly decoding: DecodingOutcome
  readonly alterations: readonly ChannelAlteration[]
  readonly verificationSummary: 'No se detectaron errores.' | 'Se detectaron errores.'
}

interface SimulationStepBase<Stage extends string> {
  readonly stage: Stage
  readonly index: number
  readonly id: string
  readonly participants: ParticipantState
  readonly learning: LearningMetadata
}

export interface InitialSimulationStep extends SimulationStepBase<'initial'> {
  readonly input: SimulationInput
}

export interface TextEncodingSimulationStep extends SimulationStepBase<'encoding'> {
  readonly source: 'text'
  readonly symbolIndex: number
  readonly symbol: EncodedSymbol
  readonly accumulatedBits: DataBits
}

export interface BinaryEncodingSimulationStep extends SimulationStepBase<'encoding'> {
  readonly source: 'binary'
  readonly validatedData: DataBits
}

export type EncodingSimulationStep = TextEncodingSimulationStep | BinaryEncodingSimulationStep

export interface CrcPreparationSimulationStep extends SimulationStepBase<'crc-preparation'> {
  readonly data: DataBits
  readonly generator: GeneratorPolynomial
  readonly zeroPadding: string
  readonly augmentedData: BinaryBits
}

export interface SenderDivisionSimulationStep extends SimulationStepBase<'sender-division'> {
  readonly dividend: BinaryBits
  readonly divisor: GeneratorPolynomial['bits']
  readonly division: CrcDivisionStep
}

export interface FrameBuildingSimulationStep extends SimulationStepBase<'frame-building'> {
  readonly data: DataBits
  readonly crc: CrcBits
  readonly frame: FrameBits
}

export interface ChannelReadySimulationStep extends SimulationStepBase<'channel-ready'> {
  readonly sentFrame: FrameBits
  readonly receivedFrame: FrameBits
  readonly alterations: readonly ChannelAlteration[]
}

export interface TransmissionSimulationStep extends SimulationStepBase<'transmission'> {
  readonly sentFrame: FrameBits
  readonly receivedFrame: FrameBits
  readonly alterations: readonly ChannelAlteration[]
}

export interface ReceiverReadySimulationStep extends SimulationStepBase<'receiver-ready'> {
  readonly receivedFrame: FrameBits
  readonly alterations: readonly ChannelAlteration[]
}

export interface ReceiverDivisionSimulationStep extends SimulationStepBase<'receiver-division'> {
  readonly dividend: FrameBits
  readonly divisor: GeneratorPolynomial['bits']
  readonly division: CrcDivisionStep
}

export interface DecodingSimulationStep extends SimulationStepBase<'decoding'> {
  readonly receivedFrame: FrameBits
  readonly outcome: DecodingOutcome
}

export interface ResultSimulationStep extends SimulationStepBase<'result'> {
  readonly result: SimulationResult
}

export type SimulationStep =
  | InitialSimulationStep
  | EncodingSimulationStep
  | CrcPreparationSimulationStep
  | SenderDivisionSimulationStep
  | FrameBuildingSimulationStep
  | ChannelReadySimulationStep
  | TransmissionSimulationStep
  | ReceiverReadySimulationStep
  | ReceiverDivisionSimulationStep
  | DecodingSimulationStep
  | ResultSimulationStep

export type SimulationStage = SimulationStep['stage']

export interface CrcSimulation {
  readonly configuration: SimulationConfiguration
  readonly encoding: EncodedMessage | null
  readonly generator: GeneratorPolynomial
  readonly sender: CrcCalculation
  readonly sentFrame: FrameBits
  readonly receivedFrame: FrameBits
  readonly alterations: readonly ChannelAlteration[]
  readonly verification: FrameVerification
  readonly decoding: DecodingOutcome
  readonly result: SimulationResult
  readonly channelReadyStepIndex: number
  readonly steps: readonly SimulationStep[]
}
