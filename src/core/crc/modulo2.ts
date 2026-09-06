import {
  bitAt,
  createBinaryBits,
  createCrcBits,
  type BinaryBits,
  type Bit,
  type CrcBits,
  type GeneratorBits,
} from '../binary'
import { CrcDomainError } from '../errors'

export interface CrcDivisionStep {
  readonly index: number
  readonly position: number
  readonly activeWindow: BinaryBits
  readonly divisorApplied: boolean
  readonly xorResult: BinaryBits
  readonly nextBit: Bit | null
  readonly intermediateDividend: BinaryBits
}

export interface CrcDivisionResult {
  readonly dividend: BinaryBits
  readonly divisor: GeneratorBits
  readonly remainder: CrcBits
  readonly steps: readonly CrcDivisionStep[]
}

export function xorBits(left: BinaryBits, right: BinaryBits): BinaryBits {
  if (left.length !== right.length) {
    throw new CrcDomainError(
      'BIT_LENGTH_MISMATCH',
      'Las secuencias deben tener la misma longitud para aplicar XOR.',
    )
  }

  // En GF(2), suma y resta son equivalentes a XOR y no producen acarreo.
  const result = Array.from(left, (leftBit, index) =>
    leftBit === bitAt(right, index) ? '0' : '1',
  ).join('')

  return createBinaryBits(result)
}

export function divideModulo2(dividend: BinaryBits, divisor: GeneratorBits): CrcDivisionResult {
  if (dividend.length < divisor.length) {
    throw new CrcDomainError(
      'DIVIDEND_TOO_SHORT',
      'El dividendo debe tener al menos la misma longitud que el generador.',
    )
  }

  const workingBits = Array.from(dividend)
  const zeroDivisor = createBinaryBits('0'.repeat(divisor.length))
  const finalPosition = dividend.length - divisor.length
  const steps: CrcDivisionStep[] = []

  for (let position = 0; position <= finalPosition; position += 1) {
    const activeWindow = createBinaryBits(
      workingBits.slice(position, position + divisor.length).join(''),
    )
    const divisorApplied = bitAt(activeWindow, 0) === '1'
    const xorResult = xorBits(activeWindow, divisorApplied ? divisor : zeroDivisor)

    for (let offset = 0; offset < xorResult.length; offset += 1) {
      workingBits[position + offset] = bitAt(xorResult, offset)
    }

    const nextBitPosition = position + divisor.length
    const nextBit = nextBitPosition < workingBits.length ? bitAt(dividend, nextBitPosition) : null

    steps.push({
      index: steps.length,
      position,
      activeWindow,
      divisorApplied,
      xorResult,
      nextBit,
      intermediateDividend: createBinaryBits(workingBits.join('')),
    })
  }

  const degree = divisor.length - 1

  return {
    dividend,
    divisor,
    remainder: createCrcBits(createBinaryBits(workingBits.slice(-degree).join(''))),
    steps,
  }
}
