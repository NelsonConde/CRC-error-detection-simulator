import { bitAt, createFrameBits, type Bit, type FrameBits } from '../binary'
import { CrcDomainError } from '../errors'

export type RandomSource = () => number

export interface BitFlipResult {
  readonly originalFrame: FrameBits
  readonly position: number
  readonly previousBit: Bit
  readonly newBit: Bit
  readonly frame: FrameBits
}

export function flipBit(frame: FrameBits, position: number): BitFlipResult {
  const previousBit = bitAt(frame, position)
  const newBit: Bit = previousBit === '0' ? '1' : '0'
  const flippedFrame = createFrameBits(
    `${frame.slice(0, position)}${newBit}${frame.slice(position + 1)}`,
  )

  return {
    originalFrame: frame,
    position,
    previousBit,
    newBit,
    frame: flippedFrame,
  }
}

export function flipRandomBit(
  frame: FrameBits,
  randomSource: RandomSource = Math.random,
): BitFlipResult {
  const randomValue = randomSource()

  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new CrcDomainError(
      'INVALID_RANDOM_VALUE',
      'La fuente aleatoria debe producir un número mayor o igual que 0 y menor que 1.',
    )
  }

  return flipBit(frame, Math.floor(randomValue * frame.length))
}
