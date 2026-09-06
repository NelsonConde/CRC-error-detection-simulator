import { createBinaryBits, createGeneratorBits, type GeneratorBits } from '../binary'
import { CrcDomainError } from '../errors'

const MINIMUM_GENERATOR_LENGTH = 2

export interface GeneratorPolynomial {
  readonly bits: GeneratorBits
  readonly degree: number
}

export function createGeneratorPolynomial(input: string): GeneratorPolynomial {
  const binary = createBinaryBits(input, 'El polinomio generador')

  if (binary.length < MINIMUM_GENERATOR_LENGTH) {
    throw new CrcDomainError(
      'INVALID_GENERATOR_LENGTH',
      `El polinomio generador debe contener al menos ${MINIMUM_GENERATOR_LENGTH} bits.`,
    )
  }

  if (!binary.startsWith('1')) {
    throw new CrcDomainError(
      'GENERATOR_MUST_START_WITH_ONE',
      'El polinomio generador debe comenzar en 1.',
    )
  }

  if (!binary.endsWith('1')) {
    throw new CrcDomainError(
      'GENERATOR_MUST_END_WITH_ONE',
      'El polinomio generador debe terminar en 1.',
    )
  }

  return {
    bits: createGeneratorBits(binary),
    degree: binary.length - 1,
  }
}
