import { CrcDomainError } from './errors'

declare const binaryBitsBrand: unique symbol
declare const semanticBitsBrand: unique symbol

export type Bit = '0' | '1'
export type BinaryBits = string & { readonly [binaryBitsBrand]: true }
type SemanticBits<Kind extends string> = BinaryBits & {
  readonly [semanticBitsBrand]: Kind
}

export type DataBits = SemanticBits<'data'>
export type GeneratorBits = SemanticBits<'generator'>
export type CrcBits = SemanticBits<'crc'>
export type FrameBits = SemanticBits<'frame'>

const BINARY_PATTERN = /^[01]+$/

export function createBinaryBits(value: string, label = 'La secuencia binaria'): BinaryBits {
  validateBinary(value, label)
  return value as BinaryBits
}

export function parseBinaryInput(value: string): DataBits {
  validateBinary(value, 'La entrada binaria')
  return value as DataBits
}

export function parseReceivedFrame(value: string): FrameBits {
  validateBinary(value, 'La trama recibida')
  return value as FrameBits
}

export function createGeneratorBits(value: BinaryBits): GeneratorBits {
  return value as GeneratorBits
}

export function createCrcBits(value: BinaryBits): CrcBits {
  return value as CrcBits
}

export function createFrameBits(value: string): FrameBits {
  return createBinaryBits(value, 'La trama') as FrameBits
}

export function createDataBits(value: string): DataBits {
  return createBinaryBits(value, 'Los bits de datos') as DataBits
}

export function bitAt(bits: BinaryBits, position: number): Bit {
  if (!Number.isInteger(position) || position < 0 || position >= bits.length) {
    throw new CrcDomainError(
      'BIT_POSITION_OUT_OF_RANGE',
      `La posición ${position} está fuera del rango válido de 0 a ${bits.length - 1}.`,
    )
  }

  return bits[position] as Bit
}

function validateBinary(value: string, label: string): void {
  if (value.length === 0) {
    throw new CrcDomainError('EMPTY_BINARY_INPUT', `${label} no puede estar vacía.`)
  }

  if (!BINARY_PATTERN.test(value)) {
    throw new CrcDomainError(
      'NON_BINARY_INPUT',
      `${label} solo puede contener los caracteres 0 y 1.`,
    )
  }
}
