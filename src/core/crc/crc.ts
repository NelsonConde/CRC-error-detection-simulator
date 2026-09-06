import {
  createBinaryBits,
  createCrcBits,
  createFrameBits,
  type BinaryBits,
  type CrcBits,
  type DataBits,
  type FrameBits,
  type GeneratorBits,
} from '../binary'
import type { GeneratorPolynomial } from './generatorPolynomial'
import { divideModulo2, type CrcDivisionStep } from './modulo2'

export interface CrcCalculation {
  readonly originalData: DataBits
  readonly generator: GeneratorBits
  readonly polynomialDegree: number
  readonly augmentedData: BinaryBits
  readonly crc: CrcBits
  readonly frame: FrameBits
  readonly divisionSteps: readonly CrcDivisionStep[]
}

export function calculateCrc(
  originalData: DataBits,
  generator: GeneratorPolynomial,
): CrcCalculation {
  const augmentedData = createBinaryBits(
    `${originalData}${'0'.repeat(generator.degree)}`,
    'Los datos aumentados',
  )
  const division = divideModulo2(augmentedData, generator.bits)
  const crc = createCrcBits(division.remainder)

  return {
    originalData,
    generator: generator.bits,
    polynomialDegree: generator.degree,
    augmentedData,
    crc,
    frame: createFrameBits(`${originalData}${crc}`),
    divisionSteps: division.steps,
  }
}
