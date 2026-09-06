import { createDataBits, type DataBits } from '../binary'
import { CrcDomainError } from '../errors'

const BITS_PER_BYTE = 8

export interface EncodedByte {
  readonly index: number
  readonly decimal: number
  readonly bits: DataBits
}

export interface EncodedSymbol {
  readonly symbol: string
  readonly bits: DataBits
  readonly bytes: readonly EncodedByte[]
}

export interface EncodedMessage {
  readonly text: string
  readonly bits: DataBits
  readonly bytes: readonly EncodedByte[]
  readonly symbols: readonly EncodedSymbol[]
}

export interface DecodedMessage {
  readonly text: string
  readonly bits: DataBits
  readonly bytes: readonly EncodedByte[]
}

export function encodeText(text: string): EncodedMessage {
  if (text.length === 0) {
    throw new CrcDomainError('EMPTY_TEXT', 'El texto no puede estar vacío.')
  }

  const encoder = new TextEncoder()
  let byteIndex = 0

  const symbols = Array.from(text, (symbol): EncodedSymbol => {
    const bytes = Array.from(encoder.encode(symbol), (decimal): EncodedByte => {
      const encodedByte = createEncodedByte(byteIndex, decimal)
      byteIndex += 1
      return encodedByte
    })

    return {
      symbol,
      bits: createDataBits(bytes.map(({ bits }) => bits).join('')),
      bytes,
    }
  })
  const bytes = symbols.flatMap(({ bytes: symbolBytes }) => symbolBytes)

  return {
    text,
    bits: createDataBits(bytes.map(({ bits }) => bits).join('')),
    bytes,
    symbols,
  }
}

export function decodeText(bits: DataBits): DecodedMessage {
  if (bits.length % BITS_PER_BYTE !== 0) {
    throw new CrcDomainError(
      'INVALID_BYTE_LENGTH',
      `La longitud binaria debe ser múltiplo de ${BITS_PER_BYTE} para decodificar UTF-8.`,
    )
  }

  const bytes = splitIntoBytes(bits)
  const byteValues = Uint8Array.from(bytes, ({ decimal }) => decimal)

  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(byteValues),
      bits,
      bytes,
    }
  } catch {
    throw new CrcDomainError(
      'INVALID_UTF8',
      'Los bits de datos no representan una secuencia UTF-8 válida.',
    )
  }
}

function splitIntoBytes(bits: DataBits): readonly EncodedByte[] {
  const bytes: EncodedByte[] = []

  for (let offset = 0; offset < bits.length; offset += BITS_PER_BYTE) {
    const byteBits = createDataBits(bits.slice(offset, offset + BITS_PER_BYTE))
    bytes.push(createEncodedByte(offset / BITS_PER_BYTE, Number.parseInt(byteBits, 2)))
  }

  return bytes
}

function createEncodedByte(index: number, decimal: number): EncodedByte {
  return {
    index,
    decimal,
    bits: createDataBits(decimal.toString(2).padStart(BITS_PER_BYTE, '0')),
  }
}
