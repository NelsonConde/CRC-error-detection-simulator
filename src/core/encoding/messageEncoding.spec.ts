import { describe, expect, it } from 'vitest'

import { decodeText, encodeText, parseBinaryInput } from '@/core'

describe('message encoding', () => {
  it('encodes ASCII text and preserves its byte mapping', () => {
    const encoded = encodeText('HOLA')

    expect(encoded.bits).toBe('01001000010011110100110001000001')
    expect(encoded.bytes.map(({ decimal }) => decimal)).toEqual([72, 79, 76, 65])
    expect(encoded.symbols.map(({ symbol, bits }) => ({ symbol, bits }))).toEqual([
      { symbol: 'H', bits: '01001000' },
      { symbol: 'O', bits: '01001111' },
      { symbol: 'L', bits: '01001100' },
      { symbol: 'A', bits: '01000001' },
    ])
  })

  it('encodes multibyte UTF-8 characters as multiple bytes', () => {
    const encoded = encodeText('ñ')

    expect(encoded.bits).toBe('1100001110110001')
    expect(encoded.bytes.map(({ decimal }) => decimal)).toEqual([195, 177])
    expect(encoded.symbols[0]?.bytes).toHaveLength(2)
  })

  it('validates a binary input', () => {
    expect(parseBinaryInput('101001')).toBe('101001')
  })

  it.each(['', '10201', '10 01', 'abc'])('rejects an invalid binary input: %j', (input) => {
    expect(() => parseBinaryInput(input)).toThrowError()
  })

  it('rejects empty text', () => {
    expect(() => encodeText('')).toThrowError('El texto no puede estar vacío.')
  })

  it('round-trips text through UTF-8 bits', () => {
    const original = 'CRC — año 🚀'
    const decoded = decodeText(encodeText(original).bits)

    expect(decoded.text).toBe(original)
  })

  it('rejects bits that do not contain complete bytes', () => {
    expect(() => decodeText(parseBinaryInput('101'))).toThrowError(
      'La longitud binaria debe ser múltiplo de 8 para decodificar UTF-8.',
    )
  })
})
